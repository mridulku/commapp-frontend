// src/components/DetailedBookViewer/PanelC.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";

function getRandomIcon() {
  const icons = ["📐", "🔬", "🏰", "🎨", "📚", "📝", "📊", "💻"];
  return icons[Math.floor(Math.random() * icons.length)];
}

function PanelC({ userId = "demoUser123" }) {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    if (!userId) return;

    async function fetchBooks() {
      try {
        // Adjust this to match your environment (e.g. VITE_BACKEND_URL)
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/books-user`,
          {
            params: { userId },
          }
        );
        if (res.data && res.data.success) {
          setBooks(res.data.data);
        } else {
          console.warn("No data or success=false fetching books:", res.data);
          setBooks([]);
        }
      } catch (err) {
        console.error("Error fetching books:", err);
        setBooks([]);
      }
    }

    fetchBooks();
  }, [userId]);

  // -------------------- Display Logic --------------------
  // We'll build a final array of "cards" that we want to render:
  //  - If no books => only "See All Courses" card
  //  - If 1-3 books => show them + "See All Courses" card
  //  - If 4 or more => show first 3 + "X more courses available" card
  const booksCount = books.length;
  let displayBooks = [];

  if (booksCount === 0) {
    // No books => single "See All Courses" card
    displayBooks = [
      {
        isSeeAll: true,
        title: "See All Courses",
        icon: "📚", // or any icon you prefer
        extraCoursesCount: 0,
      },
    ];
  } else if (booksCount < 4) {
    // 1-3 books => show each + one "See All Courses" card
    displayBooks = books.map((b) => ({
      isSeeAll: false,
      // if your doc has "bookName", otherwise adapt as needed
      title: b.bookName || "Untitled",
      icon: getRandomIcon(),
    }));
    displayBooks.push({
      isSeeAll: true,
      title: "See All Courses",
      icon: "📚",
      extraCoursesCount: 0,
    });
  } else {
    // 4 or more => show the first 3, plus "X more courses" tile
    const firstThree = books.slice(0, 3).map((b) => ({
      isSeeAll: false,
      title: b.bookName || "Untitled",
      icon: getRandomIcon(),
    }));
    const remaining = booksCount - 3;
    firstThree.push({
      isSeeAll: true,
      title: `${remaining} more courses available`,
      icon: "📚",
      extraCoursesCount: remaining,
    });
    displayBooks = firstThree;
  }

  return (
    <div style={panelStyle}>
      {/* Top row: Title on left, "Upload New Material" on right */}
      <div style={topRowStyle}>
        <h2 style={{ margin: 0 }}>My Courses / Books</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={uploadButtonStyle} onClick={() => { /* placeholder */ }}>
            <span style={{ marginRight: "6px" }}>⬆️</span> Upload New Material
          </button>
        </div>
      </div>

      {/* Tiles container */}
      <div style={tileContainerStyle}>
        {displayBooks.map((item, idx) => {
          if (item.isSeeAll) {
            // Special "See All Courses" or "X more courses" tile
            return (
              <div key={`seeAll-${idx}`} style={tileStyle}>
                <div style={iconStyle}>{item.icon}</div>
                <h3 style={{ margin: "10px 0 5px 0" }}>{item.title}</h3>

                {/* No progress bar for "See All" */}
                {/* No "Today's target" text for "See All" */}

                <div style={buttonRowStyle}>
                  <button style={seeAllCoursesButtonStyle}>
                    See All Courses
                  </button>
                </div>
              </div>
            );
          } else {
            // Normal course tile
            return (
              <div key={`course-${idx}`} style={tileStyle}>
                <div style={iconStyle}>{item.icon}</div>
                <h3 style={{ margin: "10px 0 5px 0" }}>{item.title}</h3>

                {/* Static 40% progress bar */}
                <div style={progressBarContainerStyle}>
                  <div
                    style={{
                      ...progressBarFillStyle,
                      width: "40%",
                    }}
                  />
                </div>
                <p style={progressLabelStyle}>40% complete</p>

                {/* Today’s Target */}
                <p style={targetTextStyle}>
                  Today’s Target: Complete chapter 2.1 - 2.3, 
                  1 hour 30 minutes schedule today
                </p>

                <div style={buttonRowStyle}>
                  <button style={primaryButtonStyle}>Start Learning</button>
                </div>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}

// ==================== Styles (same as original) ====================
const panelStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.1)",
  borderRadius: "8px",
  padding: "20px",
  color: "#fff",
  fontFamily: "'Open Sans', sans-serif",
  overflowY: "auto",
  maxHeight: "100%",
};

const topRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
};

const tileContainerStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  gap: "20px",
};

const tileStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.2)",
  borderRadius: "6px",
  padding: "15px",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
};

const iconStyle = {
  fontSize: "2rem",
};

const buttonRowStyle = {
  display: "flex",
  gap: "10px",
  marginTop: "10px",
};

const baseButtonStyle = {
  padding: "8px 16px",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: "bold",
};

const primaryButtonStyle = {
  ...baseButtonStyle,
  backgroundColor: "#FFD700",
  color: "#000",
};

const seeAllCoursesButtonStyle = {
  ...baseButtonStyle,
  backgroundColor: "#03A9F4",
  color: "#000",
};

const uploadButtonStyle = {
  ...baseButtonStyle,
  backgroundColor: "#4CAF50",
  color: "#000",
};

const progressBarContainerStyle = {
  width: "100%",
  height: "8px",
  backgroundColor: "rgba(255,255,255,0.3)",
  borderRadius: "4px",
  marginTop: "10px",
};

const progressBarFillStyle = {
  height: "100%",
  backgroundColor: "#FFD700",
  borderRadius: "4px",
  transition: "width 0.3s ease",
};

const progressLabelStyle = {
  margin: "5px 0",
  fontSize: "0.85rem",
  opacity: 0.8,
};

const targetTextStyle = {
  marginTop: "5px",
  fontStyle: "italic",
};

export default PanelC;