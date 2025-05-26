/*  LastAttemptPanel.jsx  – read-only quiz review (v3)
    • always highlights the learner’s pick
    • correct / wrong colours per spec
*/

import React, { useState } from "react";

/* ───── helpers ───── */
const pick = (obj, ...keys) => {
  for (const k of keys) if (obj?.[k] !== undefined) return obj[k];
  return null;
};

/* palette */
const CLR_USER_CORRECT = "#2e7d32";
const CLR_CORRECT      = "#4caf50";
const CLR_WRONG        = "#c62828";
const CLR_OTHER        = "#424242";

/* render one option line */
function OptionLine({ text, chosen, correct }) {
  let bg   = CLR_OTHER;
  let icon = "";

  if (chosen && correct) { bg = CLR_USER_CORRECT; icon = "✓"; }
  else if (correct)      { bg = CLR_CORRECT;      icon = "✓"; }
  else if (chosen)       { bg = CLR_WRONG;        icon = "✗"; }

  return (
    <li style={{
      listStyle:"none", margin:"4px 0", padding:"8px 10px",
      display:"flex", gap:6, fontSize:14, borderRadius:4,
      background:bg, color:"#fff",
      opacity: correct||chosen ? 1 : 0.45
    }}>
      {icon && <span style={{fontWeight:700,width:14}}>{icon}</span>}
      <span style={{flex:1}} dangerouslySetInnerHTML={{__html:text}}/>
    </li>
  );
}

/* render a single question card */
/* ——— QuestionCard (drop-in replacement) ——— */
function QuestionCard({ qObj, idx, userAns, correctAns, feedback }) {
  const qText   = pick(
    qObj, "questionText", "stem", "prompt", "text", "content", "question"
  ) ?? "";

  const concept = pick(qObj, "conceptName", "concept", "topic") ?? "";

  /* ---------- 1.  normalise strings  ---------- */
const clean = str =>
  String(str ?? "")
    .replace(/<[^>]*>/g, "")   // strip tags
    .replace(/\s+/g, " ")      // collapse whitespace
    .trim();

/* ---------- 2.  canonical options array ---------- */
const rawOpts = qObj.options || qObj.answers || qObj.choices || [];
const opts = rawOpts.map(o =>
  typeof o === "string" ? clean(o) :
  clean(pick(o, "text", "label", "option", "content") ?? "")
);

/* ---------- 3.  work out selected / correct ---------- */
let userIdx    = -1;
let correctIdx = -1;

if (Number.isFinite(qObj.userAnswer)) {
  userIdx = parseInt(qObj.userAnswer, 10);
} else {
  const ua = clean(qObj.userAnswer ?? qObj.userAns ?? "");
  userIdx = opts.findIndex(o => o === ua);
}

if (Number.isFinite(qObj.correctIndex)) {
  correctIdx = parseInt(qObj.correctIndex, 10);
} else {
  const ca = clean(qObj.correctAnswer ?? "");
  correctIdx = opts.findIndex(o => o === ca);
}

    /* ── 4. what did the learner actually type? ─────────────────────── */
  const typedAnswer = (
    userAns
    ?? qObj.userAnswer
    ?? qObj.userAns
    ?? qObj.answer
    ?? qObj.learnerResponse
    ?? qObj.freeText
    ?? ""
  ).toString().trim();

  /* 👇  NEW: inspect everything that could hold the answer */
console.log("QA-debug",
  { idx,
    userAnsProp : userAns,
    qObjUA      : qObj.userAnswer,
    learnerResp : qObj.learnerResponse,
    typedAnswer });

console.log("full-qObj-dump", qObj);   //  👈  add this

  return (
    <div style={styles.card}>
      {/* header */}
      <div style={styles.qHeader}>
        <span style={{ fontWeight: 600 }}>Q{idx + 1}.</span>&nbsp;
        <span dangerouslySetInnerHTML={{ __html: qText }} />
        {concept && <span style={styles.chip}>{concept}</span>}
      </div>

     

      {/* options */}
      <ul style={{ margin: 0, padding: 0 }}>
        {opts.map((opt, i) => {
          const chosen  = i === userIdx;
          const correct = i === correctIdx;

          /* colour rules (same as HistoryView) */
          let bg = "#424242";
          if (chosen && correct) bg = "#2e7d32";      // user picked & correct
          else if (correct)      bg = "#4caf50";      // correct (but not chosen)
          else if (chosen)       bg = "#c62828";      // chosen but wrong

          return (
            <li key={i}
                style={{
                  listStyle: "none",
                  margin: "4px 0",
                  padding: "8px 10px",
                  borderRadius: 4,
                  background: bg,
                  color: "#fff",
                  display: "flex",
                  gap: 6,
                  fontSize: 14,
                  opacity: correct || chosen ? 1 : 0.45,
                }}>
              {(chosen || correct) && (
                <span style={{ fontWeight: 700, width: 14 }}>
                  {correct ? "✓" : "✗"}
                </span>
              )}
              <span style={{ flex: 1 }} dangerouslySetInnerHTML={{ __html: opt }} />
            </li>
          );
        })}
      </ul>

            {/* typed response for non-MCQ items */}
      {opts.length === 0 && (
        <div style={{
          marginTop : 6,
          padding   : "8px 10px",
          borderRadius: 4,
          background  : "#37474f",
          color       : "#eceff1",
          fontSize    : 14,
          whiteSpace  : "pre-wrap",
        }}>
          <b>Your answer:</b>{" "}
          {typedAnswer || "(blank)"}
        </div>
     )}

      {feedback && <div style={styles.feedback}>{feedback}</div>}
    </div>
  );
}

