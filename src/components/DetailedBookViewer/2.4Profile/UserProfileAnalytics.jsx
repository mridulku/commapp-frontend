// src/components/DetailedBookViewer/UserProfileAnalytics.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import { auth } from "../../../firebase"; // Adjust import path as needed

function UserProfileAnalytics({ colorScheme = {} }) {
  // 1) Local state: userId from Auth
  const [userId, setUserId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // 2) Activity log states
  const [activityLog, setActivityLog] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [error, setError] = useState(null);

  // We'll assume your backend URL is in an env variable
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

  // ==============================
  // Step A: Listen to auth state
  // ==============================
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ==============================
  // Step B: Fetch user activities
  // ==============================
  useEffect(() => {
    if (authLoading) return; // Wait for auth to finish
    if (!userId) {
      setActivityLog([]);
      return;
    }

    const fetchActivities = async () => {
      setLoadingActivities(true);
      setError(null);
      try {
        const url = `${backendURL}/api/user-activities?userId=${userId}`;
        const response = await axios.get(url);
        if (response.data.success) {
          setActivityLog(response.data.data); // array of events
        } else {
          setError("Failed to fetch user activities.");
        }
      } catch (err) {
        console.error("Error fetching user activities:", err);
        setError(err.message);
      } finally {
        setLoadingActivities(false);
      }
    };

    fetchActivities();
  }, [userId, authLoading, backendURL]);

  // ==============================
  // Step C: Generate Plan Handler
  // ==============================
  const handleGeneratePlan = async () => {
    if (!userId) {
      alert("No user logged in.");
      return;
    }

    // Hardcode a target date, or fetch it from a date picker/input
    const targetDate = "2025-07-20";

    try {
      const res = await axios.get(
        "https://generateadaptiveplan-zfztjkkvva-uc.a.run.app",
        {
          params: {
            userId,
            targetDate,
          },
        }
      );
      console.log("Generate Plan response:", res.data);
      alert("Plan generated successfully!");
    } catch (err) {
      console.error("Error generating plan:", err);
      alert("Failed to generate plan. Check console for details.");
    }
  };

  // ==============================
  // Rendering
  // ==============================
  return (
    <div
      style={{
        flex: 1,
        // Match the same background color used in the main content area
        backgroundColor: colorScheme.mainBg || "#121212",
        color: colorScheme.textColor || "#FFFFFF",
        fontFamily: "'Open Sans', sans-serif",
        padding: "20px",
        overflowY: "auto",
      }}
    >
      <h2 style={{ color: colorScheme.heading || "#BB86FC" }}>User Profile & Activity</h2>

      {authLoading && <p>Checking sign-in status...</p>}

      {!authLoading && !userId && (
        <p style={{ color: colorScheme.errorColor || "#FF5555" }}>
          No user is currently logged in. Please sign in to view profile/activity.
        </p>
      )}

      {!authLoading && userId && (
        <>
          {/* Minimal user info */}
          <div
            style={{
              backgroundColor: colorScheme.cardBg || "#2F2F2F",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "20px",
              border: `1px solid ${colorScheme.borderColor || "#3A3A3A"}`,
            }}
          >
            <h3 style={{ marginTop: 0, color: colorScheme.textColor || "#FFFFFF" }}>
              Global User Profile
            </h3>
            <p>
              <strong>User ID:</strong> {userId}
            </p>
            <p>
              (You could fetch more info about the user from /api/users or Firestore.)
            </p>

            {/* Generate Plan Button */}
            <button
              onClick={handleGeneratePlan}
              style={{
                padding: "8px 16px",
                backgroundColor: colorScheme.accent || "#BB86FC",
                color: "#000",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: "bold",
                marginTop: "10px",
              }}
            >
              Generate Plan
            </button>
          </div>

          {/* Activity Log */}
          <div
            style={{
              backgroundColor: colorScheme.cardBg || "#2F2F2F",
              borderRadius: "8px",
              padding: "20px",
              border: `1px solid ${colorScheme.borderColor || "#3A3A3A"}`,
            }}
          >
            <h3 style={{ marginTop: 0, color: colorScheme.textColor || "#FFFFFF" }}>
              Activity Log
            </h3>
            {loadingActivities && <p>Loading user activities...</p>}
            {error && (
              <p style={{ color: colorScheme.errorColor || "#FF5555" }}>
                Error: {error}
              </p>
            )}

            {!loadingActivities && !error && activityLog.length === 0 && (
              <p style={{ fontStyle: "italic" }}>No recent activity found.</p>
            )}

            {!loadingActivities && !error && activityLog.length > 0 && (
              <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
                {activityLog.map((item) => (
                  <li key={item._id || item.id} style={logItemStyle(colorScheme)}>
                    <div style={logDateStyle}>
                      {item.timestamp
                        ? new Date(item.timestamp).toLocaleString()
                        : "No timestamp"}
                    </div>
                    <div style={logContentStyle}>
                      <strong>{item.eventType}</strong>{" "}
                      {item.subChapterId && (
                        <>
                          on subChapter <em>{item.subChapterId}</em>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Some inline style objects (slightly adjusted for a dark theme)
const logItemStyle = (colorScheme) => ({
  marginBottom: "15px",
  paddingLeft: "10px",
  borderLeft: `2px solid ${colorScheme.accent || "#FFD700"}`,
});

const logDateStyle = {
  fontSize: "0.85rem",
  fontStyle: "italic",
  marginBottom: "2px",
};

const logContentStyle = {
  fontSize: "0.95rem",
};

export default UserProfileAnalytics;