/***********************************************************************
 *  LastAttemptPanel.jsx  – sleek review panel (v6)
 *
 *  Changelog v5 → v6
 *  • Score pill always displays (defaults to 0).
 *  • “Your answer”, “Feedback”, “Ideal answer” now shown in separate
 *    styled blocks for clarity.
 *  • Uses the new idealAnswer field returned by QuizQuestionGrader v5.
 **********************************************************************/

import React from "react";

/* tiny helper ------------------------------------------------------- */
const pick = (obj, ...keys) => {
  for (const k of keys) if (obj?.[k] !== undefined) return obj[k];
  return null;
};

/* palette ----------------------------------------------------------- */
const CLR_BG         = "#1b1b1b";
const CLR_BORDER     = "#303030";
const CLR_TEXT       = "#e0e0e0";
const CLR_PASS       = "#2e7d32";
const CLR_FAIL       = "#c62828";
const CLR_PARTIAL    = "#ffb300";
const CLR_CORRECT    = "#4caf50";
const CLR_INACTIVE   = "#424242";
const CLR_FEEDBACK   = "#ffb74d";

/* ===========================================================
   QuestionCard – one card per question
   ----------------------------------------------------------- */
function QuestionCard({ qObj = {}, idx = 0, result = {} }) {
  /* ---------- basics -------------------------------------- */
  const qText   = pick(qObj, "question", "questionText", "prompt", "stem") ?? "";
  const concept = pick(qObj, "conceptName", "concept", "topic") ?? "";

  /* ---------- normalise options --------------------------- */
  const clean = str =>
    String(str ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

  const opts = (qObj.options || []).map(o =>
    typeof o === "string" ? clean(o) : clean(pick(o, "text", "label", "option"))
  );

  /* ---------- learner’s chosen option --------------------- */
  const userIdx = (() => {
    const raw = pick(qObj, "userAnswer", "userAns", "learnerResponse", "freeText") ?? "";
    if (raw === "") return -1;
    if (!isNaN(raw))          return parseInt(raw, 10);                    // numeric index
    if (/^[A-Z]$/i.test(raw)) return raw.trim().toUpperCase().charCodeAt(0) - 65; // letter
    return opts.findIndex(o => o === clean(raw));
  })();

  const correctIdx   = Number.isFinite(qObj.correctIndex)
                       ? parseInt(qObj.correctIndex, 10) : -1;
  const typedAnswer  =
    (pick(qObj, "userAnswer", "userAns", "learnerResponse", "freeText") ?? "")
      .toString()
      .trim();

  /* ---------- score pill ---------------------------------- */
  const rawScore   =
        typeof result.score === "number"
          ? result.score
          : parseFloat(result.score);
  const scoreNum   = isNaN(rawScore) ? 0 : Math.max(0, Math.min(1, rawScore));
  // new – keeps 0, trims nicely for 0.5 or 1
const scoreLabel =
  `${scoreNum === 0
      ? "0"
      : scoreNum.toFixed(2)             // 0.50 → "0.50"
               .replace(/\.0+$/, "")    // 1.00 → "1"
               .replace(/0$/, "")       // 0.50 → 0.5
    } / 1`;

  const passCutoff = 0.8;
  let   pillClr    = CLR_FAIL;
  if (scoreNum >= passCutoff) pillClr = CLR_PASS;
  else if (scoreNum > 0)      pillClr = CLR_PARTIAL;

  /* ---------- render -------------------------------------- */
  return (
    <div style={S.card}>
      {/* row: Q-number • text • concept • score */}
      <div style={S.headerRow}>
        <span style={S.qNum}>Q{idx + 1}</span>
        <span style={{ flex:1 }} dangerouslySetInnerHTML={{ __html:qText }} />
        {concept && <span style={S.chip}>{concept}</span>}
        <span style={{ ...S.scorePill, background:pillClr }}>{scoreLabel}</span>
      </div>

      {/* ---------- MCQ view (coloured bars) ---------- */}
      {opts.length > 0 && (
        <ul style={S.optList}>
          {opts.map((t, i) => {
            const chosen  = i === userIdx;
            const correct = i === correctIdx;
            let bg = CLR_INACTIVE;

            if (chosen && correct) bg = CLR_PASS;
            else if (correct)      bg = CLR_CORRECT;
            else if (chosen)       bg = CLR_FAIL;

            return (
              <li
                key={i}
                style={{
                  ...S.optItem,
                  background:bg,
                  opacity: chosen || correct ? 1 : 0.38,
                }}
              >
                {(chosen || correct) && (
                  <span style={S.icon}>{correct ? "✓" : "✗"}</span>
                )}
                <span style={{ flex:1 }} dangerouslySetInnerHTML={{ __html:t }} />
              </li>
            );
          })}
        </ul>
      )}

      {/* ---------- free-text answer blocks ---------- */}
      {opts.length === 0 && (
        <>
          {/* YOUR ANSWER */}
          {typedAnswer && (
            <Block
              label="Your answer"
              colour="#29434e"
              textColour="#e0f7fa"
              content={typedAnswer}
            />
          )}

          {/* FEEDBACK */}
          {result.feedback && (
            <Block
              label="Feedback"
              colour="transparent"
              textColour={CLR_FEEDBACK}
              content={result.feedback}
            />
          )}

          {/* IDEAL ANSWER */}
          {result.idealAnswer && (
            <Block
              label="Ideal answer"
              colour="#263238"
              textColour="#b2ebf2"
              content={result.idealAnswer}
            />
          )}
        </>
      )}
    </div>
  );
}

/* ===========================================================
   Re-usable labelled block
   ----------------------------------------------------------- */
function Block({ label, colour, textColour, content }) {
  return (
    <div style={{ ...S.blockWrap, background: colour }}>
      <span style={{ ...S.blockLabel, color:textColour }}>{label}:</span>
      <span style={{ color:textColour }} dangerouslySetInnerHTML={{ __html:content }} />
    </div>
  );
}

/* ===========================================================
   LastAttemptPanel – accordion wrapper
   ----------------------------------------------------------- */
export default function LastAttemptPanel({
  attempt,
  show = false,
  onToggle,
  hideToggle = false,
}) {
  if (!attempt) return null;

  const questions = attempt.questions || attempt.quizSubmission || [];
  if (!questions.length) return null;

  const results = attempt.results ||
    questions.map(q => ({
      score       : pick(q,"score"),
      feedback    : pick(q,"feedback"),
      idealAnswer : pick(q,"idealAnswer"),
    }));

  return (
    <div style={S.wrapper}>
      {!hideToggle && (
        <button style={S.toggleBtn} onClick={onToggle}>
          {show ? "▲ Hide details" : "▼ Show details"}
        </button>
      )}

      {show && (
        <div style={S.inner}>
          {questions.map((q, i) => (
            <QuestionCard key={i} qObj={q} idx={i} result={results[i]} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ===========================================================
   Styles
   ----------------------------------------------------------- */
const S = {
  wrapper: { marginBottom:"1.5rem" },

  toggleBtn: {
    background:"#263238",
    color:"#e0f7fa",
    border:"none",
    padding:"6px 14px",
    borderRadius:18,
    cursor:"pointer",
    fontSize:13,
    fontWeight:600,
  },

  inner:{ marginTop:16 },

  /* ---- card ---- */
  card:{
    background:CLR_BG,
    border:`1px solid ${CLR_BORDER}`,
    borderRadius:8,
    padding:"14px 16px",
    marginBottom:18,
    color:CLR_TEXT,
    fontSize:15,
  },

  headerRow:{
    display:"flex",
    alignItems:"baseline",
    gap:8,
    marginBottom:10,
  },

  qNum:{ fontWeight:700 },

  chip:{
    marginLeft:"auto",
    background:"#004d5b",
    color:"#b2ebf2",
    fontSize:11,
    padding:"2px 8px",
    borderRadius:12,
    whiteSpace:"nowrap",
  },

  scorePill:{
    marginLeft:10,
    fontSize:11,
    padding:"2px 8px",
    borderRadius:12,
    color:"#fff",
    whiteSpace:"nowrap",
  },

  /* ---- MCQ list ---- */
  optList:{ margin:0, padding:0, listStyle:"none" },

  optItem:{
    display:"flex",
    gap:6,
    padding:"6px 10px",
    borderRadius:4,
    marginBottom:4,
    color:"#fff",
    fontSize:14,
  },

  icon:{ fontWeight:700, width:14 },

  /* ---- free-text blocks ---- */
  blockWrap:{
    marginTop:6,
    padding:"8px 10px",
    borderRadius:4,
    whiteSpace:"pre-wrap",
    lineHeight:1.45,
  },
  blockLabel:{
    fontWeight:700,
    marginRight:6,
  },
};