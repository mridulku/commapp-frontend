// src/components/DetailedBookViewer/BooksSidebar.jsx
import React from "react";

function BooksSidebar({
  categories,
  selectedCategory,
  onCategoryChange,
  booksData,

  expandedBookName,
  toggleBookExpansion,

  expandedChapters,
  toggleChapterExpansion,

  handleBookClick,
  handleSubChapterClick,
  selectedSubChapter,

  // NEW: we have "overview" as a possible mode
  viewMode,
  setViewMode,
}) {
  // --------------- Styles ---------------
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

  const listHeaderStyle = {
    fontWeight: "bold",
    marginBottom: "10px",
    fontSize: "1.2rem",
    borderBottom: "1px solid rgba(255,255,255,0.2)",
    paddingBottom: "5px",
    color: "#fff",
  };

  const bookTitleStyle = {
    cursor: "pointer",
    padding: "8px",
    borderRadius: "6px",
    marginBottom: "6px",
    transition: "background-color 0.3s",
    fontWeight: "bold",
    color: "#fff",
  };

  const chapterTitleContainerStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 10px",
    borderRadius: "6px",
    marginBottom: "4px",
    marginLeft: "10px",
    fontSize: "0.95rem",
    transition: "background-color 0.3s",
    color: "#fff",
    cursor: "pointer", // entire row is clickable
  };

  const subChapterTitleStyle = {
    cursor: "pointer",
    padding: "4px 20px",
    borderRadius: "6px",
    marginBottom: "3px",
    marginLeft: "20px",
    fontSize: "0.9rem",
    transition: "background-color 0.3s",
    color: "#fff",
  };

  const doneBadgeStyle = {
    color: "#FFD700",
    marginLeft: "4px",
    fontWeight: "bold",
  };

  // --------------- Render ---------------
  return (
    <div style={sidebarStyle}>
      {/* 1) Mode Toggle: Library vs. Adaptive vs. Overview */}
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

        {/* NEW BUTTON: Overview */}
        <button
          style={toggleButtonStyle(viewMode === "overview")}
          onClick={() => setViewMode("overview")}
        >
          Overview
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

      {/* 3) Books (and chapters/subchapters) */}
      <div>
        <div style={listHeaderStyle}>Books</div>

        {booksData.map((book) => {
          const isBookExpanded = expandedBookName === book.bookName;

          return (
            <div key={book.bookName}>
              {/* Book Title */}
              <div
                style={bookTitleStyle}
                onClick={() => {
                  handleBookClick(book);
                  toggleBookExpansion(book.bookName);
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {book.bookName}
              </div>

              {/* Chapters (if book expanded) */}
              {isBookExpanded &&
                book.chapters.map((chapter) => {
                  const chapterKey = `${book.bookName}||${chapter.chapterName}`;
                  const isChapterExpanded = expandedChapters.includes(chapterKey);

                  return (
                    <div key={chapter.chapterName}>
                      {/* Chapter Row: entire row toggles expansion */}
                      <div
                        style={chapterTitleContainerStyle}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                        onClick={() => {
                          toggleChapterExpansion(chapterKey);
                        }}
                      >
                        {/* The +/- icon is purely visual now */}
                        <span style={{ fontWeight: "bold" }}>
                          {isChapterExpanded ? "-" : "+"}
                        </span>

                        <span style={{ flex: 1 }}>{chapter.chapterName}</span>
                      </div>

                      {/* SubChapters if expanded */}
                      {isChapterExpanded &&
                        chapter.subChapters.map((subChap) => {
                          const isSelected =
                            selectedSubChapter &&
                            selectedSubChapter.subChapterId === subChap.subChapterId;

                          const highlightStyle = {
                            backgroundColor: isSelected
                              ? "rgba(255,215,0,0.4)"
                              : "transparent",
                          };

                          return (
                            <div
                              key={subChap.subChapterId || subChap.subChapterName}
                              style={{ ...subChapterTitleStyle, ...highlightStyle }}
                              onClick={() => {
                                handleSubChapterClick(subChap);
                              }}
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
                              {subChap.subChapterName}
                              {subChap.isDone && <span style={doneBadgeStyle}>(Done)</span>}
                            </div>
                          );
                        })}
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BooksSidebar;