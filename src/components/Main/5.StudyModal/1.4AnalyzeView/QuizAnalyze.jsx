import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import LoadingSpinner from "./LoadingSpinner";

/**
 * QuizAnalyze
 * -----------
 * Removes the extra heading so the quiz begins “right away.” 
 * The user sees only the questions or final results, no big "Quiz Analyze Attempt #..." text.
 */
export default function QuizAnalyze({
  subChapterId,
  attemptNumber,
  onQuizComplete,
  onQuizFail,
}) {
  const userId = useSelector((state) => state.auth?.userId);
  const quizType = "analyze";
  const promptKey = "quizAnalyze";

  // Local states
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [responseData, setResponseData] = useState(null);

  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [finalScore, setFinalScore] = useState(null);

  // Fetch GPT quiz on mount or subChapter/attempt changes
  useEffect(() => {
    if (!subChapterId) return;
    fetchGPTQuiz();
    // Reset states
    setSelectedAnswers([]);
    setShowResult(false);
    setFinalScore(null);
  }, [subChapterId, attemptNumber]);

  async function fetchGPTQuiz() {
    try {
      setLoading(true);
      setError("");
      setResponseData(null);

      const res = await axios.post("http://localhost:3001/api/generate", {
        userId,
        subchapterId: subChapterId,
        promptKey,
      });
      setResponseData(res.data);
    } catch (err) {
      console.error("Error fetching GPT quiz data:", err);
      setError(err.message || "Error fetching GPT quiz data");
    } finally {
      setLoading(false);
    }
  }

  if (!subChapterId) return <div style={styles.text}>No subChapterId</div>;
  if (loading) {
    return <LoadingSpinner message="Building your quiz..." />;
  }
  if (error) {
    return <div style={styles.textError}>Error: {error}</div>;
  }
  if (!responseData) {
    return <div style={styles.text}>No quiz data yet.</div>;
  }

  // Parse GPT JSON
  let raw = responseData.result || "";
  if (raw.startsWith("```")) {
    raw = stripMarkdownFences(raw);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return (
      <div style={styles.container}>
        {/* 
          We remove big headings here too, just keep minimal text 
          in case there's invalid JSON 
        */}
        <p style={{ ...styles.text, color: "red" }}>
          GPT response is not valid JSON. Check console for details.
        </p>
      </div>
    );
  }

  const { UIconfig = {} } = responseData;
  const { fields = [] } = UIconfig;
  const quizFieldConfig = fields.find((f) => f.component === "quiz");
  if (!quizFieldConfig) {
    return (
      <div style={styles.container}>
        {/* Minimal => no heading */}
        <p style={styles.text}>No quiz field found in UIconfig.</p>
      </div>
    );
  }

  const quizQuestions = parsed[quizFieldConfig.field] || [];
  const totalQuestions = quizQuestions.length;

  // Handler => user clicks "Submit"
  async function handleSubmit() {
    let correctCount = 0;
    const quizSubmission = quizQuestions.map((q, idx) => {
      const userAnswer = selectedAnswers[idx];
      const isCorrect = userAnswer === q.correctAnswerIndex;
      if (isCorrect) correctCount++;
      return {
        question: q.question,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        userAnswer: typeof userAnswer === "number" ? userAnswer : null,
        isCorrect,
      };
    });

    const scoreString = `${correctCount} / ${totalQuestions}`;
    setFinalScore(scoreString);
    setShowResult(true);

    // Save doc
    try {
      await axios.post("http://localhost:3001/api/submitQuiz", {
        userId,
        subchapterId: subChapterId,
        quizType,
        quizSubmission,
        score: scoreString,
        totalQuestions,
        attemptNumber,
      });
    } catch (err) {
      console.error("Error saving quiz submission:", err);
    }
  }

  // If user submitted => show pass/fail results (no big heading)
  if (showResult && finalScore) {
    const correctCount = parseInt(finalScore.split("/")[0], 10);
    const passThreshold = 4;
    const passed = correctCount >= passThreshold;

    return (
      <div style={styles.container}>
        <p style={styles.text}>You scored: {finalScore}</p>
        {passed ? (
          <>
            <p style={styles.text}>Congratulations! You passed.</p>
            <button onClick={onQuizComplete} style={styles.button}>
              Done
            </button>
          </>
        ) : (
          <>
            <p style={styles.text}>You need more practice. Let's revise now!</p>
            <button onClick={onQuizFail} style={styles.button}>
              Revise
            </button>
          </>
        )}
      </div>
    );
  }

  // Else => show the quiz
  return (
    <div style={styles.container}>
      {/* No heading, just jump straight into questions */}
      {quizQuestions.map((question, qIndex) => (
        <div key={qIndex} style={styles.questionBlock}>
          <p style={styles.questionText}>{`Q${qIndex + 1}: ${question.question}`}</p>
          {question.options.map((opt, optIndex) => (
            <label key={optIndex} style={styles.optionLabel}>
              <input
                type="radio"
                name={`question-${qIndex}`}
                value={optIndex}
                checked={selectedAnswers[qIndex] === optIndex}
                onChange={() => {
                  const updated = [...selectedAnswers];
                  updated[qIndex] = optIndex;
                  setSelectedAnswers(updated);
                }}
              />
              {opt}
            </label>
          ))}
        </div>
      ))}

      <button onClick={handleSubmit} style={styles.button}>
        Submit Quiz
      </button>
    </div>
  );
}

// helper
function stripMarkdownFences(text) {
  return text.replace(/```(json)?/gi, "").trim();
}

const styles = {
  container: {
    padding: "1rem",
    color: "#fff",
  },
  text: {
    color: "#fff",
    fontSize: "1rem",
  },
  textError: {
    color: "red",
    padding: "1rem",
  },
  button: {
    marginTop: "1rem",
    padding: "8px 16px",
    backgroundColor: "#444",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  questionBlock: {
    marginBottom: "1rem",
  },
  questionText: {
    fontWeight: "bold",
    marginBottom: "0.5rem",
  },
  optionLabel: {
    display: "block",
    marginLeft: "1rem",
  },
};