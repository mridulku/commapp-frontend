import React, { useEffect, useState } from "react";
import axios from "axios";
import { playlistPanelStyle } from "./styles";

/**
 * OverviewSidebar
 *
 * 4-level nested plan (similar to HomeSidebar):
 *   1) Session (Day X) — expanded by default
 *   2) Book (Book: X) — expanded by default
 *   3) Chapter (Chapter: X) — expanded by default
 *   4) Sub-Chapter (Sub-Chapter: X) — collapsed by default
 *
 * Props:
 *  - planId: string (the Firestore doc ID)
 *  - onOverviewSelect: function(activity) => void
 *  - onOpenPlayer: function(planId, activity, fetchUrl) => void  // for "Play" button
 *  - colorScheme: optional styling overrides
 */
export default function OverviewSidebar({
  planId,
  onOverviewSelect = () => {},
  onOpenPlayer = () => {},  // <-- Provide a default to avoid errors
  colorScheme = {},
}) {
  const [plan, setPlan] = useState(null);

  // Expanded/collapsed states
  const [expandedSessions, setExpandedSessions] = useState([]);
  const [expandedBooks, setExpandedBooks] = useState([]);
  const [expandedChapters, setExpandedChapters] = useState([]);
  const [expandedSubs, setExpandedSubs] = useState([]); // sub-chapters collapsed by default

  // 1) Fetch the plan
  useEffect(() => {
    if (!planId) return;
    async function fetchPlanData() {
      try {
        // Adjust the URL/path if you truly need /api/adaptive-plan-sorted
        // For now, leaving it the same as your snippet
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/adaptive-plan`, {
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
  }, [planId]);

  // 2) Expand sessions/books/chapters by default once we have the plan
  useEffect(() => {
    if (!plan) return;

    const { sessions = [] } = plan;
    const sessionKeys = [];
    const bookKeys = [];
    const chapterKeys = [];

    for (const sess of sessions) {
      const { sessionLabel, activities = [] } = sess;
      const sKey = `S-${sessionLabel}`;
      sessionKeys.push(sKey);

      // Group by book
      const bookMap = new Map();
      for (const act of activities) {
        if (!bookMap.has(act.bookId)) {
          bookMap.set(act.bookId, []);
        }
        bookMap.get(act.bookId).push(act);
      }

      for (const [bookId, bookActs] of bookMap.entries()) {
        const bKey = `S-${sessionLabel}-B-${bookId}`;
        bookKeys.push(bKey);

        // Group by chapter
        const chapterMap = new Map();
        for (const a of bookActs) {
          if (!chapterMap.has(a.chapterId)) {
            chapterMap.set(a.chapterId, []);
          }
          chapterMap.get(a.chapterId).push(a);
        }
        for (const [chapterId] of chapterMap.entries()) {
          const cKey = `S-${sessionLabel}-B-${bookId}-C-${chapterId}`;
          chapterKeys.push(cKey);
        }
      }
    }

    setExpandedSessions(sessionKeys);
    setExpandedBooks(bookKeys);
    setExpandedChapters(chapterKeys);
    // sub-chapters remain collapsed by default
  }, [plan]);

  // ---------- Styling ----------
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
    padding: "8px",
    borderRadius: "4px",
    marginBottom: "4px",
    backgroundColor: "rgba(255,215,0,0.15)",
    color: "#fff",
    fontWeight: "bold",
    transition: "background-color 0.3s",
  };

  if (!plan) {
    return (
      <div style={containerStyle}>
        <h2 style={headingStyle}>Overview Plan</h2>
        <div>Loading plan data...</div>
      </div>
    );
  }

  const { sessions = [] } = plan;

  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>Overview Plan</h2>
      {sessions.map((sess) => {
        const { sessionLabel, activities = [] } = sess;
        const sessionKey = `S-${sessionLabel}`;
        const isSessionExpanded = expandedSessions.includes(sessionKey);

        // Calculate total time in this session
        const totalTime = activities.reduce((acc, a) => acc + (a.timeNeeded || 0), 0);

        return (
          <div key={sessionLabel} style={{ marginBottom: "10px" }}>
            {/* Session header */}
            <div
              style={{
                ...baseHeaderStyle,
                backgroundColor: "rgba(255,215,0,0.15)",
              }}
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

            {/* Render the books in this session (if expanded) */}
            {isSessionExpanded && renderBooksInSession(activities, sessionLabel)}
          </div>
        );
      })}
    </div>
  );

  // ---------------- Toggle Handlers ----------------
  function toggleSession(key) {
    setExpandedSessions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }
  function toggleBook(key) {
    setExpandedBooks((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }
  function toggleChapter(key) {
    setExpandedChapters((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }
  function toggleSub(key) {
    setExpandedSubs((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  // -------------- 1) Group Activities by Book --------------
  function renderBooksInSession(activities, sessionLabel) {
    const bookMap = new Map();
    for (const act of activities) {
      const bKey = act.bookId;
      if (!bookMap.has(bKey)) {
        bookMap.set(bKey, {
          bookId: bKey,
          bookName: act.bookName || `Book (${bKey})`,
          items: [],
        });
      }
      bookMap.get(bKey).items.push(act);
    }

    const bookGroups = Array.from(bookMap.values());
    return bookGroups.map((bk) => {
      const bookKey = `S-${sessionLabel}-B-${bk.bookId}`;
      const isBookExpanded = expandedBooks.includes(bookKey);

      // Summation of time for this book
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

          {isBookExpanded && renderChaptersInBook(bk.items, sessionLabel, bk.bookId)}
        </div>
      );
    });
  }

  // -------------- 2) Group Activities by Chapter --------------
  function renderChaptersInBook(activities, sessionLabel, bookId) {
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

  // -------------- 3) Group Activities by Sub-Chapter --------------
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

  // -------------- 4) Render Each Activity --------------
  function renderActivity(act, idx) {
    const { bgColor } = getActivityStyle(act.type);
    const key = `activity-${act.bookId}-${act.chapterId}-${act.subChapterId}-${idx}`;

    return (
      <div
        key={key}
        style={{
          marginBottom: "4px",
          padding: "6px",
          borderRadius: "4px",
          backgroundColor: bgColor,
          color: "#000",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left side: onOverviewSelect */}
        <div
          style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
          onClick={() => onOverviewSelect(act)}
        >
          <div style={{ fontWeight: "bold", marginRight: "8px" }}>{act.type}:</div>
          <div>{act.subChapterName || act.subChapterId}</div>
          <div style={{ marginLeft: "12px", fontSize: "0.85rem" }}>
            {act.timeNeeded || 0} min
          </div>
        </div>

        {/* Right side: "Play" => triggers MUDAR / cinematic modal */}
        <button
          style={{
            backgroundColor: "#FFD700",
            border: "none",
            borderRadius: "4px",
            padding: "4px 8px",
            cursor: "pointer",
            fontWeight: "bold",
            marginLeft: "10px",
          }}
          onClick={(e) => {
            e.stopPropagation(); // avoid also triggering onOverviewSelect
            console.log("Play button clicked", planId, act);
            onOpenPlayer(planId, act, "/api/adaptive-plan");
          }}
        >
          Play
        </button>
      </div>
    );
  }
}

/** 
 * Choose background color for READ/QUIZ/REVISE 
 */
function getActivityStyle(type = "") {
  switch (type.toUpperCase()) {
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