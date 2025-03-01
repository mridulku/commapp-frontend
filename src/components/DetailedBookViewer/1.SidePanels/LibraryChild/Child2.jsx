// src/components/DetailedBookViewer/child2.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";

// We'll import the new HistoryTab for the "History" tab
import HistoryTab from "./HistoryTab";

/**
 * Child2 - Minimal changes to:
 *  - Rename heading to "Adaptive Plan"
 *  - Add an initial "History" tab
 *  - Rename each session tab to "Today", "Tomorrow", "Day 3", etc.
 *
 * Props:
 *  - userId: string
 *  - bookId: string
 *  - planIds: string[]
 *  - onOverviewSelect: function(activity) => void
 *  - onOpenPlayer: function(planId, activity, fetchUrl) => void
 *  - colorScheme: { panelBg, textColor, borderColor, heading }
 */
export default function Child2({
  userId = null,
  bookId = "",
  planIds = [],
  onOverviewSelect = () => {},
  onOpenPlayer = () => {},
  colorScheme = {},
}) {
  // ------------------------------------------
  // 1) localPlanIds
  // ------------------------------------------
  const [localPlanIds, setLocalPlanIds] = useState(planIds);

  useEffect(() => {
    setLocalPlanIds(planIds);
  }, [planIds]);

  // ------------------------------------------
  // 2) Fetch plan IDs whenever bookId changes
  // ------------------------------------------
  useEffect(() => {
    async function fetchPlansForBook() {
      if (!userId || !bookId) {
        setLocalPlanIds([]);
        setSelectedPlanId("");
        setPlan(null);
        return;
      }

      try {
        const url = `${import.meta.env.VITE_BACKEND_URL}/api/adaptive-plan-id`;
        const res = await axios.get(url, { params: { userId, bookId } });
        if (res.data && res.data.planIds) {
          setLocalPlanIds(res.data.planIds);
        } else {
          console.warn("No planIds returned:", res.data);
          setLocalPlanIds([]);
        }
      } catch (error) {
        console.error("Error fetching plan IDs by bookId:", error);
        setLocalPlanIds([]);
      }
    }

    fetchPlansForBook();
  }, [userId, bookId]);

  // ------------------------------------------
  // 3) Selected Plan & Fetched Plan
  // ------------------------------------------
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    if (localPlanIds.length > 0) {
      setSelectedPlanId(localPlanIds[0]);
    } else {
      setSelectedPlanId("");
      setPlan(null);
    }
  }, [localPlanIds]);

  useEffect(() => {
    if (!selectedPlanId) {
      setPlan(null);
      return;
    }

    async function fetchPlan() {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/adaptive-plan`,
          {
            params: { planId: selectedPlanId },
          }
        );
        if (res.data && res.data.planDoc) {
          setPlan(res.data.planDoc);
        } else {
          console.error("No planDoc in response:", res.data);
          setPlan(null);
        }
      } catch (err) {
        console.error("Error fetching plan:", err);
        setPlan(null);
      }
    }

    fetchPlan();
  }, [selectedPlanId]);

  // ------------------------------------------
  // 4) Sessions => displayed as Tabs
  // ------------------------------------------
  const [activeSessionIndex, setActiveSessionIndex] = useState(0);

  // Reset the active tab if the plan changes
  useEffect(() => {
    setActiveSessionIndex(0);
  }, [plan]);

  // ------------------------------------------
  // 5) Expand/Collapse state for chapters
  // ------------------------------------------
  const [expandedChapters, setExpandedChapters] = useState([]);

  // Clear expansions whenever plan changes
  useEffect(() => {
    setExpandedChapters([]);
  }, [plan]);

  function toggleChapter(key) {
    setExpandedChapters((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  // ------------------------------------------
  // 6) Styles
  // ------------------------------------------
  const containerStyle = {
    backgroundColor: colorScheme.panelBg || "#0D0D0D",
    color: colorScheme.textColor || "#FFD700",
    padding: "1rem",
    minHeight: "100vh",
  };

  const headingStyle = {
    fontWeight: "bold",
    marginBottom: "15px",
    fontSize: "1.25rem",
    color: colorScheme.heading || "#FFD700",
  };

  // The "tabs" container
  const tabsContainerStyle = {
    display: "flex",
    marginBottom: "1rem",
    borderBottom: `1px solid ${colorScheme.borderColor || "#FFD700"}`,
  };

  // Single "tab" style
  const tabStyle = (isActive) => ({
    padding: "0.5rem 1rem",
    cursor: "pointer",
    border: `1px solid ${colorScheme.borderColor || "#FFD700"}`,
    borderBottom: isActive
      ? "none"
      : `1px solid ${colorScheme.borderColor || "#FFD700"}`,
    borderRadius: "8px 8px 0 0",
    marginRight: "5px",
    backgroundColor: isActive ? "#2F2F2F" : "#3D3D3D",
    color: colorScheme.textColor || "#FFD700",
  });

  // Collapsible chapter headers
  const collapsibleHeaderStyle = {
    cursor: "pointer",
    padding: "8px 12px",
    margin: "6px 0",
    backgroundColor: "#2F2F2F",
    borderRadius: "4px",
    border: `1px solid ${colorScheme.borderColor || "#FFD700"}`,
    fontWeight: "bold",
  };

  // Sub-chapter "card" container
  const subChapterCardStyle = {
    backgroundColor: "#3D3D3D",
    border: `1px solid ${colorScheme.borderColor || "#FFD700"}`,
    borderRadius: "6px",
    padding: "1rem",
    margin: "0.5rem 0",
  };

  const subChapterTitleStyle = {
    fontSize: "0.95rem",
    fontWeight: "bold",
    marginBottom: "0.5rem",
  };

  // Buttons row
  const activityButtonsRowStyle = {
    display: "flex",
    gap: "1rem",
  };

  const activityButtonStyle = (isEnabled) => ({
    backgroundColor: isEnabled ? colorScheme.heading || "#FFD700" : "#777777",
    color: isEnabled ? "#000" : "#ccc",
    border: "none",
    borderRadius: "4px",
    padding: "6px 10px",
    cursor: isEnabled ? "pointer" : "not-allowed",
    fontWeight: "bold",
    fontSize: "0.9rem",
    minWidth: "75px",
  });

  // ------------------------------------------
  // 7) Render
  // ------------------------------------------
  if (localPlanIds.length === 0 && !plan) {
    return (
      <div style={containerStyle}>
        <h2 style={headingStyle}>Adaptive Plan</h2>
        <div>
          No plan IDs found for userId="{userId}" and bookId="{bookId}".
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>Adaptive Plan</h2>

      {/* If there's more than 1 plan ID, show the dropdown */}
      {localPlanIds.length > 1 && (
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ marginRight: 5 }}>Select Plan:</label>
          <select
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
          >
            {localPlanIds.map((pid) => (
              <option key={pid} value={pid}>
                {pid}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Plan content */}
      {!selectedPlanId ? (
        <div>No Plan ID selected.</div>
      ) : !plan ? (
        <div>Loading plan data...</div>
      ) : (
        renderPlan(plan)
      )}
    </div>
  );

  // ------------------------------------------
  // renderPlan: show each "session" as a Tab, with an extra "History" tab
  // ------------------------------------------
  function renderPlan(planObj) {
    const { sessions = [] } = planObj;
    if (sessions.length === 0) {
      return <div>No sessions found in this plan.</div>;
    }

    return (
      <>
        {/* TABS container */}
        <div style={tabsContainerStyle}>
          {/* Tab 0 => History */}
          <div
            key="historyTab"
            style={tabStyle(activeSessionIndex === 0)}
            onClick={() => setActiveSessionIndex(0)}
          >
            History
          </div>

          {/* Tabs for each session => starts at index 1 */}
          {sessions.map((sess, index) => {
            const tabIndex = index + 1; // offset by 1 to account for "History"

            // We'll rename session labels:
            // If sessionLabel = 1 => "Today"
            // If sessionLabel = 2 => "Tomorrow"
            // Else => "Day X"
            let sessionDisplayName;
            const sLabel = Number(sess.sessionLabel);
            if (sLabel === 1) sessionDisplayName = "Today";
            else if (sLabel === 2) sessionDisplayName = "Tomorrow";
            else sessionDisplayName = `Day ${sLabel}`;

            // Compute total time for the label
            const totalTime = (sess.activities || []).reduce(
              (acc, a) => acc + (a.timeNeeded || 0),
              0
            );
            const label = `${sessionDisplayName} (${totalTime} min)`;

            const isActive = activeSessionIndex === tabIndex;
            return (
              <div
                key={sess.sessionLabel}
                style={tabStyle(isActive)}
                onClick={() => setActiveSessionIndex(tabIndex)}
              >
                {label}
              </div>
            );
          })}
        </div>

        {/* Render the content depending on which tab is selected */}
        {activeSessionIndex === 0
          ? // The "History" tab
            renderHistoryTab()
          : // Any other tab => sessions[activeSessionIndex-1]
            renderSessionContent(sessions[activeSessionIndex - 1])}
      </>
    );
  }

  // ------------------------------------------
  // renderHistoryTab: show the HistoryTab component
  // ------------------------------------------
  function renderHistoryTab() {
    return <HistoryTab />;
  }

  // ------------------------------------------
  // renderSessionContent: for the active day
  // ------------------------------------------
  function renderSessionContent(session) {
    if (!session) return null;
    const { activities = [] } = session;

    // Group by book
    const bookMap = new Map();
    for (const act of activities) {
      if (!bookMap.has(act.bookId)) {
        bookMap.set(act.bookId, []);
      }
      bookMap.get(act.bookId).push(act);
    }

    const uniqueBooks = [...bookMap.keys()];

    // If there's only one book in this day, skip the book layer
    if (uniqueBooks.length === 1) {
      const [singleBookId] = uniqueBooks;
      const singleBookActivities = bookMap.get(singleBookId) || [];
      return renderChaptersLayer(singleBookActivities, singleBookId, true);
    }

    // Otherwise, show each book as a heading & chapters
    return (
      <div style={{ marginTop: "1rem" }}>
        {uniqueBooks.map((bookId) => {
          const acts = bookMap.get(bookId) || [];
          const bookName = acts[0]?.bookName || `Book (${bookId})`;
          const totalBookTime = acts.reduce(
            (acc, a) => acc + (a.timeNeeded || 0),
            0
          );

          return (
            <div key={bookId} style={{ marginBottom: "1rem" }}>
              <h3 style={{ fontWeight: "bold", margin: "0.75rem 0 0.25rem" }}>
                {bookName} ({totalBookTime} min)
              </h3>
              {renderChaptersLayer(acts, bookId, false)}
            </div>
          );
        })}
      </div>
    );
  }

  // ------------------------------------------
  // renderChaptersLayer
  // ------------------------------------------
  function renderChaptersLayer(activities, bookId, skipBookLayer) {
    // Group by chapter
    const chapterMap = new Map();
    for (const act of activities) {
      if (!chapterMap.has(act.chapterId)) {
        chapterMap.set(act.chapterId, []);
      }
      chapterMap.get(act.chapterId).push(act);
    }

    return (
      <div style={{ marginLeft: skipBookLayer ? 0 : "1rem" }}>
        {[...chapterMap.entries()].map(([chapterId, cActs]) => {
          const chapterKey = `book${bookId}-chap${chapterId}`;
          const isChapterOpen = expandedChapters.includes(chapterKey);

          const chapterName =
            cActs[0]?.chapterName || `Chapter (${chapterId})`;
          const totalChapterTime = cActs.reduce(
            (acc, a) => acc + (a.timeNeeded || 0),
            0
          );
          const chapterLabel = `${chapterName} (${totalChapterTime} min)`;

          return (
            <div key={chapterId} style={{ marginBottom: "1rem" }}>
              <div
                style={collapsibleHeaderStyle}
                onClick={() => toggleChapter(chapterKey)}
              >
                {isChapterOpen ? "▾" : "▸"}{" "}
                <span style={{ marginLeft: 5 }}>{chapterLabel}</span>
              </div>
              {isChapterOpen && renderSubChapterCards(cActs)}
            </div>
          );
        })}
      </div>
    );
  }

  // ------------------------------------------
  // renderSubChapterCards
  // ------------------------------------------
  function renderSubChapterCards(chapterActivities) {
    // Group by subChapterId
    const subMap = new Map();
    for (const act of chapterActivities) {
      if (!subMap.has(act.subChapterId)) {
        subMap.set(act.subChapterId, []);
      }
      subMap.get(act.subChapterId).push(act);
    }

    return (
      <div style={{ marginTop: "0.5rem", marginLeft: "1.5rem" }}>
        {[...subMap.entries()].map(([subId, subActs]) => {
          const readAct = subActs.find((a) => a.type === "READ");
          const quizAct = subActs.find((a) => a.type === "QUIZ");
          const reviseAct = subActs.find((a) => a.type === "REVISE");
          const subName =
            subActs[0]?.subChapterName || `Sub-Chapter (${subId})`;

          return (
            <div key={subId} style={subChapterCardStyle}>
              <div style={subChapterTitleStyle}>{subName}</div>
              <div style={activityButtonsRowStyle}>
                {/* READ */}
                <button
                  style={activityButtonStyle(!!readAct)}
                  disabled={!readAct}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (readAct) {
                      onOpenPlayer(selectedPlanId, readAct, "/api/adaptive-plan");
                    }
                  }}
                >
                  {readAct ? `Read (${readAct.timeNeeded || 0}m)` : "Read"}
                </button>

                {/* QUIZ */}
                <button
                  style={activityButtonStyle(!!quizAct)}
                  disabled={!quizAct}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (quizAct) {
                      onOpenPlayer(selectedPlanId, quizAct, "/api/adaptive-plan");
                    }
                  }}
                >
                  {quizAct ? `Quiz (${quizAct.timeNeeded || 0}m)` : "Quiz"}
                </button>

                {/* REVISE */}
                <button
                  style={activityButtonStyle(!!reviseAct)}
                  disabled={!reviseAct}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (reviseAct) {
                      onOpenPlayer(selectedPlanId, reviseAct, "/api/adaptive-plan");
                    }
                  }}
                >
                  {reviseAct ? `Revise (${reviseAct.timeNeeded || 0}m)` : "Revise"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
}