import React, { useEffect, useState } from "react";
import axios from "axios";
import QuizComponent from "./QuizComponent";
import ReviseComponent from "./ReviseComponent";

export default function StageManager({ examId, activity, quizStage, userId }) {
  const subChapterId = activity?.subChapterId || "";

  const stagePassRatios = {
    remember: 0.6,
    understand: 0.7,
    apply: 0.6,
    analyze: 0.7,
  };

  const effectiveExamId = examId || "general";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [revisionAttempts, setRevisionAttempts] = useState([]);
  const [mode, setMode] = useState("LOADING");
  const [lastQuizAttempt, setLastQuizAttempt] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [subChapterId, userId, quizStage]);

  async function fetchData() {
    if (!subChapterId || !userId) {
      console.log("StageManager: missing subChapterId or userId => skipping fetch.");
      return;
    }
    try {
      setLoading(true);
      setError("");

      // 1) Quiz attempts
      const quizRes = await axios.get("http://localhost:3001/api/getQuiz", {
        params: { userId, subchapterId: subChapterId, quizType: quizStage },
      });
      const quizArr = quizRes.data.attempts || [];

      // 2) Revision attempts
      const revRes = await axios.get("http://localhost:3001/api/getRevisions", {
        params: { userId, subchapterId: subChapterId, revisionType: quizStage },
      });
      const revArr = revRes.data.revisions || [];

      setQuizAttempts(quizArr);
      setRevisionAttempts(revArr);
      computeState(quizArr, revArr);
    } catch (err) {
      console.error("StageManager: error fetching attempts:", err);
      setError(err.message || "Error fetching data");
    } finally {
      setLoading(false);
    }
  }

  function computeState(quizArr, revArr) {
    if (!quizArr.length) {
      setMode("NO_QUIZ_YET");
      setLastQuizAttempt(null);
      return;
    }
    // newest attempt first
    const [latestQuiz] = quizArr;
    setLastQuizAttempt(latestQuiz);

    // parse X/Y from latestQuiz.score
    const passRatio = stagePassRatios[quizStage] || 0.6;
    const scoreParts = latestQuiz.score.split("/");
    if (scoreParts.length !== 2) {
      // fallback if malformed
      setMode("NEED_REVISION");
      return;
    }
    const numericScore = parseInt(scoreParts[0], 10);
    const outOf = parseInt(scoreParts[1], 10);
    if (isNaN(numericScore) || isNaN(outOf) || outOf === 0) {
      setMode("NEED_REVISION");
      return;
    }

    const ratio = numericScore / outOf;
    const passed = ratio >= passRatio;

    if (passed) {
      setMode("QUIZ_COMPLETED");
      return;
    }
    const attemptNum = latestQuiz.attemptNumber;
    const matchingRev = revArr.find((r) => r.revisionNumber === attemptNum);
    if (!matchingRev) {
      setMode("NEED_REVISION");
    } else {
      setMode("CAN_TAKE_NEXT_QUIZ");
    }
  }

  function handleQuizComplete() {
    console.log("StageManager: handleQuizComplete => re-fetch data");
    fetchData();
  }
  function handleQuizFail() {
    console.log("StageManager: handleQuizFail => re-fetch data");
    fetchData();
  }
  function handleRevisionDone() {
    console.log("StageManager: handleRevisionDone => re-fetch data");
    fetchData();
  }

  if (!subChapterId || !userId) {
    return <div style={{ color: "#fff" }}>No valid subChapterId/userId.</div>;
  }
  if (loading) {
    return <div style={{ color: "#fff" }}>Loading attempts...</div>;
  }
  if (error) {
    return <div style={{ color: "red" }}>Error: {error}</div>;
  }

  // summary label
  let summaryLabel = "No Attempts Yet";
  if (quizAttempts.length > 0) {
    const [latest] = quizAttempts;
    summaryLabel = `Last Attempt => Q${latest.attemptNumber} (${latest.score})`;
  }

  return (
    <div style={{ color: "#fff", padding: "1rem" }}>
      <div style={styles.headerRow}>
        <div>
          Stage: <b>{quizStage}</b> | {summaryLabel}
        </div>
        <button
          style={styles.toggleButton}
          onClick={() => setShowTimeline(!showTimeline)}
        >
          {showTimeline ? "Hide details" : "Show details"}
        </button>
      </div>

      {showTimeline && (
        <div style={styles.timelinePanel}>
          {renderTimeline(
            quizAttempts,
            revisionAttempts,
            stagePassRatios[quizStage] || 0.6
          )}
        </div>
      )}

      <div style={styles.mainContent}>
        {mode === "NO_QUIZ_YET" && (
          <QuizComponent
            userId={userId}                // <-- Pass userId here
            quizStage={quizStage}
            examId={effectiveExamId}
            subChapterId={subChapterId}
            attemptNumber={1}
            onQuizComplete={handleQuizComplete}
            onQuizFail={handleQuizFail}
          />
        )}

        {mode === "QUIZ_COMPLETED" && (
          <div style={{ color: "lightgreen" }}>
            <p>Congratulations! You passed the <b>{quizStage}</b> stage.</p>
          </div>
        )}

        {mode === "NEED_REVISION" && lastQuizAttempt && (
          <ReviseComponent
            quizStage={quizStage}
            examId={effectiveExamId}
            subChapterId={subChapterId}
            revisionNumber={lastQuizAttempt.attemptNumber}
            onRevisionDone={handleRevisionDone}
          />
        )}

        {mode === "CAN_TAKE_NEXT_QUIZ" && lastQuizAttempt && (
          <QuizComponent
            userId={userId}                // <-- Pass userId here
            quizStage={quizStage}
            examId={effectiveExamId}
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

// Timeline
function renderTimeline(quizArr, revArr, passRatio) {
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
    const [numStr, denomStr] = quizDoc.score.split("/");
    const numericScore = parseInt(numStr, 10) || 0;
    const totalQ = parseInt(denomStr, 10) || 1;
    const ratio = numericScore / totalQ;
    const passed = ratio >= passRatio;

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
  let boxColor = "#888";
  let label = "";

  if (type === "quiz") {
    label = `Q${attemptNumber} (${score})`;
    boxColor = passed ? "#2ecc71" : "#e74c3c";
  } else if (type === "revision") {
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