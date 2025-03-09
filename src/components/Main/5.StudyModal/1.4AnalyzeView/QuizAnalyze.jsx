import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";

/**
 * QuizAnalyze
 * -----------
 * 1) Checks Firestore (/api/getQuiz) for an existing submission for (userId, subChapterId, "analyze").
 * 2) If found, we parse the existing score, and show a pass/fail result right away in *this* component.
 *    The user can then click a button => onQuizComplete() or onQuizFail().
 * 3) If not found, fetch GPT quiz, let user take it, show result screen locally.
 *    Again, user clicks pass/fail button => triggers parent's flow.
 *
 * Props:
 *   subChapterId   (String)
 *   onQuizComplete (Function) - called after user sees pass result and clicks "Done"
 *   onQuizFail     (Function) - called after user sees fail result and clicks "Revise"
 */

// Helper: remove markdown fences (```json) from GPT response
function stripMarkdownFences(text) {
  return text.replace(/```(json)?/gi, "").trim();
}

export default function QuizAnalyze({
  subChapterId,
  onQuizComplete,
  onQuizFail,
}) {
  // 1. Get user ID from Redux (fallback = "demoUser" if none)
  const userId = useSelector((state) => state.auth?.userId) || "demoUser";

  // 2. Hard-coded quiz type and promptKey
  const quizType = "analyze";
  const promptKey = "quizAnalyze";

  // 3. Local states
  const [existingQuiz, setExistingQuiz] = useState(null);  // If found in Firestore
  const [responseData, setResponseData] = useState(null);  // GPT quiz data
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // For user-selected answers (we only store local, not in Firestore)
  const [selectedAnswers, setSelectedAnswers] = useState([]);

  // After submission, we store a local "score" string, e.g. "3 / 5"
  // so we can show a result screen before calling onQuizFail/onQuizComplete.
  const [finalScore, setFinalScore] = useState(null);

  // ------------------------------------------------------------------
  // Reset local states when subChapterId / userId changes
  // ------------------------------------------------------------------
  useEffect(() => {
    setExistingQuiz(null);
    setResponseData(null);
    setFinalScore(null);
  }, [subChapterId, userId]);

  // ------------------------------------------------------------------
  // A) Check Firestore for an existing quiz
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!subChapterId || !userId) return;

    (async () => {
      setLoading(true);
      setError("");
      try {
        // 1) Check if quiz doc exists
        const res = await axios.get("http://localhost:3001/api/getQuiz", {
          params: {
            userId,
            subchapterId: subChapterId,
            quizType,
          },
        });

        if (res.data.quizExists) {
          // If we have an existing quiz => store it
          setExistingQuiz(res.data.quizData);
        } else {
          // Otherwise, fetch GPT-based quiz
          await fetchGPTQuiz();
        }
      } catch (err) {
        console.error("Error checking existing quiz:", err);
        setError(err.message || "Error checking existing quiz");
      } finally {
        setLoading(false);
      }
    })();
  }, [subChapterId, userId, quizType]);

  // Helper to fetch from /api/generate if no existing quiz
  async function fetchGPTQuiz() {
    try {
      setLoading(true);
      setResponseData(null);
      const genRes = await axios.post("http://localhost:3001/api/generate", {
        userId,
        subchapterId: subChapterId,
        promptKey,
      });
      setResponseData(genRes.data);
    } catch (err) {
      console.error("Error fetching GPT quiz data:", err);
      setError(err.message || "Error fetching GPT quiz data");
    } finally {
      setLoading(false);
    }
  }

  // ------------------------------------------------------------------
  // Early return states
  // ------------------------------------------------------------------
  if (!subChapterId || !userId) {
    return <div style={styles.text}>No valid user/subchapter info.</div>;
  }
  if (loading) {
    return <div style={styles.text}>Loading quiz data...</div>;
  }
  if (error) {
    return (
      <div style={styles.textError}>
        Error: {error}
      </div>
    );
  }

  // ------------------------------------------------------------------
  // CASE A: If we have an existing quiz => show pass/fail result
  // ------------------------------------------------------------------
  if (existingQuiz && !finalScore) {
    // existingQuiz.score e.g. "3 / 5"
    // We'll parse it and show a small results screen
    return renderResultsScreen(existingQuiz.score);
  }

  // If we have finalScore from a new attempt, show that result screen as well
  if (finalScore) {
    return renderResultsScreen(finalScore);
  }

  // ------------------------------------------------------------------
  // CASE B: No existing quiz => Show GPT-based quiz
  // ------------------------------------------------------------------
  if (!responseData) {
    return <div style={styles.text}>No quiz data available yet.</div>;
  }

  // Parse the GPT JSON
  let rawResult = responseData.result || "";
  if (rawResult.startsWith("```")) {
    rawResult = stripMarkdownFences(rawResult);
  }

  let parsedResult;
  try {
    parsedResult = JSON.parse(rawResult);
  } catch (err) {
    return (
      <div style={styles.container}>
        <h3 style={styles.heading}>Quiz (Analyze) for SubChapter: {subChapterId}</h3>
        <p style={{ ...styles.text, color: "red" }}>
          GPT response is not valid JSON. Showing raw text:
        </p>
        <pre style={styles.pre}>{rawResult}</pre>
      </div>
    );
  }

  const { UIconfig = {} } = responseData;
  const { fields = [] } = UIconfig;
  const quizFieldConfig = fields.find((f) => f.component === "quiz");
  if (!quizFieldConfig) {
    return (
      <div style={styles.container}>
        <h3 style={styles.heading}>Quiz (Analyze)</h3>
        <p style={styles.text}>No quiz field found in UIconfig. Showing raw JSON:</p>
        <pre style={styles.pre}>{JSON.stringify(parsedResult, null, 2)}</pre>
      </div>
    );
  }

  const quizQuestions = parsedResult[quizFieldConfig.field] || [];
  const totalQuestions = quizQuestions.length;

  // Handler for user selecting an answer
  function handleSelectAnswer(questionIndex, optionIndex) {
    const updated = [...selectedAnswers];
    updated[questionIndex] = optionIndex;
    setSelectedAnswers(updated);
  }

  // Handler for submit
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

    // Save to Firestore
    try {
      await axios.post("http://localhost:3001/api/submitQuiz", {
        userId,
        subchapterId: subChapterId,
        quizType,
        quizSubmission,
        score: scoreString,
        totalQuestions,
      });
    } catch (err) {
      console.error("Error saving quiz submission:", err);
    }
  }

  // RENDER QUIZ UI
  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>Quiz (Analyze) for SubChapter: {subChapterId}</h3>
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
                onChange={() => handleSelectAnswer(qIndex, optIndex)}
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

  // ------------------------------------------------------------------
  // Helper: Render pass/fail results screen, let user click "Revise" or "Done"
  // ------------------------------------------------------------------
  function renderResultsScreen(scoreString) {
    const correctCount = parseInt(scoreString.split("/")[0].trim(), 10);
    const total = parseInt(scoreString.split("/")[1].trim(), 10);
    const passThreshold = 4; // Hard-coded

    const passed = correctCount >= passThreshold;

    return (
      <div style={styles.container}>
        <h3 style={styles.heading}>Quiz Results</h3>
        <p style={styles.text}>You scored: {scoreString}</p>
        {passed ? (
          <>
            <p style={styles.text}>
              Congratulations! You passed this quiz.
            </p>
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
}

// Basic styles
const styles = {
  container: {
    backgroundColor: "transparent",
    padding: "1rem",
    color: "#fff",
  },
  heading: {
    margin: 0,
    marginBottom: "1rem",
    fontSize: "1.2rem",
    color: "#fff",
  },
  text: {
    color: "#fff",
  },
  textError: {
    color: "red",
    padding: "1rem",
  },
  pre: {
    backgroundColor: "transparent",
    color: "#fff",
    border: "none",
    padding: 0,
    margin: "1rem 0",
    whiteSpace: "pre-wrap",
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
  button: {
    marginTop: "1rem",
    padding: "8px 16px",
    cursor: "pointer",
    backgroundColor: "#444",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
  },
};