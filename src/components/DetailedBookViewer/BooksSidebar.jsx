/********************************************
 * BooksSidebar.jsx
 ********************************************/
import React from "react";

function BooksSidebar({
  categories,
  selectedCategory,
  onCategoryChange,
  booksData,
  expandedBookName,
  expandedChapterName,
  toggleBookExpansion,
  toggleChapterExpansion,
  handleBookClick,
  handleChapterClick,
  handleSubChapterClick,
}) {
  // Styles for the sidebar and items
  const sidebarStyle = {
    width: "300px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(8px)",
    padding: "20px",
    borderRight: "2px solid rgba(255,255,255,0.2)",
    overflowY: "auto",
  };

  const dropdownContainerStyle = {
    marginBottom: "20px",
  };

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

  const chapterTitleStyle = {
    cursor: "pointer",
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

  return (
    <div style={sidebarStyle}>
      {/* Category Dropdown */}
      <div style={dropdownContainerStyle}>
        <label
          htmlFor="categorySelect"
          style={{ marginRight: "10px", color: "#fff" }}
        >
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

      {/* Books, chapters, subchapters */}
      <div>
        <div style={listHeaderStyle}>Books</div>
        {booksData.map((book) => {
          const isBookExpanded = expandedBookName === book.bookName;
          return (
            <div key={book.bookName}>
              <div
                style={bookTitleStyle}
                onClick={() => {
                  handleBookClick(book);
                  toggleBookExpansion(book.bookName);
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                {book.bookName}
              </div>

              {/* Chapters */}
              {isBookExpanded &&
                book.chapters.map((chapter) => {
                  const isChapterExpanded =
                    expandedChapterName === chapter.chapterName;
                  return (
                    <div key={chapter.chapterName}>
                      <div
                        style={chapterTitleStyle}
                        onClick={() => {
                          handleChapterClick(chapter);
                          toggleChapterExpansion(chapter.chapterName);
                        }}
                        onMouseOver={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "rgba(255,255,255,0.2)")
                        }
                        onMouseOut={(e) =>
                          (e.currentTarget.style.backgroundColor = "transparent")
                        }
                      >
                        {chapter.chapterName}
                      </div>

                      {/* SubChapters */}
                      {isChapterExpanded &&
                        chapter.subChapters.map((subChap) => (
                          <div
                            key={subChap.subChapterName}
                            style={subChapterTitleStyle}
                            onClick={() => handleSubChapterClick(subChap)}
                            onMouseOver={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "rgba(255,255,255,0.2)")
                            }
                            onMouseOut={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "transparent")
                            }
                          >
                            {subChap.subChapterName}
                            {subChap.isDone && (
                              <span style={doneBadgeStyle}>(Done)</span>
                            )}
                          </div>
                        ))}
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