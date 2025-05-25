// File: StageManager.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { fetchAggregatorForSubchapter } from "../../../../../../store/aggregatorSlice";
import { fetchQuizStage, invalidateQuizStage } from "../../../../../../store/quizSlice";

import LockIcon from "@mui/icons-material/Lock";   // ← keep with other MUI imports

// StageManager.jsx  (top, with the other MUI icons)
import ListAltIcon      from "@mui/icons-material/ListAltOutlined";
import HistoryIcon      from "@mui/icons-material/HistoryEduOutlined";


import { Box } from "@mui/material";
// Child Components
import ReadingView from "./ReadingView";
import ActivityView from "./ActivityView";
import HistoryView from "./HistoryView";

import Loader from "./Loader";

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

function LockedStageInfo({ stage }) {
  const nice = stage ? stage[0].toUpperCase() + stage.slice(1) : "this stage";

  return (
    <Box
      sx={{
        mt: 6,
        mx: "auto",
        maxWidth: 420,
        textAlign: "center",
        p: 3,
        bgcolor: "#1e1e1e",
        border: "1px solid #444",
        borderRadius: 2,
        boxShadow: "0 0 6px rgba(0,0,0,.5)",
      }}
    >
      <LockIcon sx={{ fontSize: 48, color: "#FFD700", mb: 1 }} />

      <Box sx={{ fontSize: 22, fontWeight: 700, mb: 1 }}>
        {nice} is locked
      </Box>

      <Box sx={{ fontSize: 14, lineHeight: 1.6, color: "#ccc" }}>
        You’ll unlock <strong>{nice}</strong> after you finish the previous
        stage(s).<br />
        Follow the sequence → Read → Remember → Understand → Apply → Analyze —
        that’s how the mastery ladder works.
      </Box>
    </Box>
  );
}

/** Convert aggregator’s "status" => short label => "LOCKED","DONE","WIP","" */
/** Convert aggregator’s record into a short pill label.
 *  New rule ➜  UNLOCKED + ("not-started" 𝘰𝘳 "in-progress")  ⇒  "WIP"
 */
