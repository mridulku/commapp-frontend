// PlanView.jsx
import React, { useState } from "react";
import QuizHistoryModal from "./QuizHistoryModal"; // Adjust path as needed

/**
 * parsePlanCreationDate
 * ---------------------
 * Tries to parse plan.createdAt in multiple Firestore/time formats
 */
function parsePlanCreationDate(createdAt) {
  if (!createdAt) return null;
  let dateObj = null;

  if (typeof createdAt.toDate === "function") {
    // Firestore Timestamp => .toDate()
    dateObj = createdAt.toDate();
  } else if (
    typeof createdAt.seconds === "number" &&
    typeof createdAt.nanoseconds === "number"
  ) {
    // Possibly { seconds, nanoseconds }
    dateObj = new Date(createdAt.seconds * 1000);
  } else if (
    typeof createdAt._seconds === "number" &&
    typeof createdAt._nanoseconds === "number"
  ) {
    // Possibly { _seconds, _nanoseconds }
    dateObj = new Date(createdAt._seconds * 1000);
  } else if (createdAt instanceof Date) {
    dateObj = createdAt;
  } else if (typeof createdAt === "string") {
    const parsed = new Date(createdAt);
    if (!isNaN(parsed.getTime())) {
      dateObj = parsed;
    }
  }

  if (!dateObj || isNaN(dateObj.getTime())) {
    return null;
  }
  return dateObj;
}

/**
 * PlanView
 * --------
 * - Displays a plan’s sessions & activities in collapsible sections.
 * - For READ-type => shows reading completion date & reading time from `readingStats`.
 * - For QUIZ-type => shows quizStage + an “info” (i) button that opens <QuizHistoryModal>.
 *
 * Props:
 *   - plan: { createdAt, planName, examId, sessions: [...] }
 *   - readingStats: object keyed by subChapterId => { totalTimeSpentMinutes, completionDate }
 *   - userId: string => used by QuizHistoryModal to fetch data
 */
