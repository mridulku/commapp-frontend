import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import LoadingSpinner from "../Secondary/LoadingSpinner";

export default function QuizComponent({
  examId = "general",  // default if none provided
  quizStage,
  subChapterId,
  attemptNumber,
  onQuizComplete,
  onQuizFail,
}) {
  const userId = useSelector((state) => state.auth?.userId);

  // Build promptKey: e.g. "quizGeneralAnalyze"
  const promptKey = `quiz${capitalize(examId)}${capitalize(quizStage)}`;
  const quizType = quizStage; // for Firestore "quizType"

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [responseData, setResponseData] = useState(null);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [finalScore, setFinalScore] = useState(null);

  useEffect(() => {
    if (!subChapterId) return;
    fetchGPTQuiz();
    setSelectedAnswers([]);
    setShowResult(false);
    setFinalScore(null);
    // eslint-disable-next-line
  }, [subChapterId, attemptNumber, quizStage, examId]);

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

  if (!subChapterId) {
    return <div style={styles.text}>No subChapterId</div>;
  }
  if (loading) {
    return <LoadingSpinner message="Building your quiz..." />;
  }
  if (error) {
    return <div style={styles.textError}>Error: {error}</div>;
  }

  // If there's no doc found in the "prompts" collection, it means we have no promptText. 
  // The Express route logs a warning and returns minimal data.
  // We can check if responseData.result is empty or a known placeholder:
  if (!responseData?.result) {
    return (
      <div style={styles.textError}>
        No prompt found for <b>{promptKey}</b>. Please create that prompt in Firestore.
      </div>
    );
  }

  // parse GPT JSON
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
        <p style={{ ...styles.text, color: "red" }}>
          GPT response for <b>{promptKey}</b> is not valid JSON.
        </p>
        <pre>{responseData.result}</pre>
      </div>
    );
  }

  const { UIconfig = {} } = responseData;
  const { fields = [] } = UIconfig;
  const quizFieldConfig = fields.find((f) => f.component === "quiz");
  if (!quizFieldConfig) {
    return (
      <div style={styles.container}>
        <p style={styles.text}>
          <b>{promptKey}</b> prompt has no quiz field in UIconfig.
        </p>
      </div>
    );
  }

  const quizQuestions = parsed[quizFieldConfig.field] || [];
  const totalQuestions = quizQuestions.length;

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

  if (showResult && finalScore) {
    // For demonstration, you might want a stage-specific pass threshold or read from a config
    const passThreshold = 4; 
    const correctCount = parseInt(finalScore.split("/")[0], 10);
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
            <p style={styles.text}>
              You need more practice. Let's revise now!
            </p>
            <button onClick={onQuizFail} style={styles.button}>
              Revise
            </button>
          </>
        )}
      </div>
    );
  }

  // Render the quiz form
  return (
    <div style={styles.container}>
      {quizQuestions.map((question, qIndex) => (
        <div key={qIndex} style={styles.questionBlock}>
          <p style={styles.questionText}>
            Q{qIndex + 1}: {question.question}
          </p>
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

function stripMarkdownFences(text) {
  return text.replace(/```(json)?/gi, "").trim();
}

function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
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