import React, { useEffect, useState } from "react";
import axios from "axios";

/**
 * Child2
 *
 * This is the “sorted plan” component originally from 1.OverviewSidebar.
 *
 * Props:
 *  - userId: string (the user ID, e.g. from Firebase Auth)
 *  - planIds: string[] (array of plan IDs, e.g. from Firestore) [existing functionality]
 *  - onOverviewSelect: function(activity) => void
 *  - onOpenPlayer: function(planId, activity, fetchUrl) => void
 *  - colorScheme: optional styling overrides { panelBg, textColor, borderColor, heading }
 */
export default function Child2({
  userId = null,
  planIds = [],
  onOverviewSelect = () => {},
  onOpenPlayer = () => {},
  colorScheme = {},
}) {
  // ----------------------------------------------------------------------------------
  // 1) NEW: Local planIds state + a Book ID text input
  // ----------------------------------------------------------------------------------
  const [localPlanIds, setLocalPlanIds] = useState(planIds); // default from props
  const [bookId, setBookId] = useState("");

  // Whenever the parent prop "planIds" changes, update localPlanIds
  useEffect(() => {
    setLocalPlanIds(planIds);
  }, [planIds]);

  // ----------------------------------------------------------------------------------
  // 2) Existing: Which planId is currently selected
  // ----------------------------------------------------------------------------------
  const [selectedPlanId, setSelectedPlanId] = useState("");

  // Whenever localPlanIds changes, pick the first one as default (if any)
  useEffect(() => {
    if (localPlanIds.length > 0) {
      setSelectedPlanId(localPlanIds[0]);
    } else {
      setSelectedPlanId("");
      setPlan(null);
    }
  }, [localPlanIds]);

  // ----------------------------------------------------------------------------------
  // 3) Fetch plan data for the currently selected planId
  // ----------------------------------------------------------------------------------
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    if (!selectedPlanId) {
      setPlan(null);
      return;
    }

    async function fetchPlanData() {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/adaptive-plan`, {
          params: { planId: selectedPlanId },
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
  }, [selectedPlanId]);

  // ----------------------------------------------------------------------------------
  // 4) Once plan is fetched, auto-expand sessions/books/chapters
  // ----------------------------------------------------------------------------------
  const [expandedSessions, setExpandedSessions] = useState([]);
  const [expandedBooks, setExpandedBooks] = useState([]);
  const [expandedChapters, setExpandedChapters] = useState([]);
  const [expandedSubs, setExpandedSubs] = useState([]); // sub-chapters collapsed by default

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

      for (const [bId, bActs] of bookMap.entries()) {
        const bKey = `S-${sessionLabel}-B-${bId}`;
        bookKeys.push(bKey);

        // Group by chapter
        const chapterMap = new Map();
        for (const a of bActs) {
          if (!chapterMap.has(a.chapterId)) {
            chapterMap.set(a.chapterId, []);
          }
          chapterMap.get(a.chapterId).push(a);
        }
        for (const [cId] of chapterMap.entries()) {
          const cKey = `S-${sessionLabel}-B-${bId}-C-${cId}`;
          chapterKeys.push(cKey);
        }
      }
    }

    setExpandedSessions(sessionKeys);
    setExpandedBooks(bookKeys);
    setExpandedChapters(chapterKeys);
    setExpandedSubs([]);
  }, [plan]);

  // ----------------------------------------------------------------------------------
  // 5) NEW: Handler to fetch planIds from `/api/home-plan-id?userId=xxx&bookId=yyy`
  // ----------------------------------------------------------------------------------
  const handleFetchPlansByBook = async () => {
    if (!userId || !bookId) {
      alert("Please enter both userId and bookId.");
      return;
    }
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/adaptive-plan-id`, {
        params: {
          userId,
          bookId,
        },
      });
      if (res.data && res.data.planIds) {
        setLocalPlanIds(res.data.planIds); // Overwrite localPlanIds with the server result
      } else {
        console.warn("No planIds in response:", res.data);
        setLocalPlanIds([]);
      }
    } catch (error) {
      console.error("Error fetching plan IDs by book:", error);
      setLocalPlanIds([]);
    }
  };

  // ----------------------------------------------------------------------------------
  // 6) Styles
  // ----------------------------------------------------------------------------------
  const containerStyle = {
    backgroundColor: colorScheme.panelBg || "#0D0D0D",
    color: colorScheme.textColor || "#FFD700",
    padding: "1rem",
  };

  const headingStyle = {
    fontWeight: "bold",
    marginBottom: "15px",
    fontSize: "1rem",
    color: colorScheme.heading || "#FFD700",
  };

  const baseHeaderStyle = {
    width: "100%",
    cursor: "pointer",
    padding: "8px 10px",
    marginBottom: "6px",
    backgroundColor: "#2F2F2F",
    border: `1px solid ${colorScheme.borderColor || "#FFD700"}`,
    borderRadius: "4px",
    color: colorScheme.textColor || "#FFD700",
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
    border: `1px solid ${colorScheme.borderColor || "#FFD700"}`,
    backgroundColor: "#3D3D3D",
    color: colorScheme.textColor || "#FFD700",
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

  // ----------------------------------------------------------------------------------
  // 7) Render states
  // ----------------------------------------------------------------------------------

  // If we have no localPlanIds and no plan is loaded
  if (localPlanIds.length === 0 && !plan) {
    return (
      <div style={containerStyle}>
        <h2 style={headingStyle}>Overview Plan</h2>

        {/* (A) Book ID + "Fetch Plans" UI */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ marginRight: 5 }}>Book ID:</label>
          <input
            type="text"
            value={bookId}
            onChange={(e) => setBookId(e.target.value)}
            placeholder="Enter Book ID"
            style={{ marginRight: 8 }}
          />
          <button onClick={handleFetchPlansByBook}>Fetch Plans by Book</button>
        </div>

        <div>No Plan IDs provided. (Either pass via props or fetch by Book ID.)</div>
      </div>
    );
  }

  // If we do have localPlanIds (or plan from the fallback scenario)
  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>Overview Plan</h2>

      {/* (A) Book ID + "Fetch Plans" UI */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ marginRight: 5 }}>Book ID:</label>
        <input
          type="text"
          value={bookId}
          onChange={(e) => setBookId(e.target.value)}
          placeholder="Enter Book ID"
          style={{ marginRight: 8 }}
        />
        <button onClick={handleFetchPlansByBook}>Fetch Plans by Book</button>
      </div>

      {/* (B) If we have plan IDs, show the dropdown */}
      {localPlanIds.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ marginRight: 5 }}>Plan ID:</label>
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

      {/* (C) Render "loading" or plan detail */}
      {!selectedPlanId ? (
        <div>No Plan ID selected.</div>
      ) : !plan ? (
        <div>Loading plan data...</div>
      ) : (
        <div>
          {/* 8) Now we have "plan" => Render the sessions/books/chapters exactly like before */}
          {renderPlanStructure(plan)}
        </div>
      )}
    </div>
  );

  // ----------------------------------------------------------------------------------
  // 8) The existing plan structure rendering (sessions -> books -> chapters -> subchapters)
  // ----------------------------------------------------------------------------------
  function renderPlanStructure(planObj) {
    const { sessions = [] } = planObj;

    return sessions.map((sess) => {
      const { sessionLabel, activities = [] } = sess;
      const sessionKey = `S-${sessionLabel}`;
      const isSessionExpanded = expandedSessions.includes(sessionKey);

      // Calculate total time in this session
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
    });
  }

  // ----------------- TOGGLE HANDLERS -----------------
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

  // ----------------- RENDER HELPERS -----------------
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

      // Summation of time in this book group
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
    const label = `${act.type}: ${act.subChapterName || act.subChapterId} (${
      act.timeNeeded || 0
    } min)`;

    return (
      <div key={key} style={activityStyle} title={label}>
        {/* Left side: click => onOverviewSelect */}
        <div
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            ...truncatedTextStyle,
          }}
          onClick={() => onOverviewSelect(act)}
        >
          <span style={{ fontWeight: "bold", marginRight: "6px" }}>{act.type}:</span>
          <span>{act.subChapterName || act.subChapterId}</span>
          <span style={{ marginLeft: "8px", fontSize: "0.8rem" }}>
            {act.timeNeeded || 0} min
          </span>
        </div>

        {/* Right side: "Play" button => call parent's onOpenPlayer */}
        <button
          style={{
            backgroundColor: colorScheme.heading || "#FFD700",
            color: "#000",
            border: "none",
            borderRadius: "4px",
            padding: "4px 8px",
            cursor: "pointer",
            fontWeight: "bold",
            marginLeft: "10px",
          }}
          onClick={(e) => {
            e.stopPropagation(); // don’t trigger the onOverviewSelect
            onOpenPlayer(selectedPlanId, act, "/api/adaptive-plan");
          }}
        >
          Play
        </button>
      </div>
    );
  }
}