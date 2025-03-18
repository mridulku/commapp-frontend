import axios from "axios";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

/**
 * Main entry point for question generation. 
 * 
 *  - db: Firestore
 *  - subChapterId: string
 *  - examId: string (e.g. "general")
 *  - quizStage: string (e.g. "remember" / "understand" / etc.)
 *  - openAiKey: string
 *
 * Returns an object:
 * {
 *   success: boolean,
 *   error: string | null,
 *   questionsData: { questions: [...] } | null
 * }
 */
export async function generateQuestions({
  db,
  subChapterId,
  examId = "general",
  quizStage = "remember",
  openAiKey,
}) {
  try {
    // 1) Build the quizConfig doc ID (assuming your naming scheme)
    const docId = buildQuizConfigDocId(examId, quizStage);

    // 2) Fetch the quizConfig doc => e.g. { multipleChoice: 1, trueFalse: 2, fillInBlank: 0 }
    let quizConfigData = {};
    const quizConfigRef = doc(db, "quizConfigs", docId);
    const quizConfigSnap = await getDoc(quizConfigRef);
    if (quizConfigSnap.exists()) {
      quizConfigData = quizConfigSnap.data();
    } else {
      return {
        success: false,
        error: `No quizConfig doc found for '${docId}'.`,
        questionsData: null,
      };
    }

    // 3) Fetch subchapter concepts
    let conceptList = [];
    const subChapConceptsRef = collection(db, "subchapterConcepts");
    const conceptQuery = query(subChapConceptsRef, where("subChapterId", "==", subChapterId));
    const conceptSnap = await getDocs(conceptQuery);
    conceptList = conceptSnap.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    // 4) If no concepts found => fallback to old approach 
    //    (generate overall questions once)
    if (conceptList.length === 0) {
      const fallbackQuestions = await generateQuestions_Overall({
        db,
        subChapterId,
        openAiKey,
        quizConfigData,
      });
      return {
        success: true,
        error: null,
        questionsData: { questions: fallbackQuestions },
      };
    }

    // 5) If we *do* have concepts => generate question sets per concept
    let allConceptQuestions = [];
    for (const concept of conceptList) {
      // For each question type from quizConfigData
      for (let [typeName, count] of Object.entries(quizConfigData)) {
        if (count <= 0) continue; // skip if 0
        // generate "count" questions for *this concept*
        const batch = await generateQuestions_ForConcept({
          db,
          subChapterId,
          openAiKey,
          typeName,
          numberOfQuestions: count,
          concept, // pass the entire concept doc so we can mention concept.name, etc.
        });
        allConceptQuestions.push(...batch);
      }
    }

    return {
      success: true,
      error: null,
      questionsData: { questions: allConceptQuestions },
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      questionsData: null,
    };
  }
}

// ------------------------------------------------------------------
// 2. Helper: Fallback approach => old single-block question generation
// ------------------------------------------------------------------
async function generateQuestions_Overall({
  db,
  subChapterId,
  openAiKey,
  quizConfigData,
}) {
  const allQuestions = [];
  for (let [typeName, count] of Object.entries(quizConfigData)) {
    if (count <= 0) continue;

    const partial = await generateQuestions_GPT({
      db,
      subChapterId,
      openAiKey,
      typeName,
      numberOfQuestions: count,
      forcedConceptName: null,
    });
    allQuestions.push(...partial);
  }
  return allQuestions;
}

// ------------------------------------------------------------------
// 3. Helper: Concept-based approach => one concept at a time
// ------------------------------------------------------------------
async function generateQuestions_ForConcept({
  db,
  subChapterId,
  openAiKey,
  typeName,
  numberOfQuestions,
  concept,
}) {
  // concept might have { name, summary, etc. }
  return generateQuestions_GPT({
    db,
    subChapterId,
    openAiKey,
    typeName,
    numberOfQuestions,
    forcedConceptName: concept.name, // so GPT sets "conceptName": concept.name
  });
}

// ------------------------------------------------------------------
// 4. The GPT logic that fetches subchapter summary, merges prompt blocks, calls GPT
//    (similar to your existing "generateQuestions" function)
// ------------------------------------------------------------------
async function generateQuestions_GPT({
  db,
  subChapterId,
  openAiKey,
  typeName,
  numberOfQuestions,
  forcedConceptName,
}) {
  // Step A: fetch sub-chapter summary from "subchapters_demo"
  let subchapterSummary = "";
  try {
    const ref = doc(db, "subchapters_demo", subChapterId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      console.warn(`No subchapter doc found for: ${subChapterId}`);
    } else {
      const data = snap.data();
      subchapterSummary = data.summary || "";
    }
  } catch (err) {
    console.error("Error fetching subchapter:", err);
  }

  // Step B: fetch questionType doc from "questionTypes" (like you do now)
  // This part might vary in your code
  const questionTypeDoc = await fetchQuestionTypeDoc(db, typeName);

  // Build your prompt blocks
  let forcedConceptBlock = "";
  if (forcedConceptName) {
    forcedConceptBlock = `
All questions must focus on the concept: "${forcedConceptName}".
Set each question's "conceptName" field to exactly "${forcedConceptName}".
    `.trim();
  }

  const blocks = [
    {
      name: "context",
      text: `You are a question generator. Here's a subchapter summary:\n${subchapterSummary}`,
    },
    {
      name: "mainInstruction",
      text: `Generate ${numberOfQuestions} "${typeName}" questions.`,
    },
    {
      name: "forcedConcept",
      text: forcedConceptBlock,
    },
    {
      name: "questionTypeDefinition",
      text: `
Question Type Definition:
Name: ${questionTypeDoc.name}
Expected JSON structure: ${JSON.stringify(questionTypeDoc.expectedJsonStructure, null, 2)}
      `.trim(),
    },
    {
      name: "returnFormat",
      text: `
Return valid JSON in the format:
{
  "questions": [
    {
      "question": "...",
      "type": "${typeName}",
      "conceptName": "${forcedConceptName || ""}",
      ...
    }
  ]
}
No extra commentary—only the JSON object.
      `.trim(),
    },
  ];

  const prompt = blocks
    .map(b => b.text.trim())
    .filter(Boolean)
    .join("\n\n");

  // Step C: Call GPT
  let parsedQuestions = [];
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful question generator." },
          { role: "user", content: prompt },
        ],
        max_tokens: 1200,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${openAiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const gptMessage = response.data.choices[0].message.content.trim();
    const cleaned = gptMessage
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
      parsedQuestions = parsed.questions || [];
    } catch (err) {
      console.error("Error parsing GPT JSON:", err);
    }
  } catch (err) {
    console.error("Error calling GPT API:", err);
  }

  return parsedQuestions;
}

// Helper to build docId => "quizGeneralRemember" or similar
function buildQuizConfigDocId(exam, stage) {
  const capExam = exam.charAt(0).toUpperCase() + exam.slice(1);
  const capStage = stage.charAt(0).toUpperCase() + stage.slice(1);
  return `quiz${capExam}${capStage}`;
}

// Example fetch questionTypes doc
async function fetchQuestionTypeDoc(db, typeName) {
  const snap = await getDocs(collection(db, "questionTypes"));
  const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return arr.find(doc => doc.name === typeName) || { name: typeName, expectedJsonStructure: {} };
}