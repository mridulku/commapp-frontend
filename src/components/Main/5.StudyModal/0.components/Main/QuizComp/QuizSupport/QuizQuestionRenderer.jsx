/**
 * File: QuizQuestionRenderer.jsx
 * Description:
 *   A single React component that takes a question object and displays it
 *   according to its "type" (multipleChoice, fillInBlank, etc.).
 *   It also captures the user's input via onUserAnswerChange.
 */

import React from "react";

const styles = {
  container: { marginBottom: "1rem" },
  questionPrompt: { margin: "0.5rem 0", fontWeight: "bold" },
  conceptLabel: {
    fontStyle: "italic",
    fontSize: "0.9rem",
    color: "#aaa",
    margin: "0.5rem 0",
  },
  optionLabel: { display: "block", marginLeft: "1.5rem" },
  input: {
    width: "100%",
    padding: "8px",
    borderRadius: "4px",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "8px",
    minHeight: "60px",
    borderRadius: "4px",
  },
  scenarioBox: {
    backgroundColor: "#444",
    padding: "8px",
    borderRadius: "4px",
    marginBottom: "0.5rem",
  },
};

export default function QuizQuestionRenderer({
  index,
  questionObj,
  userAnswer,
  onUserAnswerChange,
}) {
  // Fallback if questionObj is missing
  if (!questionObj) {
    return <div style={styles.container}>No question data.</div>;
  }

  const qType = questionObj.type || "unknownType";
  const questionText = questionObj.question || `Question ${index + 1}`;
  const conceptName = questionObj.conceptName || "";

  return (
    <div style={styles.container}>
      <p style={styles.questionPrompt}>
        Q{index + 1}: {questionText}
      </p>
      {/* Show concept name if it exists */}
      {conceptName && (
        <p style={styles.conceptLabel}>Concept: <em>{conceptName}</em></p>
      )}

      {renderByType(qType, questionObj, userAnswer, onUserAnswerChange)}
    </div>
  );
}

function renderByType(qType, qObj, userAnswer, onUserAnswerChange) {
  switch (qType) {
    case "multipleChoice":
      return renderMultipleChoice(qObj, userAnswer, onUserAnswerChange);

    case "trueFalse":
      return renderTrueFalse(qObj, userAnswer, onUserAnswerChange);

    case "fillInBlank":
      return renderFillInBlank(qObj, userAnswer, onUserAnswerChange);

    case "shortAnswer":
    case "compareContrast":
      // Or any other "openEnded" style with a simple textarea
      return renderShortAnswer(qObj, userAnswer, onUserAnswerChange);

    case "scenario":
      return renderScenario(qObj, userAnswer, onUserAnswerChange);

    case "ranking":
      return renderRanking(qObj, userAnswer, onUserAnswerChange);

    default:
      return (
        <p style={{ color: "red" }}>
          Unknown question type: <b>{qType}</b>
        </p>
      );
  }
}

// 1) Multiple Choice
function renderMultipleChoice(qObj, userAnswer, onUserAnswerChange) {
  if (!Array.isArray(qObj.options)) {
    return <p>No MCQ options provided.</p>;
  }
  return (
    <div>
      {qObj.options.map((opt, i) => (
        <label key={i} style={styles.optionLabel}>
          <input
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

// 2) True/False
function renderTrueFalse(qObj, userAnswer, onUserAnswerChange) {
  return (
    <div>
      <label style={styles.optionLabel}>
        <input
          type="radio"
          name={`tf-${qObj.question}`}
          value="true"
          checked={userAnswer === "true"}
          onChange={() => onUserAnswerChange("true")}
        />
        True
      </label>
      <label style={styles.optionLabel}>
        <input
          type="radio"
          name={`tf-${qObj.question}`}
          value="false"
          checked={userAnswer === "false"}
          onChange={() => onUserAnswerChange("false")}
        />
        False
      </label>
    </div>
  );
}

// 3) Fill in the Blank
function renderFillInBlank(qObj, userAnswer, onUserAnswerChange) {
  return (
    <div>
      <p>{qObj.blankPhrase || "Fill in the blank:"}</p>
      <input
        type="text"
        style={styles.input}
        value={userAnswer}
        onChange={(e) => onUserAnswerChange(e.target.value)}
      />
    </div>
  );
}

// 4) Short Answer, Compare/Contrast, etc. (openEnded styles)
function renderShortAnswer(qObj, userAnswer, onUserAnswerChange) {
  return (
    <textarea
      style={styles.textarea}
      value={userAnswer}
      onChange={(e) => onUserAnswerChange(e.target.value)}
      placeholder="Enter your response..."
    />
  );
}

// 5) Scenario
function renderScenario(qObj, userAnswer, onUserAnswerChange) {
  return (
    <div>
      {qObj.scenarioText && (
        <blockquote style={styles.scenarioBox}>{qObj.scenarioText}</blockquote>
      )}
      <textarea
        style={styles.textarea}
        value={userAnswer}
        onChange={(e) => onUserAnswerChange(e.target.value)}
        placeholder="Describe how you'd handle it..."
      />
    </div>
  );
}

// 6) Ranking (if you store a set of items the user has to reorder)
function renderRanking(qObj, userAnswer, onUserAnswerChange) {
  // This can be as simple or complex as you want. 
  // For example, if qObj.options = ["Apple", "Banana", "Cherry"]
  // you might let the user reorder them. 
  // For brevity, we just show them in a <select> or multiple input:
  return (
    <div>
      <p>(Ranking question not fully implemented. Please reorder items.)</p>
      {Array.isArray(qObj.options) ? (
        <ul>
          {qObj.options.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      ) : (
        <p>No ranking options found.</p>
      )}
      {/* For a real ranking solution, you'd implement drag-and-drop or a custom UI. */}
      <input
        type="text"
        style={styles.input}
        value={userAnswer}
        onChange={(e) => onUserAnswerChange(e.target.value)}
        placeholder='e.g. "1,2,3" for your order'
      />
    </div>
  );
}