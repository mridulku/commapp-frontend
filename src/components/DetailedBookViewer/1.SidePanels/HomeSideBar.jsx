import React, { useEffect, useState } from "react";
import axios from "axios";
import { playlistPanelStyle } from "./styles";

/**
 * HomeSidebar
 *
 * Shows a 4-level nested plan:
 * 1) Session (Day X) -- expanded by default
 * 2) Book (Book: X) -- expanded by default
 * 3) Chapter (Chapter: X) -- expanded by default
 * 4) Sub-Chapter (Sub-Chapter: X) -- collapsed by default (user must click)
 *
 * Props:
 *  - planId: string (the Firestore doc ID)
 *  - backendURL: string (default "http://localhost:3001")
 *  - onHomeSelect: function(activity) => void
 *  - onOpenPlayer: function(planId, activity) => void  // <-- NEW to open the AdaptivePlayer
 *  - colorScheme: optional styling overrides
 */
export default function HomeSidebar({
  planId,
  backendURL = "http://localhost:3001",
  onHomeSelect = () => {},
  onOpenPlayer = () => {},   // NEW
  colorScheme = {},
}) {
  const [plan, setPlan] = useState(null);

  // State controlling expand/collapse for each hierarchy level
  const [expandedSessions, setExpandedSessions] = useState([]);
  const [expandedBooks, setExpandedBooks] = useState([]);
  const [expandedChapters, setExpandedChapters] = useState([]);
  const [expandedSubs, setExpandedSubs] = useState([]); // sub-chapters collapsed by default

  // 1) Fetch plan
  useEffect(() => {
    if (!planId) return;
    async function fetchPlanData() {
      try {
        const res = await axios.get(`${backendURL}/api/adaptive-plan`, {
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
  }, [planId, backendURL]);

  // 2) Once we have plan, expand sessions, books, chapters by default
  //    (sub-chapters remain collapsed)
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
        for (const [chapterId, chapActs] of chapterMap.entries()) {
          const cKey = `S-${sessionLabel}-B-${bookId}-C-${chapterId}`;
          chapterKeys.push(cKey);
        }
      }
    }

    setExpandedSessions(sessionKeys);
    setExpandedBooks(bookKeys);
    setExpandedChapters(chapterKeys);
    // setExpandedSubs([]); // sub-chapters remain collapsed
  }, [plan]);

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

  // Shared style for each expandable header level
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
        <h2 style={headingStyle}>Home Plan</h2>
        <div>Loading plan data...</div>
      </div>
    );
  }

  const { sessions = [] } = plan;

  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>Home Plan</h2>
      {sessions.map((sess) => {
        const { sessionLabel, activities = [] } = sess;
        const sessionKey = `S-${sessionLabel}`;
        const isSessionExpanded = expandedSessions.includes(sessionKey);

        // Sum up total time in this session
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

            {/* Render the books inside this session if expanded */}
            {isSessionExpanded && renderBooksInSession(activities, sessionLabel)}
          </div>
        );
      })}
    </div>
  );

  // ============= TOGGLE HANDLERS ====================
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

  // ********** 1) GROUP ACTIVITIES BY BOOK **********
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

      // Compute total time for this book
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

  // ********** 2) GROUP ACTIVITIES BY CHAPTER **********
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

      // Sum time for this chapter
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

  // ********** 3) GROUP ACTIVITIES BY SUB-CHAPTER **********
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

      // Sum time for sub-chapter
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

  // ********** 4) ACTIVITY ITEMS (READ, QUIZ, REVISE) **********
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
          justifyContent: "space-between", // so we can put a "Play" button on the right
        }}
      >
        {/* Left side: click to do onHomeSelect */}
        <div
          style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
          onClick={() => onHomeSelect(act)}
        >
          <div style={{ fontWeight: "bold", marginRight: "8px" }}>{act.type}:</div>
          <div>{act.subChapterName || act.subChapterId}</div>
          <div style={{ marginLeft: "12px", fontSize: "0.85rem" }}>
            {act.timeNeeded || 0} min
          </div>
        </div>

        {/* Right side: "Play" button to open the modal */}
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
            e.stopPropagation(); // prevent the parent div's onClick
            console.log("Play button clicked", planId, act); // <--- debug logging
            onOpenPlayer(planId, act,"/api/adaptive-plan");
          }}
        >
          Play
        </button>
      </div>
    );
  }
}

// Utility: Decide background color by activity type
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