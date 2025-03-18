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
 * generateQuestions
 *  - db: Firestore instance
 *  - subChapterId: string
 *  - openAiKey: string
 *  - selectedTypeName: string
 *  - questionTypeDoc: from Firestore (containing expectedJsonStructure, etc.)
 *  - numberOfQuestions: number
 *
 * Returns an object like:
 *  {
 *    success: boolean,
 *    subchapterSummary: string,
 *    questionsData: { questions: [...] } or null,
 *    error: string (if any)
 *  }
 */
export async function generateQuestions({
  db,
  subChapterId,
  openAiKey,
  selectedTypeName,
  questionTypeDoc,
  numberOfQuestions,
}) {
  if (!db || !subChapterId || !openAiKey || !selectedTypeName || !questionTypeDoc) {
    return {
      success: false,
      subchapterSummary: "",
      questionsData: null,
      error: "Missing required parameters.",
    };
  }

  // -------------------------------------------------------------------------
  // 1) Fetch the subchapter doc => get "summary" from "subchapters_demo"
  // -------------------------------------------------------------------------
  let subchapterSummary = "";
  try {
    const ref = doc(db, "subchapters_demo", subChapterId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return {
        success: false,
        subchapterSummary: "",
        questionsData: null,
        error: `No subchapter with ID = ${subChapterId}`,
      };
    }
    const data = snap.data();
    subchapterSummary = data.summary || "";
    if (!subchapterSummary) {
      return {
        success: false,
        subchapterSummary: "",
        questionsData: null,
        error: "Subchapter has no summary text.",
      };
    }
  } catch (err) {
    return {
      success: false,
      subchapterSummary: "",
      questionsData: null,
      error: `Error fetching subchapter: ${err.message}`,
    };
  }

  // -------------------------------------------------------------------------
  // 2) Fetch all concepts for this sub-chapter from "subchapterConcepts"
  //    Fields: name, subChapterId, summary, subPoints, createdAt, etc.
  // -------------------------------------------------------------------------
  let conceptList = [];
  try {
    const subChapConceptsRef = collection(db, "subchapterConcepts");
    const conceptQuery = query(subChapConceptsRef, where("subChapterId", "==", subChapterId));
    const conceptSnap = await getDocs(conceptQuery);

    conceptList = conceptSnap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
  } catch (err) {
    return {
      success: false,
      subchapterSummary,
      questionsData: null,
      error: `Error fetching subchapter concepts: ${err.message}`,
    };
  }

  // From each concept doc, we'll use the "name" field as the concept's name
  const conceptNames = conceptList.map((c) => c.name).filter(Boolean);

  let conceptText = "No specific concepts found for this sub-chapter.";
  if (conceptNames.length > 0) {
    conceptText =
      `This sub-chapter can be broken down into the following concepts:\n` +
      conceptNames.map((name, idx) => `${idx + 1}. ${name}`).join("\n");
  }

  // -------------------------------------------------------------------------
  // 3) Build the GPT prompt in a modular style
  // -------------------------------------------------------------------------
  const blocks = [
    {
      // Base or "context" block
      name: "baseContext",
      text: `You are a question generator. I have a subchapter summary below.`,
    },
    {
      // Main instruction: how many questions, which type
      name: "mainInstruction",
      text: `I want you to produce ${numberOfQuestions} questions of type "${questionTypeDoc.name}".`,
    },
    {
      // Subchapter summary block
      name: "subchapterSummary",
      text: `Subchapter Summary:\n${subchapterSummary}`,
    },
    {
      // Concept list block
      name: "conceptList",
      text: conceptText,
    },
    {
      // Question type definition block
      name: "questionTypeDefinition",
      text: `
Question Type Definition:
Name: ${questionTypeDoc.name}
Expected JSON structure for each question:
${JSON.stringify(questionTypeDoc.expectedJsonStructure, null, 2)}
      `.trim(),
    },
    {
      // Final format instruction => includes "conceptName"
      name: "returnFormat",
      text: `
Return valid JSON in the following format:
{
  "questions": [
    {
      "question": "...",
      "type": "${questionTypeDoc.name}",
      "conceptName": "...", // must match EXACTLY one of the concepts listed above
      // any other fields as per the expectedJsonStructure
    }
  ]
}

Please ensure:
1) Each question has a "conceptName" field chosen exactly from the list of concepts above and mark N/A if no concept list has been provided.
2) No extra commentary—only the JSON object.
      `.trim(),
    },
  ];

  // Combine them into one final prompt string
  const prompt = blocks
    .map((block) => block.text.trim())
    .filter(Boolean) // remove empty strings if any
    .join("\n\n")
    .trim();

  // -------------------------------------------------------------------------
  // 4) Call OpenAI with our assembled prompt
  // -------------------------------------------------------------------------
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful question generator." },
          { role: "user", content: prompt },
        ],
        max_tokens: 1000,
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
    } catch (err) {
      return {
        success: false,
        subchapterSummary,
        questionsData: {
          error: "Invalid JSON from GPT",
          raw: gptMessage,
        },
        error: `Error parsing GPT JSON: ${err.message}`,
      };
    }

    // Return success
    return {
      success: true,
      subchapterSummary,
      questionsData: parsed, // e.g. { questions: [...] }
      error: "",
    };
  } catch (err) {
    return {
      success: false,
      subchapterSummary,
      questionsData: null,
      error: `Error generating questions (OpenAI): ${err.message}`,
    };
  }
}