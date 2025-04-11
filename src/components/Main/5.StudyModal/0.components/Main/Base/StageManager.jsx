// File: StageManager.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";

// Child Components
import ReadingView from "./ReadingView";
import ActivityView from "./ActivityView";
import HistoryView from "./HistoryView";

const QUIZ_STAGES = ["remember", "understand", "apply", "analyze"];

/** Maps "reading"/"remember"/"understand"/"apply"/"analyze" => numeric stage # */
function getStageNumber(stageKey) {
  switch ((stageKey || "").toLowerCase()) {
    case "reading":
      return 1;
    case "remember":
      return 2;
    case "understand":
      return 3;
    case "apply":
      return 4;
    case "analyze":
      return 5;
    default:
      return 0;
  }
}

/** Convert aggregator’s "status" => a small label for WIP, etc. */
function getStatusShortLabel(item) {
  if (!item) return "";
  // aggregator => item.status => "done"/"in-progress"/"not-started"
  if (item.locked) return "LOCKED";
  if (item.status === "done") return "DONE";
  if (item.status === "in-progress") return "WIP";
  return ""; // for "not-started" or anything else
}

/** For a tooltip, we can return the aggregator status as a string. */
function getStatusTooltip(item) {
  if (!item) return "No data";
  if (item.locked) return "Locked";
  const s = (item.status || "").toLowerCase();
  if (s === "done") return "Done";
  if (s === "in-progress") return "In Progress";
  return "Not Started";
}

