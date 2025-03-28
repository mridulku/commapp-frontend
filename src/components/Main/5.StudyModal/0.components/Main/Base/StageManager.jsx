// File: StageManager.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import QuizComponent from "../QuizComp/QuizComponent";
import ReviseComponent from "../RevComp/ReviseComponent";
import { useSelector } from "react-redux";

/**
 * StageManager (Mini Tab Row at Top-Left)
 * ---------------------------------------
 * - The entire pass/fail logic, activity vs. history, timeline, concept breakdown
 *   is unchanged.
 * - We replace the big left vertical bar with a small "tab row" at the top-left.
 */

export default function StageManager({ examId, activity, quizStage, userId }) {
  const subChapterId = activity?.subChapterId || "";
  const planId = useSelector((state) => state.plan.planDoc?.id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Attempts + data
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [revisionAttempts, setRevisionAttempts] = useState([]);
  const [subchapterConcepts, setSubchapterConcepts] = useState([]);

  // pass/fail
  const [mode, setMode] = useState("LOADING");
  const [lastQuizAttempt, setLastQuizAttempt] = useState(null);

  // concept stats
  const [latestConceptStats, setLatestConceptStats] = useState(null);
  const [allAttemptsConceptStats, setAllAttemptsConceptStats] = useState([]);

  // mini tab row
  const [activeTab, setActiveTab] = useState("activity");

  const stagePassRatios = {
    remember: 1,
    understand: 1,
    apply: 1,
    analyze: 1,
  };
  const effectiveExamId = examId || "general";

  // On mount => fetch attempts, etc.
  useEffect(() => {
    if (!subChapterId || !userId) {
      console.log("StageManager: missing subChapterId/userId => skipping fetch");
      return;
    }
    fetchData();
    // eslint-disable-next-line
  }, [subChapterId, userId, quizStage]);

  async function fetchData() {
    try {
      setLoading(true);
      setError("");

      // 1) getQuiz
      const quizRes = await axios.get("http://localhost:3001/api/getQuiz", {
        params: { userId, planId, subchapterId: subChapterId, quizType: quizStage },
      });
      const quizArr = quizRes?.data?.attempts || [];

      // 2) getRevisions
      const revRes = await axios.get("http://localhost:3001/api/getRevisions", {
        params: { userId, planId, subchapterId: subChapterId, revisionType: quizStage },
      });
      const revArr = revRes?.data?.revisions || [];

      // 3) getSubchapterConcepts
      const conceptRes = await axios.get("http://localhost:3001/api/getSubchapterConcepts", {
        params: { subchapterId: subChapterId },
      });
      const conceptArr = conceptRes?.data?.concepts || [];

      setQuizAttempts(quizArr);
      setRevisionAttempts(revArr);
      setSubchapterConcepts(conceptArr);

      // pass/fail => mode
      computeMode(quizArr, revArr, conceptArr);
      // concept stats => all attempts
      buildAllAttemptsConceptStats(quizArr, conceptArr);

    } catch (err) {
      console.error("StageManager => fetchData error:", err);
      setError(err.message || "Error fetching data");
    } finally {
      setLoading(false);
    }
  }

  function computeMode(quizArr, revArr, conceptArr) {
    if (!quizArr.length) {
      setMode("NO_QUIZ_YET");
      setLastQuizAttempt(null);
      setLatestConceptStats(null);
      return;
    }
    const [latestQuiz] = quizArr;
    setLastQuizAttempt(latestQuiz);

    const ratio = parseScoreForRatio(latestQuiz.score);
    const passRatio = stagePassRatios[quizStage] || 0.6;
    if (isNaN(ratio)) {
      setMode("NEED_REVISION");
    } else {
      const passed = ratio >= passRatio;
      if (passed) {
        setMode("QUIZ_COMPLETED");
      } else {
        const attemptNum = latestQuiz.attemptNumber;
        const match = revArr.find((r) => r.revisionNumber === attemptNum);
        if (match) {
          setMode("CAN_TAKE_NEXT_QUIZ");
        } else {
          setMode("NEED_REVISION");
        }
      }
    }

    // concept stats for the LATEST quiz only
    if (latestQuiz?.quizSubmission && conceptArr.length > 0) {
      const stats = buildConceptStats(latestQuiz.quizSubmission, conceptArr);
      setLatestConceptStats(stats);
    } else {
      setLatestConceptStats(null);
    }
  }

  function buildAllAttemptsConceptStats(quizArr, conceptArr) {
    if (!quizArr.length || !conceptArr.length) {
      setAllAttemptsConceptStats([]);
      return;
    }
    const mapped = quizArr.map((attempt) => {
      const stats = buildConceptStats(attempt.quizSubmission || [], conceptArr);
      return {
        attemptNumber: attempt.attemptNumber,
        score: attempt.score,
        conceptStats: stats,
      };
    });
    setAllAttemptsConceptStats(mapped);
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

  // RENDER
  if (!subChapterId || !userId) {
    return <div style={{ color: "#fff" }}>No valid subChapterId/userId.</div>;
  }
  if (loading) {
    return <div style={{ color: "#fff" }}>Loading attempts...</div>;
  }
  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
  }

  return (
    <div style={styles.container}>

      {/* A small row of "tabs" at top-left */}
      <div style={styles.tabRow}>
        <button
          style={activeTab === "activity" ? styles.tabButtonActive : styles.tabButton}
          onClick={() => setActiveTab("activity")}
        >
          <span role="img" aria-label="Activity" style={{ marginRight: 5 }}>⚙️</span>
          Activity
        </button>
        <button
          style={activeTab === "history" ? styles.tabButtonActive : styles.tabButton}
          onClick={() => setActiveTab("history")}
        >
          <span role="img" aria-label="History" style={{ marginRight: 5 }}>📜</span>
          History
        </button>
      </div>

      {/* The main content area under that small row */}
      <div style={styles.mainContent}>
        {activeTab === "activity" && (
          <ActivityView
            mode={mode}
            quizStage={quizStage}
            examId={effectiveExamId}
            subChapterId={subChapterId}
            planId={planId}
            userId={userId}
            lastQuizAttempt={lastQuizAttempt}
            onQuizComplete={handleQuizComplete}
            onQuizFail={handleQuizFail}
            onRevisionDone={handleRevisionDone}
          />
        )}
        {activeTab === "history" && (
          <HistoryView
            quizStage={quizStage}
            quizAttempts={quizAttempts}
            revisionAttempts={revisionAttempts}
            lastQuizAttempt={lastQuizAttempt}
            latestConceptStats={latestConceptStats}
            allAttemptsConceptStats={allAttemptsConceptStats}
            passRatio={stagePassRatios[quizStage] || 0.6}
          />
        )}
      </div>
    </div>
  );
}

// --------------- Sub-Components (unchanged) ---------------
function ActivityView({
  mode,
  quizStage,
  examId,
  subChapterId,
  planId,
  userId,
  lastQuizAttempt,
  onQuizComplete,
  onQuizFail,
  onRevisionDone,
}) {
  return (
    <div style={{ padding: "16px" }}>
      {mode === "NO_QUIZ_YET" && (
        <QuizComponent
          userId={userId}
          planId={planId}
          quizStage={quizStage}
          examId={examId}
          subChapterId={subChapterId}
          attemptNumber={1}
          onQuizComplete={onQuizComplete}
          onQuizFail={onQuizFail}
        />
      )}

      {mode === "QUIZ_COMPLETED" && (
        <div style={{ color: "lightgreen", marginBottom: "1rem" }}>
          <p>Congratulations! You passed the <b>{quizStage}</b> stage.</p>
        </div>
      )}

      {mode === "NEED_REVISION" && lastQuizAttempt && (
        <ReviseComponent
          userId={userId}
          planId={planId}
          quizStage={quizStage}
          examId={examId}
          subChapterId={subChapterId}
          revisionNumber={lastQuizAttempt.attemptNumber}
          onRevisionDone={onRevisionDone}
        />
      )}

      {mode === "CAN_TAKE_NEXT_QUIZ" && lastQuizAttempt && (
        <QuizComponent
          userId={userId}
          planId={planId}
          quizStage={quizStage}
          examId={examId}
          subChapterId={subChapterId}
          attemptNumber={lastQuizAttempt.attemptNumber + 1}
          onQuizComplete={onQuizComplete}
          onQuizFail={onQuizFail}
        />
      )}
    </div>
  );
}

function HistoryView({
  quizStage,
  quizAttempts,
  revisionAttempts,
  lastQuizAttempt,
  latestConceptStats,
  allAttemptsConceptStats,
  passRatio,
}) {
  return (
    <div style={{ padding: "16px" }}>
      <h2>Stage: {quizStage} - History</h2>
      <div style={styles.sectionCard}>
        <h3>Timeline</h3>
        {renderTimeline(quizAttempts, revisionAttempts, passRatio)}
      </div>

      {lastQuizAttempt && latestConceptStats && latestConceptStats.length > 0 && (
        <div style={styles.sectionCard}>
          <h3>Concept Performance (Latest Attempt)</h3>
          {renderConceptTable(latestConceptStats)}
        </div>
      )}

      {allAttemptsConceptStats && allAttemptsConceptStats.length > 0 && (
        <div style={styles.sectionCard}>
          <h3>Attempt-by-Attempt Concept Breakdown</h3>
          {allAttemptsConceptStats.map((attemptObj, i) => {
            const { attemptNumber, score, conceptStats } = attemptObj;
            return (
              <div key={i} style={{ marginBottom: "1rem" }}>
                <h4>Attempt #{attemptNumber} &mdash; Score: {score}</h4>
                {renderConceptTable(conceptStats)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// -- timeline, concept code same as before --
function renderTimeline(quizArr, revArr, passRatio) {
  if (!quizArr.length) {
    return <p style={{ color: "#aaa" }}>No attempts yet</p>;
  }
  const quizAsc = [...quizArr].sort((a, b) => a.attemptNumber - b.attemptNumber);
  const items = [];
  quizAsc.forEach((quizDoc) => {
    const attemptNum = quizDoc.attemptNumber;
    const ratio = parseScoreForRatio(quizDoc.score);
    const passed = ratio >= passRatio;
    items.push({
      type: "quiz",
      attemptNumber: attemptNum,
      passed,
      score: quizDoc.score,
      timestamp: quizDoc.timestamp,
    });
    const matchRev = revArr.find((r) => r.revisionNumber === attemptNum);
    if (matchRev) {
      items.push({
        type: "revision",
        attemptNumber: attemptNum,
        timestamp: matchRev.timestamp,
      });
    }
  });
  return (
    <div style={styles.timelineContainer}>
      {items.map((it, i) => <TimelineItem item={it} key={i} />)}
    </div>
  );
}

function TimelineItem({ item }) {
  const { type, attemptNumber, passed, score, timestamp } = item;
  let label = "";
  let boxColor = "#888";
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
      <div style={{ ...styles.timelineBox, backgroundColor: boxColor }}>{label}</div>
      {timeString && <p style={styles.timelineTimestamp}>{timeString}</p>}
    </div>
  );
}

function renderConceptTable(stats) {
  return (
    <table style={{ borderCollapse: "collapse", width: "100%", marginTop: "0.5rem" }}>
      <thead>
        <tr>
          <th style={styles.tableHeader}>Concept</th>
          <th style={styles.tableHeader}>Correct</th>
          <th style={styles.tableHeader}>Total</th>
          <th style={styles.tableHeader}>% Correct</th>
          <th style={styles.tableHeader}>Result</th>
        </tr>
      </thead>
      <tbody>
        {stats.map((cs, idx) => {
          const ratioPct = (cs.ratio * 100).toFixed(1);
          return (
            <tr key={idx}>
              <td style={styles.tableCell}>{cs.conceptName}</td>
              <td style={styles.tableCell}>{cs.correct}</td>
              <td style={styles.tableCell}>{cs.total}</td>
              <td style={styles.tableCell}>{ratioPct}%</td>
              <td style={getCellStyle(cs.passOrFail)}>{cs.passOrFail}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// Helpers
function parseScoreForRatio(scoreString) {
  if (!scoreString) return NaN;
  const trimmed = scoreString.trim();
  if (trimmed.endsWith("%")) {
    const numPart = trimmed.slice(0, -1);
    const parsed = parseFloat(numPart);
    return isNaN(parsed) ? NaN : parsed / 100;
  }
  if (trimmed.includes("/")) {
    const [numStr, denomStr] = trimmed.split("/");
    const numericScore = parseFloat(numStr);
    const outOf = parseFloat(denomStr);
    if (!isNaN(numericScore) && !isNaN(outOf) && outOf > 0) {
      return numericScore / outOf;
    }
  }
  return NaN;
}

function buildConceptStats(quizSubmission, conceptArr) {
  const countMap = {};
  quizSubmission.forEach((q) => {
    const cName = q.conceptName || "UnknownConcept";
    if (!countMap[cName]) {
      countMap[cName] = { correct: 0, total: 0 };
    }
    countMap[cName].total++;
    if (q.score && parseFloat(q.score) >= 1) {
      countMap[cName].correct++;
    }
  });
  const conceptNamesSet = new Set(conceptArr.map((c) => c.name));
  if (countMap["UnknownConcept"]) {
    conceptNamesSet.add("UnknownConcept");
  }
  const statsArray = [];
  conceptNamesSet.forEach((cName) => {
    const rec = countMap[cName] || { correct: 0, total: 0 };
    const ratio = rec.total > 0 ? rec.correct / rec.total : 0;
    let passOrFail = "FAIL";
    if (rec.total === 0) passOrFail = "NOT_TESTED";
    else if (ratio === 1.0) passOrFail = "PASS";
    statsArray.push({
      conceptName: cName,
      correct: rec.correct,
      total: rec.total,
      ratio,
      passOrFail,
    });
  });
  statsArray.sort((a, b) => a.conceptName.localeCompare(b.conceptName));
  return statsArray;
}

function getCellStyle(passOrFail) {
  if (passOrFail === "PASS") return styles.passCell;
  if (passOrFail === "FAIL") return styles.failCell;
  return styles.notTestedCell;
}

// ---------------- Styles ----------------
const styles = {
  container: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    fontFamily: "'Inter', sans-serif",
  },
  tabRow: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#111",
    padding: "8px",
  },
  tabButton: {
    backgroundColor: "#222",
    color: "#ccc",
    border: "none",
    borderRadius: "4px",
    padding: "6px 12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: "#444",
    color: "#fff",
    borderRadius: "4px",
    padding: "6px 12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    border: "1px solid #444",
  },
  mainContent: {
    flex: 1,
    overflowY: "auto",
  },
  activityContainer: {
    padding: "16px",
  },
  historyContainer: {
    padding: "16px",
  },
  sectionCard: {
    backgroundColor: "#222",
    padding: "12px",
    borderRadius: "6px",
    marginBottom: "1rem",
  },
  timelineContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    marginTop: "0.5rem",
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
    color: "#ccc",
  },
  tableHeader: {
    borderBottom: "1px solid #aaa",
    padding: "4px 8px",
    textAlign: "left",
  },
  tableCell: {
    borderBottom: "1px solid #444",
    padding: "4px 8px",
    textAlign: "left",
    color: "#fff",
  },
  passCell: {
    borderBottom: "1px solid #444",
    padding: "4px 8px",
    textAlign: "left",
    backgroundColor: "green",
    color: "#fff",
    fontWeight: "bold",
  },
  failCell: {
    borderBottom: "1px solid #444",
    padding: "4px 8px",
    textAlign: "left",
    backgroundColor: "red",
    color: "#fff",
    fontWeight: "bold",
  },
  notTestedCell: {
    borderBottom: "1px solid #444",
    padding: "4px 8px",
    textAlign: "left",
    backgroundColor: "yellow",
    color: "#000",
    fontWeight: "bold",
  },
};