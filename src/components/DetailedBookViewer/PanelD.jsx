// src/components/DetailedBookViewer/PanelD.jsx
import React, { useState } from "react";

/**
 * PanelD: "Next Session Overview" 
 * Shows the same session → book → chapters → subChapters hierarchy
 * that AdaptiveSidebar shows, but in a panel layout.
 */
function PanelD({
  // same props you pass to AdaptiveSidebar
  categories,
  selectedCategory,
  onCategoryChange,
  booksData,
  handleSubChapterClick,
  selectedSubChapter,
}) {
  const [expandedSessions, setExpandedSessions] = useState([]);

  // ---------- STYLES (similar to Panels A, B, C) ----------
  const panelStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    padding: "20px",
    color: "#fff",
    overflowY: "auto",
    maxHeight: "100%",
  };

  const headingStyle = {
    fontWeight: "bold",
    marginBottom: "10px",
    fontSize: "1.2rem",
    borderBottom: "1px solid rgba(255,255,255,0.2)",
    paddingBottom: "5px",
    color: "#fff",
  };

  const dropdownContainerStyle = {
    marginBottom: "15px",
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
    justifyContent: "space-between",
  };

  const profBlockBase = {
    display: "inline-block",
    marginLeft: "8px",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "0.8rem",
    fontWeight: "bold",
    color: "#000",
  };

  // ---------- Build the Session → Book → Chapter groupings ----------
  const sessionsMap = groupBySessionBookChapter(booksData);

  return (
    <div style={panelStyle}>
      <h3 style={{ marginTop: 0 }}>Next Session Overview</h3>

      {/* Category Dropdown (optional) */}
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

      <div style={headingStyle}>Adaptive Sessions</div>

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
                <span style={{ marginRight: "8px" }}>{isExpanded ? "-" : "+"}</span>
                {sessionKey}
              </div>

              {/* If expanded, show Books -> Chapters -> SubChapters */}
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
                  const isSelected =
                    selectedSubChapter &&
                    selectedSubChapter.subChapterId === subChap.subChapterId;

                  const highlightStyle = {
                    backgroundColor: isSelected
                      ? "rgba(255,215,0,0.4)"
                      : "transparent",
                  };

                  const containerStyle = { ...subChapterTitleStyle, ...highlightStyle };

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

// ----- helper functions -----
function getProficiencyInfo(proficiency) {
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

function groupBySessionBookChapter(booksData) {
  const sessionsMap = {};

  booksData.forEach((book) => {
    book.chapters.forEach((chapter) => {
      chapter.subChapters.forEach((sub) => {
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

function sortSessionKeys(a, b) {
  const numA = parseInt(a.replace(/\D+/g, ""), 10) || 0;
  const numB = parseInt(b.replace(/\D+/g, ""), 10) || 0;
  return numA - numB;
}

export default PanelD;