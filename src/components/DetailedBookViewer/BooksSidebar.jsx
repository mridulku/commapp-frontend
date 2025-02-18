/********************************************
 * BooksSidebar.jsx (Multi-chapter expand/collapse + highlight)
 ********************************************/
import React from "react";

function BooksSidebar({
  categories,
  selectedCategory,
  onCategoryChange,
  booksData,

  // Single expanded book (if you want only one book at a time)
  expandedBookName,
  toggleBookExpansion,

  // Multi-chapter expansions
  expandedChapters,         // an array of strings or IDs
  toggleChapterExpansion,   // function that adds/removes the chapter from expandedChapters

  // For selecting a subchapter
  handleBookClick,
  handleChapterClick,
  handleSubChapterClick,

  selectedSubChapter,
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

  // We’ll manually create an expand/collapse icon or text for each chapter
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
      {/* Category Dropdown */}
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

      {/* Books */}
      <div>
        <div style={listHeaderStyle}>Books</div>

        {booksData.map((book) => {
          // If you want only one book expanded at a time, keep using expandedBookName logic:
          const isBookExpanded = expandedBookName === book.bookName;

          return (
            <div key={book.bookName}>
              {/* Book Title */}
              <div
                style={bookTitleStyle}
                onClick={() => {
                  // Possibly set this book as "selectedBook"
                  handleBookClick(book);
                  // Expand/collapse the book
                  toggleBookExpansion(book.bookName);
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                {book.bookName}
              </div>

              {/* Chapters (only render if this book is expanded) */}
              {isBookExpanded && book.chapters.map((chapter) => {
                // Create a unique "key" for the chapter
                // If you have a chapterId, you can use that instead
                const chapterKey = `${book.bookName}||${chapter.chapterName}`;

                // Check if it's in expandedChapters
                const isChapterExpanded = expandedChapters.includes(chapterKey);

                return (
                  <div key={chapter.chapterName}>
                    {/* Chapter Title Row */}
                    <div
                      style={chapterTitleContainerStyle}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)")}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      {/* Expand/Collapse icon */}
                      <span
                        style={{ cursor: "pointer", fontWeight: "bold" }}
                        onClick={(e) => {
                          e.stopPropagation(); // stop from triggering handleChapterClick
                          toggleChapterExpansion(chapterKey);
                        }}
                      >
                        {isChapterExpanded ? "-" : "+"}
                      </span>

                      {/* Chapter name text (click to 'select' the chapter, if you want) */}
                      <span
                        style={{ cursor: "pointer", flex: 1 }}
                        onClick={() => handleChapterClick(chapter)}
                      >
                        {chapter.chapterName}
                      </span>
                    </div>

                    {/* SubChapters - visible if isChapterExpanded */}
                    {isChapterExpanded && chapter.subChapters.map((subChap) => {
                      // Compare subChapterId to highlight if selected
                      const isSelected =
                        selectedSubChapter &&
                        selectedSubChapter.subChapterId === subChap.subChapterId;

                      const highlightStyle = {
                        backgroundColor: isSelected ? "rgba(255,215,0,0.4)" : "transparent",
                      };

                      return (
                        <div
                          key={subChap.subChapterId || subChap.subChapterName}
                          style={{ ...subChapterTitleStyle, ...highlightStyle }}
                          onClick={() => handleSubChapterClick(subChap)}
                          onMouseOver={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)";
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