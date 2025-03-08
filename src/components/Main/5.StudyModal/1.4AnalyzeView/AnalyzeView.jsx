// ApplyView.jsx

import React, { useEffect, useState } from "react";
import QuizAnalyze from "./QuizAnalyze";
import ReviseAnalyze from "./ReviseAnalyze";

/**
 * Example statuses for the Apply stage:
 * - "NOT_STARTED" : user hasn't done any quiz
 * - "QUIZ_FAILED" : user failed => show revision
 * - "REVISION_DONE": user finished revision => quiz again
 * - "QUIZ_COMPLETED": user passed => success message
 */

// A small placeholder for attempt history items
function AttemptHistoryItem({ attempt }) {
  // e.g. attempt = { attemptNum, date, score, threshold, status: "pass"|"fail" }
  return (
    <div style={histStyles.historyItem}>
      <strong>Attempt #{attempt.attemptNum}</strong> on {attempt.date} <br />
      Score: {attempt.score} / {attempt.threshold} —{" "}
      {attempt.status.toUpperCase()}
    </div>
  );
}

export default function RememberView({ activity }) {
  const subChapterId = activity?.subChapterId || "N/A";

  // Stage status (dummy logic for demonstration)
  const [status, setStatus] = useState("NOT_STARTED");

  // Example pass threshold
  const passThreshold = 3;

  // Example local attempt data (simulate a user with 2 attempts)
  const [attemptHistory, setAttemptHistory] = useState([
    {
      attemptNum: 1,
      date: "2025-03-01",
      score: 2,
      threshold: passThreshold,
      status: "fail",
    },
    {
      attemptNum: 2,
      date: "2025-03-02",
      score: 3,
      threshold: passThreshold,
      status: "pass",
    },
  ]);

  // Controls whether the "History Panel" is visible
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  // On mount, simulate fetching data
  useEffect(() => {
    // e.g. setStatus("QUIZ_FAILED") if user last failed, etc.
    // setAttemptHistory(...) from your DB
    setStatus("NOT_STARTED");
  }, [subChapterId]);

  // Child handlers
  function handleQuizComplete() {
    setStatus("QUIZ_COMPLETED");
    // In real code, store quiz pass in DB, push new attempt record
  }

  function handleQuizFail() {
    setStatus("QUIZ_FAILED");
    // store fail attempt, etc.
  }

  function handleRevisionDone() {
    setStatus("REVISION_DONE");
  }

  function handleSecondQuizComplete() {
    setStatus("QUIZ_COMPLETED");
  }

  function handleSecondQuizFail() {
    setStatus("QUIZ_FAILED");
  }

  // A) Renders a small rectangular “Attempt #” pill in top-right
  //    that toggles the side panel
  function renderAttemptPill() {
    // e.g. let's say the last attempt was #2, or we can show total attempts
    const totalAttempts = attemptHistory.length;
    const lastAttemptNum = totalAttempts > 0 ? attemptHistory[attemptHistory.length - 1].attemptNum : 0;

    // If you want to show "Attempts: 2" or "Attempt #2" – up to you:
    const pillLabel = totalAttempts === 0
      ? "No Attempts"
      : `Attempt #${lastAttemptNum}`;

    return (
      <div style={styles.attemptPill} onClick={() => setShowHistoryPanel(true)}>
        {pillLabel}
      </div>
    );
  }

  // B) The side panel that slides in from the right
  function renderHistoryPanel() {
    return (
      <div style={styles.historyPanel}>
        <div style={styles.panelHeader}>
          <h4 style={{ margin: 0 }}>Apply Stage Attempts</h4>
          <button style={styles.closeBtn} onClick={() => setShowHistoryPanel(false)}>
            ✕
          </button>
        </div>
        <p style={{ margin: 0, fontSize: "0.85rem" }}>
          Pass if score ≥ {passThreshold}
        </p>
        <div style={histStyles.historyList}>
          {attemptHistory.length === 0 ? (
            <p style={{ margin: 0 }}>No attempts yet.</p>
          ) : (
            attemptHistory.map((att, idx) => (
              <AttemptHistoryItem attempt={att} key={idx} />
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.outerContainer}>
      {/* A) The top bar area: title + attempt pill on top-right */}
      <div style={styles.topBar}>
        <h2 style={styles.titleText}>
          [Apply View] SubChapter ID: {subChapterId}
        </h2>
        {renderAttemptPill()}
      </div>

      {/* B) The main content area => quiz or revision or success */}
      <div style={styles.contentArea}>
        {status === "NOT_STARTED" && (
          <QuizAnalyze
            subChapterId={subChapterId}
            onQuizComplete={handleQuizComplete}
            onQuizFail={handleQuizFail}
          />
        )}
        {status === "QUIZ_FAILED" && (
          <ReviseAnalyze
            subChapterId={subChapterId}
            onRevisionDone={handleRevisionDone}
          />
        )}
        {status === "REVISION_DONE" && (
          <div style={{ marginBottom: "1rem", color: "#f90" }}>
            <p>Revision complete. Attempt quiz again:</p>
            <QuizAnalyze
              subChapterId={subChapterId}
              onQuizComplete={handleSecondQuizComplete}
              onQuizFail={handleSecondQuizFail}
            />
          </div>
        )}
        {status === "QUIZ_COMPLETED" && (
          <div style={{ marginBottom: "1rem", color: "lightgreen" }}>
            <h3>Quiz Completed Successfully!</h3>
            <p>Congrats, you passed the Apply stage for sub-chapter {subChapterId}.</p>
          </div>
        )}
      </div>

      {/* C) Conditionally render the side panel if showHistoryPanel=true */}
      {showHistoryPanel && renderHistoryPanel()}
    </div>
  );
}

// STYLES
const styles = {
  outerContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    fontFamily: `'Inter', 'Roboto', sans-serif`,
    position: "relative",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px",
    borderBottom: "1px solid #333",
  },
  titleText: {
    margin: 0,
  },
  attemptPill: {
    backgroundColor: "#444",
    color: "#fff",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: "bold",
  },
  contentArea: {
    flex: 1,
    padding: "20px",
    overflowY: "auto",
    maxWidth: "60ch",
    margin: "0 auto",
    lineHeight: 1.6,
    fontSize: "1rem",
  },
  historyPanel: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "300px",
    height: "100%",
    backgroundColor: "#222",
    borderLeft: "1px solid #555",
    padding: "12px",
    zIndex: 999,
    boxSizing: "border-box",
  },
  panelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "8px",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: "1rem",
    cursor: "pointer",
  },
};

// Additional styling for history list
const histStyles = {
  historyList: {
    marginTop: "6px",
    maxHeight: "50vh",
    overflowY: "auto",
    borderTop: "1px solid #555",
    paddingTop: "6px",
  },
  historyItem: {
    marginBottom: "8px",
    fontSize: "0.8rem",
    lineHeight: 1.4,
  },
};