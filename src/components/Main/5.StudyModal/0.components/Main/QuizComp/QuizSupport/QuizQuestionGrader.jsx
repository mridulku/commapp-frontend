/***********************************************************************
 *  QuizQuestionGrader.js  (v6 – *all* prompts are Firestore-driven)
 *
 *  • Reads systemTemplate, rubric, and userTemplate from
 *      collection  quizGradingPrompts / general_<stage>
 *  • No local defaults – if anything is missing the call aborts
 *    and an explicit error is surfaced to the caller.
 *  • Still logs every GPT call through chatCompletionTracked().
 **********************************************************************/

/* ─── imports ──────────────────────────────────────────────────── */
import { chatCompletionTracked }  from "./aiClient";
import { doc, getDoc }           from "firebase/firestore";
import { db }                    from "../../../../../../../firebase"; // ← adjust if needed

const clamp01 = n => Math.max(0, Math.min(1, Number(n) || 0));

/* ───────────────── helper – fetch Firestore prompt set ───────── */
async function fetchPromptSet(stage = "understand") {
  const snap = await getDoc(doc(db, "quizGradingPrompts", `general_${stage}`));

  if (!snap.exists())
    throw new Error(`[Grader] Firestore doc “general_${stage}” not found`);

  const { systemTemplate, rubric, userTemplate } = snap.data() || {};

  if (!systemTemplate?.trim()) throw new Error("Missing field: systemTemplate");
  if (!rubric?.trim())         throw new Error("Missing field: rubric");
  if (!userTemplate?.trim())   throw new Error("Missing field: userTemplate");

  return {
    systemTemplate: systemTemplate.trim(),
    rubric        : rubric.trim(),
    userTemplate  : userTemplate.trim(),
  };
}

/* ───────────────── public API 1 – master helper ──────────────── */
export async function gradeAllQuestions({
  openAiKey         = "",
  subchapterSummary = "",
  quizStage         = "understand",
  questions         = [],
  userAnswers       = [],
}) {
  /* basic guard */
  if (questions.length !== userAnswers.length)
    return { success: false, results: [], error: "questions vs answers length mismatch" };

  /* pull templates from Firestore */
  let promptSet;
  try {
    promptSet = await fetchPromptSet(quizStage);
  } catch (err) {
    return { success: false, results: [], error: err.message };
  }

  const results = new Array(questions.length).fill(null);

  /* split local vs GPT */
  const local   = [];
  const openEnd = [];
  questions.forEach((q, i) => {
    const item = { qObj: q, userAns: userAnswers[i] ?? "", index: i };
    (isLocallyGradableType(q.type) ? local : openEnd).push(item);
  });

  /* local grading */
  local.forEach(it => {
    results[it.index] = localGradeQuestion(it.qObj, it.userAns);
  });

  /* GPT grading */
  if (openEnd.length) {
    if (!openAiKey) {
      openEnd.forEach(it => {
        results[it.index] = { score: 0, feedback: "No OpenAI key provided." };
      });
    } else {
      const { success, gradingArray, error } = await gradeOpenEndedBatch({
        openAiKey,
        subchapterSummary,
        items      : openEnd,
        promptSet,
        quizStage,
      });

      if (!success) {
        openEnd.forEach(it =>
          results[it.index] = { score: 0, feedback: `GPT error: ${error}` }
        );
      } else {
        gradingArray.forEach((g, k) =>
          results[openEnd[k].index] = g
        );
      }
    }
  }

  return { success: true, results, error: "" };
}

/* ───────────────── public API 2 – type helper ────────────────── */
export function isLocallyGradableType(t) {
  return ["multipleChoice", "trueFalse", "fillInBlank", "ranking"].includes(t);
}

/* ───────────────── public API 3 – local grading rules ────────── */
export function localGradeQuestion(q, userAns) {
  let score = 0, fb = "";

  switch (q.type) {
    case "multipleChoice": {
      const ok = q.correctIndex === Number(userAns);
      score = ok ? 1 : 0;
      fb    = ok ? "Correct!" :
        `Incorrect. Correct: ${q.options?.[q.correctIndex] ?? "—"}`;
      break;
    }
    case "trueFalse": {
      const ok = (userAns||"").toString().toLowerCase() ===
                 (q.correctValue||"").toString().toLowerCase();
      score = ok ? 1 : 0;
      fb    = ok ? "Correct!" :
        `Incorrect. The correct answer was "${q.correctValue}".`;
      break;
    }
    case "fillInBlank": {
      const ok = (userAns||"").trim().toLowerCase() ===
                 (q.answerKey||"").trim().toLowerCase();
      score = ok ? 1 : 0;
      fb    = ok ? "Correct!" : `Incorrect. Expected "${q.answerKey}".`;
      break;
    }
    default: {
      score = 0;
      fb    = "Unrecognized type for local grading.";
    }
  }
  return { score: clamp01(score), feedback: fb };
}

/* ───────────────── public API 4 – GPT batch grading ──────────── */
export async function gradeOpenEndedBatch({
  openAiKey,
  subchapterSummary = "",
  items             = [],
  promptSet         = {},
  quizStage         = "(unknown)",
}) {
  if (!openAiKey)
    return { success: false, gradingArray: [], error: "Missing API key" };
  if (!items.length)
    return { success: true, gradingArray: [], error: "" };

  /* ── 1️⃣  ensure we HAVE a promptSet ─────────────────────── */
  if (!promptSet.userTemplate || !promptSet.systemTemplate) {
    promptSet = await fetchPromptSet(quizStage);   // ← uses helper already in file
  }

  const { rubric, systemTemplate, userTemplate } = promptSet;
  /* build items block */
  let itemBlock = "";
  items.forEach((it, i) => {
    const q = it.qObj;
    itemBlock += `
Q#${i + 1}
Question: ${q.question}
Expected: ${q.expectedAnswer ?? q.answerGuidance ?? "(none)"}
Learner : """${it.userAns}"""`.trim() + "\n";
  });

  /* substitute placeholders {{rubric}}, {{summary}}, {{items}} */
  const userPrompt = userTemplate
    .replace(/{{\s*rubric\s*}}/gi, rubric)
    .replace(/{{\s*summary\s*}}/gi, subchapterSummary)
    .replace(/{{\s*items\s*}}/gi, itemBlock.trim());

  /* call OpenAI (logged) */
  try {
    const resp = await chatCompletionTracked(
      {
        model      : "gpt-3.5-turbo",
        messages   : [
          { role: "system", content: systemTemplate },
          { role: "user",   content: userPrompt    },
        ],
        max_tokens : 1000,
        temperature: 0.0,
      },
      {
        kind         : "grading",
        quizStage,
        questionCount: items.length,
      }
    );

    /* parse JSON */
    const raw = resp.choices[0].message.content
                   .replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed.results))
      throw new Error("Missing results[] array");

        const gradingArray = parsed.results.map(r => ({
      score       : clamp01(r.score),
      feedback    : (r.feedback ?? "").trim(),
      idealAnswer : (r.idealAnswer ?? "").trim()
    }));

    /* pad / trim */
    while (gradingArray.length < items.length)
      gradingArray.push({ score:0, feedback:"", idealAnswer:"" });
    gradingArray.length = items.length;

    return { success:true, gradingArray, error:"" };
  } catch (err) {
    return { success:false, gradingArray:[], error: err.message };
  }
}