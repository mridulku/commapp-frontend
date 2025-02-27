// src/components/DetailedBookViewer/StatsPanel.jsx

import React from "react";

/**
 * StatsPanel
 *
 * Four small “cards” in a row:
 * 1) Total Materials
 * 2) Plan Progress (with a small progress bar)
 * 3) Daily Average
 * 4) Days Until Next Deadline
 */
function StatsPanel() {
  // Panel container styling
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

  // Each stat card styling
  const statCardStyle = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: "10px 15px",
    borderRadius: "8px",
    minWidth: "160px",
    justifyContent: "space-between",
    color: "#fff",           // white text
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

  // The main number or info
  const valueStyle = {
    fontWeight: "bold",
    fontSize: "1.1rem",
    color: "#FFD700", // gold accent
  };

  const labelStyle = {
    fontSize: "0.9rem",
    opacity: 0.9,
  };

  // For the progress bar in the Plan Progress stat
  // Example: 60% progress
  const progressPercent = 60;

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
    backgroundColor: "#FFD700", // gold
    borderRadius: "3px",
  };

  return (
    <div style={panelContainerStyle}>
      {/* Stat #1: Total Materials */}
      <div style={statCardStyle}>
        <span role="img" aria-label="materials" style={iconStyle}>
          📚
        </span>
        <div style={textContainerStyle}>
          <span style={valueStyle}>8</span>
          <span style={labelStyle}>Total Materials</span>
        </div>
      </div>

      {/* Stat #2: Plan Progress (with progress bar) */}
      <div style={statCardStyle}>
        <span role="img" aria-label="progress" style={iconStyle}>
          📈
        </span>
        <div style={textContainerStyle}>
          <span style={valueStyle}>{progressPercent}%</span>
          <span style={labelStyle}>Plan Progress</span>
          {/* Small inline progress bar */}
          <div style={progressBarContainer}>
            <div style={progressBarFill} />
          </div>
        </div>
      </div>

      {/* Stat #3: Daily Average */}
      <div style={statCardStyle}>
        <span role="img" aria-label="time" style={iconStyle}>
          ⏰
        </span>
        <div style={textContainerStyle}>
          <span style={valueStyle}>1h 30m</span>
          <span style={labelStyle}>Daily Average</span>
        </div>
      </div>

      {/* Stat #4: Days Until Next Deadline */}
      <div style={statCardStyle}>
        <span role="img" aria-label="deadline" style={iconStyle}>
          🚀
        </span>
        <div style={textContainerStyle}>
          <span style={valueStyle}>14</span>
          <span style={labelStyle}>Days Until Deadline</span>
        </div>
      </div>
    </div>
  );
}

export default StatsPanel;