/** Capitalize helper */
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function StageManager({ examId, activity, userId }) {
  // ----------------- Basic Activity Data -----------------
  const subChapterId = activity?.subChapterId || "";
  const activityType = (activity?.type || "").toLowerCase(); // "read" or "quiz"
  const possibleQuizStage = (activity?.quizStage || "").toLowerCase();
  const completionStatus = (activity?.completionStatus || "").toLowerCase();

  // The stage that the user arrived on from left panel
  const selectedStage = (activityType === "quiz")
    ? possibleQuizStage || "remember"
    : "reading";

  // ----------------- Global Redux Data -----------------
  const planId = useSelector((state) => state.plan.planDoc?.id);
  const effectiveExamId = examId || "general";

  // ----------------- Tab & subView States -----------------
  // We'll keep `activeTab` but default to the stage from the left-panel activity
  const [activeTab, setActiveTab] = useState(selectedStage);
  const [subView, setSubView] = useState("activity");

  // Whenever `activity` changes => reset tab & subView
  useEffect(() => {
    if (QUIZ_STAGES.includes(selectedStage)) {
      setActiveTab(selectedStage);
    } else {
      setActiveTab("reading");
    }
    setSubView("activity");
  }, [activity, selectedStage]);

  // ----------------- Refresh Key for aggregator re-fetch -----------------
  const [refreshKey, setRefreshKey] = useState(0);
  function handleNeedsRefreshStatus() {
    setRefreshKey((prev) => prev + 1);
  }

  // ----------------- aggregator => subchapter-status => for locked/done info -----------------
  const [taskInfo, setTaskInfo] = useState([]);
  const [taskInfoLoading, setTaskInfoLoading] = useState(false);
  const [taskInfoError, setTaskInfoError] = useState("");

  useEffect(() => {
    if (!userId || !planId || !subChapterId) {
      setTaskInfo([]);
      setTaskInfoLoading(false);
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
        console.error("[StageManager] subchapter-status error:", err);
        setTaskInfoError(err.message || "Error loading subchapter status");
        setTaskInfo([]);
      } finally {
        setTaskInfoLoading(false);
      }
    }
    fetchSubchapterStatus();
  }, [userId, planId, subChapterId, refreshKey]);

  // ----------------- Quiz & Status Data (for the active quiz stage) -----------------
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [revisionAttempts, setRevisionAttempts] = useState([]);
  const [subchapterConcepts, setSubchapterConcepts] = useState([]);
  const [mode, setMode] = useState("LOADING");
  const [lastQuizAttempt, setLastQuizAttempt] = useState(null);
  const [latestConceptStats, setLatestConceptStats] = useState(null);
  const [allAttemptsConceptStats, setAllAttemptsConceptStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // If activeTab is a quiz stage => fetch quiz data
  useEffect(() => {
    if (!subChapterId || !userId) return;

    if (QUIZ_STAGES.includes(activeTab)) {
      fetchQuizData(activeTab);
    } else {
      // Not a quiz => clear data
      setMode("LOADING");
      setQuizAttempts([]);
      setRevisionAttempts([]);
      setSubchapterConcepts([]);
      setAllAttemptsConceptStats([]);
      setLastQuizAttempt(null);
      setLatestConceptStats(null);
    }
  }, [activeTab, subChapterId, userId]);

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
      console.error("[StageManager] fetchQuizData error:", err);
      setError(err.message || "Error fetching quiz data");
    } finally {
      setLoading(false);
    }
  }

  // Decide quiz mode
  const stagePassRatios = {
    remember: 1,
    understand: 1,
    apply: 1,
    analyze: 1,
  };

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

    // Build concept stats for latest attempt
    if (latestQuiz?.quizSubmission && conceptArr.length > 0) {
      const stats = buildConceptStats(latestQuiz.quizSubmission, conceptArr);
      setLatestConceptStats(stats);
    } else {
      setLatestConceptStats(null);
    }
  }

  // Build concept stats => used in "History" view
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

  // If a quiz or revision finishes => re-fetch
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

  // ========== If activity is deferred/complete => short-circuit ==========
  if (completionStatus === "deferred") {
    return (
      <div style={styles.messageBox}>
        <h2>This activity has been deferred.</h2>
        <p style={{ marginTop: 8 }}>You can proceed to the next activity.</p>
      </div>
    );
  }
  if (completionStatus === "complete") {
    return (
      <div style={styles.messageBox}>
        <h2>This activity is complete.</h2>
        <p style={{ marginTop: 8 }}>You can proceed to the next activity.</p>
      </div>
    );
  }

  // --------------- Normal UI ---------------
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
      {/* 1) Our pill row => reading + quiz stages (remember, understand, etc.) */}
      <div style={styles.stageRow}>
        {renderStagePill("reading")}
        {QUIZ_STAGES.map((st) => renderStagePill(st))}
      </div>

      {/* 2) The main content => locked if aggregator says locked or if not the user's chosen stage */}
      <div style={styles.mainContent}>
        {isTabAllowedAndUnlocked(activeTab) ? (
          renderTabContent(activeTab)
        ) : (
          <div style={{ fontSize: "1.1rem", color: "#f00" }}>
            This stage is not currently accessible.
          </div>
        )}
      </div>
    </div>
  );

  // Renders the pill for a given stageKey => "reading"/"remember"/"understand"/"apply"/"analyze"
  function renderStagePill(stageKey) {
    // aggregator => find item => locked/done/in-progress
    const labelForTaskInfo = (stageKey === "reading" ? "Reading" : capitalize(stageKey));
    const item = taskInfo.find(
      (t) => (t.stageLabel || "").toLowerCase() === labelForTaskInfo.toLowerCase()
    );
    const locked = item?.locked || false;
    const shortLabel = getStatusShortLabel(item); // "LOCKED","DONE","WIP",""
    const tooltipStr = getStatusTooltip(item);

    // numeric stage => reading=1, remember=2...
    const stageNum = getStageNumber(stageKey);
    // is this the current user-chosen stage from left panel?
    const isSelectedStage = (stageKey === selectedStage);

    // highlight if it's the active tab
    const isCurrentTab = (stageKey === activeTab);

    // The pill can only be "clicked" if it's the selectedStage from left panel
    // AND aggregator says not locked
    const canClick = (isSelectedStage && !locked);

    // Build the dynamic style
    let pillStyle = { ...styles.stagePill };
    if (isCurrentTab) {
      pillStyle = { ...pillStyle, ...styles.stagePillCurrent };
    } else if (!canClick) {
      pillStyle = { ...pillStyle, ...styles.stagePillDisabled };
    }

    // If we have a short status label => show it in the smaller sub-box
    // e.g. WIP, LOCKED, DONE
    let statusBox = null;
    if (shortLabel) {
      statusBox = (
        <div style={styles.statusBox}>
          {shortLabel}
        </div>
      );
    }

    return (
      <div
        key={stageKey}
        style={pillStyle}
        title={tooltipStr}
        onClick={() => {
          if (canClick) {
            setActiveTab(stageKey);
            if (QUIZ_STAGES.includes(stageKey)) {
              setSubView("activity");
            }
          }
        }}
      >
        {/* The numeric prefix => e.g. "1" then name => "Reading" */}
        <div style={styles.stageNumber}>{stageNum}</div>
        <div style={styles.stageLabel}>{labelForTaskInfo}</div>
        {statusBox}
      </div>
    );
  }

  /** 
   * We only show the tab content if aggregator says it's not locked
   * and if it's the left-panel's chosen stage.
   */
  function isTabAllowedAndUnlocked(tabKey) {
    if (tabKey !== selectedStage) return false;
    if (isTabLocked(tabKey)) return false;
    return true;
  }

  function isTabLocked(tabKey) {
    const labelForTaskInfo =
      tabKey === "reading" ? "Reading" : capitalize(tabKey);
    const item = taskInfo.find(
      (t) => (t.stageLabel || "").toLowerCase() === labelForTaskInfo.toLowerCase()
    );
    return item?.locked === true;
  }

  // Actual content for reading or quiz
  function renderTabContent(tabKey) {
    // (1) Reading
    if (tabKey === "reading") {
      return (
        <ReadingView
          activity={activity}
          onNeedsRefreshStatus={handleNeedsRefreshStatus}
        />
      );
    }

    // (2) Quiz stage
    if (QUIZ_STAGES.includes(tabKey)) {
      if (loading) {
        return <div style={{ color: "#fff" }}>Loading quiz data...</div>;
      }
      if (error) {
        return <div style={{ color: "red" }}>{error}</div>;
      }
      return (
        <div style={styles.quizContainer}>
          {/* Sub-buttons => "Activity" / "History" */}
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
              activity={activity}
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
              onNeedsRefreshStatus={handleNeedsRefreshStatus}
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
              passRatio={stagePassRatios[tabKey] || 1}
            />
          )}
        </div>
      );
    }

    // (3) fallback
    return <div style={{ color: "#fff" }}>Unknown stage: {tabKey}</div>;
  }
}

