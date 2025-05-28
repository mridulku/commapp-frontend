/**
 * File: QuizQuestionGenerator.js  (v2 – prompt fetched from Firestore)
 * ------------------------------------------------------------------
 *  ▸ Generates quiz questions with GPT
 *  ▸ Excludes concepts already mastered at 100 %
 *  ▸ Reads the *entire* prompt from Firestore → quizPrompts/<exam>_<stage>
 *  ▸ All OpenAI calls go through chatCompletionTracked() so you keep
 *    prompt/completion token usage, cost and latency in Firestore.
 */

import { chatCompletionTracked } from "./aiClient";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";

/* ────────────────────────────────────────────────────────────────
 *  MAIN ENTRY
 * ────────────────────────────────────────────────────────────── */
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

    /* ── 0) Which concepts has the learner already mastered? ───── */
    const passedConceptsSet = await findPassedConcepts(
      db,
      userId,
      planId,
      subChapterId,
      quizStage
    );

    /* ── 1) Fetch quizConfig for counts (unchanged) ─────────────── */
    const cfgId = buildQuizConfigDocId(examId, quizStage);
    const cfgSnap = await getDoc(doc(db, "quizConfigs", cfgId));
    if (!cfgSnap.exists()) {
      return { success: false, error: `Missing quizConfig “${cfgId}”` };
    }
    const quizConfig = { ...cfgSnap.data() }; // { multipleChoice: 2 … }
    const stageIntroFromCfg = quizConfig.stagePrompt || "";
    delete quizConfig.stagePrompt;

    /* ── 2) Fetch prompt parts from quizPrompts collection ─────── */
    const promptDocId = `${examId}_${quizStage}`; // eg. general_remember
    const promptSnap = await getDoc(doc(db, "quizPrompts", promptDocId));

    if (!promptSnap.exists()) {
      return {
        success: false,
        error: `Missing quizPrompts/${promptDocId}`,
      };
    }

    const { system: systemPrompt, template, stageIntro = stageIntroFromCfg } =
      promptSnap.data();

    if (!systemPrompt || !template) {
      return {
        success: false,
        error: `quizPrompts/${promptDocId} is missing “system” or “template” fields`,
      };
    }

    /* ── 3) Fetch all concept docs for this sub-chapter ─────────── */
    const conceptRecs = await getDocs(
      query(
        collection(db, "subchapterConcepts"),
        where("subChapterId", "==", subChapterId)
      )
    );

    let concepts = conceptRecs.docs.map(d => ({ id: d.id, ...d.data() }));
    concepts = concepts.filter(c => !passedConceptsSet.has(c.name));

    if (concepts.length === 0) {
      console.log("[generateQuestions] 0 concepts left → skip quiz");
      return { success: true, questionsData: { questions: [] } };
    }

    /* ── 4) Loop (concept × typeName × count) → GPT ─────────────── */
    const allQs = [];

    for (const concept of concepts) {
      for (const [typeName, count] of Object.entries(quizConfig)) {
        if (count <= 0) continue;

        const batch = await gptBatch({
          db,
          subChapterId,
          typeName,
          numberOfQuestions: count,
          forcedConceptName: concept.name,
          userId,
          quizStage,
          systemPrompt,
          template,
          stageIntro,
        });
        allQs.push(...batch);
      }
    }

    return { success: true, questionsData: { questions: allQs } };
  } catch (err) {
    console.error("[generateQuestions] ERROR:", err);
    return { success: false, error: err.message };
  }
}

/* ────────────────────────────────────────────────────────────────
 *  Helper – find concepts already passed at 100 %
 * ────────────────────────────────────────────────────────────── */
async function findPassedConcepts(
  db,
  userId,
  planId,
  subChapterId,
  quizStage
) {
  const passed = new Set();
  try {
    const q = query(
      collection(db, "quizzes_demo"),
      where("userId", "==", userId),
      where("planId", "==", planId),
      where("subchapterId", "==", subChapterId),
      where("quizType", "==", quizStage),
      orderBy("attemptNumber", "desc")
    );

    const snap = await getDocs(q);
    snap.forEach(d => {
      (d.data().quizSubmission || []).forEach(q => {
        if (parseFloat(q.score) >= 1 && q.conceptName)
          passed.add(q.conceptName);
      });
    });
  } catch (e) {
    console.error("findPassedConcepts error:", e);
  }
  return passed;
}

/* ────────────────────────────────────────────────────────────────
 *  GPT call for one (concept × type × count) batch
 * ────────────────────────────────────────────────────────────── */
async function gptBatch({
  db,
  subChapterId,
  typeName,
  numberOfQuestions,
  forcedConceptName,
  userId,
  quizStage,
  systemPrompt,
  template,
  stageIntro,
}) {
  /* A) sub-chapter summary (for context) */
  let summary = "";
  try {
    const s = await getDoc(doc(db, "subchapters_demo", subChapterId));
    summary = s.exists() ? s.data().summary || "" : "";
  } catch (e) {
    console.error("subchapter fetch error:", e);
  }

  /* B) handlebars-style replacements ------------------------- */
  const promptBody = template
    .replace(/{{subSummary}}/g, summary)
    .replace(/{{n}}/g, numberOfQuestions)
    .replace(/{{qType}}/g, typeName)
    .replace(/{{forcedBlock}}/g, forcedConceptName
      ? `All questions must focus on the concept “${forcedConceptName}”.\n` +
        `Set each question's "conceptName" field to "${forcedConceptName}".`
      : "");

  /* C) OpenAI call (tracked) */
  try {
    const resp = await chatCompletionTracked(
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: promptBody },
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
    return JSON.parse(raw).questions || [];
  } catch (err) {
    console.error("gptBatch error:", err);
    return [];
  }
}

/* ────────────────────────────────────────────────────────────────
 *  Utility
 * ────────────────────────────────────────────────────────────── */
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
function buildQuizConfigDocId(exam, stage) {
  return `quiz${cap(exam)}${cap(stage)}`;
}