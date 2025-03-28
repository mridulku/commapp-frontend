// File: HistoryView.jsx
import React, { useState } from "react";

/**
 * HistoryView (Forced Narrow Table)
 * ---------------------------------
 * - Concept column = 20%
 * - Up to 4 visible quiz columns share remaining 80%
 * - Very small font for date/time
 * - tableLayout: fixed, overflowX hidden => no horizontal scrollbar.
 * - If text is STILL forcing scroll, check parent containers or reduce widths further (e.g. 15% for concept).
 */
export default function HistoryView({
  quizStage = "remember",
  totalStages = ["remember", "understand", "apply", "analyze"],

  quizAttempts = [],
  revisionAttempts = [],
  allAttemptsConceptStats = [],
}) {
  // 1) final statuses
  const { conceptSet, conceptStatusMap } = computeConceptStatuses(allAttemptsConceptStats);
  const totalConcepts = conceptSet.size;

  // 2) Summaries
  const masteredCount = [...conceptStatusMap.values()].filter(s => s === "PASS").length;
  const inProgressCount = [...conceptStatusMap.values()].filter(s => s === "FAIL").length;
  const notTestedCount = totalConcepts - (masteredCount + inProgressCount);

  // 3) combined steps
  const combinedSteps = buildCombinedSteps(quizAttempts, revisionAttempts);
  const totalCols = combinedSteps.length;

  // 4) Only 4 columns displayed
  const [colStart, setColStart] = useState(Math.max(0, totalCols - 4));
  const colEnd = colStart + 4;
  const visibleSteps = combinedSteps.slice(colStart, colEnd);

  // 5) pass/fail cell data
  const cellData = buildCellData(allAttemptsConceptStats);

  // 6) stage highlight
  const currentStageIndex = totalStages.findIndex(
    (st) => st.toLowerCase() === quizStage.toLowerCase()
  );

  // 7) arrow nav
  function handlePrev() {
    if (colStart > 0) setColStart(colStart - 1);
  }
  function handleNext() {
    if (colEnd < totalCols) setColStart(colStart + 1);
  }

  // (A) concept col = 20%, others share 80%
  const conceptColWidth = 20; 
  const numCols = visibleSteps.length;
  const stepColWidth = numCols > 0 ? (80 / numCols).toFixed(2) : 0;

  return (
    <div style={styles.container}>

      {/* Stage Stepper */}
      <StageStepper totalStages={totalStages} currentStageIndex={currentStageIndex} />

      {/* Summaries */}
      <div style={styles.summaryRow}>
        <div style={styles.conceptCount}>{totalConcepts} Concepts 📚</div>
        <MasteryIcon color="green" label="Mastered" count={masteredCount} />
        <MasteryIcon color="red" label="In Progress" count={inProgressCount} />
        <MasteryIcon color="gray" label="Not Tested" count={notTestedCount} />
      </div>

      {/* Arrows row */}
      <div style={styles.navRow}>
        <button style={styles.navBtn} onClick={handlePrev} disabled={colStart <= 0}>
          &lt;
        </button>
        <span style={styles.navInfo}>
          Showing columns {colStart + 1} - {Math.min(colEnd, totalCols)} of {totalCols}
        </span>
        <button style={styles.navBtn} onClick={handleNext} disabled={colEnd >= totalCols}>
          &gt;
        </button>
      </div>

      {/* Table => forced to 100% width, no horizontal scroll */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <colgroup>
            <col style={{ width: `${conceptColWidth}%` }} />
            {visibleSteps.map((_, idx) => (
              <col key={idx} style={{ width: `${stepColWidth}%` }} />
            ))}
          </colgroup>

          <thead>
            <tr>
              <th style={styles.th}>Concept</th>
              {visibleSteps.map((step, idx) => (
                <AttemptHeaderCell key={idx} step={step} />
              ))}
            </tr>
          </thead>

          <tbody>
            {Array.from(conceptSet).sort().map((cName) => {
              const finalStatus = conceptStatusMap.get(cName) || "NOT_TESTED";
              return (
                <tr key={cName}>
                  <td style={styles.tdConcept}>{cName}</td>
                  {visibleSteps.map((step, i) => (
                    <AttemptBodyCell
                      key={i}
                      step={step}
                      conceptName={cName}
                      cellData={cellData}
                      finalStatus={finalStatus}
                    />
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ==================== Stage Stepper, Mastery Icons, etc. ==================== */
function StageStepper({ totalStages, currentStageIndex }) {
  return (
    <div style={styles.stepperRow}>
      {totalStages.map((stName, i) => {
        const isActive = i === currentStageIndex;
        const isLocked = i > currentStageIndex;
        return (
          <div
            key={i}
            style={{
              ...styles.stepBox,
              ...(isActive ? styles.stepBoxActive : {}),
              ...(isLocked ? styles.stepBoxLocked : {}),
            }}
          >
            {capitalize(stName)}
            {isLocked && <span style={styles.lockIcon}>🔒</span>}
          </div>
        );
      })}
    </div>
  );
}
function MasteryIcon({ color, label, count }) {
  return (
    <div style={styles.mIcon}>
      <div style={{ ...styles.mDot, backgroundColor: color }} />
      <span>{label}: {count}</span>
    </div>
  );
}
function capitalize(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ==================== AttemptHeaderCell ==================== */
function AttemptHeaderCell({ step }) {
  // show date/time vertically in small font
  const dt = step.quizTimestamp ? formatTimestampVertical(step.quizTimestamp) : null;
  return (
    <th style={styles.th}>
      <div style={styles.headerCellInner}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
          {step.hasQuiz && <span>Q{step.attemptNumber}</span>}
          {step.hasRevision && (
            <RevisionIcon attemptNumber={step.attemptNumber} timestamp={step.revisionTimestamp} />
          )}
        </div>
        {dt && <div style={styles.quizDate}>{dt}</div>}
      </div>
    </th>
  );
}
function formatTimestampVertical(ts) {
  const d = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
  const dateStr = d.toLocaleDateString(); 
  const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <>
      <div>{dateStr}</div>
      <div>{timeStr}</div>
    </>
  );
}

/* ==================== AttemptBodyCell ==================== */
function AttemptBodyCell({ step, conceptName, cellData, finalStatus }) {
  const rec = cellData[conceptName]?.[step.attemptNumber];
  // no record => if final PASS => Mastered else "—"
  if (!rec) {
    if (finalStatus === "PASS") {
      return <td style={styles.passCell}>Mastered</td>;
    }
    return <td style={styles.notTestedCell}>—</td>;
  }
  // 0/0 => forced Mastered
  if (rec.correct === 0 && rec.total === 0) {
    return (
      <td style={styles.passCell}>
        Mastered
        <InfoIcon text="0/0 (N/A)" />
      </td>
    );
  }
  const ratioPct = (rec.ratio * 100).toFixed(1);
  const detail = `${rec.correct}/${rec.total} (${ratioPct}%)`;
  if (rec.passOrFail === "PASS") {
    return (
      <td style={styles.passCell}>
        Mastered
        <InfoIcon text={detail} />
      </td>
    );
  } else if (rec.passOrFail === "FAIL") {
    return (
      <td style={styles.failCell}>
        Failed
        <InfoIcon text={detail} />
      </td>
    );
  }
  // else => not tested
  return (
    <td style={styles.notTestedCell}>
      —
      <InfoIcon text={detail} />
    </td>
  );
}

/* ==================== InfoIcon + Tooltip ==================== */
function InfoIcon({ text }) {
  const [hover, setHover] = useState(false);
  if (!text) return null;
  return (
    <span
      style={styles.infoContainer}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span style={styles.infoIcon}>i</span>
      {hover && (
        <div style={styles.infoTip}>{text}</div>
      )}
    </span>
  );
}

/* ==================== RevisionIcon w/ tooltip ==================== */
function RevisionIcon({ attemptNumber, timestamp }) {
  const [hover, setHover] = useState(false);
  const label = `R${attemptNumber}`;
  const tipStr = timestamp ? formatTimestampPlain(timestamp) : "";
  return (
    <span
      style={styles.revWrapper}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button style={styles.revBtn}>{label}</button>
      {hover && tipStr && (
        <div style={styles.revTip}>{tipStr}</div>
      )}
    </span>
  );
}
function formatTimestampPlain(ts) {
  const d = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
  return d.toLocaleString();
}

/* ==================== Data Builders ==================== */
function buildCombinedSteps(quizArr, revisionArr) {
  const map = {};
  quizArr.forEach((q) => {
    const n = q.attemptNumber;
    if (!map[n]) {
      map[n] = {
        attemptNumber: n,
        hasQuiz: false,
        quizTimestamp: null,
        quizScore: q.score || "",
        hasRevision: false,
        revisionTimestamp: null,
      };
    }
    map[n].hasQuiz = true;
    map[n].quizTimestamp = q.timestamp || null;
    map[n].quizScore = q.score || "";
  });

  revisionArr.forEach((r) => {
    const n = r.revisionNumber;
    if (!map[n]) {
      map[n] = {
        attemptNumber: n,
        hasQuiz: false,
        quizTimestamp: null,
        quizScore: "",
        hasRevision: false,
        revisionTimestamp: null,
      };
    }
    map[n].hasRevision = true;
    map[n].revisionTimestamp = r.timestamp || null;
  });
  return Object.values(map).sort((a, b) => a.attemptNumber - b.attemptNumber);
}
function buildCellData(allStats) {
  const data = {};
  allStats.forEach((attempt) => {
    const n = attempt.attemptNumber;
    (attempt.conceptStats || []).forEach((cs) => {
      const cName = cs.conceptName;
      if (!data[cName]) data[cName] = {};
      data[cName][n] = {
        passOrFail: cs.passOrFail,
        correct: cs.correct,
        total: cs.total,
        ratio: cs.ratio,
      };
    });
  });
  return data;
}
function computeConceptStatuses(allAtts) {
  const conceptStatusMap = new Map();
  const conceptSet = new Set();
  const sorted = [...allAtts].sort((a, b) => a.attemptNumber - b.attemptNumber);
  sorted.forEach((attempt) => {
    (attempt.conceptStats || []).forEach((cs) => {
      conceptSet.add(cs.conceptName);
      if (!conceptStatusMap.has(cs.conceptName)) {
        conceptStatusMap.set(cs.conceptName, "NOT_TESTED");
      }
      if (cs.passOrFail === "PASS") {
        conceptStatusMap.set(cs.conceptName, "PASS");
      } else if (
        cs.passOrFail === "FAIL" &&
        conceptStatusMap.get(cs.conceptName) !== "PASS"
      ) {
        conceptStatusMap.set(cs.conceptName, "FAIL");
      }
    });
  });
  return { conceptSet, conceptStatusMap };
}

/* ==================== Styles ==================== */
const styles = {
  container: {
    width: "90%",
    color: "#fff",
    fontFamily: "'Inter', sans-serif",
    padding: 16,
  },

  // Stepper
  stepperRow: {
    display: "flex",
    gap: 8,
    marginBottom: 16,
  },
  stepBox: {
    padding: "6px 10px",
    borderRadius: 6,
    backgroundColor: "#444",
    color: "#ccc",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  stepBoxActive: {
    backgroundColor: "#5cb85c",
    color: "#fff",
    fontWeight: "bold",
  },
  stepBoxLocked: {
    opacity: 0.4,
  },
  lockIcon: {
    fontSize: "0.9rem",
  },

  // Summaries
  summaryRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  conceptCount: {
    backgroundColor: "#333",
    padding: "6px 12px",
    borderRadius: 6,
    fontSize: "1rem",
  },
  mIcon: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#333",
    padding: "4px 8px",
    borderRadius: 6,
  },
  mDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
  },

  // Arrows
  navRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 4,
  },
  navBtn: {
    backgroundColor: "#444",
    color: "#fff",
    border: "1px solid #666",
    borderRadius: 4,
    padding: "2px 6px",
    cursor: "pointer",
  },
  navInfo: {
    color: "#ccc",
  },

  // Table
  tableWrapper: {
    marginTop: 8,
    overflowX: "hidden", // hides any horizontal scroll
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    tableLayout: "fixed",  // forces columns to obey colgroup
  },
  th: {
    border: "1px solid #444",
    backgroundColor: "#333",
    padding: "4px",
    textAlign: "center",
    fontSize: "0.8rem",
    wordWrap: "break-word",
    color: "#fff",
  },

  // For concept cells
  tdConcept: {
    border: "1px solid #444",
    backgroundColor: "#000",
    padding: "6px",
    textAlign: "left",
    fontSize: "0.9rem",
    color: "#fff",
    wordWrap: "break-word",
  },

  // pass/fail
  passCell: {
    border: "1px solid #444",
    backgroundColor: "green",
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "0.8rem",
    wordWrap: "break-word",
  },
  failCell: {
    border: "1px solid #444",
    backgroundColor: "red",
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "0.8rem",
    wordWrap: "break-word",
  },
  notTestedCell: {
    border: "1px solid #444",
    backgroundColor: "gray",
    color: "#000",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "0.8rem",
    wordWrap: "break-word",
  },

  // Info
  infoContainer: {
    display: "inline-block",
    position: "relative",
    marginLeft: 4,
    cursor: "pointer",
  },
  infoIcon: {
    backgroundColor: "#444",
    color: "#fff",
    borderRadius: "50%",
    width: 14,
    height: 14,
    fontSize: "0.6rem",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  infoTip: {
    position: "absolute",
    top: "115%",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "#222",
    color: "#fff",
    padding: "4px 6px",
    borderRadius: 4,
    border: "1px solid #555",
    fontSize: "0.75rem",
    whiteSpace: "nowrap",
    zIndex: 9999,
  },

  // Revision
  revWrapper: {
    position: "relative",
    display: "inline-block",
  },
  revBtn: {
    backgroundColor: "#666",
    color: "#fff",
    fontSize: "0.65rem",
    border: "1px solid #888",
    borderRadius: 4,
    padding: "1px 4px",
    cursor: "pointer",
  },
  revTip: {
    position: "absolute",
    top: "115%",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "#222",
    color: "#fff",
    fontSize: "0.7rem",
    padding: "4px 6px",
    borderRadius: 4,
    border: "1px solid #555",
    whiteSpace: "nowrap",
    zIndex: 9999,
  },

  // Header cell
  headerCellInner: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    wordWrap: "break-word",
  },
  quizDate: {
    fontSize: "0.65rem",
    color: "#ccc",
    marginTop: 2,
    textAlign: "center",
  },
};