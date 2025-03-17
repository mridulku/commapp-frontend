// QuestionRenderer.jsx
import React from "react";

const styles = {
  block: { marginBottom: "1rem" },
  optionLabel: { display: "block", marginLeft: "1.5rem" },
  input: {
    width: "100%",
    padding: "8px",
    boxSizing: "border-box",
    borderRadius: "4px",
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

export default function QuestionRenderer({
  index,
  questionObj,
  userAnswer,
  onUserAnswerChange,
}) {
  const qType = questionObj.type || "";
  const questionText = questionObj.question || `Question ${index + 1}`;

  return (
    <div style={styles.block}>
      <p>
        <b>Q{index + 1}:</b> {questionText}
      </p>
      {renderQuestionByType(qType, questionObj, userAnswer, onUserAnswerChange)}
    </div>
  );
}

function renderQuestionByType(qType, questionObj, userAnswer, onUserAnswerChange) {
  switch (qType) {
    case "multipleChoice":
      // questionObj.options => ["A", "B", "C"]
      // questionObj.correctAnswerIndex => 1 (for example)
      return (
        <>
          {Array.isArray(questionObj.options) &&
            questionObj.options.map((opt, optIdx) => (
              <label key={optIdx} style={styles.optionLabel}>
                <input
                  type="radio"
                  name={`mc-${questionObj.question}`}
                  value={optIdx}
                  checked={Number(userAnswer) === optIdx}
                  onChange={() => onUserAnswerChange(optIdx)}
                />
                {opt}
              </label>
            ))}
        </>
      );

    case "trueFalse":
      // questionObj.correctAnswer => boolean
      // user picks "true" or "false"
      return (
        <div>
          <p>{questionObj.statement || "True or false?"}</p>
          <label style={styles.optionLabel}>
            <input
              type="radio"
              name={`tf-${questionObj.question}`}
              value="true"
              checked={userAnswer === "true"}
              onChange={() => onUserAnswerChange("true")}
            />
            True
          </label>
          <label style={styles.optionLabel}>
            <input
              type="radio"
              name={`tf-${questionObj.question}`}
              value="false"
              checked={userAnswer === "false"}
              onChange={() => onUserAnswerChange("false")}
            />
            False
          </label>
        </div>
      );

    case "fillInBlank":
      // questionObj.correctAnswers => e.g. ["skimming","Skimming"]
      return (
        <div>
          <p>{questionObj.blankPhrase || "Fill in the blank:"}</p>
          <input
            style={styles.input}
            type="text"
            value={userAnswer || ""}
            onChange={(e) => onUserAnswerChange(e.target.value)}
          />
        </div>
      );

    case "shortAnswer":
      // questionObj.answerGuidance => optional
      return (
        <div>
          <textarea
            style={styles.textarea}
            value={userAnswer || ""}
            onChange={(e) => onUserAnswerChange(e.target.value)}
            placeholder="Write your short answer..."
          />
        </div>
      );

    case "scenario":
      // questionObj.scenarioText => scenario
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

    default:
      return (
        <div style={{ color: "red" }}>
          Unknown question type: <b>{qType}</b>
        </div>
      );
  }
}