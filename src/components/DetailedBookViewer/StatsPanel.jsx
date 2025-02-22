import React from "react";

// Optional icons. For now, we can use emoji or placeholder text
// In a real project, you might use Font Awesome, Material Icons, or custom SVGs

function StatsPanel() {
  const panelContainerStyle = {
    display: "flex",
    gap: "20px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(6px)",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "20px",
    alignItems: "center",
    justifyContent: "space-around",
  };

  const statCardStyle = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: "10px 15px",
    borderRadius: "8px",
    minWidth: "160px",
    justifyContent: "space-between",
  };

  const iconStyle = {
    fontSize: "1.4rem",
    marginRight: "10px",
  };

  const textContainerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    flex: 1,
  };

  const valueStyle = {
    fontWeight: "bold",
    fontSize: "1.1rem",
    color: "#FFD700", // gold
  };

  const labelStyle = {
    fontSize: "0.9rem",
    color: "#fff",
    opacity: 0.8,
  };

  return (
    <div style={panelContainerStyle}>
      {/* Stat #1: Books Uploaded */}
      <div style={statCardStyle}>
        <span role="img" aria-label="book" style={iconStyle}>
          📚
        </span>
        <div style={textContainerStyle}>
          <span style={valueStyle}>5</span>
          <span style={labelStyle}>Books Uploaded</span>
        </div>
      </div>

      {/* Stat #2: Hours Studied */}
      <div style={statCardStyle}>
        <span role="img" aria-label="time" style={iconStyle}>
          ⏰
        </span>
        <div style={textContainerStyle}>
          <span style={valueStyle}>3h 30m</span>
          <span style={labelStyle}>This Week</span>
        </div>
      </div>

      {/* Stat #3: Subchapters Read */}
      <div style={statCardStyle}>
        <span role="img" aria-label="read" style={iconStyle}>
          ✅
        </span>
        <div style={textContainerStyle}>
          <span style={valueStyle}>12</span>
          <span style={labelStyle}>Subchapters Read</span>
        </div>
      </div>

      {/* Stat #4: Quizzes Done */}
      <div style={statCardStyle}>
        <span role="img" aria-label="quiz" style={iconStyle}>
          ✍️
        </span>
        <div style={textContainerStyle}>
          <span style={valueStyle}>2</span>
          <span style={labelStyle}>Quizzes Completed</span>
        </div>
      </div>
    </div>
  );
}

export default StatsPanel;