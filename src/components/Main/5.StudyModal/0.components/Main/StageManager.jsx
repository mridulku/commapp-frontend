import React, { useEffect, useState } from "react";
import axios from "axios";
import QuizComponent from "./QuizComponent";
import ReviseComponent from "./ReviseComponent";

export default function StageManager({ examId, activity, quizStage, userId }) {
  const subChapterId = activity?.subChapterId || "";

  const stagePassRatios = {
    remember: 0.1,
    understand: 0.7,
    apply: 0.6,
    analyze: 0.7,
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

  // NEW: Store subchapter concepts in state so we can do concept-level reporting
  const [subchapterConcepts, setSubchapterConcepts] = useState([]);
  // We'll also store computed concept stats for the *latest* quiz in a separate variable
  const [conceptStats, setConceptStats] = useState(null);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [subChapterId, userId, quizStage]);

  /**
   * Main data fetch:
   *  1) quiz attempts + revision attempts
   *  2) subchapter concepts
   *  3) compute pass/fail mode
   */
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

      // 3) Subchapter concepts
      //    (If you have your own Firebase fetch, do that; here is an example REST call.)
      const conceptRes = await axios.get("http://localhost:3001/api/getSubchapterConcepts", {
        params: { subchapterId: subChapterId },
      });
      const conceptArr = conceptRes.data.concepts || [];

      setQuizAttempts(quizArr);
      setRevisionAttempts(revArr);
      setSubchapterConcepts(conceptArr);

      // Evaluate pass/fail mode
      computeState(quizArr, revArr, conceptArr);
    } catch (err) {
      console.error("StageManager: error fetching attempts or concepts:", err);
      setError(err.message || "Error fetching data");
    } finally {
      setLoading(false);
    }
  }

  /**
   * Convert a "score" string (e.g. "72.00%", "3/5") into 0..1 ratio.
   */
  function parseScoreForRatio(scoreString) {
    if (!scoreString) return NaN;
    const trimmed = scoreString.trim();

    // Check for percentage
    if (trimmed.endsWith("%")) {
      const numPart = trimmed.slice(0, -1); 
      const parsed = parseFloat(numPart);
      return isNaN(parsed) ? NaN : parsed / 100;
    }

    // Check for "X/Y"
    if (trimmed.includes("/")) {
      const [numStr, denomStr] = trimmed.split("/");
      const numericScore = parseFloat(numStr);
      const outOf = parseFloat(denomStr);
      if (!isNaN(numericScore) && !isNaN(outOf) && outOf > 0) {
        return numericScore / outOf;
      }
    }

    // otherwise unrecognized
    return NaN;
  }

  /**
   * Decide pass/fail mode based on the newest quiz attempt.
   * Also, compute concept-level stats for that attempt so we can display them.
   */
  function computeState(quizArr, revArr, conceptArr) {
    if (!quizArr.length) {
      setMode("NO_QUIZ_YET");
      setLastQuizAttempt(null);
      setConceptStats(null);
      return;
    }

    // newest attempt is first
    const [latestQuiz] = quizArr;
    setLastQuizAttempt(latestQuiz);

    // --- (A) Overall pass/fail logic (unchanged) ---
    const passRatio = stagePassRatios[quizStage] || 0.6;
    const ratio = parseScoreForRatio(latestQuiz.score);
    if (isNaN(ratio)) {
      setMode("NEED_REVISION");
    } else {
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
    }

    // --- (B) Compute concept-level stats for the LATEST attempt, storing in state ---
    if (latestQuiz?.quizSubmission && conceptArr.length > 0) {
      const stats = buildConceptStats(latestQuiz.quizSubmission, conceptArr);
      setConceptStats(stats);
    } else {
      setConceptStats(null);
    }
  }

  /**
   * Utility: turn quizSubmission[] + list of subchapterConcepts into a conceptStats object/array
   */
  function buildConceptStats(quizSubmission, conceptArr) {
    // Tally correct vs. total for each conceptName
    const countMap = {};
    quizSubmission.forEach((q) => {
      const cName = q.conceptName || "UnknownConcept";
      if (!countMap[cName]) {
        countMap[cName] = { correct: 0, total: 0 };
      }
      countMap[cName].total++;
      // If we treat a question as correct if q.score >= 1:
      if (q.score && parseFloat(q.score) >= 1) {
        countMap[cName].correct++;
      }
    });

    // Now build a list in the order of conceptArr
    // conceptArr might look like: [ {name: "ConceptA"}, {name: "ConceptB"} ]
    const statsArray = conceptArr.map((c) => {
      const cName = c.name; // or c.conceptName
      const rec = countMap[cName] || { correct: 0, total: 0 };
      const ratio = rec.total > 0 ? rec.correct / rec.total : 0;
      return {
        conceptName: cName,
        correct: rec.correct,
        total: rec.total,
        ratio,
      };
    });

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

  // Render logic
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

      {/* Timeline stays the same */}
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
        {/* 
          1) No quiz => show first quiz
          2) Quiz completed => show success
          3) Need Revision => show revision 
          4) or show next quiz if revision done
        */}
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

        {mode === "QUIZ_COMPLETED" && (
          <div style={{ color: "lightgreen", marginBottom: "1rem" }}>
            <p>Congratulations! You passed the <b>{quizStage}</b> stage.</p>
          </div>
        )}

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

        {/* NEW: Show concept stats for the last attempt (if we have them) */}
        {lastQuizAttempt && conceptStats && conceptStats.length > 0 && (
          <div style={{ marginTop: "1rem" }}>
            <h3>Concept Performance (Last Attempt)</h3>
            <table style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>Concept</th>
                  <th style={styles.tableHeader}>Correct</th>
                  <th style={styles.tableHeader}>Total</th>
                  <th style={styles.tableHeader}>% Correct</th>
                </tr>
              </thead>
              <tbody>
                {conceptStats.map((cs, idx) => (
                  <tr key={idx}>
                    <td style={styles.tableCell}>{cs.conceptName}</td>
                    <td style={styles.tableCell}>{cs.correct}</td>
                    <td style={styles.tableCell}>{cs.total}</td>
                    <td style={styles.tableCell}>{(cs.ratio * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// Timeline code remains basically the same
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

function parseScoreForTimeline(scoreString) {
  if (!scoreString) return 0;
  const trimmed = scoreString.trim();
  if (trimmed.endsWith("%")) {
    const numPart = trimmed.slice(0, -1);
    const parsed = parseFloat(numPart);
    return !isNaN(parsed) ? parsed / 100 : 0;
  }
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

// Inline styles
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
};