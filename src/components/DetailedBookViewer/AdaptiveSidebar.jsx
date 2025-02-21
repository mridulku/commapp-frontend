/********************************************
 * AdaptiveSidebar.jsx
 * - Shows the same "Library"/"Adaptive" toggle at the top.
 * - Groups subchapters by session => book => chapter.
 * - Allows expand/collapse at the session level.
 * - Displays proficiency status as a small colored block to the right.
 ********************************************/
import React, { useState } from "react";

function AdaptiveSidebar({
  // Same top-level props as your BooksSidebar
  categories,
  selectedCategory,
  onCategoryChange,

  // The "adaptive" subset of data. Usually you'd pass the filtered data here.
  booksData,

  // For highlighting or selecting a subchapter
  handleSubChapterClick,
  selectedSubChapter,

  // Mode + setter so we can switch back to library
  viewMode,
  setViewMode,
}) {
  // ---------- Local state for expand/collapse of sessions ----------
  const [expandedSessions, setExpandedSessions] = useState([]);

  // ---------- STYLES ----------
  const sidebarStyle = {
    width: "300px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(8px)",
    padding: "20px",
    borderRight: "2px solid rgba(255,255,255,0.2)",
    overflowY: "auto",
  };

  const modeToggleContainerStyle = {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
  };

  const toggleButtonStyle = (active) => ({
    padding: "8px 16px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    background: active ? "#FFD700" : "transparent",
    color: active ? "#000" : "#fff",
    transition: "background-color 0.3s",
  });

  const dropdownContainerStyle = { marginBottom: "20px" };

  const headingStyle = {
    fontWeight: "bold",
    marginBottom: "10px",
    fontSize: "1.2rem",
    borderBottom: "1px solid rgba(255,255,255,0.2)",
    paddingBottom: "5px",
    color: "#fff",
  };

  const sessionHeaderStyle = {
    cursor: "pointer",
    padding: "8px",
    borderRadius: "6px",
    marginBottom: "6px",
    transition: "background-color 0.3s",
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: "rgba(255,255,255,0.15)",
    marginTop: "10px",
  };

  const bookTitleStyle = {
    fontWeight: "bold",
    marginLeft: "15px",
    color: "#FFD700",
    marginTop: "8px",
  };

  const chapterTitleStyle = {
    marginLeft: "30px",
    color: "#fff",
    marginTop: "4px",
  };

  const subChapterTitleStyle = {
    cursor: "pointer",
    padding: "4px 20px",
    borderRadius: "6px",
    marginLeft: "45px",
    fontSize: "0.9rem",
    transition: "background-color 0.3s",
    color: "#fff",
    marginTop: "2px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between", // so status block can be on the right
  };

  // A little style for the subchapter's proficiency block
  const profBlockBase = {
    display: "inline-block",
    marginLeft: "8px",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "0.8rem",
    fontWeight: "bold",
    color: "#000", // since we might use bright backgrounds
  };

  // ---------- Build the Session → Book → Chapter groupings ----------
  const sessionsMap = groupBySessionBookChapter(booksData);

  return (
    <div style={sidebarStyle}>
      {/* 1) Mode Toggle: let user go back to library */}
      <div style={modeToggleContainerStyle}>
        <button
          style={toggleButtonStyle(viewMode === "library")}
          onClick={() => setViewMode("library")}
        >
          Library
        </button>
        <button
          style={toggleButtonStyle(viewMode === "adaptive")}
          onClick={() => setViewMode("adaptive")}
        >
          Adaptive
        </button>
      </div>

      {/* 2) Category Dropdown */}
      <div style={dropdownContainerStyle}>
        <label htmlFor="categorySelect" style={{ marginRight: "10px", color: "#fff" }}>
          Select Category:
        </label>
        <select
          id="categorySelect"
          onChange={onCategoryChange}
          value={selectedCategory || ""}
          style={{ padding: "5px 10px", borderRadius: "4px", fontSize: "16px" }}
        >
          {categories.map((cat) => (
            <option key={cat.categoryId} value={cat.categoryId}>
              {cat.categoryName}
            </option>
          ))}
        </select>
      </div>

      {/* 3) Heading for "Adaptive Sessions" */}
      <div style={headingStyle}>Adaptive Sessions</div>

      {/* 4) Render each Session as an expandable panel */}
      {Object.keys(sessionsMap)
        .sort((a, b) => sortSessionKeys(a, b))
        .map((sessionKey) => {
          const isExpanded = expandedSessions.includes(sessionKey);

          return (
            <div key={sessionKey}>
              {/* Session Header */}
              <div
                style={sessionHeaderStyle}
                onClick={() => toggleSession(sessionKey)}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.3)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)";
                }}
              >
                <span style={{ marginRight: "8px" }}>
                  {isExpanded ? "-" : "+"}
                </span>
                {sessionKey}
              </div>

              {/* If expanded, show the Books -> Chapters -> Subchapters */}
              {isExpanded && renderSessionContent(sessionsMap[sessionKey])}
            </div>
          );
        })}
    </div>
  );

  // ---------- Helpers ----------

  function toggleSession(sessionKey) {
    setExpandedSessions((prev) =>
      prev.includes(sessionKey)
        ? prev.filter((s) => s !== sessionKey)
        : [...prev, sessionKey]
    );
  }

  function renderSessionContent(sessionData) {
    // sessionData => { bookName: { chapterName: [subChapters...] } }
    return Object.keys(sessionData).map((bookName) => {
      const chaptersObj = sessionData[bookName];

      return (
        <div key={bookName}>
          <div style={bookTitleStyle}>{bookName}</div>
          {Object.keys(chaptersObj).map((chapterName) => {
            const subChaps = chaptersObj[chapterName];
            return (
              <div key={chapterName}>
                <div style={chapterTitleStyle}>{chapterName}</div>
                {subChaps.map((subChap) => {
                  // highlight if selected
                  const isSelected =
                    selectedSubChapter &&
                    selectedSubChapter.subChapterId === subChap.subChapterId;

                  const highlightStyle = {
                    backgroundColor: isSelected
                      ? "rgba(255,215,0,0.4)"
                      : "transparent",
                  };

                  // We create a style for the subchapter container
                  const containerStyle = { ...subChapterTitleStyle, ...highlightStyle };

                  // Render the proficiency block
                  const { label: profLabel, bgColor } = getProficiencyInfo(subChap.proficiency);

                  return (
                    <div
                      key={subChap.subChapterId}
                      style={containerStyle}
                      onClick={() => handleSubChapterClick(subChap)}
                      onMouseOver={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor =
                            "rgba(255,255,255,0.2)";
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      <span>{subChap.subChapterName}</span>

                      {/* Right side: show proficiency block */}
                      <div
                        style={{
                          ...profBlockBase,
                          backgroundColor: bgColor,
                        }}
                      >
                        {profLabel}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      );
    });
  }
}

/** 
 * Returns an object with label + bgColor 
 * for the given proficiency value.
 */
function getProficiencyInfo(proficiency) {
  // If it is null or empty => "unread"
  if (!proficiency || proficiency.trim() === "") {
    return {
      label: "Unread",
      bgColor: "red",
    };
  }

  switch (proficiency) {
    case "reading":
      return {
        label: "Reading",
        bgColor: "yellow",
      };
    case "read":
      return {
        label: "Read",
        bgColor: "orange",
      };
    case "proficient":
      return {
        label: "Proficient",
        bgColor: "blue",
      };
    default:
      return {
        label: "Unread",
        bgColor: "red",
      };
  }
}

/**
 * Groups the `booksData` into a structure:
 * {
 *   [sessionKey]: {
 *      [bookName]: {
 *         [chapterName]: [array of subchapters]
 *      }
 *   }
 * }
 */
function groupBySessionBookChapter(booksData) {
  const sessionsMap = {};

  booksData.forEach((book) => {
    book.chapters.forEach((chapter) => {
      chapter.subChapters.forEach((sub) => {
        // e.g. sub.session = 1 => "Session 1"
        const sessionVal = sub.session ? `Session ${sub.session}` : "Session: None";

        if (!sessionsMap[sessionVal]) {
          sessionsMap[sessionVal] = {};
        }
        if (!sessionsMap[sessionVal][book.bookName]) {
          sessionsMap[sessionVal][book.bookName] = {};
        }
        if (!sessionsMap[sessionVal][book.bookName][chapter.chapterName]) {
          sessionsMap[sessionVal][book.bookName][chapter.chapterName] = [];
        }
        sessionsMap[sessionVal][book.bookName][chapter.chapterName].push(sub);
      });
    });
  });

  return sessionsMap;
}

/**
 * Example sorting function for session keys like "Session 1"
 */
function sortSessionKeys(a, b) {
  const numA = parseInt(a.replace(/\D+/g, ""), 10) || 0;
  const numB = parseInt(b.replace(/\D+/g, ""), 10) || 0;
  return numA - numB;
}

export default AdaptiveSidebar;