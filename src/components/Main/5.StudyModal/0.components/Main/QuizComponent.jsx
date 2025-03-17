import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import LoadingSpinner from "../Secondary/LoadingSpinner";
import QuestionRenderer from "./QuestionRenderer";  // The multi-type renderer

function stripMarkdownFences(text) {
  return text.replace(/```(json)?/gi, "").trim();
}

function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function QuizComponent({
  examId = "general",
  quizStage,
  subChapterId,
  attemptNumber,
  onQuizComplete,
  onQuizFail,
}) {
  const userId = useSelector((state) => state.auth?.userId);

  /**
   * We'll define or import pass ratios here as well,
   * or rely on StageManager for the final decision.
   * But we'll do a local ratio check to show immediate pass/fail to user.
   */
  const stagePassRatios = {
    remember: 0.6,
    understand: 0.7,
    apply: 0.6,
    analyze: 0.7,
  };
  const passRatio = stagePassRatios[quizStage] || 0.6;

  const promptKey = `quiz${capitalize(examId)}${capitalize(quizStage)}`;
  const quizType = quizStage;

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [responseData, setResponseData] = useState(null);

  // Each question's user response
  const [userAnswers, setUserAnswers] = useState([]);

  const [showResult, setShowResult] = useState(false);
  const [finalScore, setFinalScore] = useState(null);

  useEffect(() => {
    if (!subChapterId) return;
    fetchGPTQuiz();
    setUserAnswers([]);
    setShowResult(false);
    setFinalScore(null);
    // eslint-disable-next-line
  }, [subChapterId, attemptNumber, quizStage, examId]);

  async function fetchGPTQuiz() {
    try {
      setLoading(true);
      setError("");
      setResponseData(null);

      /**
       * For multi-type generation, you need to pass instructions to your server's /api/generate
       * So your server can build a GPT prompt like:
       * "Generate 3 questions of type multipleChoice, 1 of type trueFalse, 1 fillInBlank..."
       * Or do it inside the Firestore "prompts" doc. This example uses existing code.
       */
      const res = await axios.post("http://localhost:3001/api/generate", {
        userId,
        subchapterId: subChapterId,
        promptKey,
      });
      setResponseData(res.data);
    } catch (err) {
      console.error("QuizComponent: Error fetching GPT quiz data:", err);
      setError(err.message || "Error fetching GPT quiz data");
    } finally {
      setLoading(false);
    }
  }

  // Basic checks
  if (!subChapterId) {
    return <div style={styles.text}>No subChapterId</div>;
  }
  if (loading) {
    return <LoadingSpinner message="Building your quiz..." />;
  }
  if (error) {
    return <div style={styles.textError}>Error: {error}</div>;
  }
  if (!responseData?.result) {
    return (
      <div style={styles.textError}>
        No prompt found for <b>{promptKey}</b>. Please create that in Firestore.
      </div>
    );
  }

  // Parse GPT JSON
  let raw = responseData.result;
  if (raw.startsWith("```")) {
    raw = stripMarkdownFences(raw);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return (
      <div style={styles.container}>
        <p style={{ color: "red" }}>Invalid JSON from GPT for {promptKey}</p>
        <pre>{responseData.result}</pre>
      </div>
    );
  }

  // Suppose your GPT prompt or your Firestore prompt doc says:
  // { "questions": [ ...multiple question objects... ] }
  const quizQuestions = parsed.quizQuestions || [];

  // Initialize userAnswers if not set:
  // (But we do it in useEffect once we have quizQuestions, for a real approach.)
  // Here, a quick approach is:
  if (userAnswers.length !== quizQuestions.length) {
    setUserAnswers(Array(quizQuestions.length).fill(""));
  }

  function handleAnswerChange(qIndex, newVal) {
    const updated = [...userAnswers];
    updated[qIndex] = newVal;
    setUserAnswers(updated);
  }

  // Submitting => we compute how many are correct
  async function handleSubmit() {
    console.log("QuizComponent: handleSubmit => checking user answers.");

    let correctCount = 0;
    const submissionDetail = quizQuestions.map((qObj, idx) => {
      const userAnswer = userAnswers[idx];
      const isCorrect = checkIfCorrect(qObj, userAnswer);
      if (isCorrect) correctCount++;
      return {
        ...qObj,
        userAnswer,
        isCorrect,
      };
    });

    const total = quizQuestions.length;
    const scoreString = `${correctCount}/${total}`;
    setFinalScore(scoreString);
    setShowResult(true);

    // Save to Firestore:
    try {
      await axios.post("http://localhost:3001/api/submitQuiz", {
        userId,
        subchapterId: subChapterId,
        quizType,
        quizSubmission: submissionDetail,
        score: scoreString,
        totalQuestions: total,
        attemptNumber,
      });
      console.log("QuizComponent: quiz submission saved with score =", scoreString);
    } catch (err) {
      console.error("QuizComponent: error saving quiz submission:", err);
    }
  }

  // If showResult
  if (showResult && finalScore) {
    const [numStr, denomStr] = finalScore.split("/");
    const correctNum = parseInt(numStr, 10);
    const total = parseInt(denomStr, 10) || 1;
    const ratio = correctNum / total;
    const passed = ratio >= passRatio;

    return (
      <div style={styles.container}>
        <p style={styles.text}>You scored: {finalScore}</p>
        <p style={styles.text}>
          ({(ratio * 100).toFixed(1)}% correct, passing threshold is{" "}
          {(passRatio * 100).toFixed(1)}%)
        </p>
        {passed ? (
          <>
            <p style={styles.text}>Great job, you passed!</p>
            <button style={styles.button} onClick={onQuizComplete}>
              Done
            </button>
          </>
        ) : (
          <>
            <p style={styles.text}>You need more practice. Let's revise!</p>
            <button style={styles.button} onClick={onQuizFail}>
              Revise
            </button>
          </>
        )}
      </div>
    );
  }

  // Otherwise, display the quiz
  return (
    <div style={styles.container}>
      {quizQuestions.map((qObj, qIndex) => (
        <QuestionRenderer
          key={qIndex}
          index={qIndex}
          questionObj={qObj}
          userAnswer={userAnswers[qIndex]}
          onUserAnswerChange={(val) => handleAnswerChange(qIndex, val)}
        />
      ))}

      <button style={styles.button} onClick={handleSubmit}>
        Submit Quiz
      </button>
    </div>
  );
}

