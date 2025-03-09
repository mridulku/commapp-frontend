import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";

// Helper to remove markdown fences (```json) from GPT's response
function stripMarkdownFences(text) {
  return text.replace(/```(json)?/gi, "").trim();
}

export default function QuizAnalyze({ onQuizDone }) {
  // 1. Grabbing user/subchapter from Redux
  const userId = useSelector((state) => state.auth?.userId) || "demoUser";
  const { flattenedActivities, currentIndex } = useSelector((state) => state.plan);
  const currentActivity =
    flattenedActivities && currentIndex >= 0 ? flattenedActivities[currentIndex] : null;
  const subchapterId = currentActivity ? currentActivity.subChapterId : "";

  // 2. Hard-coded prompt key & quiz type
  const promptKey = "quizAnalyze";
  const quizType = "analyze"; // or pass this as a prop if needed

  // 3. Local states for either existing quiz data or GPT data
  const [existingQuiz, setExistingQuiz] = useState(null);  // If we find a quiz in Firestore
  const [responseData, setResponseData] = useState(null);  // GPT response
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 4. Additional states for quiz
  const [selectedAnswers, setSelectedAnswers] = useState([]); // array of user-selected option indices
  const [score, setScore] = useState(null);

  // -------------------------------------------------------------------
  // A) Reset local states whenever subchapter/user/quizType changes,
  //    so we don't show old data from the previous subchapter.
  // -------------------------------------------------------------------
  useEffect(() => {
    setExistingQuiz(null);
    setResponseData(null);
    setScore(null);
  }, [subchapterId, userId, quizType]);

  // -------------------------------------------------------------------
  // B) Check if we already have a quiz submission
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!subchapterId || !userId) return;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get("http://localhost:3001/api/getQuiz", {
          params: { userId, subchapterId, quizType },
        });
        if (res.data.quizExists) {
          // We already have a quiz => store it in existingQuiz
          setExistingQuiz(res.data.quizData);
        } else {
          // No existing quiz => proceed to GPT generate
          await fetchQuizFromGPT();
        }
      } catch (err) {
        console.error("Error checking existing quiz:", err);
        setError(err.message || "Error checking existing quiz");
      } finally {
        setLoading(false);
      }
    })();
  }, [subchapterId, userId, quizType]);

  // -------------------------------------------------------------------
  // C) Helper to fetch GPT-based quiz if no existing quiz
  // -------------------------------------------------------------------
  async function fetchQuizFromGPT() {
    try {
      setLoading(true);
      setResponseData(null);
      setError("");

      const generateRes = await axios.post("http://localhost:3001/api/generate", {
        userId,
        subchapterId,
        promptKey,
      });

      setResponseData(generateRes.data);
    } catch (err) {
      console.error("Error fetching GPT quiz data:", err);
      setError(err.message || "Error fetching GPT quiz data");
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------------------------------------------
  // Early returns for loading / error / no user
  // -------------------------------------------------------------------
  if (!subchapterId || !userId) {
    return <div style={styles.text}>Please ensure you have valid user and subchapter info.</div>;
  }
  if (loading) {
    return <div style={styles.text}>Loading...</div>;
  }
  if (error) {
    return (
      <div style={styles.textError}>
        Error: {error}
      </div>
    );
  }

  // -------------------------------------------------------------------
  // CASE A: If quiz already exists, show stored results
  // -------------------------------------------------------------------
  if (existingQuiz) {
    return (
      <div style={styles.container}>
        <h3 style={styles.heading}>Quiz Already Attempted</h3>
        <p style={styles.text}>You scored: {existingQuiz.score}</p>
        <button onClick={onQuizDone} style={styles.button}>
          Done with Quiz
        </button>
      </div>
    );
  }

  // -------------------------------------------------------------------
  // CASE B: No existing quiz => Show GPT-based quiz
  // -------------------------------------------------------------------
  if (!responseData) {
    // Possibly means we had an error or still loading.
    return (
      <div style={styles.text}>
        No quiz data available yet.
      </div>
    );
  }

  // 6. Parse the GPT JSON result
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
        <h3 style={styles.heading}>Quiz (Analyze Stage) for SubChapter: {subchapterId}</h3>
        <p style={{ ...styles.text, color: "red" }}>
          GPT response is not valid JSON. Showing raw text:
        </p>
        <pre style={styles.pre}>{rawResult}</pre>
        <button onClick={onQuizDone} style={styles.button}>
          Done with Quiz
        </button>
      </div>
    );
  }

  // 7. Identify UI fields from the response
  const { UIconfig = {} } = responseData;
  const { fields = [] } = UIconfig;

  const quizFieldConfig = fields.find((f) => f.component === "quiz");
  if (!quizFieldConfig) {
    // If there's no quiz field defined, fallback to raw JSON
    return (
      <div style={styles.container}>
        <h3 style={styles.heading}>Quiz (Analyze Stage)</h3>
        <p style={styles.text}>No quiz field found in UIconfig. Showing raw JSON:</p>
        <pre style={styles.pre}>{JSON.stringify(parsedResult, null, 2)}</pre>
        <button onClick={onQuizDone} style={styles.button}>
          Done with Quiz
        </button>
      </div>
    );
  }

  // 8. The array of questions in the JSON (quizQuestions)
  const quizQuestions = parsedResult[quizFieldConfig.field] || [];
  const totalQuestions = quizQuestions.length;

  // 9. Handler for selecting an answer
  function handleSelectAnswer(questionIndex, optionIndex) {
    const updated = [...selectedAnswers];
    updated[questionIndex] = optionIndex;
    setSelectedAnswers(updated);
  }

  // 10. Handler for submitting the quiz
  async function handleSubmit() {
    let correctCount = 0;

    // We'll build a "quizSubmission" array for storing
    const quizSubmission = quizQuestions.map((question, qIndex) => {
      const userAnswer = selectedAnswers[qIndex];
      const isCorrect = userAnswer === question.correctAnswerIndex;
      if (isCorrect) correctCount++;

      return {
        question: question.question,
        options: question.options,
        correctAnswerIndex: question.correctAnswerIndex,
        userAnswer: typeof userAnswer === "number" ? userAnswer : null,
        isCorrect,
      };
    });

    const finalScore = `${correctCount} / ${totalQuestions}`;
    setScore(finalScore);

    // 10a. Now post the quiz submission to the server
    try {
      await axios.post("http://localhost:3001/api/submitQuiz", {
        userId,
        subchapterId,
        quizType,
        quizSubmission,
        score: finalScore,
        totalQuestions,
      });
    } catch (err) {
      console.error("Error saving quiz submission:", err);
      // optionally show some UI error
    }
  }

  // 11. If we have a final score, show results
  if (score !== null) {
    return (
      <div style={styles.container}>
        <h3 style={styles.heading}>Quiz Results</h3>
        <p style={styles.text}>You scored: {score}</p>
        <button onClick={onQuizDone} style={styles.button}>
          Done with Quiz
        </button>
      </div>
    );
  }

  // 12. Render the new GPT-based quiz
  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>{quizFieldConfig.label || "Quiz"}</h3>
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
}

// Styles
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