/*  LastAttemptPanel.jsx  – modernised review panel (v4)  */

import React from "react";

/* helpers --------------------------------------------------- */
const pick = (obj, ...keys) => {
  for (const k of keys) if (obj?.[k] !== undefined) return obj[k];
  return null;
};

/* palette */
const CLR_BG              = "#1b1b1b";
const CLR_BORDER          = "#303030";
const CLR_TEXT            = "#e0e0e0";
const CLR_USER_CORRECT    = "#2e7d32";
const CLR_CORRECT         = "#4caf50";
const CLR_WRONG           = "#c62828";
const CLR_INACTIVE        = "#424242";
const CLR_FEEDBACK        = "#ffb74d";

/* ---------- QuestionCard ---------------------------------- */
/* ---------- QuestionCard ---------------------------------- */
function QuestionCard({ qObj, idx, result = {} }) {
  /* 1. basic text / meta ----------------------------------- */
  const qText   =
    pick(qObj, "question", "questionText", "prompt", "stem") ?? "";
  const concept = pick(qObj, "conceptName", "concept", "topic") ?? "";

  /* 2. normalise helpers ----------------------------------- */
  const clean = str =>
    String(str ?? "")
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const rawOpts = qObj.options || qObj.answers || [];
  const opts    = rawOpts.map(o =>
    typeof o === "string"
      ? clean(o)
      : clean(pick(o, "text", "label", "option") ?? "")
  );



  /* which option did the learner actually choose? */
const userIdx = (() => {
  // grab whatever field your backend uses
  const raw = qObj.userAnswer ?? qObj.userAns ?? qObj.learnerResponse ?? "";

  if (raw === null || raw === undefined || raw === "") return -1;

  /* #1 numeric index – 0, 1, "2" … */
  if (!isNaN(raw)) return parseInt(raw, 10);

  /* #2 letter – "A"/"b" …  */
  if (/^[A-Z]$/i.test(raw.trim()))
    return raw.trim().toUpperCase().charCodeAt(0) - 65;

  /* #3 the option text itself */
  const cleaned = raw.toString().trim().replace(/\s+/g, " ");
  const byText  = opts.findIndex(o => o === cleaned);
  if (byText !== -1) return byText;

  return -1;           // couldn’t match
})();

  const correctIdx = Number.isFinite(qObj.correctIndex)
    ? parseInt(qObj.correctIndex, 10)
    : -1;

  const typedAnswer = (
    qObj.userAnswer        ??
    qObj.userAns           ??
    qObj.learnerResponse   ??
    qObj.freeText          ??
    ""
  )
    .toString()
    .trim();

  /* 4. per-item score / colours ---------------------------- */
  const gotPoint = result?.score === 1;
  const scorePill = gotPoint ? "✓ 1 / 1" : "✗ 0 / 1";

  /* 5. render ---------------------------------------------- */
  return (
    <div style={styles.card}>
      {/* header row */}
      <div style={styles.headerRow}>
        <span style={styles.qNumber}>Q{idx + 1}</span>
        <span
          style={{ flex: 1 }}
          dangerouslySetInnerHTML={{ __html: qText }}
        />
        {concept && <span style={styles.chip}>{concept}</span>}
        <span
          style={{
            ...styles.scorePill,
            background: gotPoint ? CLR_USER_CORRECT : CLR_WRONG,
          }}
        >
          {scorePill}
        </span>
      </div>

      {/* MCQ choices (if any) */}
      {opts.length > 0 && (
        <ul style={styles.optList}>
          {opts.map((text, i) => {
            const chosen  = i === userIdx;
            const correct = i === correctIdx;

            let bg = CLR_INACTIVE;
            if (chosen && correct) bg = CLR_USER_CORRECT;
            else if (correct)      bg = CLR_CORRECT;
            else if (chosen)       bg = CLR_WRONG;

            return (
              <li
                key={i}
                style={{
                  ...styles.optItem,
                  background: bg,
                  opacity: correct || chosen ? 1 : 0.38,
                }}
              >
                {(chosen || correct) && (
                  <span style={styles.icon}>
                    {correct ? "✓" : "✗"}
                  </span>
                )}
                <span
                  dangerouslySetInnerHTML={{ __html: text }}
                  style={{ flex: 1 }}
                />
              </li>
            );
          })}
        </ul>
      )}

            {/* free-text answers only (no options means not MCQ) */}
      {opts.length === 0 && typedAnswer && (
        <div style={styles.typedBlock}>
          <b>Your answer:</b> {typedAnswer || "(blank)"}
        </div>
      )}

      {/* Show feedback only for NON-MCQ questions */}
{opts.length === 0 && result?.feedback && (
  <div
    style={styles.feedback}
    dangerouslySetInnerHTML={{ __html: result.feedback }}
  />
)}
    </div>
  );
}

/* ---------- LastAttemptPanel ------------------------------- */
export default function LastAttemptPanel({
  attempt,
  show = false,
  onToggle,
  hideToggle = false,
}) {
  if (!attempt) return null;

  const questions = attempt.questions || attempt.quizSubmission || [];
  if (!questions.length) return null;

  /* RESULTS array falls back gracefully if missing */
  const results =
    attempt.results ||
    questions.map(q => ({ score: pick(q, "score"), feedback: pick(q, "feedback") }));

  return (
    <div style={styles.wrapper}>
      {!hideToggle && (
        <button style={styles.toggleBtn} onClick={onToggle}>
          {show ? "▲ Hide details" : "▼ Show details"}
        </button>
      )}

      {show && (
        <div style={styles.inner}>
          {questions.map((q, i) => (
  <QuestionCard
    key={i}
    qObj={q}
    idx={i}
    result={results[i]}   
  />
))}
        </div>
      )}
    </div>
  );
}

/* ---------- styles ----------------------------------------- */
const styles = {
  wrapper: { marginBottom: "1.5rem" },

  toggleBtn: {
    background: "#263238",
    color: "#e0f7fa",
    border: "none",
    padding: "6px 14px",
    borderRadius: 18,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
  },

  inner: { marginTop: 16 },

  /* card */
  card: {
    background: CLR_BG,
    border: `1px solid ${CLR_BORDER}`,
    borderRadius: 8,
    padding: "14px 16px",
    marginBottom: 18,
    color: CLR_TEXT,
    fontSize: 15,
  },

  headerRow: {
    display: "flex",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 10,
  },

  qNumber: { fontWeight: 700 },

  chip: {
    marginLeft: "auto",
    background: "#004d5b",
    color: "#b2ebf2",
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 12,
    whiteSpace: "nowrap",
  },

  scorePill: {
    marginLeft: 10,
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 12,
    color: "#fff",
    whiteSpace: "nowrap",
  },

  /* option list */
  optList: { margin: 0, padding: 0, listStyle: "none" },

  optItem: {
    display: "flex",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 4,
    marginBottom: 4,
    color: "#fff",
    fontSize: 14,
  },

  icon: { fontWeight: 700, width: 14 },

  /* feedback */
  feedback: {
    marginTop: 8,
    fontSize: 13,
    color: CLR_FEEDBACK,
  },
  typedBlock: {
  marginTop: 6,
  padding: "6px 10px",
  borderRadius: 4,
  background: "#37474f",
  color: "#eceff1",
  fontSize: 14,
  whiteSpace: "pre-wrap",
},
};