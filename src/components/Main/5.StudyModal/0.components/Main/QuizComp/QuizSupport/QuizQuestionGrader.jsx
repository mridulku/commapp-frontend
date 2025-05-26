/***********************************************************************
 *  QuizQuestionGrader.js      (v3 – passRatio & rubric are now data)
 *
 *  Exports:
 *    • gradeAllQuestions() – one-shot helper used by QuizView
 *    • isLocallyGradableType(), localGradeQuestion()
 *    • gradeOpenEndedBatch() – single GPT call for open-ended items
 *
 *  –  Local grading rules stay hard-coded (fast, deterministic)
 *  –  Caller decides pass/fail using the stage’s passRatio field that
 *     lives in Firestore -> quizConfigs/<quizDoc>. This module simply
 *     returns an array  [{ score, feedback }, … ] (0 … 1 per question)
 **********************************************************************/
// ─── imports ─────────────────────────────────────────────────────────
import axios from "axios";

// ─── tiny util ───────────────────────────────────────────────────────
const clamp01 = n => Math.max(0, Math.min(1, Number(n) || 0));

// ─── API 1 – master helper (local + GPT) ─────────────────────────────
export async function gradeAllQuestions({
  openAiKey         = "",
  subchapterSummary = "",
  questions         = [],
  userAnswers       = [],
  rubric            = "Grade on completeness and correctness. "
                      + "Return score (0-1) and 1-2 sentences of feedback."
}) {
  if (questions.length !== userAnswers.length) {
    return { success:false, results:[], error:"questions vs answers length mismatch" };
  }

  const results = new Array(questions.length).fill(null);

  // split
  const local   = [];
  const openEnd = [];
  questions.forEach((q, i) => {
    const ans = userAnswers[i] ?? "";
    (isLocallyGradableType(q.type) ? local : openEnd)
      .push({ qObj:q, userAns:ans, index:i });
  });

  // 1) local grading
  local.forEach(item => {
    results[item.index] = localGradeQuestion(item.qObj, item.userAns);
  });

  // 2) GPT grading
  if (openEnd.length) {
    if (!openAiKey) {
      openEnd.forEach(item =>
        results[item.index] = { score:0, feedback:"No OpenAI key for GPT grading." });
    } else {
      const { success, gradingArray, error } = await gradeOpenEndedBatch({
        openAiKey, subchapterSummary, items:openEnd, rubric
      });

      if (!success) {
        console.error("GPT grading:", error);
        openEnd.forEach(item =>
          results[item.index] = { score:0, feedback:`GPT error: ${error}` });
      } else {
        gradingArray.forEach((r, k) => results[openEnd[k].index] = r);
      }
    }
  }

  return { success:true, results, error:"" };
}

// ─── API 2 – local vs GPT decision helper ───────────────────────────
export function isLocallyGradableType(type){
  return ["multipleChoice","trueFalse","fillInBlank","ranking"].includes(type);
}

// ─── API 3 – local grading rules (unchanged) ────────────────────────
export function localGradeQuestion(q, userAns){
  let score=0, fb="";

  switch(q.type){
    case "multipleChoice":{
      const ok = q.correctIndex === Number(userAns);
      score = ok?1:0;
      fb    = ok? "Correct!" : `Incorrect. Correct: ${q.options?.[q.correctIndex]??"—"}`;
      break;
    }
    case "trueFalse":{
      const ok = (userAns||"").toString().toLowerCase() ===
                 (q.correctValue||"").toString().toLowerCase();
      score = ok?1:0;
      fb    = ok? "Correct!" : `Incorrect. Correct answer was "${q.correctValue}".`;
      break;
    }
    case "fillInBlank":{
      const ok = (userAns||"").trim().toLowerCase() ===
                 (q.answerKey||"").trim().toLowerCase();
      score = ok?1:0;
      fb    = ok? "Correct!" : `Incorrect. Expected "${q.answerKey}".`;
      break;
    }
    case "ranking":{
      // placeholder – implement your own logic
      score = 0;
      fb    = "Ranking grading not implemented.";
      break;
    }
    default:{
      score = 0;
      fb    = "Unrecognized type for local grading.";
    }
  }
  return { score:clamp01(score), feedback:fb };
}

// ─── API 4 – GPT batch grading for open-ended items ──────────────────
/*  items[] = { qObj, userAns, index }
 *  rubric  = short string injected into GPT prompt
 */
export async function gradeOpenEndedBatch({
  openAiKey, subchapterSummary="", items=[], rubric=""
}){
  if (!openAiKey) return { success:false, gradingArray:[], error:"Missing API key" };
  if (!items.length)    return { success:true , gradingArray:[], error:"" };

  /* build prompt ----------------------------------------------------*/
  let block = "";
  items.forEach((it,i)=>{
    const q  = it.qObj;
    block += `
Q#${i+1}
Question: ${q.question}
Expected: ${q.expectedAnswer ?? q.answerGuidance ?? "(none)"}
Learner : """${it.userAns}"""`.trim()+"\n";
  });

  const userPrompt = `
You are a strict grading assistant.
Rubric: "${rubric}"
Context (sub-chapter summary): "${subchapterSummary}"

For every Q#: compare Expected vs Learner, decide a score between 0 and 1
(1 = fully correct, 0 = totally wrong) and give concise feedback.

Return JSON ONLY:
{
  "results":[
    { "score":0.75, "feedback":"…" },
    …
  ]
}
${block}`.trim();

  /* call OpenAI -----------------------------------------------------*/
  try{
    const resp = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model:"gpt-3.5-turbo",
        messages:[
          { role:"system", content:"Return JSON only, no extra text."},
          { role:"user",   content:userPrompt }
        ],
        max_tokens:1000,
        temperature:0.0
      },
      { headers:{ Authorization:`Bearer ${openAiKey}` } }
    );

    const raw    = resp.data.choices[0].message.content
                     .replace(/```json|```/g,"").trim();
    const parsed = JSON.parse(raw);

    if(!Array.isArray(parsed.results))
      throw new Error("Missing results[] array in GPT reply");

    const gradingArray = parsed.results.map(r=>({
      score   : clamp01(r.score),
      feedback: r.feedback ?? ""
    }));

    // pad / trim to match items.length just in case
    while(gradingArray.length < items.length) gradingArray.push({score:0,feedback:""});
    return { success:true, gradingArray, error:"" };

  }catch(err){
    return { success:false, gradingArray:[], error:err.message };
  }
}