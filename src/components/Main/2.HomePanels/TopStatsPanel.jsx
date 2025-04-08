// File: src/components/DetailedBookViewer/StatsPanel.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import FlagIcon from "@mui/icons-material/Flag";
import MenuBookIcon from "@mui/icons-material/MenuBook";

export default function StatsPanel({ userId }) {
  // We'll fetch from the server how many seconds the user studied today
  const [timeStudiedTodaySec, setTimeStudiedTodaySec] = useState(0);

  // For demonstration, placeholders for the other stats
  const [todaysTargetPercent] = useState(60);
  const [activeCoursesCount] = useState(1);

  // On mount or if userId changes => fetch today's total from /api/daily-time
  useEffect(() => {
    if (!userId) return;

    // Build a YYYY-MM-DD string for "today"
    // (Alternatively, the server can do "today" logic if you prefer.)
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    async function fetchDailyTime() {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/daily-time`, {
          params: { userId, dateStr }
        });
        if (res.data && res.data.success) {
          setTimeStudiedTodaySec(res.data.sumSeconds || 0);
        } else {
          console.warn("No success or missing data from /api/daily-time", res.data);
          setTimeStudiedTodaySec(0);
        }
      } catch (err) {
        console.error("Error fetching daily time:", err);
        setTimeStudiedTodaySec(0);
      }
    }

    fetchDailyTime();
  }, [userId]);

  // Convert seconds => "Xh Ym" or just "Xm"
  function formatTimeStudied(seconds) {
    const hours = Math.floor(seconds / 3600);
    const remainderSec = seconds % 3600;
    const minutes = Math.floor(remainderSec / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  const timeStudiedToday = formatTimeStudied(timeStudiedTodaySec);

  // ----- STYLES (unchanged) -----
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
    color: "#fff",
  };
  const iconStyle = {
    fontSize: "1.4rem",
    marginRight: "10px",
    display: "flex",
    alignItems: "center",
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
    color: "#B39DDB",
  };
  const labelStyle = {
    fontSize: "0.9rem",
    opacity: 0.9,
  };

  const progressBarContainer = {
    marginTop: "4px",
    width: "100%",
    height: "6px",
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: "3px",
  };
  const progressBarFill = {
    width: `${todaysTargetPercent}%`,
    height: "100%",
    backgroundColor: "#B39DDB",
    borderRadius: "3px",
  };

  return (
    <div style={panelContainerStyle}>

      {/* Stat #1: Time Studied Today */}
      <div style={statCardStyle}>
        <div style={iconStyle}>
          <AccessTimeIcon />
        </div>
        <div style={textContainerStyle}>
          <span style={valueStyle}>{timeStudiedToday}</span>
          <span style={labelStyle}>Time Studied Today</span>
        </div>
      </div>

      {/* Stat #2: Today’s Target */}
      <div style={statCardStyle}>
        <div style={iconStyle}>
          <FlagIcon />
        </div>
        <div style={textContainerStyle}>
          <span style={valueStyle}>{todaysTargetPercent}%</span>
          <span style={labelStyle}>Today’s Target</span>
          <div style={progressBarContainer}>
            <div style={progressBarFill} />
          </div>
        </div>
      </div>

      {/* Stat #3: Active Courses */}
      <div style={statCardStyle}>
        <div style={iconStyle}>
          <MenuBookIcon />
        </div>
        <div style={textContainerStyle}>
          <span style={valueStyle}>{activeCoursesCount}</span>
          <span style={labelStyle}>Active Courses</span>
        </div>
      </div>

    </div>
  );
}