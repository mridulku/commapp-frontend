// File: QuizQuestionRenderer.jsx

import React from "react";

const styles = {
  container: { marginBottom: "1rem" },
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
  const qType = questionObj.type || "";
  const questionText = questionObj.question || `Question ${index + 1}`;

  return (
    <div style={styles.container}>
      <p>
        <b>Q{index + 1}:</b> {questionText}
      </p>
      {renderByType(qType, questionObj, userAnswer, onUserAnswerChange)}
    </div>
  );
}

function renderByType(qType, questionObj, userAnswer, onUserAnswerChange) {
  switch (qType) {
    case "multipleChoice":
      return (
        <>
          {Array.isArray(questionObj.options) &&
            questionObj.options.map((opt, optIdx) => (
              <label key={optIdx} style={styles.optionLabel}>
                <input
                  type="radio"
                  name={`q-mc-${questionObj.question}`}
                  value={optIdx}
                  checked={parseInt(userAnswer, 10) === optIdx}
                  onChange={() => onUserAnswerChange(optIdx)}
                />
                {opt}
              </label>
            ))}
        </>
      );

    case "trueFalse":
      return (
        <div>
          <label style={styles.optionLabel}>
            <input
              type="radio"
              name={`q-tf-${questionObj.question}`}
              value="true"
              checked={userAnswer === "true"}
              onChange={() => onUserAnswerChange("true")}
            />
            True
          </label>
          <label style={styles.optionLabel}>
            <input
              type="radio"
              name={`q-tf-${questionObj.question}`}
              value="false"
              checked={userAnswer === "false"}
              onChange={() => onUserAnswerChange("false")}
            />
            False
          </label>
        </div>
      );

    case "fillInBlank":
      return (
        <div>
          <p>{questionObj.blankPhrase || "Fill in the blank:"}</p>
          <input
            type="text"
            style={styles.input}
            value={userAnswer || ""}
            onChange={(e) => onUserAnswerChange(e.target.value)}
          />
        </div>
      );

    case "shortAnswer":
      return (
        <textarea
          style={styles.textarea}
          value={userAnswer || ""}
          onChange={(e) => onUserAnswerChange(e.target.value)}
          placeholder="Short answer..."
        />
      );

    case "scenario":
      return (
        <div>
          {questionObj.scenarioText && (
            <blockquote style={styles.scenarioBox}>
              {questionObj.scenarioText}
            </blockquote>
          )}
          <textarea
            style={styles.textarea}
            value={userAnswer || ""}
            onChange={(e) => onUserAnswerChange(e.target.value)}
            placeholder="Describe how you'd handle it..."
          />
        </div>
      );

    // Add more question types as desired...
    default:
      return (
        <p style={{ color: "red" }}>
          Unknown question type: <b>{qType}</b>
        </p>
      );
  }
}