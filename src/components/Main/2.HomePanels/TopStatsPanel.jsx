// src/components/DetailedBookViewer/StatsPanel.jsx

import React from "react";

/**
 * StatsPanel
 *
 * Four small “cards” in a row:
 *  1) Today's Schedule (Time)
 *  2) Today's Progress (progress bar)
 *  3) Daily Average
 *  4) Active Courses
 */
function StatsPanel() {
  // Container that holds all four stat cards
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

  // Each individual card
  const statCardStyle = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: "10px 15px",
    borderRadius: "8px",
    minWidth: "160px",
    justifyContent: "space-between",
    color: "#fff", // white text
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

  // The main “big number” or info
  const valueStyle = {
    fontWeight: "bold",
    fontSize: "1.1rem",
    color: "#B39DDB", // Purple accent
  };

  const labelStyle = {
    fontSize: "0.9rem",
    opacity: 0.9,
  };

  // For the progress bar in the “Today’s Progress” stat
  const progressPercent = 60; // placeholder
  const progressBarContainer = {
    marginTop: "4px",
    width: "100%",
    height: "6px",
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: "3px",
  };

  const progressBarFill = {
    width: `${progressPercent}%`,
    height: "100%",
    backgroundColor: "#B39DDB", // purple
    borderRadius: "3px",
  };

  return (
    <div style={panelContainerStyle}>
      {/* Stat #1: Today's Schedule */}
      <div style={statCardStyle}>
        <span role="img" aria-label="clock" style={iconStyle}>
          ⏰
        </span>
        <div style={textContainerStyle}>
          <span style={valueStyle}>1h 30m</span>
          <span style={labelStyle}>Today’s Schedule</span>
        </div>
      </div>

      {/* Stat #2: Today's Progress */}
      <div style={statCardStyle}>
        <span role="img" aria-label="progress" style={iconStyle}>
          📊
        </span>
        <div style={textContainerStyle}>
          <span style={valueStyle}>{progressPercent}%</span>
          <span style={labelStyle}>Today’s Progress</span>
          <div style={progressBarContainer}>
            <div style={progressBarFill} />
          </div>
        </div>
      </div>

      {/* Stat #3: Daily Average */}
      <div style={statCardStyle}>
        <span role="img" aria-label="average" style={iconStyle}>
          🕒
        </span>
        <div style={textContainerStyle}>
          <span style={valueStyle}>1h 20m</span>
          <span style={labelStyle}>Daily Average</span>
        </div>
      </div>

      {/* Stat #4: Active Courses */}
      <div style={statCardStyle}>
        <span role="img" aria-label="courses" style={iconStyle}>
          📚
        </span>
        <div style={textContainerStyle}>
          <span style={valueStyle}>4</span>
          <span style={labelStyle}>Active Courses</span>
        </div>
      </div>
    </div>
  );
}

export default StatsPanel;