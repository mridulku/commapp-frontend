// File: StageManager.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";

// Child Components
import ReadingView from "./ReadingView";
import ActivityView from "./ActivityView";
import HistoryView from "./HistoryView";

/**
 * We treat these four as the recognized Bloom’s quiz stages.
 */
const QUIZ_STAGES = ["remember", "understand", "apply", "analyze"];

/**
 * StageManager
 * ------------
 * - Renders a top bar of tabs: Reading | Remember | Understand | Apply | Analyze
 * - If "Reading" => render <ReadingView activity={...} />
 * - If one of the quiz stages => fetch attempts & render sub-buttons "Activity" | "History"
 * - Then load <ActivityView> or <HistoryView> for that stage.
 *
 * Props:
 *  - examId
 *  - activity (object with .type, .quizStage, .subChapterId, etc.)
 *  - userId
 *  - Optional: any extra fields you want to pass along
 */
export default function StageManager({ examId, activity, userId }) {
  // Extract relevant data from `activity`
  const subChapterId = activity?.subChapterId || "";
  const activityType = (activity?.type || "").toLowerCase();
  const possibleQuizStage = (activity?.quizStage || "").toLowerCase();

  // We'll also get `planId` from Redux if needed
  const planId = useSelector((state) => state.plan.planDoc?.id);

  // ========================= State for Tabs & SubView =========================
  // If activity.type = "read", default tab => "reading".
  // If we have a recognized quizStage => default to that. Else fallback "reading".
  let defaultTab = "reading";
  if (QUIZ_STAGES.includes(possibleQuizStage)) {
    defaultTab = possibleQuizStage;  // e.g. "remember"
  } else if (activityType === "quiz" && !QUIZ_STAGES.includes(possibleQuizStage)) {
    // Unknown quiz stage => fallback to remember or reading
    defaultTab = "remember"; 
  }
  const [activeTab, setActiveTab] = useState(defaultTab);

  // If user is in a quiz stage, subView => "activity" or "history"
  // By default we go to "activity"
  const [subView, setSubView] = useState("activity");

  // ========================= Loading / Error states =========================
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ========================= Data: Quiz/Revision/Concepts =========================
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [revisionAttempts, setRevisionAttempts] = useState([]);
  const [subchapterConcepts, setSubchapterConcepts] = useState([]);

  // ========================= pass/fail Mode / Stats =========================
  // "NO_QUIZ_YET", "QUIZ_COMPLETED", "NEED_REVISION", "CAN_TAKE_NEXT_QUIZ", "LOADING"
  const [mode, setMode] = useState("LOADING");
  const [lastQuizAttempt, setLastQuizAttempt] = useState(null);
  const [latestConceptStats, setLatestConceptStats] = useState(null);
  const [allAttemptsConceptStats, setAllAttemptsConceptStats] = useState([]);

  // Pass thresholds for each stage (adjust as you like)
  const stagePassRatios = {
    remember: 0.6,
    understand: 0.6,
    apply: 0.6,
    analyze: 0.6,
  };
  const effectiveExamId = examId || "general";

  // ========================= useEffect => fetch if quiz stage =========================
  useEffect(() => {
    // If no subChapterId/userId => skip
    if (!subChapterId || !userId) {
      console.log("StageManager: missing subChapterId/userId => skip fetch");
      return;
    }

    // If the activeTab is not a recognized quiz stage => skip quiz fetch
    if (!QUIZ_STAGES.includes(activeTab)) {
      // We can reset our quiz data states to avoid confusion
      setMode("LOADING");
      setQuizAttempts([]);
      setRevisionAttempts([]);
      setSubchapterConcepts([]);
      setAllAttemptsConceptStats([]);
      setLastQuizAttempt(null);
      setLatestConceptStats(null);
      return;
    }

    // Otherwise, we fetch quiz attempts, revision attempts, concepts, etc.
    fetchQuizData(activeTab);
    // eslint-disable-next-line
  }, [activeTab, subChapterId, userId]);

  /**
   * fetchQuizData
   * -------------
   * Load quiz attempts, revision attempts, subchapter concepts
   */
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

      // Build concept stats => for all attempts
      buildAllAttemptsConceptStats(quizArr, conceptArr);
    } catch (err) {
      console.error("StageManager => fetchQuizData error:", err);
      setError(err.message || "Error fetching quiz data");
    } finally {
      setLoading(false);
    }
  }

  /**
   * computeMode
   * -----------
   * From the latest quiz attempt => figure out if user passed or needs revision, etc.
   */
  function computeMode(quizArr, revArr, conceptArr, quizStage) {
    if (!quizArr.length) {
      setMode("NO_QUIZ_YET");
      setLastQuizAttempt(null);
      setLatestConceptStats(null);
      return;
    }
    // newest attempt => first item
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

    // If we have quizSubmission => build concept stats for that attempt
    if (latestQuiz?.quizSubmission && conceptArr.length > 0) {
      const stats = buildConceptStats(latestQuiz.quizSubmission, conceptArr);
      setLatestConceptStats(stats);
    } else {
      setLatestConceptStats(null);
    }
  }

  /**
   * buildAllAttemptsConceptStats
   * -----------
   * For the "History" view, we want concept stats for every attempt
   */
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

  // ========================= Child event handlers => re-fetch =========================
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

  // ========================= Render Logic =========================
  // 1) If subChapterId or userId missing => bail
  if (!subChapterId || !userId) {
    return <div style={{ color: "#fff" }}>No valid subChapterId/userId.</div>;
  }
  // 2) If loading...
  if (loading) {
    return <div style={{ color: "#fff" }}>Loading attempts...</div>;
  }
  // 3) If error
  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
  }

  return (
    <div style={styles.container}>

      {/* Top row => 5 tabs: Reading, Remember, Understand, Apply, Analyze */}
      <div style={styles.tabRow}>
        {/* Reading */}
        <button
          style={activeTab === "reading" ? styles.tabButtonActive : styles.tabButton}
          onClick={() => {
            setActiveTab("reading");
            setSubView("activity"); // reset subView if we switch away from quiz
          }}
        >
          Reading
        </button>
        
        {/* Bloom’s Quiz Stages */}
        {QUIZ_STAGES.map((st) => {
          const isActive = activeTab === st;
          return (
            <button
              key={st}
              style={isActive ? styles.tabButtonActive : styles.tabButton}
              onClick={() => {
                setActiveTab(st);
                setSubView("activity"); // Usually default to showing "Activity"
              }}
            >
              {capitalize(st)}
            </button>
          );
        })}
      </div>

      {/* Main content area */}
      <div style={styles.mainContent}>
        {/* If "reading" => show <ReadingView> with the current activity data */}
        {activeTab === "reading" && (
          <ReadingView activity={activity} />
        )}

        {/* If one of the QUIZ_STAGES => show sub-row for "Activity" / "History" */}
        {QUIZ_STAGES.includes(activeTab) && (
          <div style={styles.quizContainer}>
            {/* Sub-buttons for Activity / History */}
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
                quizStage={activeTab}
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
                quizStage={activeTab}
                quizAttempts={quizAttempts}
                revisionAttempts={revisionAttempts}
                lastQuizAttempt={lastQuizAttempt}
                latestConceptStats={latestConceptStats}
                allAttemptsConceptStats={allAttemptsConceptStats}
                passRatio={stagePassRatios[activeTab] || 0.6}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============== Utilities ============== */

/**
 * parseScoreForRatio
 *  - Takes a string like "80%", or "4/5", returns a number in [0..1]
 */
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

/**
 * buildConceptStats
 *  - from quizSubmission[] and subchapterConcepts[] => produce an array of
 *    { conceptName, correct, total, ratio, passOrFail }
 */
function buildConceptStats(quizSubmission, conceptArr) {
  const countMap = {};

  quizSubmission.forEach((q) => {
    const cName = q.conceptName || "UnknownConcept";
    if (!countMap[cName]) {
      countMap[cName] = { correct: 0, total: 0 };
    }
    countMap[cName].total++;
    // We assume q.score >= 1.0 => correct
    if (q.score && parseFloat(q.score) >= 1) {
      countMap[cName].correct++;
    }
  });

  // Convert conceptArr to a set of concept names
  const conceptNamesSet = new Set(conceptArr.map((c) => c.name));
  // If we had "UnknownConcept", ensure it’s included
  if (countMap["UnknownConcept"]) {
    conceptNamesSet.add("UnknownConcept");
  }

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

  // Sort alphabetically by conceptName
  statsArray.sort((a, b) => a.conceptName.localeCompare(b.conceptName));
  return statsArray;
}

/**
 * capitalize
 *  - e.g. "remember" => "Remember"
 */
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ============== Styles ============== */
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
    border: "1px solid #444",
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