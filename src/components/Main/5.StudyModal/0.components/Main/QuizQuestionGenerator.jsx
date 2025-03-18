/**
 * File: QuizQuestionGenerator.js
 * Description: Handles question generation from GPT, returning an array of question objects
 * that already contain correct answers/expected answers. 
 */

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
 * Main entry point for question generation for a subchapter + stage.
 * This function fetches the quizConfig doc (e.g. quizRememberGeneral),
 * then for each question type in that config, calls GPT to generate
 * the requested number of questions. 
 * 
 * For local vs. GPT-based grading:
 *   - If question type is multipleChoice/trueFalse/fillInBlank/etc.,
 *     we instruct GPT to include "correctIndex"/"correctValue"/"answerKey"
 *     in the JSON.
 *   - If question type is openEnded/shortAnswer/scenario/etc., 
 *     we instruct GPT to include an "expectedAnswer" or "answerGuidance",
 *     which we later send to GPT for grading.
 */
export async function generateQuestions({
  db,
  subChapterId,
  examId = "general",
  quizStage = "remember",
  openAiKey,
}) {
  try {
    // 1) Build the quizConfig doc ID (e.g. "quizGeneralRemember")
    const docId = buildQuizConfigDocId(examId, quizStage);

    // 2) Fetch that quizConfig doc => e.g. { multipleChoice: 3, trueFalse: 2, ... }
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

    // 3) Fetch subchapter concepts from "subchapterConcepts"
    let conceptList = [];
    const subChapConceptsRef = collection(db, "subchapterConcepts");
    const conceptQuery = query(
      subChapConceptsRef,
      where("subChapterId", "==", subChapterId)
    );
    const conceptSnap = await getDocs(conceptQuery);
    conceptList = conceptSnap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    // 4) If no concepts found => fallback approach: generate overall questions once
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

    // 5) If we do have concepts => generate question sets per concept
    let allConceptQuestions = [];
    for (const concept of conceptList) {
      // For each question type from quizConfigData
      for (let [typeName, count] of Object.entries(quizConfigData)) {
        if (count <= 0) continue; // skip if 0
        // generate "count" questions for this concept
        const batch = await generateQuestions_ForConcept({
          db,
          subChapterId,
          openAiKey,
          typeName,
          numberOfQuestions: count,
          concept,
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
// 2. Helper: fallback approach => old single-block question generation
// ------------------------------------------------------------------
async function generateQuestions_Overall({ db, subChapterId, openAiKey, quizConfigData }) {
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
// 3. Helper: concept-based approach => one concept at a time
// ------------------------------------------------------------------
async function generateQuestions_ForConcept({
  db,
  subChapterId,
  openAiKey,
  typeName,
  numberOfQuestions,
  concept,
}) {
  // concept might have { name, summary, ... }
  return generateQuestions_GPT({
    db,
    subChapterId,
    openAiKey,
    typeName,
    numberOfQuestions,
    forcedConceptName: concept.name,
  });
}

// ------------------------------------------------------------------
// 4. The GPT logic that fetches subchapter summary, merges prompt blocks, calls GPT
// ------------------------------------------------------------------
async function generateQuestions_GPT({
  db,
  subChapterId,
  openAiKey,
  typeName,
  numberOfQuestions,
  forcedConceptName,
}) {
  // Step A: fetch subchapter summary from "subchapters_demo"
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

  // Step B: (Optional) fetch questionType doc from "questionTypes" to see JSON structure
  //         This is up to you. If you have that structure, it can help shape the prompt.
  //         For brevity, we skip that here or we can do it if needed.

  // Build an instruction block that demands correct or expected answers:
  let forcedConceptBlock = "";
  if (forcedConceptName) {
    forcedConceptBlock = `
All questions must focus on the concept: "${forcedConceptName}".
Set each question's "conceptName" field to "${forcedConceptName}".
    `.trim();
  }

  // The important part: Telling GPT how to format "correctIndex" etc.
  // We'll show a short snippet as an example. You can expand for "ranking" or "compare/contrast."
  const systemPrompt = `You are a helpful question generator that outputs JSON only.`;

  const userPrompt = `
You have a subchapter summary:
"${subchapterSummary}"

Generate ${numberOfQuestions} questions of type "${typeName}."

${forcedConceptBlock}

Include:
- "question": The question text
- "type": "${typeName}"
- "conceptName": (if forced, otherwise blank)
- For multipleChoice => include "options": [..] and "correctIndex": (the 0-based index of the correct option)
- For trueFalse => include "correctValue": "true" or "false"
- For fillInBlank => include "answerKey": "..."
- For shortAnswer / openEnded / compareContrast => include "expectedAnswer": "..."
- For scenario => could also have "scenarioText" plus "expectedAnswer"

Return a valid JSON object exactly in this format:
{
  "questions": [
    {
      "question": "...",
      "type": "${typeName}",
      "conceptName": "...",
      ... // any other fields like correctIndex, expectedAnswer, etc.
    },
    ...
  ]
}

No extra commentary—only valid JSON.
`.trim();

  let parsedQuestions = [];
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1500,
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

// Helper to build docId => e.g. "quizGeneralRemember"
function buildQuizConfigDocId(exam, stage) {
  const capExam = exam.charAt(0).toUpperCase() + exam.slice(1);
  const capStage = stage.charAt(0).toUpperCase() + stage.slice(1);
  return `quiz${capExam}${capStage}`;
}