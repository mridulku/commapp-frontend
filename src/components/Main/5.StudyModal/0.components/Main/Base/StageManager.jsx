// File: StageManager.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";

// Children
import ActivityView from "./ActivityView";
import HistoryView from "./HistoryView";
import ReadingView from "./ReadingView";

// We’ll treat these as the four Bloom’s quiz stages:
const QUIZ_STAGES = ["remember", "understand", "apply", "analyze"];

export default function StageManager({ examId, activity, userId }) {
  const subChapterId = activity?.subChapterId || "";
  const planId = useSelector((state) => state.plan.planDoc?.id);

  // For top-level tabs => "reading", "remember", "understand", "apply", "analyze"
  const [activeTab, setActiveTab] = useState("reading");

  // For the sub-view when in a quiz stage => "activity" or "history"
  const [subView, setSubView] = useState("activity");

  // Data relevant to the quiz stage
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [revisionAttempts, setRevisionAttempts] = useState([]);
  const [subchapterConcepts, setSubchapterConcepts] = useState([]);

  // pass/fail mode => "NO_QUIZ_YET", "QUIZ_COMPLETED", etc.
  const [mode, setMode] = useState("LOADING");
  const [lastQuizAttempt, setLastQuizAttempt] = useState(null);
  const [latestConceptStats, setLatestConceptStats] = useState(null);
  const [allAttemptsConceptStats, setAllAttemptsConceptStats] = useState([]);

  // We'll define pass thresholds for each stage
  const stagePassRatios = {
    remember: 0.6,
    understand: 0.6,
    apply: 0.6,
    analyze: 0.6,
  };
  const effectiveExamId = examId || "general";

  // ---------------- useEffect => fetch data if we’re on a quiz stage ----------------
  useEffect(() => {
    if (!subChapterId || !userId) {
      console.log("StageManager: missing subChapterId/userId => skip fetch");
      return;
    }
    // If the activeTab is "reading", no quiz data needed => skip
    if (!QUIZ_STAGES.includes(activeTab)) {
      // Reset data? Or keep old data? Let's just reset for clarity
      setMode("LOADING");
      setQuizAttempts([]);
      setRevisionAttempts([]);
      setSubchapterConcepts([]);
      setAllAttemptsConceptStats([]);
      setLastQuizAttempt(null);
      setLatestConceptStats(null);
      return;
    }

    // If the activeTab is one of the quiz stages => fetch
    fetchData(activeTab);
    // eslint-disable-next-line
  }, [activeTab, subChapterId, userId]);

  async function fetchData(quizStage) {
    try {
      setLoading(true);
      setError("");

      // getQuiz
      const quizRes = await axios.get("http://localhost:3001/api/getQuiz", {
        params: { userId, planId, subchapterId: subChapterId, quizType: quizStage },
      });
      const quizArr = quizRes?.data?.attempts || [];

      // getRevisions
      const revRes = await axios.get("http://localhost:3001/api/getRevisions", {
        params: { userId, planId, subchapterId: subChapterId, revisionType: quizStage },
      });
      const revArr = revRes?.data?.revisions || [];

      // getSubchapterConcepts
      const conceptRes = await axios.get("http://localhost:3001/api/getSubchapterConcepts", {
        params: { subchapterId: subChapterId },
      });
      const conceptArr = conceptRes?.data?.concepts || [];

      setQuizAttempts(quizArr);
      setRevisionAttempts(revArr);
      setSubchapterConcepts(conceptArr);

      // Evaluate pass/fail => set 'mode'
      computeMode(quizArr, revArr, conceptArr, quizStage);

      // Build concept stats => for all attempts
      buildAllAttemptsConceptStats(quizArr, conceptArr);
    } catch (err) {
      console.error("StageManager => fetchData error:", err);
      setError(err.message || "Error fetching data");
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

    // If latest quiz had submissions => build concept stats
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

  // Child event handlers => re-fetch for whichever stage is active
  function handleQuizComplete() {
    if (QUIZ_STAGES.includes(activeTab)) {
      fetchData(activeTab);
    }
  }
  function handleQuizFail() {
    if (QUIZ_STAGES.includes(activeTab)) {
      fetchData(activeTab);
    }
  }
  function handleRevisionDone() {
    if (QUIZ_STAGES.includes(activeTab)) {
      fetchData(activeTab);
    }
  }

  // Render
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

      {/* Top bar with logo + big row of tabs */}
      <div style={styles.topBar}>
        
        <div style={styles.tabRow}>
          {/* Reading tab */}
          <button
            style={activeTab === "reading" ? styles.tabButtonActive : styles.tabButton}
            onClick={() => {
              setActiveTab("reading");
              setSubView("activity"); // reset subView
            }}
          >
            Reading
          </button>

          {/* Bloom’s stages: remember, understand, apply, analyze */}
          {QUIZ_STAGES.map((st) => {
            const isActive = activeTab === st;
            return (
              <button
                key={st}
                style={isActive ? styles.tabButtonActive : styles.tabButton}
                onClick={() => {
                  setActiveTab(st);
                  // keep subView the same, or default to activity
                  setSubView("activity");
                }}
              >
                {capitalize(st)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div style={styles.mainContent}>
        {/* If we are on "reading," show the ReadingView. */}
        {activeTab === "reading" && (
          <ReadingView activity={activity} />
        )}

        {/* Otherwise, we are on one of the quiz stages => show subView toggles + either ActivityView or HistoryView */}
        {QUIZ_STAGES.includes(activeTab) && (
          <div style={styles.quizStageContainer}>
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

            {/* Depending on subView => show ActivityView or HistoryView */}
            {subView === "activity" && (
              <ActivityView
                mode={mode}
                quizStage={activeTab} // <-- pass the chosen Bloom’s stage
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

/* ============= Utilities ============= */
function parseScoreForRatio(scoreString) {
  if (!scoreString) return NaN;
  const trimmed = scoreString.trim();
  // If ends with '%'
  if (trimmed.endsWith("%")) {
    const numPart = trimmed.slice(0, -1);
    const parsed = parseFloat(numPart);
    return isNaN(parsed) ? NaN : parsed / 100;
  }
  // If X/Y
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

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ============= Styles ============= */
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

  topBar: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#111",
    padding: "8px",
    gap: "16px",
  },
  logo: {
    width: "120px",
    height: "40px",
    objectFit: "cover",
  },
  tabRow: {
    display: "flex",
    flexDirection: "row",
    gap: "8px",
  },
  tabButton: {
    backgroundColor: "#222",
    color: "#ccc",
    border: "none",
    borderRadius: "4px",
    padding: "6px 12px",
    cursor: "pointer",
    fontWeight: 500,
  },
  tabButtonActive: {
    backgroundColor: "#444",
    color: "#fff",
    border: "1px solid #444",
    borderRadius: "4px",
    padding: "6px 12px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  mainContent: {
    flex: 1,
    overflowY: "auto",
    padding: "8px",
  },
  quizStageContainer: {
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