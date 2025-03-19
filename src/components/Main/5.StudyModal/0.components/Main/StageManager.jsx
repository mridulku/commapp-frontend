import React, { useEffect, useState } from "react";
import axios from "axios";
import QuizComponent from "./QuizComponent";
import ReviseComponent from "./ReviseComponent";

/**
 * StageManager
 *  - Fetches quiz attempts + revisions + subchapter concepts
 *  - Decides pass/fail for the "latest" quiz attempt (the old logic)
 *  - Shows timeline + ability to attempt quiz / do revisions
 *  - NEW: Renders a concept-level breakdown for *each* quiz attempt in descending order
 */
export default function StageManager({ examId, activity, quizStage, userId }) {
  const subChapterId = activity?.subChapterId || "";

  // Pass/fail thresholds by stage
  const stagePassRatios = {
    remember: 1,
    understand: 1,
    apply: 1,
    analyze: 1,
  };
  const effectiveExamId = examId || "general";

  // Existing state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [revisionAttempts, setRevisionAttempts] = useState([]);
  const [mode, setMode] = useState("LOADING");
  const [lastQuizAttempt, setLastQuizAttempt] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);

  // We'll fetch all subchapter concepts
  const [subchapterConcepts, setSubchapterConcepts] = useState([]);

  // For the "latest" quiz attempt concept breakdown (we used to show just one)
  const [latestConceptStats, setLatestConceptStats] = useState(null);

  // NEW: store concept breakdown for *all* attempts in descending order
  const [allAttemptsConceptStats, setAllAttemptsConceptStats] = useState([]);

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

      // 1) Quiz attempts (descending attemptNumber from Firestore)
      const quizRes = await axios.get("http://localhost:3001/api/getQuiz", {
        params: { userId, subchapterId: subChapterId, quizType: quizStage },
      });
      const quizArr = quizRes.data.attempts || [];

      // 2) Revision attempts
      const revRes = await axios.get("http://localhost:3001/api/getRevisions", {
        params: { userId, subchapterId: subChapterId, revisionType: quizStage },
      });
      const revArr = revRes.data.revisions || [];

      // 3) Subchapter concepts
      const conceptRes = await axios.get("http://localhost:3001/api/getSubchapterConcepts", {
        params: { subchapterId: subChapterId },
      });
      const conceptArr = conceptRes.data.concepts || [];

      // Save them in state
      setQuizAttempts(quizArr);
      setRevisionAttempts(revArr);
      setSubchapterConcepts(conceptArr);

      // Evaluate pass/fail mode for the LATEST attempt
      computeState(quizArr, revArr, conceptArr);

      // Build concept breakdown for all attempts (descending order)
      buildAllAttemptsConceptStats(quizArr, conceptArr);
    } catch (err) {
      console.error("StageManager: error fetching attempts or concepts:", err);
      setError(err.message || "Error fetching data");
    } finally {
      setLoading(false);
    }
  }

  /**
   * buildAllAttemptsConceptStats:
   *   For each quiz attempt, compute concept stats. Then store in allAttemptsConceptStats.
   *   We'll keep them in *descending* attemptNumber order to match the quizArr ordering from Firestore.
   */
  function buildAllAttemptsConceptStats(quizArr, conceptArr) {
    if (!quizArr.length || !conceptArr.length) {
      setAllAttemptsConceptStats([]);
      return;
    }

    // quizArr is presumably in descending order from Firestore
    // For each attempt, build concept stats. We'll store them in an array of objects:
    // [ { attemptNumber, score: "...", conceptStats: [{conceptName, correct, total, ratio, passOrFail}, ...] }, ... ]
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

  /**
   * parseScoreForRatio: convert "72.00%", "3/5" to 0..1 ratio (or NaN if unrecognized).
   */
  function parseScoreForRatio(scoreString) {
    if (!scoreString) return NaN;
    const trimmed = scoreString.trim();

    // 1) Percentage-based
    if (trimmed.endsWith("%")) {
      const numPart = trimmed.slice(0, -1);
      const parsed = parseFloat(numPart);
      return isNaN(parsed) ? NaN : parsed / 100;
    }

    // 2) "X/Y" format
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
   * computeState: decides pass/fail based on the newest quiz attempt. Also sets the
   * latest concept stats so we can show them if desired.
   */
  function computeState(quizArr, revArr, conceptArr) {
    if (!quizArr.length) {
      setMode("NO_QUIZ_YET");
      setLastQuizAttempt(null);
      setLatestConceptStats(null);
      return;
    }

    // newest attempt is the first doc (desc order from Firestore)
    const [latestQuiz] = quizArr;
    setLastQuizAttempt(latestQuiz);

    // Overall pass/fail logic (unchanged)
    const passRatio = stagePassRatios[quizStage] || 0.6;
    const ratio = parseScoreForRatio(latestQuiz.score);
    if (isNaN(ratio)) {
      setMode("NEED_REVISION");
      return;
    }
    const passed = ratio >= passRatio;
    if (passed) {
      setMode("QUIZ_COMPLETED");
    } else {
      // Not passed => see if there's a matching revision
      const attemptNum = latestQuiz.attemptNumber;
      const matchingRev = revArr.find((r) => r.revisionNumber === attemptNum);
      if (!matchingRev) {
        setMode("NEED_REVISION");
      } else {
        setMode("CAN_TAKE_NEXT_QUIZ");
      }
    }

    // Build concept stats for the LATEST quiz only (for the old single table we had).
    if (latestQuiz?.quizSubmission && conceptArr.length > 0) {
      const stats = buildConceptStats(latestQuiz.quizSubmission, conceptArr);
      setLatestConceptStats(stats);
    } else {
      setLatestConceptStats(null);
    }
  }

  function getCellStyle(passOrFail) {
    if (passOrFail === "PASS") return styles.passCell;
    if (passOrFail === "FAIL") return styles.failCell;
    return styles.notTestedCell; // default or a new style
  }

  function getResultCellStyle(passOrFail) {
    if (passOrFail === "PASS") {
      return styles.passCell;
    }
    if (passOrFail === "NOT_TESTED") {
      return styles.notTestedCell; 
    }
    // Otherwise, "FAIL"
    return styles.failCell;
  }

  /**
   * buildConceptStats: given a single quizSubmission[] and the list of subchapterConcepts,
   *   returns an array of objects [ { conceptName, correct, total, ratio, passOrFail }, ... ]
   *   We'll define pass as ratio === 1.0 (i.e. 100%).
   */
  function buildConceptStats(quizSubmission, conceptArr) {
    // Count correct vs. total for each conceptName
    const countMap = {};
    quizSubmission.forEach((q) => {
      const cName = q.conceptName || "UnknownConcept";
      if (!countMap[cName]) {
        countMap[cName] = { correct: 0, total: 0 };
      }
      countMap[cName].total++;
      // We'll treat 'correct' if q.score >= 1
      if (q.score && parseFloat(q.score) >= 1) {
        countMap[cName].correct++;
      }
    });

    // Build an array for each known concept in conceptArr,
    // plus any "UnknownConcept" if it appeared in the quiz.
    // If you want to only show concepts that appear, you can adapt this logic,
    // but for now we show everything in conceptArr + anything else from the quiz.
    const conceptNamesSet = new Set(conceptArr.map((c) => c.name));
    if (countMap["UnknownConcept"]) {
      conceptNamesSet.add("UnknownConcept");
    }

    const statsArray = [];
    conceptNamesSet.forEach((cName) => {
      const rec = countMap[cName] || { correct: 0, total: 0 };
      const ratio = rec.total > 0 ? rec.correct / rec.total : 0;
      let passOrFail;

      if (rec.total === 0) {
        passOrFail = "NOT_TESTED";  // or "NA"
      } else if (ratio === 1.0) {
        passOrFail = "PASS";
      } else {
        passOrFail = "FAIL";
      }
        statsArray.push({
        conceptName: cName,
        correct: rec.correct,
        total: rec.total,
        ratio,
        passOrFail,
      });
    });

    // You might want to sort this array by conceptName, or keep the order from the DB.
    // We'll just sort by conceptName for neatness:
    statsArray.sort((a, b) => a.conceptName.localeCompare(b.conceptName));

    return statsArray;
  }

  // Handlers
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

  // Render
  if (!subChapterId || !userId) {
    return <div style={{ color: "#fff" }}>No valid subChapterId/userId.</div>;
  }
  if (loading) {
    return <div style={{ color: "#fff" }}>Loading attempts...</div>;
  }
  if (error) {
    return <div style={{ color: "red" }}>Error: {error}</div>;
  }

  // summary label for the newest attempt
  let summaryLabel = "No Attempts Yet";
  if (quizAttempts.length > 0) {
    const [latest] = quizAttempts;
    summaryLabel = `Last Attempt => Q${latest.attemptNumber} (${latest.score})`;
  }

  return (
    <div style={{ color: "#fff", padding: "1rem" }}>
      {/* Header row */}
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

      {/* Timeline of quiz + revision attempts */}
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
        {/* 1) If no quiz yet => show first quiz attempt */}
        {mode === "NO_QUIZ_YET" && (
          <QuizComponent
            userId={userId}
            quizStage={quizStage}
            examId={effectiveExamId}
            subChapterId={subChapterId}
            attemptNumber={1}
            onQuizComplete={handleQuizComplete}
            onQuizFail={handleQuizFail}
          />
        )}

        {/* 2) Quiz completed => show success */}
        {mode === "QUIZ_COMPLETED" && (
          <div style={{ color: "lightgreen", marginBottom: "1rem" }}>
            <p>Congratulations! You passed the <b>{quizStage}</b> stage.</p>
          </div>
        )}

        {/* 3) If we need revision, show the revision component */}
        {mode === "NEED_REVISION" && lastQuizAttempt && (
          <ReviseComponent
            userId={userId}
            quizStage={quizStage}
            examId={effectiveExamId}
            subChapterId={subChapterId}
            revisionNumber={lastQuizAttempt.attemptNumber}
            onRevisionDone={handleRevisionDone}
          />
        )}

        {/* 4) If there's a matching revision done, let user retake quiz */}
        {mode === "CAN_TAKE_NEXT_QUIZ" && lastQuizAttempt && (
          <QuizComponent
            userId={userId}
            quizStage={quizStage}
            examId={effectiveExamId}
            subChapterId={subChapterId}
            attemptNumber={lastQuizAttempt.attemptNumber + 1}
            onQuizComplete={handleQuizComplete}
            onQuizFail={handleQuizFail}
          />
        )}

        {/* Single-table breakdown for the *latest attempt* (unchanged from before) */}
        {lastQuizAttempt && latestConceptStats && latestConceptStats.length > 0 && (
          <div style={{ marginTop: "1rem" }}>
            <h3>Concept Performance (Latest Attempt)</h3>
            <table style={{ borderCollapse: "collapse" }}>
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
                {latestConceptStats.map((cs, idx) => {
                  const ratioPct = (cs.ratio * 100).toFixed(1);
                  // Mark pass if ratio === 1.0
                  const isPass = cs.passOrFail === "PASS";
                  return (
                    <tr key={idx}>
                      <td style={styles.tableCell}>{cs.conceptName}</td>
                      <td style={styles.tableCell}>{cs.correct}</td>
                      <td style={styles.tableCell}>{cs.total}</td>
                      <td style={styles.tableCell}>{ratioPct}%</td>
                      <td style={getCellStyle(cs.passOrFail)}>
                      {cs.passOrFail}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* NEW: Attempt-by-Attempt concept breakdown in descending order */}
        {allAttemptsConceptStats && allAttemptsConceptStats.length > 0 && (
          <div style={{ marginTop: "2rem" }}>
            <h2>Attempt-by-Attempt Concept Breakdown (Descending)</h2>
            {allAttemptsConceptStats.map((attemptObj, i) => {
              const { attemptNumber, score, conceptStats } = attemptObj;
              return (
                <div key={i} style={{ marginBottom: "1.5rem" }}>
                  <h3 style={{ marginBottom: "0.5rem" }}>
                    Attempt # {attemptNumber} &mdash; Score: {score}
                  </h3>
                  <table style={{ borderCollapse: "collapse" }}>
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
                      {conceptStats.map((cs, idx) => {
                        const ratioPct = (cs.ratio * 100).toFixed(1);
                        const isPass = cs.passOrFail === "PASS";
                        return (
                          <tr key={idx}>
                            <td style={styles.tableCell}>{cs.conceptName}</td>
                            <td style={styles.tableCell}>{cs.correct}</td>
                            <td style={styles.tableCell}>{cs.total}</td>
                            <td style={styles.tableCell}>{ratioPct}%</td>
                            <td style={getResultCellStyle(cs.passOrFail)}>
                            {cs.passOrFail}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ------------------------ Timeline code ------------------------ //
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

  // We want to show timeline in ascending order (attempt #1, #2, etc.)
  // quizArr is in descending order from Firestore, so let's reverse it for timeline
  const quizAsc = [...quizArr].sort((a, b) => a.attemptNumber - b.attemptNumber);
  const timelineItems = [];

  quizAsc.forEach((quizDoc) => {
    const attemptNum = quizDoc.attemptNumber;
    const ratio = parseScoreForTimeline(quizDoc.score);
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

/**
 * parseScoreForTimeline: simpler version for timeline (returns 0 if unrecognized).
 */
function parseScoreForTimeline(scoreString) {
  if (!scoreString) return 0;
  const trimmed = scoreString.trim();
  // 1) If ends with '%'
  if (trimmed.endsWith("%")) {
    const numPart = trimmed.slice(0, -1);
    const parsed = parseFloat(numPart);
    return !isNaN(parsed) ? parsed / 100 : 0;
  }
  // 2) If "X/Y"
  if (trimmed.includes("/")) {
    const [numStr, denomStr] = trimmed.split("/");
    const numericScore = parseFloat(numStr);
    const outOf = parseFloat(denomStr);
    if (!isNaN(numericScore) && !isNaN(outOf) && outOf > 0) {
      return numericScore / outOf;
    }
  }
  return 0;
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

// ------------------------ Styles ------------------------ //
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
  mainContent: {
    marginTop: "1rem",
  },
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
  tableHeader: {
    borderBottom: "1px solid #aaa",
    padding: "4px 8px",
    textAlign: "left",
  },
  tableCell: {
    borderBottom: "1px solid #444",
    padding: "4px 8px",
    textAlign: "left",
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
    backgroundColor: "yellow", // or some other color
    color: "#000",
    fontWeight: "bold",
  },
};