export default function PlanView({
  plan,
  planId = "",
  readingStats = {},
  userId = "",
  colorScheme = {},
}) {
  // 1) If no plan => return
  if (!plan) {
    return <p style={styles.infoText}>No plan data available.</p>;
  }

  // 2) Parse creation date from plan
  const creationDate = parsePlanCreationDate(plan.createdAt);
  if (!creationDate) {
    return <p style={styles.infoText}>No valid plan creation date found.</p>;
  }

  // We'll track which session labels are expanded
  const [expandedSessions, setExpandedSessions] = useState([]);

  // For showing the quiz history modal
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [modalSubchapterId, setModalSubchapterId] = useState("");
  const [modalQuizStage, setModalQuizStage] = useState("");

  // sessions array
  const sessions = plan.sessions || [];

  // Expand/collapse session
  function toggleSession(label) {
    setExpandedSessions((prev) =>
      prev.includes(label)
        ? prev.filter((l) => l !== label)
        : [...prev, label]
    );
  }

  /**
   * handleShowQuizHistory
   * ---------------------
   * Called when the “i” button is clicked on a quiz row.
   * We store the subChapterId & quizStage => open the modal.
   */
  function handleShowQuizHistory(activity) {
    const subCh = activity.subChapterId || "";
    const stage = (activity.quizStage || "").toLowerCase();
    setModalSubchapterId(subCh);
    setModalQuizStage(stage);
    setShowQuizModal(true);
  }

  return (
    <div style={{ marginTop: "1rem" }}>
      <h3 style={styles.sectionTitle}>Plan Overview</h3>

      <p style={styles.infoText}>
        <strong>Plan Created On:</strong>{" "}
        {creationDate.toLocaleString()}
      </p>
      <p style={styles.infoText}>
        <strong>Plan Name:</strong> {plan.planName || "(No name)"}
      </p>
      <p style={styles.infoText}>
        <strong>Exam ID:</strong> {plan.examId || "N/A"}
      </p>

      {/* Sessions */}
      {sessions.length === 0 ? (
        <p style={styles.infoText}>No sessions in the plan.</p>
      ) : (
        sessions.map((sess, index) => {
          // e.g. "1", "2"
          const numericLabel = parseInt(sess.sessionLabel, 10) || (index + 1);
          const sessionDateObj = new Date(
            creationDate.getTime() + (numericLabel - 1) * 86400000
          );
          const sessionDateStr = sessionDateObj.toLocaleDateString();

          const isExpanded = expandedSessions.includes(sess.sessionLabel);

          return (
            <div key={sess.sessionLabel} style={styles.sessionContainer}>
              <div
                style={styles.sessionHeader}
                onClick={() => toggleSession(sess.sessionLabel)}
              >
                <div style={{ fontWeight: "bold" }}>
                  {isExpanded ? "▾" : "▸"} Day {sess.sessionLabel} – {sessionDateStr}
                </div>
                <div>{(sess.activities || []).length} activities</div>
              </div>

              {isExpanded && (
                <div style={styles.sessionContent}>
                  {/* Table header row */}
                  <div style={styles.tableHeaderRow}>
                    <div style={{ width: "15%", fontWeight: "bold" }}>Type</div>
                    <div style={{ width: "30%", fontWeight: "bold" }}>Subchapter</div>
                    <div style={{ width: "10%", fontWeight: "bold" }}>Planned</div>
                    <div style={{ width: "20%", fontWeight: "bold" }}>Read Done</div>
                    <div style={{ width: "15%", fontWeight: "bold" }}>Read Time</div>
                    <div style={{ width: "10%", fontWeight: "bold" }}>Quiz Stage</div>
                  </div>

                  {(sess.activities || []).map((act, i) => {
                    const isRead = act.type === "READ";
                    const subChId = act.subChapterId || "";
                    const stats = readingStats[subChId] || null;

                    let completionStr = "—";
                    let timeSpentStr = "—";

                    if (isRead && stats) {
                      if (stats.completionDate) {
                        completionStr = stats.completionDate.toLocaleDateString();
                      }
                      if (typeof stats.totalTimeSpentMinutes === "number") {
                        timeSpentStr = stats.totalTimeSpentMinutes.toFixed(1) + " min";
                      }
                    }

                    let quizCellContent = "—";
                    if (act.type === "QUIZ" && act.quizStage) {
                      quizCellContent = (
                        <>
                          {act.quizStage}
                          <button
                            style={styles.infoBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShowQuizHistory(act);
                            }}
                          >
                            i
                          </button>
                        </>
                      );
                    }

                    return (
                      <div key={i} style={styles.tableRow}>
                        {/* 1) Type */}
                        <div style={{ width: "15%" }}>
                          <strong>{act.type}</strong>
                        </div>
                        {/* 2) Subchapter */}
                        <div style={{ width: "30%", fontStyle: "italic" }}>
                          {act.subChapterName || "Unknown SubCh"}
                        </div>
                        {/* 3) Planned */}
                        <div style={{ width: "10%", textAlign: "right" }}>
                          {act.timeNeeded || 0} min
                        </div>
                        {/* 4) Read Done */}
                        <div style={{ width: "20%", textAlign: "center" }}>
                          {completionStr}
                        </div>
                        {/* 5) Read Time */}
                        <div style={{ width: "15%", textAlign: "right" }}>
                          {timeSpentStr}
                        </div>
                        {/* 6) Quiz Stage */}
                        <div style={{ width: "10%", textAlign: "center" }}>
                          {quizCellContent}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}

      {/* Render the quiz history modal if showQuizModal=true */}
      {showQuizModal && (
        <QuizHistoryModal
          planId = {planId}
          open={showQuizModal}
          onClose={() => setShowQuizModal(false)}
          subChapterId={modalSubchapterId}
          quizStage={modalQuizStage}
          userId={userId}  // <-- pass the userId here
        />
      )}
    </div>
  );
}

// ---------------------------------------------
// Styles
// ---------------------------------------------
const styles = {
  sectionTitle: {
    margin: "0.5rem 0",
    color: "#333",
    fontSize: "1.05rem",
    fontWeight: 600,
    borderBottom: "1px solid #ccc",
    paddingBottom: "0.3rem",
  },
  infoText: {
    fontSize: "0.95rem",
    color: "#333",
    margin: "0.5rem 0",
  },
  sessionContainer: {
    backgroundColor: "#fafafa",
    border: "1px solid #ddd",
    borderRadius: "4px",
    marginBottom: "8px",
  },
  sessionHeader: {
    cursor: "pointer",
    padding: "8px 12px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#eee",
    borderRadius: "4px",
  },
  sessionContent: {
    padding: "8px 12px",
    borderTop: "1px solid #ddd",
  },
  tableHeaderRow: {
    display: "flex",
    borderBottom: "2px solid #ccc",
    paddingBottom: "4px",
    marginBottom: "6px",
  },
  tableRow: {
    display: "flex",
    borderBottom: "1px solid #eee",
    padding: "4px 0",
  },
  infoBtn: {
    marginLeft: 6,
    backgroundColor: "#888",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
  },
};