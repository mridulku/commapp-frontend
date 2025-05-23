/**
 * File: QuizQuestionRenderer.jsx
 * Description:
 *   Renders one quiz question.  If the parent passes `readOnly={true}`,
 *   all inputs are disabled (handy for “last-attempt” review panels).
 */

import React from "react";

/* ----------------------------- styles -------------------------------- */
const styles = {
  container      : { marginBottom: "1rem" },
  questionPrompt : { margin: "0.5rem 0", fontWeight: "bold" },
  conceptLabel   : { fontStyle: "italic", fontSize: "0.9rem", color: "#aaa", margin: "0.5rem 0" },
  optionLabel    : { display: "block", marginLeft: "1.5rem" },
  input          : { width: "100%", padding: "8px", borderRadius: "4px", boxSizing: "border-box" },
  textarea       : { width: "100%", padding: "8px", minHeight: "60px", borderRadius: "4px" },
  scenarioBox    : { backgroundColor: "#444", padding: "8px", borderRadius: "4px", marginBottom: "0.5rem" },
};

/* --------------------------- component ------------------------------- */
export default function QuizQuestionRenderer({
  index,
  questionObj,
  userAnswer,
  onUserAnswerChange,
  readOnly = false,                // 👈 NEW — optional flag
}) {
  console.log("[QuizQuestionRenderer] render → index", index, "| type:", questionObj?.type);

  /* graceful fallback */
  if (!questionObj) return <div style={styles.container}>No question data.</div>;

  const qType        = questionObj.type    || "unknownType";
  const questionText = questionObj.question|| `Question ${index + 1}`;
  const conceptName  = questionObj.conceptName || "";

  return (
    <div style={styles.container}>
      <p style={styles.questionPrompt}>Q{index + 1}: {questionText}</p>

      {conceptName && (
        <p style={styles.conceptLabel}>
          Concept: <em>{conceptName}</em>
        </p>
      )}

      {renderByType(qType, questionObj, userAnswer, onUserAnswerChange, readOnly)}
    </div>
  );
}

/* ------------------- render switch-board ----------------------------- */
function renderByType(qType, qObj, userAnswer, onUserAnswerChange, readOnly) {
  switch (qType) {
    case "multipleChoice": return renderMultipleChoice(qObj, userAnswer, onUserAnswerChange, readOnly);
    case "trueFalse"     : return renderTrueFalse    (qObj, userAnswer, onUserAnswerChange, readOnly);
    case "fillInBlank"   : return renderFillInBlank  (qObj, userAnswer, onUserAnswerChange, readOnly);
    case "shortAnswer":
    case "compareContrast":return renderShortAnswer  (qObj, userAnswer, onUserAnswerChange, readOnly);
    case "scenario"      : return renderScenario     (qObj, userAnswer, onUserAnswerChange, readOnly);
    case "ranking"       : return renderRanking      (qObj, userAnswer, onUserAnswerChange, readOnly);
    default              : return <p style={{ color: "red" }}>Unknown question type: <b>{qType}</b></p>;
  }
}

/* ---------------------- type-specific UIs ---------------------------- */
function renderMultipleChoice(qObj, userAnswer, onUserAnswerChange, readOnly) {
  if (!Array.isArray(qObj.options)) return <p>No MCQ options provided.</p>;
  return (
    <div>
      {qObj.options.map((opt, i) => (
        <label key={i} style={styles.optionLabel}>
          <input
            disabled={readOnly}
            type="radio"
            name={`mcq-${qObj.question}`}
            value={i}
            checked={parseInt(userAnswer, 10) === i}
            onChange={() => onUserAnswerChange(i.toString())}
          />
          {opt}
        </label>
      ))}
    </div>
  );
}

function renderTrueFalse(qObj, userAnswer, onUserAnswerChange, readOnly) {
  return (
    <div>
      {["true", "false"].map((val) => (
        <label key={val} style={styles.optionLabel}>
          <input
            disabled={readOnly}
            type="radio"
            name={`tf-${qObj.question}`}
            value={val}
            checked={userAnswer === val}
            onChange={() => onUserAnswerChange(val)}
          />
          {val.charAt(0).toUpperCase() + val.slice(1)}
        </label>
      ))}
    </div>
  );
}

function renderFillInBlank(qObj, userAnswer, onUserAnswerChange, readOnly) {
  return (
    <div>
      <p>{qObj.blankPhrase || "Fill in the blank:"}</p>
      <input
        disabled={readOnly}
        type="text"
        style={styles.input}
        value={userAnswer}
        onChange={(e) => onUserAnswerChange(e.target.value)}
      />
    </div>
  );
}

function renderShortAnswer(qObj, userAnswer, onUserAnswerChange, readOnly) {
  return (
    <textarea
      disabled={readOnly}
      style={styles.textarea}
      value={userAnswer}
      onChange={(e) => onUserAnswerChange(e.target.value)}
      placeholder="Enter your response..."
    />
  );
}

function renderScenario(qObj, userAnswer, onUserAnswerChange, readOnly) {
  return (
    <div>
      {qObj.scenarioText && (
        <blockquote style={styles.scenarioBox}>{qObj.scenarioText}</blockquote>
      )}
      <textarea
        disabled={readOnly}
        style={styles.textarea}
        value={userAnswer}
        onChange={(e) => onUserAnswerChange(e.target.value)}
        placeholder="Describe how you'd handle it..."
      />
    </div>
  );
}

function renderRanking(qObj, userAnswer, onUserAnswerChange, readOnly) {
  return (
    <div>
      <p>(Ranking question not fully implemented.)</p>
      <input
        disabled={readOnly}
        type="text"
        style={styles.input}
        value={userAnswer}
        onChange={(e) => onUserAnswerChange(e.target.value)}
        placeholder='e.g. "1,2,3" for your order'
      />
    </div>
  );
}