/**
 * checkIfCorrect => custom logic for each question type
 */
function checkIfCorrect(questionObj, userAnswer) {
  switch (questionObj.type) {
    case "multipleChoice":
      // correct if userAnswer (a number) === questionObj.correctAnswerIndex
      return parseInt(userAnswer, 10) === questionObj.correctAnswerIndex;

    case "trueFalse":
      // questionObj.correctAnswer => boolean (true or false)
      // userAnswer => "true" or "false"
      if (typeof questionObj.correctAnswer !== "boolean") return false;
      const boolAnswer = userAnswer === "true"; // convert user input to boolean
      return boolAnswer === questionObj.correctAnswer;

    case "fillInBlank":
      // questionObj.correctAnswers => array of acceptable strings
      // userAnswer => string
      if (!Array.isArray(questionObj.correctAnswers)) return false;
      const trimmed = (userAnswer || "").trim().toLowerCase();
      return questionObj.correctAnswers.some(
        (ans) => ans.trim().toLowerCase() === trimmed
      );

    case "shortAnswer":
      // Could do an approximate text match or GPT-based check.
      // For simplicity, let's say we always mark "false" to show you can expand
      // Or if questionObj.correctAnswers exist, do a check:
      // return questionObj.correctAnswers.includes(userAnswer)
      return false;

    case "scenario":
      // Usually would do GPT-based checking or skip auto-scoring
      return false;

    default:
      return false;
  }
}

const styles = {
  container: {
    padding: "1rem",
    color: "#fff",
  },
  text: {
    color: "#fff",
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
};