function getStatusShortLabel(item) {
  if (!item) return "";

  /* 1) Still locked on the server */
  if (item.locked) return "LOCKED";

  /* 2) Explicit server flags */
  const s = (item.status || "").toLowerCase();
  if (s === "done")         return "DONE";
  if (s === "in-progress")  return "Active";

  /* 3) NEW: unlocked but not-started → treat as Work-In-Progress */
  if (s === "not-started")  return "Active";

  return "";
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

/** 
 * StageManager
 * ------------
 * Renders a row of "reading" + quiz stages => each is color-coded:
 *   - LOCKED => red pill
 *   - DONE => green pill
 *   - WIP => yellow pill
 *   - Otherwise => dark pill
 * 
 * The currently active stage has a white border for emphasis.
 */
export default function StageManager({ examId, activity, userId }) {
  // ----------------- Basic Activity Data -----------------
  const subChapterId = activity?.subChapterId || "";
  const activityType = (activity?.type || "").toLowerCase(); // "read" or "quiz"
  const possibleQuizStage = (activity?.quizStage || "").toLowerCase();
  const completionStatus = (activity?.completionStatus || "").toLowerCase();

  /* ---------- context labels for breadcrumb pills ---------- */
const chapterLabel    = activity?.chapterName    || "Chapter";
const subChapterLabel = activity?.subChapterName || "Sub-chapter";
const groupingLabel   = activity?.grouping;

function renderContextPill(text, key) {
  return (
    <div
      key={key}
      style={styles.contextPill}
      title={text}          // ← idea D: shows full name on hover
    >
      {text}
    </div>
  );
}

  // The stage that the user arrived on from left panel
  const selectedStage =
    activityType === "quiz" ? possibleQuizStage || "remember" : "reading";

  // ----------------- Global Redux Data -----------------
  const planId = useSelector((state) => state.plan.planDoc?.id);
  const effectiveExamId = examId || "general";

  // ----------------- Tab & subView States -----------------
  // We'll keep `activeTab` but default to the stage from the left-panel activity
  const [activeTab, setActiveTab] = useState(selectedStage);
  const [subView, setSubView] = useState("activity");

  const renderToggleRow = () => (
  <div style={styles.subButtonRow}>
    <button
      style={subView === "activity" ? styles.subBtnActive : styles.subBtn}
      onClick={() => setSubView("activity")}
      title="Work on the current task"
    >
      <ListAltIcon sx={{ fontSize: 18, mr: .5 }} />
      Activity
    </button>

    <button
      style={subView === "history" ? styles.subBtnActive : styles.subBtn}
      onClick={() => setSubView("history")}
      title="See all previous attempts"
    >
      <HistoryIcon sx={{ fontSize: 18, mr: .5 }} />
      History
    </button>
  </div>
);

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

  // ----------------- aggregator data – from Redux -----------------
const dispatch = useDispatch();
const subchapterData = useSelector(
  (state) => state.aggregator.subchapterMap[subChapterId]
);
const taskInfo        = subchapterData?.taskInfo ?? [];
const taskInfoLoading = !subchapterData && !!subChapterId;
const taskInfoError = useSelector(
    (s) => s.aggregator.subchapterErrors[subChapterId] || null
  );

// lazy-load once per sub-chapter
useEffect(() => {
  if (subChapterId && !subchapterData) {
    dispatch(fetchAggregatorForSubchapter({ subChapterId }));
  }
}, [dispatch, subChapterId, subchapterData]);

  // ----------------- Quiz & Status Data (for the active quiz stage) -----------------
  const key = `${subChapterId}|${activeTab}`;
  const quizObj   = useSelector((s) => s.quiz.entities[key]);
  const loading   = useSelector((s) => s.quiz.loading[key]);
  const error     = quizObj?.error;
  const quizAttempts      = quizObj?.quizAttempts     ?? [];
  const revisionAttempts  = quizObj?.revisionAttempts ?? [];
  const subchapterConcepts= quizObj?.concepts         ?? [];
  const [mode, setMode] = useState("LOADING");
  const [lastQuizAttempt, setLastQuizAttempt] = useState(null);
  const [latestConceptStats, setLatestConceptStats] = useState(null);
  const [allAttemptsConceptStats, setAllAttemptsConceptStats] = useState([]);


    /* ------------------------------------------------------------
     Whenever quiz data arrives in the slice, recompute:
       • mode
      • lastQuizAttempt
       • latestConceptStats
       • allAttemptsConceptStats   (for HistoryView)
  ------------------------------------------------------------ */
  useEffect(() => {
    if (!QUIZ_STAGES.includes(activeTab)) return;

    /* 1) choose which arrays we’ll use */
    const quizArr = quizAttempts;
    const revArr  = revisionAttempts;
    const conceptArr = subchapterConcepts;

    /* 2) update derived state */
    computeMode(quizArr, revArr, conceptArr, activeTab);
    buildAllAttemptsConceptStats(quizArr, conceptArr);
  }, [quizAttempts, revisionAttempts, subchapterConcepts, activeTab]);
  

  // If activeTab is a quiz stage => fetch quiz data
  useEffect(() => {
    if (!subChapterId || !userId) return;

    if (QUIZ_STAGES.includes(activeTab)) {
          dispatch(
              fetchQuizStage({ userId, planId, subChapterId, stage: activeTab })
            );
    } else {
      // Not a quiz => clear data
      setMode("LOADING");
      setLastQuizAttempt(null);
      setLatestConceptStats(null);
    }
  }, [activeTab, subChapterId, userId]);

  async function fetchQuizData(currentStage) {
    try {
      setLoading(true);
      setError("");
      // 1) getQuiz
      const quizRes = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/getQuiz`, {
        params: {
          userId,
          planId,
          subchapterId: subChapterId,
          quizType: currentStage,
        },
      });
      const quizArr = quizRes?.data?.attempts || [];

      // 2) getRevisions
      const revRes = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/getRevisions`, {
        params: {
          userId,
          planId,
          subchapterId: subChapterId,
          revisionType: currentStage,
        },
      });
      const revArr = revRes?.data?.revisions || [];

      // 3) getSubchapterConcepts
      const conceptRes = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/getSubchapterConcepts`, {
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
          dispatch(invalidateQuizStage(key));                // clear cache
          dispatch(fetchQuizStage({ userId, planId,          // refetch fresh data
                                   subChapterId, stage: activeTab }));
        }
  }
  function handleQuizFail() {
      if (QUIZ_STAGES.includes(activeTab)) {
          dispatch(invalidateQuizStage(key));
          dispatch(fetchQuizStage({ userId, planId, subChapterId, stage: activeTab }));
        }
  }
  function handleRevisionDone() {
      if (QUIZ_STAGES.includes(activeTab)) {
          dispatch(invalidateQuizStage(key));
          dispatch(fetchQuizStage({ userId, planId, subChapterId, stage: activeTab }));
        }
  }

  // ========== If activity is deferred/complete => short-circuit ==========
  

  // --------------- Normal UI ---------------
  if (taskInfoLoading) {
        return (
          <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
            <Loader type="bar" accent="#FFD700" determinate={false} />
          </Box>
        );
      }
  if (taskInfoError) {
    return <div style={{ color: "red" }}>{taskInfoError}</div>;
  }
  if (!subChapterId || !userId) {
    return <div style={{ color: "#fff" }}>No valid subChapterId/userId provided.</div>;
  }

  return (
    <div style={styles.container}>
  {/* 0) Breadcrumb / context row ─────────────── */}
 <div style={styles.contextRow}
     title={`${groupingLabel} • ${chapterLabel} • ${subChapterLabel}`}>
  {groupingLabel && (
    <>
      <div style={styles.crumbBox}>{groupingLabel}</div>
      <span style={styles.chevron}>▸</span>
    </>
  )}
  <div style={styles.crumbBox}>{chapterLabel}</div>
  <span style={styles.chevron}>▸</span>
  <div style={styles.crumbBox}>{subChapterLabel}</div>
</div>

  {/* 1) Stage-pill row ───────────────────────── */}
  <div style={styles.stageRow}>
    {renderStagePill("reading")}
    {QUIZ_STAGES.map((st) => renderStagePill(st))}
  </div>

      {/* 2) The main content => locked if aggregator says locked or if not the user's chosen stage */}
      <div style={styles.mainContent}>
        {isTabAllowedAndUnlocked(activeTab) ? (
          renderTabContent(activeTab)
        ) : (
          <LockedStageInfo stage={activeTab} />
        )}
      </div>
    </div>
  );

  /** Renders the pill for a given stageKey => "reading"/"remember"/"understand"/"apply"/"analyze" */
  function renderStagePill(stageKey) {
    // aggregator => find item => locked/done/in-progress
    const labelForTaskInfo =
      stageKey === "reading" ? "Reading" : capitalize(stageKey);
    const item = taskInfo.find(
      (t) => (t.stageLabel || "").toLowerCase() === labelForTaskInfo.toLowerCase()
    );
    const locked = item?.locked || false;
    const shortLabel = getStatusShortLabel(item); // "LOCKED","DONE","WIP",""
    const tooltipStr = getStatusTooltip(item);

    // numeric stage => reading=1, remember=2...
    const stageNum = getStageNumber(stageKey);
    // is this the current user-chosen stage from left panel?
    const isSelectedStage = stageKey === selectedStage;
    // is this the active tab (the one we're currently viewing in the UI)
    const isCurrentTab = stageKey === activeTab;

    // The pill can only be "clicked" if it's the selectedStage from the left panel
    // AND aggregator says not locked
    const canClick = isSelectedStage && !locked;

    // Build the dynamic style => color-coded by shortLabel, highlight if current tab
    const pillStyle = getDynamicPillStyle(shortLabel, isCurrentTab, canClick);

    // Show a small "status label" in the pill if shortLabel is non-empty
    // (E.g. WIP, DONE, LOCKED)
    let statusEl = null;
    if (shortLabel) {
      statusEl = <div style={styles.statusBox}>{shortLabel}</div>;
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
        {statusEl}
      </div>
    );
  }

  /** We only show the tab content if aggregator says it's not locked
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
                return (
                  <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
                    <Loader type="spinner" accent="#FFD700" />
                  </Box>
                );
              }
      if (error) {
        return <div style={{ color: "red" }}>{error}</div>;
      }
      return (
        <div style={styles.quizContainer}>


        {renderToggleRow()}  



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
              activityId={activity.activityId}
              subChapterId={subChapterId}
              planId={planId}
              userId={userId}
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

/** parse string => numeric ratio */
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

/** buildConceptStats => merges quizSubmission with conceptArr => pass/fail per concept */
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

/** 
 * Returns the dynamic style object for a stage pill, 
 * color-coding based on aggregator short label:
 *   - LOCKED => redish
 *   - DONE => greenish
 *   - WIP => yellowish
 *   - default => dark pill
 * 
 * Additionally, if it's the current tab => add a white border 
 * so the user knows it's active.
 */
function getDynamicPillStyle(shortLabel, isCurrentTab, canClick) {
  // start with base
  let pillStyle = { ...styles.stagePill };

  // color-coded backgrounds
  switch (shortLabel) {
    case "LOCKED":
      pillStyle.backgroundColor = "#c62828"; // deep red
      pillStyle.color = "#fff";
      break;
    case "DONE":
      pillStyle.backgroundColor = "#2e7d32"; // green
      pillStyle.color = "#fff";
      break;
    case "Active":
      pillStyle.backgroundColor = "#f9a825"; // yellow
      pillStyle.color = "#000";
      break;
    default:
      // "not-started" => just dark
      pillStyle.backgroundColor = "#222";
      pillStyle.color = "#ccc";
      break;
  }

  // If aggregator says locked or user can't click => partial fade
  if (!canClick) {
    pillStyle.opacity = 0.5;
    pillStyle.cursor = "default";
  }

  // If it's the current tab => highlight with white border
  if (isCurrentTab) {
    pillStyle.border = "2px solid #fff";
    pillStyle.margin = "-2px";
  }

  return pillStyle;
}

/** Basic styles for the layout */
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
  stageRow: {
    display: "flex",
    flexDirection: "row",
    gap: "8px",
   backgroundColor: "transparent", // no strip
  padding: "4px 8px 8px",         // align nicely under breadcrumb"#111",
    padding: "8px",
    alignItems: "center",
      width: "100%",              // keep it full-width
  justifyContent: "center",// explicit left alignment
  },
  stagePill: {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    borderRadius: "16px",
    // We'll override backgroundColor in getDynamicPillStyle
    // We'll also override border if isCurrentTab
    color: "#ccc",
    cursor: "pointer",
    userSelect: "none",
    border: "1px solid #333",
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
  },
  stageLabel: {
    fontSize: "0.85rem",
  },
  statusBox: {
    backgroundColor: "rgba(255,255,255,0.15)",
    color: "#fff",
    fontSize: "0.65rem",
    borderRadius: "4px",
    padding: "2px 4px",
  },

  mainContent: {
    flex: 1,
    overflowY: "auto",
    padding: "8px",
    overflowX: "hidden", 
    boxSizing: "border-box",
  },
  contextPill: {
   backgroundColor: "#424242",
   color: "#fff",
   fontSize: "0.75rem",
   padding: "4px 10px",
   borderRadius: 12,
   maxWidth: 160,
   whiteSpace: "nowrap",
   overflow: "hidden",
   textOverflow: "ellipsis",
 },
  quizContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  /* Toggle row */
 
  
  messageBox: {
    padding: "24px",
    fontSize: "1.1rem",
    color: "#fff",
    backgroundColor: "#111",
    textAlign: "center",
  },
    /* ── NEW breadcrumb row ──────────────────── */
  contextRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
       backgroundColor: "transparent",
  padding: "6px 8px 2px",
  justifyContent: "center",   // NEW – center horizontally
  width: "100%",              // ensure the flex-box spans full row
  },
   crumbBox: {
   backgroundColor: "#2d2d2d",
   color: "#fff",
   fontSize: "0.78rem",
   padding: "4px 12px",
   borderRadius: 6,
   whiteSpace: "nowrap",   // keep each crumb on one line
   lineHeight: 1.1,
   flexShrink: 0,
 },
  chevron: {
    color: "#777",
    fontSize: "0.8rem",
  },
  
  /* ONE clean definition is enough */
  subButtonRow: {
    display:        "flex",
    justifyContent: "center",
    gap:            "16px",
    margin:         "12px 0 20px"
  },

  subBtn: {
    display:        "inline-flex",
    alignItems:     "center",
    gap:            "4px",
    background:     "#424242",
    color:          "#e0e0e0",
    border:         "1px solid #616161",
    borderRadius:   "20px",
    padding:        "6px 16px",
    fontSize:       "0.85rem",
    cursor:         "pointer",
    transition:     "background 180ms"
  },

  subBtnActive: {
    /* copy-&-override manually (cannot spread while defining) */
    display:        "inline-flex",
    alignItems:     "center",
    gap:            "4px",
    background:     "#9c27b0",
    color:          "#fff",
    border:         "1px solid #ab47bc",
    borderRadius:   "20px",
    padding:        "6px 16px",
    fontSize:       "0.85rem",
    cursor:         "pointer",
    transition:     "background 180ms"
  },

};