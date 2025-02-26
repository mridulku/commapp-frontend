// src/components/DetailedBookViewer/1.SidePanels/LeftPanel.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { playlistPanelStyle } from "./styles";

/**
 * LeftPanel
 *
 * Fetches a plan doc from `${backendURL}${fetchUrl}?planId=...`
 * Then shows a nested, collapsible list:
 *    Session -> Book -> Chapter -> Sub-Chapter -> Activities
 *
 * Props:
 *  - planId: string (the Firestore doc ID)
 *  - fetchUrl: string (the endpoint path to call, e.g. "/api/adaptive-plan-total")
 *  - backendURL: string (base URL for your Express server, default = "http://localhost:3001")
 *  - onActivitySelect: function(index, activity) => void
 *  - colorScheme: optional overrides for styling
 *  - initialActivityContext: optional { subChapterId, type } => auto-expand
 */
export default function LeftPanel({
  planId,
  fetchUrl = "/api/adaptive-plan", // <-- route to call
  backendURL = "http:/localhost:3001",

  onActivitySelect = () => {},
  colorScheme = {},
  initialActivityContext = null, // for auto-expanding
}) {
  const [plan, setPlan] = useState(null);

  // Track expanded/collapsed keys
  const [expandedSessions, setExpandedSessions] = useState([]);
  const [expandedBooks, setExpandedBooks] = useState([]);
  const [expandedChapters, setExpandedChapters] = useState([]);
  const [expandedSubs, setExpandedSubs] = useState([]);

  // 1) Fetch plan data from (backendURL + fetchUrl) with planId
  useEffect(() => {
    if (!planId) return;

    async function fetchPlanData() {
      try {
        console.log("Fetching from:", `${backendURL}${fetchUrl}`, "with planId=", planId);
        const res = await axios.get(`${backendURL}${fetchUrl}`, {
          params: { planId },
        });
        if (res.data && res.data.planDoc) {
          setPlan(res.data.planDoc);
        } else {
          console.error("No planDoc in response:", res.data);
        }
      } catch (err) {
        console.error("Error fetching plan:", err);
      }
    }
    fetchPlanData();
  }, [planId, backendURL, fetchUrl]);

  // 2) Auto-expand logic once plan is loaded + we have initialActivityContext
  useEffect(() => {
    if (plan && initialActivityContext) {
      console.log("Auto-expanding with context:", initialActivityContext);
      autoExpandToActivity(plan, initialActivityContext);
    }
  }, [plan, initialActivityContext]);

  /**
   * autoExpandToActivity
   *
   * Finds the matching activity by subChapterId + type,
   * sets the expanded states for session/book/chapter/sub-chapter,
   * and finally calls onActivitySelect to highlight that activity.
   */
  function autoExpandToActivity(plan, { subChapterId, type }) {
    const targetType = type ? type.toUpperCase() : null;

    let foundActivity = null;
    let foundSessionLabel, foundBookId, foundChapterId, foundSubChapterId;

    // Loop sessions to find the matching subChapterId + type
    for (const sess of plan.sessions || []) {
      const { sessionLabel, activities = [] } = sess;
      for (const act of activities) {
        if (
          act.subChapterId === subChapterId &&
          act.type?.toUpperCase() === targetType
        ) {
          foundActivity = act;
          foundSessionLabel = sessionLabel;
          foundBookId = act.bookId;
          foundChapterId = act.chapterId;
          foundSubChapterId = act.subChapterId;
          break;
        }
      }
      if (foundActivity) break;
    }

    if (!foundActivity) {
      console.warn("No matching activity for", subChapterId, type);
      return;
    }

    // Build keys to expand
    const sessionKey = `session-${foundSessionLabel}`;
    const bookKey = `S-${foundSessionLabel}-B-${foundBookId}`;
    const chapterKey = `S-${foundSessionLabel}-B-${foundBookId}-C-${foundChapterId}`;
    const subKey = `S-${foundSessionLabel}-B-${foundBookId}-C-${foundChapterId}-SUB-${foundSubChapterId}`;

    // Expand them
    setExpandedSessions((prev) => (prev.includes(sessionKey) ? prev : [...prev, sessionKey]));
    setExpandedBooks((prev) => (prev.includes(bookKey) ? prev : [...prev, bookKey]));
    setExpandedChapters((prev) => (prev.includes(chapterKey) ? prev : [...prev, chapterKey]));
    setExpandedSubs((prev) => (prev.includes(subKey) ? prev : [...prev, subKey]));

    // Select the activity
    onActivitySelect(0, foundActivity);
  }

  // Basic styling
  const containerStyle = {
    ...playlistPanelStyle,
    width: "300px",
    minWidth: "250px",
    backgroundColor: colorScheme.panelBg || "rgba(0, 0, 0, 0.9)",
    color: "#fff",
    overflowY: "auto",
    padding: "20px",
    borderRight: "2px solid rgba(255,215,0,0.4)",
  };

  const headingStyle = {
    fontWeight: "bold",
    marginBottom: "15px",
    fontSize: "1.2rem",
    color: colorScheme.heading || "#FFD700",
  };

  const baseHeaderStyle = {
    cursor: "pointer",
    padding: "10px",
    borderRadius: "6px",
    marginBottom: "6px",
    backgroundColor: "rgba(255,215,0,0.15)",
    color: "#fff",
    fontWeight: "bold",
    transition: "background-color 0.3s",
  };

  if (!plan) {
    return (
      <div style={containerStyle}>
        <h2 style={headingStyle}>Adaptive Plan</h2>
        <div>Loading plan data...</div>
      </div>
    );
  }

  const { sessions = [] } = plan;

  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>Adaptive Plan</h2>
      {sessions.map((sess) => {
        const { sessionLabel, activities = [] } = sess;
        const sessionKey = `session-${sessionLabel}`;
        const isSessionExpanded = expandedSessions.includes(sessionKey);

        const totalTime = activities.reduce((acc, a) => acc + (a.timeNeeded || 0), 0);

        return (
          <div key={sessionLabel} style={{ marginBottom: "10px" }}>
            {/* Session header */}
            <div
              style={baseHeaderStyle}
              onClick={() => toggleSession(sessionKey)}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,215,0,0.3)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,215,0,0.15)";
              }}
            >
              {isSessionExpanded ? "▾" : "▸"} Day {sessionLabel} — {totalTime} min
            </div>

            {/* Books in this session (if expanded) */}
            {isSessionExpanded && renderBooks(activities, sessionLabel)}
          </div>
        );
      })}
    </div>
  );

  // ==================== Toggle Helpers ====================
  function toggleSession(key) {
    setExpandedSessions((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
    );
  }
  function toggleBook(key) {
    setExpandedBooks((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
    );
  }
  function toggleChapter(key) {
    setExpandedChapters((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
    );
  }
  function toggleSub(key) {
    setExpandedSubs((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
    );
  }

  // ==================== LEVEL 1: BOOK GROUPING ====================
  function renderBooks(activities, sessionLabel) {
    const booksMap = new Map();
    for (const act of activities) {
      const bKey = act.bookId;
      if (!booksMap.has(bKey)) {
        booksMap.set(bKey, {
          bookId: bKey,
          bookName: act.bookName || `Book (${bKey})`,
          items: [],
        });
      }
      booksMap.get(bKey).items.push(act);
    }

    const bookGroups = Array.from(booksMap.values());

    return bookGroups.map((bk) => {
      const bookKey = `S-${sessionLabel}-B-${bk.bookId}`;
      const isBookExpanded = expandedBooks.includes(bookKey);

      const totalBookTime = bk.items.reduce((acc, a) => acc + (a.timeNeeded || 0), 0);

      return (
        <div key={bookKey} style={{ marginLeft: "20px", marginBottom: "8px" }}>
          <div
            style={{
              ...baseHeaderStyle,
              backgroundColor: "rgba(255,215,0,0.25)",
            }}
            onClick={() => toggleBook(bookKey)}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,215,0,0.4)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,215,0,0.25)";
            }}
          >
            {isBookExpanded ? "▾" : "▸"} Book: {bk.bookName} — {totalBookTime} min
          </div>

          {isBookExpanded && renderChapters(bk.items, sessionLabel, bk.bookId)}
        </div>
      );
    });
  }

  // ==================== LEVEL 2: CHAPTER GROUPING ====================
  function renderChapters(activities, sessionLabel, bookId) {
    const chapterMap = new Map();
    for (const act of activities) {
      const cKey = act.chapterId;
      if (!chapterMap.has(cKey)) {
        chapterMap.set(cKey, {
          chapterId: cKey,
          chapterName: act.chapterName || `Chapter (${cKey})`,
          items: [],
        });
      }
      chapterMap.get(cKey).items.push(act);
    }

    const chapterGroups = Array.from(chapterMap.values());

    return chapterGroups.map((ch) => {
      const chapterKey = `S-${sessionLabel}-B-${bookId}-C-${ch.chapterId}`;
      const isChapterExpanded = expandedChapters.includes(chapterKey);

      const totalChapterTime = ch.items.reduce((acc, a) => acc + (a.timeNeeded || 0), 0);

      return (
        <div key={chapterKey} style={{ marginLeft: "20px", marginBottom: "8px" }}>
          <div
            style={{
              ...baseHeaderStyle,
              backgroundColor: "rgba(255,215,0,0.35)",
            }}
            onClick={() => toggleChapter(chapterKey)}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,215,0,0.5)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,215,0,0.35)";
            }}
          >
            {isChapterExpanded ? "▾" : "▸"} Chapter: {ch.chapterName} — {totalChapterTime} min
          </div>

          {isChapterExpanded &&
            renderSubChapters(ch.items, sessionLabel, bookId, ch.chapterId)}
        </div>
      );
    });
  }

  // ==================== LEVEL 3: SUB-CHAPTER GROUPING ====================
  function renderSubChapters(activities, sessionLabel, bookId, chapterId) {
    const subMap = new Map();
    for (const act of activities) {
      const sKey = act.subChapterId;
      if (!subMap.has(sKey)) {
        subMap.set(sKey, {
          subChapterId: sKey,
          subChapterName: act.subChapterName || `Sub-Chapter (${sKey})`,
          items: [],
        });
      }
      subMap.get(sKey).items.push(act);
    }

    const subGroups = Array.from(subMap.values());

    return subGroups.map((sb) => {
      const subKey = `S-${sessionLabel}-B-${bookId}-C-${chapterId}-SUB-${sb.subChapterId}`;
      const isSubExpanded = expandedSubs.includes(subKey);

      const totalSubTime = sb.items.reduce((acc, a) => acc + (a.timeNeeded || 0), 0);

      return (
        <div key={subKey} style={{ marginLeft: "20px", marginBottom: "8px" }}>
          <div
            style={{
              ...baseHeaderStyle,
              backgroundColor: "rgba(255,215,0,0.45)",
            }}
            onClick={() => toggleSub(subKey)}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,215,0,0.6)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,215,0,0.45)";
            }}
          >
            {isSubExpanded ? "▾" : "▸"} Sub-Chapter: {sb.subChapterName} — {totalSubTime} min
          </div>

          {isSubExpanded && (
            <div style={{ marginLeft: "20px" }}>
              {sb.items.map((act, idx) => renderActivity(act, idx))}
            </div>
          )}
        </div>
      );
    });
  }

  // ==================== LEVEL 4: ACTIVITIES ====================
  function renderActivity(act, idx) {
    const { bgColor } = getActivityStyle(act.type);

    return (
      <div
        key={idx}
        style={{
          marginBottom: "4px",
          padding: "6px",
          borderRadius: "4px",
          backgroundColor: bgColor,
          color: "#000",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
        }}
        onClick={() => onActivitySelect(idx, act)}
      >
        <div style={{ fontWeight: "bold", marginRight: "8px" }}>{act.type}:</div>
        <div>{act.subChapterName || act.subChapterId}</div>
        <div style={{ marginLeft: "auto", fontSize: "0.85rem" }}>
          {act.timeNeeded || 0} min
        </div>
      </div>
    );
  }
}

// Simple helper for background color
function getActivityStyle(type) {
  switch (type?.toUpperCase()) {
    case "READ":
      return { bgColor: "lightblue" };
    case "QUIZ":
      return { bgColor: "lightgreen" };
    case "REVISE":
      return { bgColor: "khaki" };
    default:
      return { bgColor: "#ccc" };
  }
}