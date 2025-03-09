import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";

/**
 * QuizAnalyze
 * -----------
 * Supports multiple attempts logic:
 *   - /api/getQuiz now returns an array of attempts (sorted by attemptNumber desc).
 *   - We look at the latest attempt to see if user already passed or failed.
 *   - If no attempts, we fetch GPT quiz and store a new attempt with attemptNumber = existingAttemptsCount + 1.
 *
 * Props:
 *   subChapterId   (String)
 *   onQuizComplete (Function) - user sees pass result, clicks "Done"
 *   onQuizFail     (Function) - user sees fail result, clicks "Revise"
 */

function stripMarkdownFences(text) {
  return text.replace(/```(json)?/gi, "").trim();
}

export default function QuizAnalyze({
  subChapterId,
  onQuizComplete,
  onQuizFail,
}) {
  // 1. Grab user ID from Redux
  const userId = useSelector((state) => state.auth?.userId) || "demoUser";

  // Hard-coded quiz type and promptKey
  const quizType = "analyze";
  const promptKey = "quizAnalyze";

  // Local state
  const [allAttempts, setAllAttempts] = useState([]); // array of docs from getQuiz
  const [responseData, setResponseData] = useState(null); // GPT quiz data
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [finalScore, setFinalScore] = useState(null);

  // ------------------------------------------------------------------
  // Reset local states whenever subChapterId / userId changes
  // ------------------------------------------------------------------
  useEffect(() => {
    setAllAttempts([]);
    setResponseData(null);
    setFinalScore(null);
  }, [subChapterId, userId]);

  // ------------------------------------------------------------------
  // A) Fetch all existing quiz attempts from /api/getQuiz
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!subChapterId || !userId) return;

    (async () => {
      setLoading(true);
      setError("");

      try {
        const res = await axios.get("http://localhost:3001/api/getQuiz", {
          params: {
            userId,
            subchapterId: subChapterId,
            quizType,
          },
        });
        if (res.data.attempts) {
          // array of attempts, sorted desc in the back end
          setAllAttempts(res.data.attempts);
        }
      } catch (err) {
        console.error("Error fetching quiz attempts:", err);
        setError(err.message || "Error fetching quiz attempts");
      } finally {
        setLoading(false);
      }
    })();
  }, [subChapterId, userId, quizType]);

  // Early returns
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
  // DETERMINE LATEST ATTEMPT PASS/FAIL
  //   If user has attempts, we see if last attempt was pass or fail
  // ------------------------------------------------------------------
  // allAttempts is sorted by attemptNumber desc in the backend
  const latestAttempt = allAttempts.length > 0 ? allAttempts[0] : null;
  if (latestAttempt && !finalScore) {
    // We have at least one past attempt
    const numericScore = parseInt(latestAttempt.score.split("/")[0].trim(), 10);
    const passThreshold = 4; // Hard-coded
    const passed = numericScore >= passThreshold;

    // We'll show a local results screen so user can see last attempt
    return renderResultsScreen(latestAttempt.score, latestAttempt.attemptNumber, passed);
  }

  // If we have finalScore from a new attempt, show that result
  if (finalScore) {
    const numericScore = parseInt(finalScore.split("/")[0].trim(), 10);
    const passThreshold = 4;
    const passed = numericScore >= passThreshold;

    // Just show results locally
    // The parent can see pass/fail once user clicks "Done" or "Revise"
    return renderResultsScreen(finalScore, -1 /* attemptNumber?? */, passed);
  }

  // ------------------------------------------------------------------
  // If user has no attempts or we want a new attempt => fetch GPT quiz
  //   We'll do that on demand below
  // ------------------------------------------------------------------
  if (!responseData) {
    // If no GPT data loaded yet, fetch it
    return (
      <div style={styles.container}>
        <button onClick={handleFetchGPT} style={styles.button}>
          Start Attempt #{allAttempts.length + 1}
        </button>
      </div>
    );
  }

  // We have GPT data => show the quiz
  return renderQuizUI(responseData);

  // ------------------------------------------------------------------
  // B) Helper function to fetch GPT quiz => sets responseData
  // ------------------------------------------------------------------
  async function handleFetchGPT() {
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
  // C) RENDER QUIZ
  // ------------------------------------------------------------------
  function renderQuizUI(apiData) {
    // parse GPT JSON
    let rawResult = apiData.result || "";
    if (rawResult.startsWith("```")) {
      rawResult = stripMarkdownFences(rawResult);
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(rawResult);
    } catch (err) {
      return (
        <div style={styles.container}>
          <h3 style={styles.heading}>Quiz (Analyze)</h3>
          <p style={{ ...styles.text, color: "red" }}>
            GPT response is not valid JSON. Showing raw text:
          </p>
          <pre style={styles.pre}>{rawResult}</pre>
        </div>
      );
    }

    const { UIconfig = {} } = apiData;
    const { fields = [] } = UIconfig;
    const quizFieldConfig = fields.find((f) => f.component === "quiz");
    if (!quizFieldConfig) {
      return (
        <div style={styles.container}>
          <h3 style={styles.heading}>Quiz (Analyze)</h3>
          <p style={styles.text}>
            No quiz field found. Showing raw JSON:
          </p>
          <pre style={styles.pre}>{JSON.stringify(parsedResult, null, 2)}</pre>
        </div>
      );
    }

    const quizQuestions = parsedResult[quizFieldConfig.field] || [];
    const totalQuestions = quizQuestions.length;

    // On submit
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

      // Attempt number = existingAttempts.length + 1
      const attemptNumber = allAttempts.length + 1;

      // Save new attempt doc
      try {
        await axios.post("http://localhost:3001/api/submitQuiz", {
          userId,
          subchapterId: subChapterId,
          quizType,
          quizSubmission,
          score: scoreString,
          totalQuestions,
          attemptNumber, // new field
        });
      } catch (err) {
        console.error("Error saving quiz submission:", err);
      }
    }

    return (
      <div style={styles.container}>
        <h3 style={styles.heading}>Quiz (Analyze) - Attempt #{allAttempts.length + 1}</h3>
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
          Submit
        </button>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // D) RENDER RESULTS SCREEN
  // ------------------------------------------------------------------
  function renderResultsScreen(scoreString, attemptNum, passed) {
    return (
      <div style={styles.container}>
        <h3 style={styles.heading}>
          Last Attempt{attemptNum > 0 ? ` #${attemptNum}` : ""} Results
        </h3>
        <p style={styles.text}>You scored: {scoreString}</p>
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
}



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
    margin: "1rem 0",
    whiteSpace: "pre-wrap",
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