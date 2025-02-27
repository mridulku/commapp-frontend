// src/components/DetailedBookViewer/PanelC.jsx

import React from "react";

function PanelC() {
  // Dummy data simulating different books/courses
  const dummyBooks = [
    {
      id: 1,
      title: "Mathematics 101",
      icon: "📐",
      todaysTarget: "Complete Chapter 2.1 - 2.3",
      progress: 40, // percent
    },
    {
      id: 2,
      title: "Science Fundamentals",
      icon: "🔬",
      todaysTarget: "Finish Chapter 3",
      progress: 65,
    },
    {
      id: 3,
      title: "History of Europe",
      icon: "🏰",
      todaysTarget: "Review Renaissance Era",
      progress: 20,
    },
    // Replace Art Basics with a tile for more courses
    {
      id: 4,
      title: "7 More Courses Available",
      icon: "📚",
      todaysTarget: "Explore them all",
      progress: 0, // or omit if you prefer no progress bar
      isMoreCourses: true, // We'll use this as a flag for special tile content
    },
  ];

  return (
    <div style={panelStyle}>
      {/* Top row: Title on left, "Upload" button & optional second button on right */}
      <div style={topRowStyle}>
        <h2 style={{ margin: 0 }}>My Courses / Books</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={uploadButtonStyle}>
            <span style={{ marginRight: "6px" }}>⬆️</span> Upload New Material
          </button>
          {/* If you wanted a second top bar button here, you could add it */}
          {/* <button style={secondaryButtonStyle}>Another Button</button> */}
        </div>
      </div>

      <div style={tileContainerStyle}>
        {dummyBooks.map((book) => (
          <div key={book.id} style={tileStyle}>
            <div style={iconStyle}>{book.icon}</div>

            <h3 style={{ margin: "10px 0 5px 0" }}>{book.title}</h3>

            {/* Optional progress bar (unless you want to hide it for "more courses") */}
            {!book.isMoreCourses && (
              <>
                <div style={progressBarContainerStyle}>
                  <div style={{ 
                    ...progressBarFillStyle, 
                    width: `${book.progress}%` 
                  }} />
                </div>
                <p style={progressLabelStyle}>{book.progress}% complete</p>
              </>
            )}

            {/* Today’s Target */}
            <p style={targetTextStyle}>
              Today’s Target: {book.todaysTarget}
            </p>

            {/* For normal courses, show "Start Learning" button. 
                For the "7 More Courses" tile, show "See All Courses." */}
            <div style={buttonRowStyle}>
              {book.isMoreCourses ? (
                <button style={seeAllCoursesButtonStyle}>
                  See All Courses
                </button>
              ) : (
                <button style={primaryButtonStyle}>Start Learning</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== Styles ====================
const panelStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.1)",
  borderRadius: "8px",
  padding: "20px",
  color: "#fff",
  fontFamily: "'Open Sans', sans-serif",
  overflowY: "auto",
  maxHeight: "100%",
};

// Top row: flex container for title + 1 (or 2) buttons
const topRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
};

// Grid container for the tiles
const tileContainerStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  gap: "20px",
};

// Each course tile
const tileStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.2)",
  borderRadius: "6px",
  padding: "15px",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
};

// The large icon at the top of each tile
const iconStyle = {
  fontSize: "2rem",
};

// Button row
const buttonRowStyle = {
  display: "flex",
  gap: "10px",
  marginTop: "10px",
};

// Base button styles
const baseButtonStyle = {
  padding: "8px 16px",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: "bold",
};

// The primary button (gold)
const primaryButtonStyle = {
  ...baseButtonStyle,
  backgroundColor: "#FFD700",
  color: "#000",
};

// A “See All Courses” button with a teal color
const seeAllCoursesButtonStyle = {
  ...baseButtonStyle,
  backgroundColor: "#03A9F4",
  color: "#000",
};

// The “Upload New Material” button: a calm green
const uploadButtonStyle = {
  ...baseButtonStyle,
  backgroundColor: "#4CAF50", 
  color: "#000",
};

// Container for progress bar
const progressBarContainerStyle = {
  width: "100%",
  height: "8px",
  backgroundColor: "rgba(255,255,255,0.3)",
  borderRadius: "4px",
  marginTop: "10px",
};

// Progress bar fill
const progressBarFillStyle = {
  height: "100%",
  backgroundColor: "#FFD700",
  borderRadius: "4px",
  transition: "width 0.3s ease",
};

// Text label for the progress
const progressLabelStyle = {
  margin: "5px 0",
  fontSize: "0.85rem",
  opacity: 0.8,
};

// Target text (italic)
const targetTextStyle = {
  marginTop: "5px",
  fontStyle: "italic",
};

export default PanelC;