import React, { useEffect, useState } from "react";
import axios from "axios";

// Example: using your existing styling from "styles.js"
import { playlistPanelStyle } from "./styles";

/**
 * LeftPanel
 *
 * This component fetches the plan doc from a backend endpoint (like /api/adaptive-plan)
 * and renders day-by-day (session-by-session) activities in a collapsible list.
 *
 * Props:
 *  - planId: string (the Firestore doc ID for the plan in 'adaptive_demo')
 *  - backendURL: string (base URL for your Express server, e.g. "http://localhost:3001")
 *  - onActivitySelect: function(index, activity) => void
 *     (Fires when user clicks on a particular activity. The parent can set currentIndex, etc.)
 *  - colorScheme: optional overrides for styling
 */
export default function LeftPanel({
  planId,
  backendURL = "http://localhost:3001",
  onActivitySelect = () => {},
  colorScheme = {},
}) {
  // Local state for fetched plan
  const [plan, setPlan] = useState(null);

  // Track which session labels are expanded/collapsed
  const [expandedSessions, setExpandedSessions] = useState([]);

  useEffect(() => {
    if (!planId) return;

    async function fetchPlanData() {
      try {
        const res = await axios.get(`${backendURL}/api/adaptive-plan`, {
          params: { planId },
        });
        if (res.data && res.data.planDoc) {
          setPlan(res.data.planDoc);
        } else {
          console.error("No planDoc in response:", res.data);
        }
      } catch (err) {
        console.error("Error fetching plan:", err);
      }
    }

    fetchPlanData();
  }, [planId, backendURL]);

  // Basic styling to match your black + gold design
  const containerStyle = {
    ...playlistPanelStyle, // your existing panel style
    // You could override or add more:
    width: "300px",
    minWidth: "250px",
    backgroundColor: colorScheme.panelBg || "rgba(0, 0, 0, 0.9)",
    color: "#fff",
    overflowY: "auto",
    padding: "20px",
    borderRight: "2px solid rgba(255,215,0,0.4)",
  };

  const headingStyle = {
    fontWeight: "bold",
    marginBottom: "15px",
    fontSize: "1.2rem",
    color: colorScheme.heading || "#FFD700",
  };

  const sessionHeaderStyle = {
    cursor: "pointer",
    padding: "10px",
    borderRadius: "6px",
    marginBottom: "6px",
    backgroundColor: "rgba(255,215,0,0.15)",
    color: "#fff",
    fontWeight: "bold",
    transition: "background-color 0.3s",
  };

  // If plan not fetched yet, show loading
  if (!plan) {
    return (
      <div style={containerStyle}>
        <h2 style={headingStyle}>Adaptive Plan</h2>
        <div>Loading plan data...</div>
      </div>
    );
  }

  const { sessions = [] } = plan;

  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>Adaptive Plan</h2>
      {sessions.map((sess, sIndex) => {
        const { sessionLabel, activities = [] } = sess;
        const isExpanded = expandedSessions.includes(sessionLabel);

        // Sum up time for display
        const totalTime = activities.reduce((acc, a) => acc + (a.timeNeeded || 0), 0);

        return (
          <div key={sessionLabel} style={{ marginBottom: "10px" }}>
            <div
              style={sessionHeaderStyle}
              onClick={() => toggleSession(sessionLabel)}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,215,0,0.3)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,215,0,0.15)";
              }}
            >
              {isExpanded ? "▾" : "▸"} Day {sessionLabel} — {totalTime} min
            </div>

            {/* If expanded, render the activities */}
            {isExpanded && renderActivities(activities, sIndex)}
          </div>
        );
      })}
    </div>
  );

  // Helper: expand/collapse session
  function toggleSession(label) {
    setExpandedSessions((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );
  }

  // Renders each activity for the given session
  function renderActivities(activities, sessionIndex) {
    return activities.map((act, idx) => {
      const activityKey = `${sessionIndex}-${idx}`;
      const bubbleStyle = getActivityStyle(act.type);

      return (
        <div
          key={activityKey}
          style={{
            marginLeft: "20px",
            marginBottom: "4px",
            padding: "6px",
            borderRadius: "4px",
            backgroundColor: bubbleStyle.bgColor,
            color: "#000",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
          onClick={() => onActivitySelect(idx, act)}
        >
          <div style={{ fontWeight: "bold", marginRight: "8px" }}>
            {act.type}:
          </div>
          <div>{act.subChapterName || act.subChapterId}</div>
          <div style={{ marginLeft: "auto", fontSize: "0.85rem" }}>
            {act.timeNeeded || 0} min
          </div>
        </div>
      );
    });
  }
}

/**
 * Basic color mapping for each activity type.
 * Adjust to match your desired color scheme for reading/quiz/revise.
 */
function getActivityStyle(type) {
  switch (type) {
    case "READ":
    case "reading":
      return { bgColor: "lightblue" };
    case "QUIZ":
    case "quiz":
      return { bgColor: "lightgreen" };
    case "REVISE":
    case "revision":
      return { bgColor: "khaki" };
    default:
      return { bgColor: "#ccc" };
  }
}