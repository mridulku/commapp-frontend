/**
 * File: QuizQuestionGenerator.js
 * ------------------------------------------------------------------
 *  ▸ Generates quiz questions with GPT
 *  ▸ Excludes concepts already mastered at 100 %
 *  ▸ Each Bloom-stage can prepend a stage-specific prompt snippet
 *  ▸ All OpenAI calls go through chatCompletionTracked() so you get
 *    prompt / completion token usage, cost and latency in Firestore.
 */

import { chatCompletionTracked } from "./aiClient";

import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";

/* ────────────────────────────────────────────────────────────────────
 *  MAIN ENTRY
 * ────────────────────────────────────────────────────────────────── */
export async function generateQuestions({
  db,
  planId,
  subChapterId,
  examId = "general",
  quizStage = "remember",
  userId,
}) {
  try {
    console.log("[generateQuestions] START", {
      userId,
      planId,
      subChapterId,
      quizStage,
      examId,
    });

    /* ── 0) Which concepts has the learner already mastered? ── */
    const passedConceptsSet = await findPassedConcepts(
      db,
      userId,
      planId,
      subChapterId,
      quizStage
    );
    console.log(
      "[generateQuestions] passedConceptsSet ➜",
      Array.from(passedConceptsSet)
    );

    /* ── 1) Fetch quizConfig for this stage (e.g. quizGeneralRemember) ── */
    const docId = buildQuizConfigDocId(examId, quizStage);
    const quizConfigRef = doc(db, "quizConfigs", docId);
    const quizConfigSnap = await getDoc(quizConfigRef);

    if (!quizConfigSnap.exists()) {
      console.warn(`[generateQuestions] No quizConfig doc “${docId}”`);
      return {
        success: false,
        error: `Missing quizConfig “${docId}”`,
        questionsData: null,
      };
    }

    /** quizConfig = { multipleChoice: 2, trueFalse: 1, … , stagePrompt } */
    const quizConfigData = quizConfigSnap.data();
    console.log("[generateQuestions] quizConfigData ➜", quizConfigData);

    /* pull out the stagePrompt then delete so only counts remain */
    const stagePrompt = quizConfigData.stagePrompt || "";
    delete quizConfigData.stagePrompt;

    /* ── 2) Fetch all concept docs for this sub-chapter ── */
    const conceptSnap = await getDocs(
      query(
        collection(db, "subchapterConcepts"),
        where("subChapterId", "==", subChapterId)
      )
    );

    let conceptList = conceptSnap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    /* remove already-mastered concepts */
    conceptList = conceptList.filter((c) => !passedConceptsSet.has(c.name));

    if (conceptList.length === 0) {
      console.log("[generateQuestions] All concepts mastered — 0 questions.");
      return { success: true, error: null, questionsData: { questions: [] } };
    }

    /* ── 3) Loop (concept × typeName × count) → GPT ── */
    const allConceptQuestions = [];

    for (const concept of conceptList) {
      console.log(`→ Generating for concept “${concept.name}”`);
      for (const [typeName, count] of Object.entries(quizConfigData)) {
        if (count <= 0) continue;

        const batch = await generateQuestions_ForConcept({
          db,
          subChapterId,
          typeName,
          numberOfQuestions: count,
          concept,
          userId,
          quizStage,
          stagePrompt,
        });

        allConceptQuestions.push(...batch);
      }
    }

    console.log(
      "[generateQuestions] TOTAL generated ➜",
      allConceptQuestions.length
    );

    return {
      success: true,
      error: null,
      questionsData: { questions: allConceptQuestions },
    };
  } catch (err) {
    console.error("[generateQuestions] ERROR:", err);
    return { success: false, error: err.message, questionsData: null };
  }
}

/* ────────────────────────────────────────────────────────────────────
 *  Helper: findPassedConcepts
 * ────────────────────────────────────────────────────────────────── */
async function findPassedConcepts(db, userId, planId, subChapterId, quizStage) {
  const passed = new Set();
  try {
    const snap = await getDocs(
      query(
        collection(db, "quizzes_demo"),
        where("userId", "==", userId),
        where("planId", "==", planId),
        where("subchapterId", "==", subChapterId),
        where("quizType", "==", quizStage),
        orderBy("attemptNumber", "desc")
      )
    );

    snap.forEach((d) => {
      (d.data().quizSubmission || []).forEach((q) => {
        const c = q.conceptName;
        if (c && parseFloat(q.score) >= 1) passed.add(c);
      });
    });
  } catch (err) {
    console.error("findPassedConcepts error:", err);
  }
  return passed;
}

/* ────────────────────────────────────────────────────────────────────
 *  Helper: generateQuestions_ForConcept
 * ────────────────────────────────────────────────────────────────── */
async function generateQuestions_ForConcept({
  db,
  subChapterId,
  typeName,
  numberOfQuestions,
  concept,
  userId,
  quizStage,
  stagePrompt,
}) {
  return generateQuestions_GPT({
    db,
    subChapterId,
    typeName,
    numberOfQuestions,
    forcedConceptName: concept.name,
    userId,
    quizStage,
    stagePrompt,
  });
}

/* ────────────────────────────────────────────────────────────────────
 *  Helper: generateQuestions_GPT
 * ────────────────────────────────────────────────────────────────── */
async function generateQuestions_GPT({
  db,
  subChapterId,
  typeName,
  numberOfQuestions,
  forcedConceptName,
  userId,
  quizStage,
  stagePrompt = "",
}) {
  /* A) fetch sub-chapter summary */
  let subchapterSummary = "";
  try {
    const snap = await getDoc(doc(db, "subchapters_demo", subChapterId));
    if (snap.exists()) subchapterSummary = snap.data().summary || "";
  } catch (e) {
    console.error("subchapter fetch error:", e);
  }

  /* B) forced concept block (optional) */
  const forcedBlock = forcedConceptName
    ? `All questions must focus on the concept “${forcedConceptName}”.\n` +
      `Set each question's "conceptName" field to "${forcedConceptName}".`
    : "";

  /* C) build prompt */
  const systemPrompt =
    "You are a helpful question generator that outputs JSON only.";
  const userPrompt = `
${stagePrompt}

You have a sub-chapter summary:
"${subchapterSummary}"

Generate ${numberOfQuestions} questions of type "${typeName}."

${forcedBlock}

Include:
- "question": The question text
- "type": "${typeName}"
- "conceptName": (if forced, otherwise blank)
- For multipleChoice => "options"[] and "correctIndex"
- For trueFalse      => "correctValue": "true" or "false"
- For fillInBlank    => "answerKey"
- For openEnded/compareContrast/shortAnswer => "expectedAnswer"
- For scenario       => "scenarioText" + "expectedAnswer"

Return ONLY valid JSON:
{
  "questions":[ { … }, … ]
}
`.trim();

  /* D) call OpenAI (via tracked helper) */
  try {
    const resp = await chatCompletionTracked(
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
        userId,
        subChapterId,
        quizStage,
        concept: forcedConceptName || "mixed",
        questionType: typeName,
      }
    );

    const raw = resp.choices[0].message.content
      .replace(/```json|```/g, "")
      .trim();
    const parsed = JSON.parse(raw);
    return parsed.questions || [];
  } catch (err) {
    console.error("generateQuestions_GPT error:", err);
    return [];
  }
}

/* ────────────────────────────────────────────────────────────────────
 *  Utility: buildQuizConfigDocId
 * ────────────────────────────────────────────────────────────────── */
function buildQuizConfigDocId(exam, stage) {
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  return `quiz${cap(exam)}${cap(stage)}`;
}