/* ───── main component ───── */
export default function LastAttemptPanel({ attempt }) {
  if (!attempt) return null;

  const questions = attempt.questions || attempt.quizSubmission || [];
  const results   = attempt.results   ||
    questions.map(q => ({ score:pick(q,"score"), feedback:pick(q,"feedback") }));

  if (!questions.length) return null;

  const [open,setOpen] = useState(false);

  return (
    <div style={styles.wrapper}>
      <button style={styles.toggleBtn} onClick={()=>setOpen(o=>!o)}>
        {open ? "▼  Hide last quiz" : "▲  Show last quiz"}
      </button>

      {open && (
        <div style={styles.inner}>
          <p style={{margin:"4px 0 16px 0",fontSize:15}}>
            <b>Last quiz score:</b> {attempt.score ?? "N/A"}{" "}
            
          </p>

          {questions.map((q,i)=>(
            <QuestionCard
              key={i}
              qObj={q}
              idx={i}
               userAns={pick(
   q,
   "userAnswer",            // frontend field
   "userAns",               // alt. frontend field
   "selected",              // sometimes used in older data
   "givenAnswer",           // ""
   "answer",                // ✨ backend (open-ended)
   "learnerResponse",       // ✨ backend (open-ended)
   "learnerAnswer",
   "studentAnswer",
   "freeText"
 )}
              correctAns={pick(q,"correctAnswer","answer","key","rightOption")}
              feedback={results[i]?.feedback}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ───── styles ───── */
const styles = {
  wrapper:{ marginBottom:"1.5rem" },
  toggleBtn:{
    background:"#444", color:"#fff", border:"none",
    padding:"6px 12px", borderRadius:4, cursor:"pointer",
    fontSize:14, fontWeight:500,
  },
  inner:{ marginTop:8 },
  card:{ background:"#222", border:"1px solid #333",
         borderRadius:6, padding:"10px 12px", marginBottom:14 },
  qHeader:{
    display:"flex", alignItems:"center", gap:6,
    marginBottom:8, fontSize:15,
  },
  chip:{
    marginLeft:"auto",
    background:"#004d5b", color:"#b2ebf2",
    fontSize:11, padding:"2px 8px", borderRadius:12,
    whiteSpace:"nowrap",
  },
  feedback:{ marginTop:6, fontSize:13, color:"#ffb74d" },
};