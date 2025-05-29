/**
 * File: RevisionContentGenerator.js
 * Description:
 *   - Self-contained logic for building revision content from GPT
 *   - Automatically determines which concepts the user failed in their latest quiz attempt
 *   - Returns a concept-by-concept breakdown
 */

 import axios from "axios";
 import { chatCompletionTracked } from "../../QuizComp/QuizSupport/aiClient"

 // ─── tiny util:  {{VAR}} → value ───────────────────────────
function replaceVars(str, map) {
  return Object.keys(map).reduce(
    (s, k) => s.replaceAll(`{{${k}}}`, map[k]),   // global replace
    str
  );
}

import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";

export async function generateRevisionContent({
  db,
  examId             = "general",   // ← NEW (defaults to “general”)
  subChapterId,
  openAiKey = "",            // ← default so it’s never undefined
  revisionConfig,
  userId,
  revisionNumber,      // ←  add this
  quizStage,
  maxHistoryAttempts = 10,
}) {
    

  if (!db || !subChapterId || !userId || !quizStage) {  // ← openAiKey removed
    return {
      success: false,
      revisionData: null,
      error: "Missing required parameters in generateRevisionContent.",
    };
  }


  /* 0) ─── load dynamic prompt from  revisionPrompts/{quizStage}  ─── */
let promptTemplate = "";
try {
  const promptId = `${examId.toLowerCase()}_${quizStage.toLowerCase()}`;
  const snap     = await getDoc(doc(db, "revisionPrompts", promptId));
  if (snap.exists()) promptTemplate = snap.data().template || "";
} catch (e) {
  console.warn("revisionPrompts lookup failed:", e.message);
}
/* 1) Grab the user’s MOST-RECENT quiz attempts … */
  /* ────────────────────────────────────────────────
   * 1) Grab the user’s MOST-RECENT quiz attempts
   *    (up to maxHistoryAttempts) so we can:
   *      • work out failed concepts          (as before)
   *      • embed a history block in the prompt
  * ────────────────────────────────────────────── */
  let failedConcepts = [];
  let historyBlock   = "";
  try {
    const quizRef = collection(db, "quizzes_demo");
    const q = query(
      quizRef,
      where("userId", "==", userId),
      where("subchapterId", "==", subChapterId),    // Firestore query
      where("quizType", "==", quizStage),
      orderBy("attemptNumber", "desc")
    );
    const snap = await getDocs(q);
        if (snap.empty) {
      console.log("No quiz attempts found ➜ generic revision.");
    } else {
      /* ── a) slice the most-recent N docs ── */
      const recentDocs = snap.docs.slice(0, maxHistoryAttempts);

      /* ── b) build a human-readable *history* string ── */
      historyBlock = recentDocs
        .map((d) => {
          const { attemptNumber, quizSubmission = [] } = d.data();
          const lines = quizSubmission.map((q, idx) => {
            const isCorrect = parseFloat(q.score) >= 1 ? "✅" : "❌";
            return `    • Q${idx + 1} (${q.conceptName}): ${isCorrect}`;
          });
          return `Attempt #${attemptNumber}\n${lines.join("\n")}`;
        })
        .join("\n\n");

      /* ── c) compute failedConcepts *from the latest attempt only* (unchanged) ── */
      const latestDoc = recentDocs[0];
      const latestData = latestDoc.data();
      const quizSubmission = latestData.quizSubmission || [];

      // Build a concept map => { conceptName: { correct, total } }
      const conceptMap = {};
      quizSubmission.forEach((qItem) => {
        const cName = qItem.conceptName || "UnknownConcept";
        if (!conceptMap[cName]) {
          conceptMap[cName] = { correct: 0, total: 0 };
        }
        conceptMap[cName].total++;
        if (parseFloat(qItem.score) >= 1) {
          conceptMap[cName].correct++;
        }
      });

      // If ratio < 1 => fail
      Object.keys(conceptMap).forEach((cName) => {
        const { correct, total } = conceptMap[cName];
        if (total > 0 && correct < total) {
          failedConcepts.push(cName);
        }
      });
    }
  } catch (err) {
    return {
      success: false,
      revisionData: null,
      error: `Error fetching latest quiz attempt: ${err.message}`,
    };
  }

  // 2) Fetch subchapter summary from "subchapters_demo"
  let subchapterSummary = "";
  try {
    const ref = doc(db, "subchapters_demo", subChapterId);   // summary fetch
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      return {
        success: false,
        revisionData: null,
        error: `No subchapter found with ID: ${subchapterId}`,
      };
    }
    subchapterSummary = snap.data().summary || "";
  } catch (err) {
    return {
      success: false,
      revisionData: null,
      error: `Error fetching subchapter doc: ${err.message}`,
    };
  }

  // 3) We'll incorporate the revisionConfig doc. Suppose it has instructions or something
  const configJson = JSON.stringify(revisionConfig, null, 2);

  // 4) Build a GPT prompt that says: "Focus on these failed concepts. Return JSON with 'title' + 'concepts'..."
  let failedConceptsText = "No failing concepts => provide a general revision.";
  if (failedConcepts.length > 0) {
    failedConceptsText = `These concepts were failed:\n - ${failedConcepts.join("\n - ")}`;
  }

    /* 👇 NEW – only added if we actually have history */
  const quizHistoryText = historyBlock
    ? `\n\nQuiz History (most recent ${maxHistoryAttempts}):\n${historyBlock}`
    : "";

 
  
/* 5️⃣ build the final prompt — either from Firestore or fallback */
const userPrompt = promptTemplate
  ? replaceVars(promptTemplate, {
      SUB_SUMMARY: subchapterSummary,
      FAILED_CONCEPTS: failedConcepts.length
        ? failedConcepts.map(c => "  – " + c).join("\n")
        : "  – none (give a concise general recap of all key ideas)",
      QUIZ_HISTORY: quizHistoryText || "  – no previous attempts on record",
      CONFIG_JSON: configJson,
    })
  : `⚠️  revisionPrompts/${quizStage} is missing.
      Please create it or paste your former hard-coded prompt here.`;

  // 5) Call GPT
  try {
   const resp = await chatCompletionTracked(
     {
       model      : "gpt-3.5-turbo",
       messages   : [
         { role:"system", content:"You are a helpful tutor. Return JSON only."},
         { role:"user",   content:userPrompt }
       ],
       max_tokens : 1600,
       temperature: 0.7,
     },
     {
       kind        : "revision",
       subChapterId,      
       quizStage,
       revisionNumber,
       userId,
     }
   );

  const gptMessage = resp.choices[0].message.content.trim();

    const cleaned = gptMessage.replace(/```json/g, "").replace(/```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      return {
        success: false,
        revisionData: null,
        error: `Error parsing GPT JSON: ${err.message}`,
      };
    }

    return {
      success: true,
      revisionData: parsed,
      error: "",
    };
  } catch (err) {
    return {
      success: false,
      revisionData: null,
      error: `Error calling GPT: ${err.message}`,
    };
  }
}