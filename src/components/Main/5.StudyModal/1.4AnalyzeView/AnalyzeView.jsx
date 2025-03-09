import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux"; // <-- to get userId from Redux
import QuizAnalyze from "./QuizAnalyze";
import ReviseAnalyze from "./ReviseAnalyze";

/**
 * AnalyzeView
 * -----------
 * 1) On mount, fetch quiz attempts (/api/getQuiz) + revision attempts (/api/getRevisions).
 * 2) Decide user state (no quizzes yet? last quiz pass? last quiz fail + revision done?).
 * 3) Render the appropriate step.
 */

export default function AnalyzeView({ activity }) {
  // Suppose each activity has { subChapterId }
  const subChapterId = activity?.subChapterId || "";

  // Option A: get userId from Redux
  // const userId = useSelector((state) => state.auth?.userId);
  // if you want to fallback => "demoUser":
  //   const userId = useSelector((state) => state.auth?.userId) || "demoUser";

  // Option B: or you might pass userId as a prop if you prefer:
  // but let's assume Redux approach:
  const userId = useSelector((state) => state.auth?.userId);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [quizAttempts, setQuizAttempts] = useState([]);       // from /api/getQuiz
  const [revisionAttempts, setRevisionAttempts] = useState([]); // from /api/getRevisions

  // mode => "NO_QUIZ_YET", "QUIZ_COMPLETED", "NEED_REVISION", "CAN_TAKE_NEXT_QUIZ"
  const [mode, setMode] = useState("LOADING");

  // We'll track the user's last quiz attempt doc
  const [lastQuizAttempt, setLastQuizAttempt] = useState(null);

  // Re-fetch on subChapterId or userId changes
  useEffect(() => {
    if (!subChapterId || !userId) return;
    fetchData();
  }, [subChapterId, userId]);

  async function fetchData() {
    try {
      setLoading(true);
      setError("");

      // 1) get quiz attempts
      const quizRes = await axios.get("http://localhost:3001/api/getQuiz", {
        params: {
          userId,                  // <--- use real userId from Redux
          subchapterId: subChapterId,
          quizType: "analyze",
        },
      });
      const quizArr = quizRes.data.attempts || [];

      // 2) get revision attempts
      const revRes = await axios.get("http://localhost:3001/api/getRevisions", {
        params: {
          userId,                  // <--- same here
          subchapterId: subChapterId,
          revisionType: "analyze",
        },
      });
      const revArr = revRes.data.revisions || [];

      setQuizAttempts(quizArr);
      setRevisionAttempts(revArr);
      computeState(quizArr, revArr);
    } catch (err) {
      console.error("Error fetching attempts:", err);
      setError(err.message || "Error fetching data");
    } finally {
      setLoading(false);
    }
  }

  function computeState(quizArr, revArr) {
    if (quizArr.length === 0) {
      // no quiz attempts => user does attempt #1
      setMode("NO_QUIZ_YET");
      setLastQuizAttempt(null);
      return;
    }

    // quizArr is sorted by attemptNumber desc in the backend
    const [latestQuiz] = quizArr; // first item is the newest
    setLastQuizAttempt(latestQuiz);

    // parse the score => e.g. "3 / 5"
    const numericScore = parseInt(latestQuiz.score.split("/")[0], 10);
    const passThreshold = 4; // your logic
    const passed = numericScore >= passThreshold;
    const attemptNum = latestQuiz.attemptNumber;

    if (passed) {
      setMode("QUIZ_COMPLETED");
      return;
    }

    // user fail => check if revision for that attempt
    const matchingRev = revArr.find((r) => r.revisionNumber === attemptNum);
    if (!matchingRev) {
      setMode("NEED_REVISION");
    } else {
      setMode("CAN_TAKE_NEXT_QUIZ");
    }
  }

  // Called when user finishes or fails the quiz => re-fetch
  function handleQuizComplete() {
    fetchData();
  }
  function handleQuizFail() {
    fetchData();
  }

  // Called when user finishes revision => re-fetch
  function handleRevisionDone() {
    fetchData();
  }

  // If subChapterId or userId is missing, we can't load
  if (!subChapterId || !userId) {
    return (
      <div style={{ color: "#fff" }}>
        No valid subChapterId or userId. Please ensure both are set.
      </div>
    );
  }
  if (loading) {
    return <div style={{ color: "#fff" }}>Loading attempts...</div>;
  }
  if (error) {
    return <div style={{ color: "red" }}>Error: {error}</div>;
  }

  return (
    <div style={{ color: "#fff", padding: "1rem" }}>
      <h2>Analyze Flow for subChapter: {subChapterId}</h2>

      {mode === "NO_QUIZ_YET" && (
        <div>
          <p>No quiz attempts yet. Let's do attempt #1</p>
          <QuizAnalyze
            subChapterId={subChapterId}
            attemptNumber={1}
            onQuizComplete={handleQuizComplete}
            onQuizFail={handleQuizFail}
          />
        </div>
      )}

      {mode === "QUIZ_COMPLETED" && (
        <div style={{ color: "lightgreen" }}>
          <h3>Quiz Completed Successfully!</h3>
          <p>You passed the Analyze stage for sub-chapter {subChapterId}.</p>
        </div>
      )}

      {mode === "NEED_REVISION" && lastQuizAttempt && (
        <div>
          <p>
            Your last quiz attempt #{lastQuizAttempt.attemptNumber} was a fail.
            Please do the revision for attempt #{lastQuizAttempt.attemptNumber}.
          </p>
          <ReviseAnalyze
            subChapterId={subChapterId}
            revisionNumber={lastQuizAttempt.attemptNumber}
            onRevisionDone={handleRevisionDone}
          />
        </div>
      )}

      {mode === "CAN_TAKE_NEXT_QUIZ" && lastQuizAttempt && (
        <div>
          <p>
            You've completed revision for quiz attempt #
            {lastQuizAttempt.attemptNumber}. Take next quiz attempt!
          </p>
          <QuizAnalyze
            subChapterId={subChapterId}
            attemptNumber={lastQuizAttempt.attemptNumber + 1}
            onQuizComplete={handleQuizComplete}
            onQuizFail={handleQuizFail}
          />
        </div>
      )}
    </div>
  );
}