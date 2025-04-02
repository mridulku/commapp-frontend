// File: StageManager.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";

// Child Components
import ReadingView from "./ReadingView";
import ActivityView from "./ActivityView";
import HistoryView from "./HistoryView";

// The recognized quiz stages
const QUIZ_STAGES = ["remember", "understand", "apply", "analyze"];

/**
 * StageManager
 * ------------
 * - Fetches subchapter status from /subchapter-status => gets "locked" info for each stage
 * - Renders a top bar of tabs: Reading | Remember | Understand | Apply | Analyze
 *   * Each tab can show a lock icon if locked===true
 * - If user clicks a locked tab => show a placeholder "This stage is currently locked."
 * - Otherwise, the normal reading or quiz UI is shown.
 *
 * Props:
 *  - examId
 *  - activity (object with .type, .quizStage, .subChapterId, etc.)
 *  - userId (from Redux or passed in)
 */
export default function StageManager({ examId, activity, userId }) {
  // Extract relevant data from `activity`
  const subChapterId = activity?.subChapterId || "";
  const activityType = (activity?.type || "").toLowerCase();
  const possibleQuizStage = (activity?.quizStage || "").toLowerCase();

  // Get planId from Redux
  const planId = useSelector((state) => state.plan.planDoc?.id);

  // Determine defaultTab from activity
  let defaultTab = "reading";
  if (QUIZ_STAGES.includes(possibleQuizStage)) {
    defaultTab = possibleQuizStage;
  } else if (activityType === "quiz") {
    defaultTab = "remember";
  }
  const [activeTab, setActiveTab] = useState(defaultTab);

  // If user is in a quiz stage, subView => "activity" or "history"
  // By default we go to "activity"
  const [subView, setSubView] = useState("activity");

  // ------------------- Existing states for quiz logic (unchanged) -------------------
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [revisionAttempts, setRevisionAttempts] = useState([]);
  const [subchapterConcepts, setSubchapterConcepts] = useState([]);
  const [mode, setMode] = useState("LOADING");
  const [lastQuizAttempt, setLastQuizAttempt] = useState(null);
  const [latestConceptStats, setLatestConceptStats] = useState(null);
  const [allAttemptsConceptStats, setAllAttemptsConceptStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pass thresholds for each stage
  const stagePassRatios = {
    remember: 1,
    understand: 1,
    apply: 1,
    analyze: 1,
  };
  const effectiveExamId = examId || "general";

  // ------------------- NEW: subchapter-status for lock info -------------------
  const [taskInfo, setTaskInfo] = useState([]);
  const [taskInfoLoading, setTaskInfoLoading] = useState(false);
  const [taskInfoError, setTaskInfoError] = useState("");

  /**
   * 1) On mount (and whenever userId/planId/subChapterId changes) => fetch /subchapter-status
   *    We won't render tabs or content until we have the lock info, so the lock icons appear immediately.
   */
  useEffect(() => {
    if (!userId || !planId || !subChapterId) {
      setTaskInfo([]);
      return;
    }
    async function fetchSubchapterStatus() {
      try {
        setTaskInfoLoading(true);
        setTaskInfoError("");
        const res = await axios.get("http://localhost:3001/subchapter-status", {
          params: {
            userId,
            planId,
            subchapterId: subChapterId,
          },
        });
        // res.data.taskInfo => array of 5 objects (Reading + quiz stages)
        setTaskInfo(res.data.taskInfo || []);
      } catch (err) {
        console.error("StageManager => /subchapter-status error:", err);
        setTaskInfoError(err.message || "Error loading subchapter status");
        setTaskInfo([]);
      } finally {
        setTaskInfoLoading(false);
      }
    }
    fetchSubchapterStatus();
  }, [userId, planId, subChapterId]);

  /**
   * 2) If the user selects a QUIZ_STAGES tab => fetch local quiz data
   *    We do so only after we have userId / subChapterId.
   *    If it's locked => we'll still fetch the quiz data, or you could skip. 
   *    We'll just let it fetch. But we'll show "locked" if the user tries to view it.
   */
  useEffect(() => {
    if (!subChapterId || !userId) return;

    // If the activeTab is not a recognized quiz stage => skip quiz fetch
    if (!QUIZ_STAGES.includes(activeTab)) {
      // reset quiz states
      setMode("LOADING");
      setQuizAttempts([]);
      setRevisionAttempts([]);
      setSubchapterConcepts([]);
      setAllAttemptsConceptStats([]);
      setLastQuizAttempt(null);
      setLatestConceptStats(null);
      return;
    }
    // fetch quiz data
    fetchQuizData(activeTab);
    // eslint-disable-next-line
  }, [activeTab, subChapterId, userId]);

  // =============== Existing fetch quiz logic ===============
  async function fetchQuizData(currentStage) {
    try {
      setLoading(true);
      setError("");

      // 1) getQuiz
      const quizRes = await axios.get("http://localhost:3001/api/getQuiz", {
        params: {
          userId,
          planId,
          subchapterId: subChapterId,
          quizType: currentStage,
        },
      });
      const quizArr = quizRes?.data?.attempts || [];

      // 2) getRevisions
      const revRes = await axios.get("http://localhost:3001/api/getRevisions", {
        params: {
          userId,
          planId,
          subchapterId: subChapterId,
          revisionType: currentStage,
        },
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

      // Evaluate pass/fail => set 'mode'
      computeMode(quizArr, revArr, conceptArr, currentStage);
      // Build concept stats => for "History" view
      buildAllAttemptsConceptStats(quizArr, conceptArr);
    } catch (err) {
      console.error("StageManager => fetchQuizData error:", err);
      setError(err.message || "Error fetching quiz data");
    } finally {
      setLoading(false);
    }
  }

  function computeMode(quizArr, revArr, conceptArr, quizStage) {
    if (!quizArr.length) {
      setMode("NO_QUIZ_YET");
      setLastQuizAttempt(null);
      setLatestConceptStats(null);
      return;
    }
    // newest attempt => first item in quizArr
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
        // see if there's a matching revision
        const attemptNum = latestQuiz.attemptNumber;
        const match = revArr.find((r) => r.revisionNumber === attemptNum);
        if (match) {
          setMode("CAN_TAKE_NEXT_QUIZ");
        } else {
          setMode("NEED_REVISION");
        }
      }
    }

    // Build concept stats for the latest attempt
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

  // Refresh quiz data after quiz or revision is done
  function handleQuizComplete() {
    if (QUIZ_STAGES.includes(activeTab)) {
      fetchQuizData(activeTab);
    }
  }
  function handleQuizFail() {
    if (QUIZ_STAGES.includes(activeTab)) {
      fetchQuizData(activeTab);
    }
  }
  function handleRevisionDone() {
    if (QUIZ_STAGES.includes(activeTab)) {
      fetchQuizData(activeTab);
    }
  }

  // =============== Render ===============

  // 1) If we're still loading the subchapter status => show a placeholder
  if (taskInfoLoading) {
    return <div style={{ color: "#fff" }}>Loading stage statuses...</div>;
  }
  // 2) If we got an error from subchapter-status => show it
  if (taskInfoError) {
    return <div style={{ color: "red" }}>{taskInfoError}</div>;
  }

  // If no subChapterId or userId => bail
  if (!subChapterId || !userId) {
    return <div style={{ color: "#fff" }}>No valid subChapterId/userId provided.</div>;
  }

  return (
    <div style={styles.container}>
      {/* 1) The row of tabs => Reading, Remember, Understand, Apply, Analyze */}
      <div style={styles.tabRow}>
        {renderStageTab("reading", "Reading")}
        {QUIZ_STAGES.map((st) => {
          return renderStageTab(st, capitalize(st));
        })}
      </div>

      {/* 2) Main content => 
          If reading => show reading 
          If quiz stage => sub-buttons 
          BUT if locked => show a locked placeholder 
      */}
      <div style={styles.mainContent}>
        {isTabLocked(activeTab) ? (
          // If the chosen tab is locked => show a placeholder
          <div style={{ fontSize: "1.1rem", color: "#f00" }}>
            This stage is currently locked.
          </div>
        ) : (
          // else => normal content
          renderTabContent(activeTab)
        )}
      </div>
    </div>
  );

  // =============== Helper: isTabLocked ===============
  function isTabLocked(tabKey) {
    // find the matching item in taskInfo
    const labelForTaskInfo = tabKey === "reading" ? "Reading" : capitalize(tabKey);
    const item = taskInfo.find(
      (t) => (t.stageLabel || "").toLowerCase() === labelForTaskInfo.toLowerCase()
    );
    return item?.locked === true;
  }

  // =============== Helper: renderTabContent ===============
  // Returns the normal content for reading or quiz stage
  function renderTabContent(tabKey) {
    if (tabKey === "reading") {
      // Reading => show ReadingView
      return <ReadingView activity={activity} />;
    }

    // else => quiz stage => show sub-buttons + ActivityView/HistoryView
    if (QUIZ_STAGES.includes(tabKey)) {
      // If there's an error or loading quiz data
      if (loading) {
        return <div style={{ color: "#fff" }}>Loading quiz data...</div>;
      }
      if (error) {
        return <div style={{ color: "red" }}>{error}</div>;
      }

      return (
        <div style={styles.quizContainer}>
          {/* Sub-buttons for activity/history */}
          <div style={styles.subButtonRow}>
            <button
              style={subView === "activity" ? styles.subBtnActive : styles.subBtn}
              onClick={() => setSubView("activity")}
            >
              Activity
            </button>
            <button
              style={subView === "history" ? styles.subBtnActive : styles.subBtn}
              onClick={() => setSubView("history")}
            >
              History
            </button>
          </div>

          {subView === "activity" && (
            <ActivityView
              mode={mode}
              quizStage={tabKey}
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

          {subView === "history" && (
            <HistoryView
              quizStage={tabKey}
              quizAttempts={quizAttempts}
              revisionAttempts={revisionAttempts}
              lastQuizAttempt={lastQuizAttempt}
              latestConceptStats={latestConceptStats}
              allAttemptsConceptStats={allAttemptsConceptStats}
              passRatio={stagePassRatios[tabKey] || 0.6}
            />
          )}
        </div>
      );
    }

    // Fallback if unknown
    return <div style={{ color: "#fff" }}>Unknown stage: {tabKey}</div>;
  }

  // =============== Helper: renderStageTab ===============
  function renderStageTab(tabKey, tabLabel) {
    const isCurrent = (activeTab === tabKey);
    const locked = isTabLocked(tabKey);

    return (
      <button
        key={tabKey}
        style={isCurrent ? styles.tabButtonActive : styles.tabButton}
        onClick={() => {
          setActiveTab(tabKey);
          if (QUIZ_STAGES.includes(tabKey)) {
            setSubView("activity");
          }
        }}
      >
        {tabLabel}
        {/* Show lock icon if locked */}
        {locked && <span style={{ marginLeft: 6 }}>🔒</span>}
      </button>
    );
  }
}

/* ========== Utility: parseScoreForRatio ========== */
function parseScoreForRatio(scoreString) {
  if (!scoreString) return NaN;
  const trimmed = scoreString.trim();
  // If ends with '%'
  if (trimmed.endsWith("%")) {
    const numPart = trimmed.slice(0, -1);
    const parsed = parseFloat(numPart);
    return isNaN(parsed) ? NaN : parsed / 100;
  }
  // If "X/Y"
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

/* ========== Utility: buildConceptStats ========== */
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
  if (countMap["UnknownConcept"]) conceptNamesSet.add("UnknownConcept");

  const statsArray = [];
  conceptNamesSet.forEach((cName) => {
    const rec = countMap[cName] || { correct: 0, total: 0 };
    const ratio = rec.total > 0 ? rec.correct / rec.total : 0;
    let passOrFail = "FAIL";
    if (rec.total === 0) {
      passOrFail = "NOT_TESTED";
    } else if (ratio === 1.0) {
      passOrFail = "PASS";
    }
    statsArray.push({
      conceptName: cName,
      correct: rec.correct,
      total: rec.total,
      ratio,
      passOrFail,
    });
  });
  return statsArray;
}

/* ========== Utility: capitalize ========== */
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ========== Styles ========== */
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
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: "#444",
    color: "#fff",
    borderRadius: "4px",
    padding: "6px 12px",
    cursor: "pointer",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
  },
  mainContent: {
    flex: 1,
    overflowY: "auto",
    padding: "8px",
  },
  quizContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  subButtonRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "8px",
  },
  subBtn: {
    backgroundColor: "#222",
    color: "#ccc",
    border: "none",
    borderRadius: "4px",
    padding: "5px 12px",
    cursor: "pointer",
    fontWeight: 500,
  },
  subBtnActive: {
    backgroundColor: "#666",
    color: "#fff",
    borderRadius: "4px",
    padding: "5px 12px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};