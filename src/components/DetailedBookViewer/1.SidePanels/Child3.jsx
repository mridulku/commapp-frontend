import React, { useEffect, useState } from "react";
import axios from "axios";

/**
 * Child3 (HomeSidebar logic)
 *
 * Similar structure to OverviewSidebar, but it uses a single "planId"
 * instead of an array of planIds.
 *
 * Props:
 * - userId (string) <-- NEW: so we can fetch plan by (userId, bookId)
 * - planId (string) (still supported)
 * - backendURL (string) - e.g. import.meta.env.VITE_BACKEND_URL
 * - onHomeSelect(activity) => void
 * - onOpenPlayer(planId, activity, fetchUrl) => void
 * - colorScheme (object)
 */

export default function Child3({
  userId = null,
  planId: initialPlanId,         // renamed prop to avoid confusion with local planId
  backendURL = "http://localhost:3001",
  onHomeSelect = () => {},
  onOpenPlayer = () => {},
  colorScheme = {},
}) {
  // -------------------------------------------------------------------------
  // 1) NEW: We’ll keep a local planId, so we can either use the prop or override it
  // -------------------------------------------------------------------------
  const [planId, setPlanId] = useState(initialPlanId || "");

  // For the new Book ID input
  const [bookId, setBookId] = useState("");

  // The fetched plan doc
  const [plan, setPlan] = useState(null);

  // Expanded/collapsed states
  const [expandedSessions, setExpandedSessions] = useState([]);
  const [expandedBooks, setExpandedBooks] = useState([]);
  const [expandedChapters, setExpandedChapters] = useState([]);
  const [expandedSubs, setExpandedSubs] = useState([]);

  // -------------------------------------------------------------------------
  // 2) If the prop changes, update local planId
  // -------------------------------------------------------------------------
  useEffect(() => {
    setPlanId(initialPlanId || "");
  }, [initialPlanId]);

  // -------------------------------------------------------------------------
  // 3) Whenever we have a planId, fetch that single plan
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!planId) {
      setPlan(null);
      return;
    }

    async function fetchPlanData() {
      try {
        const res = await axios.get(`${backendURL}/api/adaptive-plan`, {
          params: { planId },
        });
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
    fetchPlanData();
  }, [planId, backendURL]);

  // -------------------------------------------------------------------------
  // 4) Auto-expand sessions/books/chapters (sub-chapters remain collapsed)
  // -------------------------------------------------------------------------
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

      const bookMap = new Map();
      for (const act of activities) {
        if (!bookMap.has(act.bookId)) {
          bookMap.set(act.bookId, []);
        }
        bookMap.get(act.bookId).push(act);
      }
      for (const [bId, bookActs] of bookMap.entries()) {
        const bKey = `S-${sessionLabel}-B-${bId}`;
        bookKeys.push(bKey);

        const chapterMap = new Map();
        for (const a of bookActs) {
          if (!chapterMap.has(a.chapterId)) {
            chapterMap.set(a.chapterId, []);
          }
          chapterMap.get(a.chapterId).push(a);
        }
        for (const [chapterId] of chapterMap.entries()) {
          const cKey = `S-${sessionLabel}-B-${bId}-C-${chapterId}`;
          chapterKeys.push(cKey);
        }
      }
    }
    setExpandedSessions(sessionKeys);
    setExpandedBooks(bookKeys);
    setExpandedChapters(chapterKeys);
    setExpandedSubs([]);
  }, [plan]);

  // -------------------------------------------------------------------------
  // 5) NEW: Handler to fetch a plan ID from `/api/adaptive-plan-id?userId=xxx&bookId=yyy`
  // -------------------------------------------------------------------------
  const handleFetchPlanIdByBook = async () => {
    if (!userId || !bookId) {
      alert("Please enter both userId and bookId.");
      return;
    }

    try {
      // This endpoint should return { success: true, planIds: [...] }
      const url = `${backendURL}/api/home-plan-id`;
      const res = await axios.get(url, {
        params: { userId, bookId },
      });
      if (res.data && res.data.planIds && res.data.planIds.length > 0) {
        // Just pick the *first* plan ID for Child3
        setPlanId(res.data.planIds[0]);
      } else {
        console.warn("No planIds found for this user/book:", res.data);
        setPlanId("");
        setPlan(null);
      }
    } catch (error) {
      console.error("Error fetching plan IDs by bookId:", error);
      setPlanId("");
      setPlan(null);
    }
  };

  // -------------------------------------------------------------------------
  // 6) Styles
  // -------------------------------------------------------------------------
  const containerStyle = {
    backgroundColor: colorScheme.panelBg || "#0D0D0D",
    color: colorScheme.textColor || "#FFFFFF",
    padding: "20px",
    borderRight: `1px solid ${colorScheme.borderColor || "#3A3A3A"}`,
    overflowY: "auto",
  };

  const headingStyle = {
    fontWeight: "bold",
    marginBottom: "15px",
    fontSize: "1rem",
    color: colorScheme.heading || "#BB86FC",
  };

  const baseHeaderStyle = {
    width: "100%",
    cursor: "pointer",
    padding: "8px 10px",
    marginBottom: "6px",
    backgroundColor: "#2F2F2F",
    border: `1px solid ${colorScheme.borderColor || "#3A3A3A"}`,
    borderRadius: "4px",
    color: colorScheme.textColor || "#FFFFFF",
    transition: "background-color 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const activityStyle = {
    width: "100%",
    marginBottom: "6px",
    padding: "6px 10px",
    borderRadius: "4px",
    border: `1px solid ${colorScheme.borderColor || "#3A3A3A"}`,
    backgroundColor: "#3D3D3D",
    color: colorScheme.textColor || "#FFFFFF",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };

  const truncatedTextStyle = {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: "180px",
  };

  // -------------------------------------------------------------------------
  // 7) Render
  // -------------------------------------------------------------------------
  // If no planId yet, or user can override by fetching planId from bookId
  if (!planId && !plan) {
    return (
      <div style={containerStyle}>
        <h2 style={headingStyle}>Home Plan</h2>

        {/* (A) Book ID + "Fetch Plan" UI */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ marginRight: 5 }}>Book ID:</label>
          <input
            type="text"
            value={bookId}
            onChange={(e) => setBookId(e.target.value)}
            placeholder="Enter Book ID"
            style={{ marginRight: 8 }}
          />
          <button onClick={handleFetchPlanIdByBook}>Fetch Plan by Book</button>
        </div>

        <p>No planId provided, and no plan loaded.</p>
      </div>
    );
  }

  // If we have a planId but plan is not loaded yet
  if (planId && !plan) {
    return (
      <div style={containerStyle}>
        <h2 style={headingStyle}>Home Plan</h2>

        {/* (A) Book ID + "Fetch Plan" UI */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ marginRight: 5 }}>Book ID:</label>
          <input
            type="text"
            value={bookId}
            onChange={(e) => setBookId(e.target.value)}
            placeholder="Enter Book ID"
            style={{ marginRight: 8 }}
          />
          <button onClick={handleFetchPlanIdByBook}>Fetch Plan by Book</button>
        </div>

        <p>Loading plan data...</p>
      </div>
    );
  }

  // If plan is loaded
  if (plan) {
    const { sessions = [] } = plan;

    return (
      <div style={containerStyle}>
        <h2 style={headingStyle}>Home Plan</h2>

        {/* (A) Book ID + "Fetch Plan" UI */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ marginRight: 5 }}>Book ID:</label>
          <input
            type="text"
            value={bookId}
            onChange={(e) => setBookId(e.target.value)}
            placeholder="Enter Book ID"
            style={{ marginRight: 8 }}
          />
          <button onClick={handleFetchPlanIdByBook}>Fetch Plan by Book</button>
        </div>

        {/* Render the plan structure (sessions -> books -> chapters -> subchapters) */}
        {sessions.map((sess) => {
          const { sessionLabel, activities = [] } = sess;
          const sessionKey = `S-${sessionLabel}`;
          const isSessionExpanded = expandedSessions.includes(sessionKey);
          const totalTime = activities.reduce((acc, a) => acc + (a.timeNeeded || 0), 0);
          const sessionText = `Day ${sessionLabel} — ${totalTime} min`;

          return (
            <div key={sessionLabel}>
              <div
                style={baseHeaderStyle}
                onClick={() => toggleSession(sessionKey)}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#505050";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "#2F2F2F";
                }}
                title={sessionText}
              >
                <span style={truncatedTextStyle}>
                  {isSessionExpanded ? "▾" : "▸"} {sessionText}
                </span>
              </div>

              {isSessionExpanded && renderBooksInSession(activities, sessionLabel)}
            </div>
          );
        })}
      </div>
    );
  }

  // Otherwise, default fallback (shouldn’t get here if all branches are covered)
  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>Home Plan</h2>
      <p>No plan available.</p>
    </div>
  );

  // -------------------------------------------------------------------------
  // Toggle Handlers
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Render Helpers
  // -------------------------------------------------------------------------
  function renderBooksInSession(activities, sessionLabel) {
    const bookMap = new Map();
    for (const act of activities) {
      if (!bookMap.has(act.bookId)) {
        bookMap.set(act.bookId, []);
      }
      bookMap.get(act.bookId).push(act);
    }

    return Array.from(bookMap.entries()).map(([bookId, bookActs]) => {
      const bKey = `S-${sessionLabel}-B-${bookId}`;
      const isBookExpanded = expandedBooks.includes(bKey);

      const totalBookTime = bookActs.reduce((acc, a) => acc + (a.timeNeeded || 0), 0);
      const bookName = bookActs[0]?.bookName || `Book (${bookId})`;
      const bookText = `Book: ${bookName} — ${totalBookTime} min`;

      return (
        <div key={bookId} style={{ marginLeft: "1rem" }}>
          <div
            style={baseHeaderStyle}
            onClick={() => toggleBook(bKey)}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#505050";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#2F2F2F";
            }}
            title={bookText}
          >
            <span style={truncatedTextStyle}>
              {isBookExpanded ? "▾" : "▸"} {bookText}
            </span>
          </div>

          {isBookExpanded && renderChaptersInBook(bookActs, sessionLabel, bookId)}
        </div>
      );
    });
  }

  function renderChaptersInBook(activities, sessionLabel, bookId) {
    const chapterMap = new Map();
    for (const act of activities) {
      if (!chapterMap.has(act.chapterId)) {
        chapterMap.set(act.chapterId, []);
      }
      chapterMap.get(act.chapterId).push(act);
    }

    return Array.from(chapterMap.entries()).map(([chapterId, chapterActs]) => {
      const cKey = `S-${sessionLabel}-B-${bookId}-C-${chapterId}`;
      const isChapterExpanded = expandedChapters.includes(cKey);

      const totalChapterTime = chapterActs.reduce((acc, a) => acc + (a.timeNeeded || 0), 0);
      const chapterName = chapterActs[0]?.chapterName || `Chapter (${chapterId})`;
      const chapterText = `Chapter: ${chapterName} — ${totalChapterTime} min`;

      return (
        <div key={chapterId} style={{ marginLeft: "1.5rem" }}>
          <div
            style={baseHeaderStyle}
            onClick={() => toggleChapter(cKey)}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#505050";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#2F2F2F";
            }}
            title={chapterText}
          >
            <span style={truncatedTextStyle}>
              {isChapterExpanded ? "▾" : "▸"} {chapterText}
            </span>
          </div>

          {isChapterExpanded &&
            renderSubChapters(chapterActs, sessionLabel, bookId, chapterId)}
        </div>
      );
    });
  }

  function renderSubChapters(activities, sessionLabel, bookId, chapterId) {
    const subMap = new Map();
    for (const act of activities) {
      if (!subMap.has(act.subChapterId)) {
        subMap.set(act.subChapterId, []);
      }
      subMap.get(act.subChapterId).push(act);
    }

    return Array.from(subMap.entries()).map(([subId, subActs]) => {
      const subKey = `S-${sessionLabel}-B-${bookId}-C-${chapterId}-SUB-${subId}`;
      const isSubExpanded = expandedSubs.includes(subKey);

      const totalSubTime = subActs.reduce((acc, a) => acc + (a.timeNeeded || 0), 0);
      const subName = subActs[0]?.subChapterName || `Sub-Chapter (${subId})`;
      const subText = `Sub-Chapter: ${subName} — ${totalSubTime} min`;

      return (
        <div key={subId} style={{ marginLeft: "2rem" }}>
          <div
            style={baseHeaderStyle}
            onClick={() => toggleSub(subKey)}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#505050";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#2F2F2F";
            }}
            title={subText}
          >
            <span style={truncatedTextStyle}>
              {isSubExpanded ? "▾" : "▸"} {subText}
            </span>
          </div>

          {isSubExpanded && (
            <div style={{ marginLeft: "2.5rem" }}>
              {subActs.map((act, idx) => renderActivity(act, idx))}
            </div>
          )}
        </div>
      );
    });
  }

  function renderActivity(act, idx) {
    const key = `activity-${act.bookId}-${act.chapterId}-${act.subChapterId}-${idx}`;
    const label = `${act.type}: ${act.subChapterName || act.subChapterId} (${act.timeNeeded || 0} min)`;

    return (
      <div key={key} style={activityStyle} title={label}>
        {/* onHomeSelect => click the row */}
        <div
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            ...truncatedTextStyle,
          }}
          onClick={() => onHomeSelect(act)}
        >
          <span style={{ fontWeight: "bold", marginRight: "6px" }}>{act.type}:</span>
          <span>{act.subChapterName || act.subChapterId}</span>
          <span style={{ marginLeft: "8px", fontSize: "0.8rem" }}>
            {act.timeNeeded || 0} min
          </span>
        </div>

        {/* "Play" button => cinematic player */}
        <button
          style={{
            backgroundColor: colorScheme.heading || "#BB86FC",
            color: "#000",
            border: "none",
            borderRadius: "4px",
            padding: "4px 8px",
            cursor: "pointer",
            fontWeight: "bold",
            marginLeft: "10px",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onOpenPlayer(planId, act, "/api/adaptive-plan");
          }}
        >
          Play
        </button>
      </div>
    );
  }
}