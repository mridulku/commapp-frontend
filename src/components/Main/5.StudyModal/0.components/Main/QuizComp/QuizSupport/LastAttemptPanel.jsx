/*  LastAttemptPanel.jsx  – modernised review panel (v5)
    ▼  CHANGES
    • Per-question pill now shows the actual fractional score (0 – 1)
    • Green ≥ passCutoff (default 0.8) │ Amber for partial │ Red for zero
    • All other behaviour remains identical
*/

import React from "react";

/* helpers --------------------------------------------------- */
const pick = (obj, ...keys) => {
  for (const k of keys) if (obj?.[k] !== undefined) return obj[k];
  return null;
};

/* palette */
const CLR_BG           = "#1b1b1b";
const CLR_BORDER       = "#303030";
const CLR_TEXT         = "#e0e0e0";
const CLR_PASS         = "#2e7d32";
const CLR_FAIL         = "#c62828";
const CLR_PARTIAL      = "#ffb300";
const CLR_CORRECT      = "#4caf50";
const CLR_INACTIVE     = "#424242";
const CLR_FEEDBACK     = "#ffb74d";

/* ===========================================================
   QuestionCard
   ----------------------------------------------------------- */
function QuestionCard({ qObj, idx, result = {} }) {
  /* 1. basic text / meta ----------------------------------- */
  const qText   = pick(qObj, "question", "questionText", "prompt", "stem") ?? "";
  const concept = pick(qObj, "conceptName", "concept", "topic") ?? "";

  /* 2. normalise helpers ----------------------------------- */
  const clean = str =>
    String(str ?? "")
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const rawOpts = qObj.options || qObj.answers || [];
  const opts = rawOpts.map(o =>
    typeof o === "string"
      ? clean(o)
      : clean(pick(o, "text", "label", "option") ?? "")
  );

  /* 3. learner’s chosen option index ----------------------- */
  const userIdx = (() => {
    const raw = pick(qObj, "userAnswer", "userAns", "learnerResponse", "freeText") ?? "";
    if (raw === "") return -1;
    if (!isNaN(raw))         return parseInt(raw, 10);                 // numeric
    if (/^[A-Z]$/i.test(raw))return raw.trim().toUpperCase().charCodeAt(0) - 65; // letter
    const byText = opts.findIndex(o => o === clean(raw));
    return byText !== -1 ? byText : -1;
  })();

  const correctIdx = Number.isFinite(qObj.correctIndex)
    ? parseInt(qObj.correctIndex, 10)
    : -1;

  const typedAnswer =
    (pick(qObj,
      "userAnswer",
      "userAns",
      "learnerResponse",
      "freeText") ?? ""
    ).toString().trim();

  /* 4. score pill (fraction-aware) ------------------------- */
  /* clamp, prettify */
  const rawScore   = Number.isFinite(result?.score) ? result.score : parseFloat(result?.score);
  const scoreNum   = Math.min(1, Math.max(0, isNaN(rawScore) ? 0 : rawScore));
  const displayStr = scoreNum.toFixed(2).replace(/\.00$/, "").replace(/0$/, ""); // 1→1  0.80→0.8

  const passCutoff = 0.8;                      // tweak if desired
  let pillColour   = CLR_FAIL;
  if (scoreNum >= passCutoff) pillColour = CLR_PASS;
  else if (scoreNum > 0)      pillColour = CLR_PARTIAL;

  const scorePill = `${displayStr} / 1`;

  /* 5. render ---------------------------------------------- */
  return (
    <div style={styles.card}>
      {/* header row */}
      <div style={styles.headerRow}>
        <span style={styles.qNumber}>Q{idx + 1}</span>
        <span style={{ flex: 1 }} dangerouslySetInnerHTML={{ __html: qText }} />
        {concept && <span style={styles.chip}>{concept}</span>}
        <span style={{ ...styles.scorePill, background: pillColour }}>
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
            if (chosen && correct) bg = CLR_PASS;
            else if (correct)      bg = CLR_CORRECT;
            else if (chosen)       bg = CLR_FAIL;

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
                  <span style={styles.icon}>{correct ? "✓" : "✗"}</span>
                )}
                <span
                  style={{ flex: 1 }}
                  dangerouslySetInnerHTML={{ __html: text }}
                />
              </li>
            );
          })}
        </ul>
      )}

      {/* free-text answers */}
      {opts.length === 0 && typedAnswer && (
        <div style={styles.typedBlock}>
          <b>Your answer:</b> {typedAnswer || "(blank)"}
        </div>
      )}

      {/* feedback line */}
      {opts.length === 0 && result?.feedback && (
        <div
          style={styles.feedback}
          dangerouslySetInnerHTML={{ __html: result.feedback }}
        />
      )}
    </div>
  );
}

/* ===========================================================
   LastAttemptPanel
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

  /* build results[] safely */
  const results =
    attempt.results ||
    questions.map(q => ({
      score:    pick(q, "score"),
      feedback: pick(q, "feedback"),
    }));

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
            <QuestionCard key={i} qObj={q} idx={i} result={results[i]} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ===========================================================
   Styles (unchanged except score pill colour additions)
   ----------------------------------------------------------- */
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