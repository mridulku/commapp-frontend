// File: StageManager.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";

// Child Components
import ReadingView from "./ReadingView";
import ActivityView from "./ActivityView";
import HistoryView from "./HistoryView";

const QUIZ_STAGES = ["remember", "understand", "apply", "analyze"];

export default function StageManager({ examId, activity, userId }) {
  // 1) Extract relevant data
  const subChapterId = activity?.subChapterId || "";
  const activityType = (activity?.type || "").toLowerCase();      // "read" or "quiz"
  const possibleQuizStage = (activity?.quizStage || "").toLowerCase();

  // 2) PlanId from Redux
  const planId = useSelector((state) => state.plan.planDoc?.id);

  // 3) We'll keep a piece of local state for activeTab
  const [activeTab, setActiveTab] = useState("reading");

  // 4) Whenever the `activity` prop changes, recalculate which tab to show
  useEffect(() => {
    let newTab = "reading";
    if (QUIZ_STAGES.includes(possibleQuizStage)) {
      newTab = possibleQuizStage;
    } else if (activityType === "quiz") {
      newTab = "remember";
    }
    setActiveTab(newTab);
  }, [activity, possibleQuizStage, activityType]);

  // 5) We also keep subView for quiz stages => "activity" or "history"
  const [subView, setSubView] = useState("activity");

  // 6) Whenever the `activity` changes, reset subView to "activity"
  useEffect(() => {
    setSubView("activity");
  }, [activity]);

  // --- All your existing quiz logic is unchanged below ---
  // (loading states, fetch quiz data, compute mode, etc.)
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [revisionAttempts, setRevisionAttempts] = useState([]);
  const [subchapterConcepts, setSubchapterConcepts] = useState([]);
  const [mode, setMode] = useState("LOADING");
  const [lastQuizAttempt, setLastQuizAttempt] = useState(null);
  const [latestConceptStats, setLatestConceptStats] = useState(null);
  const [allAttemptsConceptStats, setAllAttemptsConceptStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const stagePassRatios = {
    remember: 1,
    understand: 1,
    apply: 1,
    analyze: 1,
  };
  const effectiveExamId = examId || "general";

  // -------------- subchapter-status for lock info --------------
  const [taskInfo, setTaskInfo] = useState([]);
  const [taskInfoLoading, setTaskInfoLoading] = useState(false);
  const [taskInfoError, setTaskInfoError] = useState("");

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

  // If user selects a quiz tab => fetch quiz data
  useEffect(() => {
    if (!subChapterId || !userId) return;
    if (!QUIZ_STAGES.includes(activeTab)) {
      // not a recognized quiz stage => skip
      setMode("LOADING");
      setQuizAttempts([]);
      setRevisionAttempts([]);
      setSubchapterConcepts([]);
      setAllAttemptsConceptStats([]);
      setLastQuizAttempt(null);
      setLatestConceptStats(null);
      return;
    }
    fetchQuizData(activeTab);
  }, [activeTab, subChapterId, userId]);

  // The existing fetch logic
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

      // 3) subchapter concepts
      const conceptRes = await axios.get("http://localhost:3001/api/getSubchapterConcepts", {
        params: { subchapterId: subChapterId },
      });
      const conceptArr = conceptRes?.data?.concepts || [];

      setQuizAttempts(quizArr);
      setRevisionAttempts(revArr);
      setSubchapterConcepts(conceptArr);

      // Evaluate pass/fail => mode
      computeMode(quizArr, revArr, conceptArr, currentStage);
      // Build concept stats for history
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
        // see if revision exists
        const attemptNum = latestQuiz.attemptNumber;
        const match = revArr.find((r) => r.revisionNumber === attemptNum);
        if (match) {
          setMode("CAN_TAKE_NEXT_QUIZ");
        } else {
          setMode("NEED_REVISION");
        }
      }
    }
    // Build stats for latest attempt
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

  // ------------ Render ------------
  if (taskInfoLoading) {
    return <div style={{ color: "#fff" }}>Loading stage statuses...</div>;
  }
  if (taskInfoError) {
    return <div style={{ color: "red" }}>{taskInfoError}</div>;
  }
  if (!subChapterId || !userId) {
    return <div style={{ color: "#fff" }}>No valid subChapterId/userId provided.</div>;
  }

  return (
    <div style={styles.container}>
      {/* Tabs */}
      <div style={styles.tabRow}>
        {renderStageTab("reading", "Reading")}
        {QUIZ_STAGES.map((st) => renderStageTab(st, capitalize(st)))}
      </div>

      {/* Main content */}
      <div style={styles.mainContent}>
        {isTabLocked(activeTab) ? (
          <div style={{ fontSize: "1.1rem", color: "#f00" }}>This stage is currently locked.</div>
        ) : (
          renderTabContent(activeTab)
        )}
      </div>
    </div>
  );

  // Helper: isTabLocked
  function isTabLocked(tabKey) {
    const labelForTaskInfo = tabKey === "reading" ? "Reading" : capitalize(tabKey);
    const item = taskInfo.find(
      (t) => (t.stageLabel || "").toLowerCase() === labelForTaskInfo.toLowerCase()
    );
    return item?.locked === true;
  }

  // Helper: renderStageTab
  function renderStageTab(tabKey, tabLabel) {
    const isCurrent = activeTab === tabKey;
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
        {locked && <span style={{ marginLeft: 6 }}>🔒</span>}
      </button>
    );
  }

  // Helper: renderTabContent
  function renderTabContent(tabKey) {
    if (tabKey === "reading") {
      return <ReadingView activity={activity} />;
    }
    // Quiz stage
    if (QUIZ_STAGES.includes(tabKey)) {
      if (loading) {
        return <div style={{ color: "#fff" }}>Loading quiz data...</div>;
      }
      if (error) {
        return <div style={{ color: "red" }}>{error}</div>;
      }
      return (
        <div style={styles.quizContainer}>
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
    return <div style={{ color: "#fff" }}>Unknown stage: {tabKey}</div>;
  }
}

// Utility: parseScoreForRatio
function parseScoreForRatio(scoreString) {
  if (!scoreString) return NaN;
  const trimmed = scoreString.trim();
  if (trimmed.endsWith("%")) {
    const parsed = parseFloat(trimmed.slice(0, -1));
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

// Utility: buildConceptStats
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

// Utility: capitalize
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Styles
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