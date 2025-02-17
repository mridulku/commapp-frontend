/********************************************
 * QuizSection.jsx
 ********************************************/
import React from "react";

function QuizSection({
  quizData,
  selectedAnswers,
  quizSubmitted,
  score,
  handleOptionSelect,
  handleSubmitQuiz,
}) {
  const panelStyle = {
    backgroundColor: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(6px)",
    padding: "15px",
    borderRadius: "6px",
    marginBottom: "20px",
  };

  const sectionTitleStyle = {
    marginTop: 0,
    borderBottom: "1px solid rgba(255,255,255,0.3)",
    paddingBottom: "5px",
    marginBottom: "10px",
  };

  const buttonStyle = {
    padding: "10px 20px",
    borderRadius: "4px",
    border: "none",
    background: "#FFD700",
    color: "#000",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "opacity 0.3s",
    marginTop: "10px",
  };

  if (!quizData || quizData.length === 0) {
    return (
      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>Quiz</h2>
        <p>No quiz available for this subchapter.</p>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <h2 style={sectionTitleStyle}>Quiz</h2>
      {quizData.map((q, idx) => {
        const userSelection = selectedAnswers[idx];
        const isCorrect = userSelection === q.correctAnswerIndex;

        return (
          <div
            key={idx}
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              padding: "10px",
              borderRadius: "6px",
              marginBottom: "10px",
            }}
          >
            <p style={{ marginBottom: "5px" }}>
              <strong>
                Q{idx + 1}: {q.questionText}
              </strong>
            </p>
            {q.options.map((optionText, optionIdx) => {
              const radioId = `q${idx}_opt${optionIdx}`;
              return (
                <div key={optionIdx} style={{ marginBottom: "4px" }}>
                  <label htmlFor={radioId} style={{ cursor: "pointer" }}>
                    <input
                      id={radioId}
                      type="radio"
                      name={`question_${idx}`}
                      value={optionIdx}
                      checked={userSelection === optionIdx}
                      onChange={() => handleOptionSelect(idx, optionIdx)}
                      style={{ marginRight: "8px" }}
                    />
                    {optionText}
                  </label>
                </div>
              );
            })}

            {/* If submitted, show correctness + explanation */}
            {quizSubmitted && (
              <div style={{ marginTop: "8px" }}>
                {userSelection === undefined ? (
                  <p style={{ color: "orange" }}>No answer selected.</p>
                ) : isCorrect ? (
                  <p style={{ color: "limegreen" }}>Correct!</p>
                ) : (
                  <p style={{ color: "red" }}>Incorrect!</p>
                )}
                <p style={{ fontStyle: "italic", marginTop: "4px" }}>
                  Explanation: {q.explanation}
                </p>
              </div>
            )}
          </div>
        );
      })}

      {/* Submit or score */}
      {!quizSubmitted ? (
        <button onClick={handleSubmitQuiz} style={buttonStyle}>
          Submit Quiz
        </button>
      ) : (
        <div style={{ marginTop: "10px" }}>
          <strong>
            You scored {score} out of {quizData.length}
          </strong>
        </div>
      )}
    </div>
  );
}

export default QuizSection;