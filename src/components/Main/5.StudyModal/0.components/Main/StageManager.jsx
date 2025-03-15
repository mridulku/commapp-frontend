// StageManager.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";

// Our new "generic" quiz & revise comps:
import QuizComponent from "./QuizComponent";
import ReviseComponent from "./ReviseComponent";

export default function StageManager({ examId, activity, quizStage, userId }) {
  const subChapterId = activity?.subChapterId || "";

  // If quizStage = "analyze", we do the old "AnalyzeView" logic
  // Otherwise => fallback
  if (!subChapterId || !userId) {
    return <div style={{ color: "#fff" }}>No valid subChapterId/userId.</div>;
  }

  // If it's NOT "analyze," show fallback for now
  if (quizStage !== "analyze") {
    return (
      <div style={{ color: "#fff", padding: "1rem" }}>
        <h3>Stage: {quizStage}</h3>
        <p>
          Currently, revision/quiz logic not implemented for stage{" "}
          <b>{quizStage}</b>.
        </p>
        <p>
          (In a future step, you can reuse the same logic below if you want the
          same pass/fail flow.)
        </p>
      </div>
    );
  }

  // =============================
  // "AnalyzeView" logic below
  // =============================
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [revisionAttempts, setRevisionAttempts] = useState([]);
  const [mode, setMode] = useState("LOADING");
  const [lastQuizAttempt, setLastQuizAttempt] = useState(null);

  const [showTimeline, setShowTimeline] = useState(false);

  useEffect(() => {
    fetchData();
  }, [subChapterId, userId]);

  async function fetchData() {
    if (!subChapterId || !userId) return;

    try {
      setLoading(true);
      setError("");

      // 1) get quiz attempts
      const quizRes = await axios.get("http://localhost:3001/api/getQuiz", {
        params: { userId, subchapterId: subChapterId, quizType: quizStage },
      });
      const quizArr = quizRes.data.attempts || [];

      // 2) get revision attempts
      const revRes = await axios.get("http://localhost:3001/api/getRevisions", {
        params: { userId, subchapterId: subChapterId, revisionType: quizStage },
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
      setMode("NO_QUIZ_YET");
      setLastQuizAttempt(null);
      return;
    }
    const [latestQuiz] = quizArr; // newest attempt
    setLastQuizAttempt(latestQuiz);

    const numericScore = parseInt(latestQuiz.score.split("/")[0], 10);
    const passThreshold = 4; // Hard-coded for analyze
    const passed = numericScore >= passThreshold;
    const attemptNum = latestQuiz.attemptNumber;

    if (passed) {
      setMode("QUIZ_COMPLETED");
      return;
    }
    const matchingRev = revArr.find((r) => r.revisionNumber === attemptNum);
    if (!matchingRev) {
      setMode("NEED_REVISION");
    } else {
      setMode("CAN_TAKE_NEXT_QUIZ");
    }
  }

  function handleQuizComplete() {
    fetchData();
  }
  function handleQuizFail() {
    fetchData();
  }
  function handleRevisionDone() {
    fetchData();
  }

  if (loading) {
    return <div style={{ color: "#fff" }}>Loading attempts...</div>;
  }
  if (error) {
    return <div style={{ color: "red" }}>Error: {error}</div>;
  }

  // Show a summary label
  let summaryLabel = "No Attempts Yet";
  if (quizAttempts.length > 0) {
    const [latest] = quizAttempts;
    summaryLabel = `Last Attempt => Q${latest.attemptNumber} (${latest.score})`;
  }

  return (
    <div style={{ color: "#fff", padding: "1rem" }}>
      {/* Minimal row with summary + toggle button */}
      <div style={styles.headerRow}>
        <div>{summaryLabel}</div>
        <button
          style={styles.toggleButton}
          onClick={() => setShowTimeline(!showTimeline)}
        >
          {showTimeline ? "Hide details" : "Show details"}
        </button>
      </div>

      {showTimeline && (
        <div style={styles.timelinePanel}>
          {renderTimeline(quizAttempts, revisionAttempts)}
        </div>
      )}

      <div style={styles.mainContent}>
        {mode === "NO_QUIZ_YET" && (
          <QuizComponent
            quizStage={quizStage}
            subChapterId={subChapterId}
            attemptNumber={1}
            onQuizComplete={handleQuizComplete}
            onQuizFail={handleQuizFail}
          />
        )}

        {mode === "QUIZ_COMPLETED" && (
          <div style={{ color: "lightgreen" }}>
            <p>Congratulations! You passed the {quizStage} stage.</p>
          </div>
        )}

        {mode === "NEED_REVISION" && lastQuizAttempt && (
          <ReviseComponent
            quizStage={quizStage}
            subChapterId={subChapterId}
            revisionNumber={lastQuizAttempt.attemptNumber}
            onRevisionDone={handleRevisionDone}
          />
        )}

        {mode === "CAN_TAKE_NEXT_QUIZ" && lastQuizAttempt && (
          <QuizComponent
            quizStage={quizStage}
            subChapterId={subChapterId}
            attemptNumber={lastQuizAttempt.attemptNumber + 1}
            onQuizComplete={handleQuizComplete}
            onQuizFail={handleQuizFail}
          />
        )}
      </div>
    </div>
  );
}

// Reuse your old timeline code
function renderTimeline(quizArr, revArr) {
  if (!quizArr.length) {
    return (
      <div style={styles.timelineContainer}>
        <div style={styles.timelineItem}>
          <p style={{ color: "#aaa", margin: 0 }}>No attempts yet</p>
        </div>
      </div>
    );
  }

  const quizAsc = [...quizArr].sort((a, b) => a.attemptNumber - b.attemptNumber);

  const timelineItems = [];
  quizAsc.forEach((quizDoc) => {
    const attemptNum = quizDoc.attemptNumber;
    const numericScore = parseInt(quizDoc.score.split("/")[0], 10);
    const passThreshold = 4;
    const passed = numericScore >= passThreshold;

    timelineItems.push({
      type: "quiz",
      attemptNumber: attemptNum,
      passed,
      score: quizDoc.score,
      timestamp: quizDoc.timestamp,
    });

    const matchingRev = revArr.find((r) => r.revisionNumber === attemptNum);
    if (matchingRev) {
      timelineItems.push({
        type: "revision",
        attemptNumber: attemptNum,
        timestamp: matchingRev.timestamp,
      });
    }
  });

  return (
    <div style={styles.timelineContainer}>
      {timelineItems.map((item, idx) => (
        <TimelineItem item={item} key={idx} />
      ))}
    </div>
  );
}

function TimelineItem({ item }) {
  const { type, attemptNumber, passed, score, timestamp } = item;
  const isQuiz = type === "quiz";
  const isRevision = type === "revision";

  let boxColor = "#888";
  let label = "";
  if (isQuiz) {
    label = `Q${attemptNumber} (${score})`;
    boxColor = passed ? "#2ecc71" : "#e74c3c";
  } else if (isRevision) {
    label = `R${attemptNumber}`;
    boxColor = "#3498db";
  }

  const timeString = timestamp
    ? new Date(timestamp._seconds * 1000).toLocaleString()
    : null;

  return (
    <div style={styles.timelineItem}>
      <div style={{ ...styles.timelineBox, backgroundColor: boxColor }}>
        {label}
      </div>
      {timeString && <p style={styles.timelineTimestamp}>{timeString}</p>}
    </div>
  );
}

const styles = {
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem",
  },
  toggleButton: {
    backgroundColor: "#444",
    color: "#fff",
    border: "none",
    padding: "6px 10px",
    borderRadius: "4px",
    cursor: "pointer",
  },
  timelinePanel: {
    marginBottom: "1rem",
    backgroundColor: "#111",
    padding: "0.5rem",
    borderRadius: "4px",
  },
  mainContent: {},
  timelineContainer: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  timelineItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  timelineBox: {
    minWidth: "60px",
    padding: "8px",
    borderRadius: "4px",
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  timelineTimestamp: {
    fontSize: "0.75rem",
    marginTop: "4px",
    color: "#aaa",
  },
};