// ========== parseScoreForRatio ==========
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

// ========== buildConceptStats ==========
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

// ========== Styles ==========
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
  // The row for the "pills"
  stageRow: {
    display: "flex",
    flexDirection: "row",
    gap: "8px",
    backgroundColor: "#111",
    padding: "8px",
    alignItems: "center",
  },
  // Each pill
  stagePill: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    borderRadius: "16px",
    backgroundColor: "#222",
    color: "#ccc",
    cursor: "pointer",
    userSelect: "none",
  },
  // Currently selected tab => highlight
  stagePillCurrent: {
    backgroundColor: "#444",
    color: "#fff",
    fontWeight: "bold",
  },
  // If aggregator says locked or the user has a different stage => fade
  stagePillDisabled: {
    opacity: 0.5,
    cursor: "default",
  },
  stageNumber: {
    backgroundColor: "#333",
    color: "#fff",
    fontSize: "0.8rem",
    width: "20px",
    height: "20px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    // Could do a stronger style if you want
  },
  stageLabel: {
    fontSize: "0.85rem",
    // add any other styling
  },
  statusBox: {
    backgroundColor: "#444",
    color: "#fff",
    fontSize: "0.65rem",
    borderRadius: "4px",
    padding: "2px 4px",
    // e.g. "WIP" or "DONE" or "LOCKED"
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
  messageBox: {
    padding: "24px",
    fontSize: "1.1rem",
    color: "#fff",
    backgroundColor: "#111",
    textAlign: "center",
  },
};