// File: StatsPanel.jsx

import React from "react";
import { LinearProgress } from "@mui/material";

export default function StatsPanel({ plan, colorScheme }) {
  // Filler data if plan is null or partial
  const examDate = plan?.targetDate || "2025-12-31";
  const dailyPlanTime = 30;     // filler
  const chaptersCount = 5;      // filler
  const subChaptersCount = 12;  // filler

  const overallProgress = 65;   // filler => for overall
  const dailyProgress = 20;     // filler => for daily

  return (
    <div style={{ marginBottom: "1rem" }}>
      {/* 6 tiles => #1 Overall Progress, #2 Daily Progress, #3 Exam Date, #4 Daily Plan, #5 Chapters, #6 SubChaps */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          width: "100%",
          justifyContent: "space-between",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        {/* 1) Overall Progress tile */}
        <OverallProgressTile
          title="Overall Progress"
          progressValue={overallProgress}
          colorScheme={colorScheme}
        />

        {/* 2) Daily Progress tile */}
        <OverallProgressTile
          title="Daily Progress"
          progressValue={dailyProgress}
          colorScheme={colorScheme}
          daily={true} // optionally if you want a distinct color bar
        />

        {/* 3) Exam Date */}
        <IconCard
          icon="📅"
          label="Exam Date"
          value={examDate}
          color={colorScheme.heading || "#FFD700"}
        />
        {/* 4) Daily Plan */}
        <IconCard
          icon="⏱"
          label="Daily Plan"
          value={`${dailyPlanTime} min`}
          color={colorScheme.heading || "#FFD700"}
        />
        {/* 5) Chapters */}
        <IconCard
          icon="📖"
          label="Chapters"
          value={chaptersCount}
          color={colorScheme.heading || "#FFD700"}
        />
        
      </div>
    </div>
  );
}

/** Overall tile for both Overall and Daily progress, 
    with a linear bar and label at the top */
function OverallProgressTile({ title, progressValue, colorScheme, daily = false }) {
  // If daily is true, we might use a different color or style
  const barColor = daily 
    ? (colorScheme.dailyBarColor || "#FF9800") // fallback orange
    : (colorScheme.heading || "#FFD700");

  const tileStyle = {
    backgroundColor: "#2F2F2F",
    borderRadius: "8px",
    padding: "0.6rem",
    flex: 1,
    minWidth: 130,
    maxWidth: 9999,
    textAlign: "center",
  };

  return (
    <div style={tileStyle}>
      <div style={{ fontWeight: "bold", marginBottom: 6 }}>{title}</div>

      <LinearProgress
        variant="determinate"
        value={progressValue}
        sx={{
          height: 10,
          borderRadius: 2,
          backgroundColor: "rgba(255,255,255,0.2)",
          "& .MuiLinearProgress-bar": {
            backgroundColor: barColor,
          },
        }}
      />

      <div
        style={{
          marginTop: "4px",
          fontWeight: "bold",
          color: barColor,
        }}
      >
        {progressValue}%
      </div>
    </div>
  );
}

/** Reusable icon-based card for exam date, daily plan, chapters, etc. */
function IconCard({ icon, label, value, color }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 130,
        maxWidth: 9999,
        backgroundColor: "#2F2F2F",
        borderRadius: "8px",
        padding: "0.6rem",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "1.4rem", marginBottom: 4 }}>{icon}</div>
      <div
        style={{
          textTransform: "uppercase",
          fontSize: "0.7rem",
          opacity: 0.8,
          marginBottom: "4px",
        }}
      >
        {label}
      </div>
      <div style={{ fontWeight: "bold", color }}>{value}</div>
    </div>
  );
}