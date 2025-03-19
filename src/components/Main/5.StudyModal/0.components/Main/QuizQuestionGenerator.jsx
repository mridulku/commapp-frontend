/**
 * File: QuizQuestionGenerator.js
 * Description:
 *   - Handles question generation from GPT, returning an array of question objects
 *   - Now excludes any concepts that the user has already passed at 100%
 */

import axios from "axios";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";

/**
 * Main entry point for question generation for a subchapter + stage.
 * This function:
 *   1) finds any concepts the user has already passed (100% correctness),
 *   2) fetches the quizConfig doc (e.g. quizGeneralRemember),
 *   3) fetches subchapterConcepts,
 *   4) filters out "passed" concepts,
 *   5) calls GPT or local generation to produce questions only for remaining concepts.
 */
export async function generateQuestions({
  db,
  subChapterId,
  examId = "general",
  quizStage = "remember",
  openAiKey,
  userId, // <-- newly required so we can fetch prior attempts
}) {
  try {
    // 0) First, gather a set of concepts the user has already "passed" at 100%
    const passedConceptsSet = await findPassedConcepts(db, userId, subChapterId, quizStage);

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

    // 3a) Filter out any concepts that appear in passedConceptsSet
    //     (assuming we match by concept's "name")
    conceptList = conceptList.filter((c) => {
      const cName = c.name; // or c.conceptName, depending on your schema
      return !passedConceptsSet.has(cName);
    });

    // 4) If no concepts remain => fallback approach (maybe empty or generate overall)
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

    // 5) If we do have filtered concepts => generate question sets per concept
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

/**
 * Helper: findPassedConcepts
 *  - Fetch all quiz attempts for the user/subChapter/quizStage
 *  - For each attempt, check question "conceptName" + "score"
 *  - If concept is 100% correct in that attempt => mark as "passed"
 *  - We'll collect a Set of concept names the user has *ever* gotten 100% on
 */
async function findPassedConcepts(db, userId, subChapterId, quizStage) {
  const passedSet = new Set();

  try {
    // 1) Fetch all attempts from "quizzes_demo" with userId, subchapterId, quizType
    const quizRef = collection(db, "quizzes_demo");
    const q = query(
      quizRef,
      where("userId", "==", userId),
      where("subchapterId", "==", subChapterId),
      where("quizType", "==", quizStage),
      orderBy("attemptNumber", "desc")
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      // No attempts => user hasn't passed anything
      return passedSet;
    }

    // 2) For each attempt, gather concept correctness
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const quizSubmission = data.quizSubmission || [];
      // We'll track concept -> { correct: X, total: Y } for *that attempt*
      // If correct == total, user got 100% for that concept in this attempt => passed
      const conceptMap = {};

      quizSubmission.forEach((qItem) => {
        const cName = qItem.conceptName || "UnknownConcept";
        if (!conceptMap[cName]) {
          conceptMap[cName] = { correct: 0, total: 0 };
        }
        conceptMap[cName].total++;
        // if qItem.score >= 1 => correct
        if (parseFloat(qItem.score) >= 1) {
          conceptMap[cName].correct++;
        }
      });

      // Now see if any concept has 100% => ratio == 1
      Object.keys(conceptMap).forEach((cName) => {
        const { correct, total } = conceptMap[cName];
        if (total > 0 && correct === total) {
          passedSet.add(cName);
        }
      });
    });
  } catch (err) {
    console.error("Error in findPassedConcepts:", err);
  }

  return passedSet;
}

/**
 * Helper: If no concepts remain or if no concepts found initially,
 * we generate an "overall" question set. 
 */
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

/**
 * Helper: concept-based approach => one concept at a time
 */
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

/**
 * GPT logic that fetches subchapter summary, merges prompt blocks, calls GPT
 */
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

  // Build any forced concept instructions
  let forcedConceptBlock = "";
  if (forcedConceptName) {
    forcedConceptBlock = `
All questions must focus on the concept: "${forcedConceptName}".
Set each question's "conceptName" field to "${forcedConceptName}".
    `.trim();
  }

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
- For multipleChoice => include "options": [..] and "correctIndex": ...
- For trueFalse => include "correctValue": "true" or "false"
- For fillInBlank => include "answerKey": "..."
- For openEnded/shortAnswer/compareContrast => include "expectedAnswer": "..."
- For scenario => can have "scenarioText" + "expectedAnswer"

Return valid JSON like:
{
  "questions": [
    {
      "question": "...",
      "type": "${typeName}",
      "conceptName": "...",
      ...
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

/**
 * Helper: buildQuizConfigDocId => e.g. "quizGeneralRemember"
 */
function buildQuizConfigDocId(exam, stage) {
  const capExam = exam.charAt(0).toUpperCase() + exam.slice(1);
  const capStage = stage.charAt(0).toUpperCase() + stage.slice(1);
  return `quiz${capExam}${capStage}`;
}