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

  // 3) Form fields for generating a plan
  const [targetDate, setTargetDate] = useState("2025-07-20");  // required by default
  const [maxDays, setMaxDays] = useState("");
  const [wpm, setWpm] = useState("");
  const [dailyReadingTime, setDailyReadingTime] = useState("");
  const [quizTime, setQuizTime] = useState("");
  const [reviseTime, setReviseTime] = useState("");

  // New fields for selecting books/chapters/subchapters (comma-separated)
  const [bookIdsString, setBookIdsString] = useState("");
  const [chapterIdsString, setChapterIdsString] = useState("");
  const [subchapterIdsString, setSubchapterIdsString] = useState("");

  // We'll assume your usual backend or other APIs point to:
  // This is the Cloud Run or Firebase Function URL
  const generatePlanURL = "https://generateadaptiveplan-zfztjkkvva-uc.a.run.app";

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
  // (This part is presumably your own custom logic to show activity logs, etc.)
  // We'll assume you have a route: /api/user-activities?userId=XYZ
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

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

    // Build the request body (JSON)
    const requestBody = {
      userId,
    };

    // 1) Required: targetDate (or you can make it optional if desired)
    if (targetDate) {
      requestBody.targetDate = targetDate;
    } else {
      alert("Target date is required!");
      return;
    }

    // 2) Optional overrides
    if (maxDays) {
      requestBody.maxDays = Number(maxDays);
    }
    if (wpm) {
      requestBody.wpm = Number(wpm);
    }
    if (dailyReadingTime) {
      requestBody.dailyReadingTime = Number(dailyReadingTime);
    }
    if (quizTime) {
      requestBody.quizTime = Number(quizTime);
    }
    if (reviseTime) {
      requestBody.reviseTime = Number(reviseTime);
    }

    // 3) Optional Book/Chapter/Subchapter IDs
    // If user typed "abc123, xyz456" => ["abc123", "xyz456"]
    if (bookIdsString.trim()) {
      const arrayOfBookIds = bookIdsString
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean); // remove empty
      requestBody.selectedBooks = arrayOfBookIds;
    }
    if (chapterIdsString.trim()) {
      const arrayOfChapterIds = chapterIdsString
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      requestBody.selectedChapters = arrayOfChapterIds;
    }
    if (subchapterIdsString.trim()) {
      const arrayOfSubchapterIds = subchapterIdsString
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      requestBody.selectedSubChapters = arrayOfSubchapterIds;
    }

    // Now send POST to the Cloud Function
    try {
      const res = await axios.post(generatePlanURL, requestBody, {
        headers: { "Content-Type": "application/json" },
      });
      console.log("Generate Plan response:", res.data);

      if (res.status === 200) {
        alert("Plan generated successfully!");
      } else {
        alert("Something went wrong generating plan.");
      }
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
        backgroundColor: colorScheme.mainBg || "#121212",
        color: colorScheme.textColor || "#FFFFFF",
        fontFamily: "'Open Sans', sans-serif",
        padding: "20px",
        overflowY: "auto",
      }}
    >
      <h2 style={{ color: colorScheme.heading || "#BB86FC" }}>
        User Profile & Activity
      </h2>

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
            <p>(Any additional user info here.)</p>
          </div>

          {/* Generate Plan Form */}
          <div
            style={{
              backgroundColor: colorScheme.cardBg || "#2F2F2F",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "20px",
              border: `1px solid ${colorScheme.borderColor || "#3A3A3A"}`,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Generate Adaptive Plan</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* Target Date (required) */}
              <div>
                <label style={{ marginRight: "8px" }}>Target Date:</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  style={{ padding: "4px" }}
                />
              </div>

              {/* maxDays (optional) */}
              <div>
                <label style={{ marginRight: "8px" }}>Max Days Override:</label>
                <input
                  type="number"
                  value={maxDays}
                  onChange={(e) => setMaxDays(e.target.value)}
                  placeholder="(Leave blank for default)"
                  style={{ padding: "4px" }}
                />
              </div>

              {/* wpm (optional) */}
              <div>
                <label style={{ marginRight: "8px" }}>WPM Override:</label>
                <input
                  type="number"
                  value={wpm}
                  onChange={(e) => setWpm(e.target.value)}
                  placeholder="(Leave blank for Firestore persona)"
                  style={{ padding: "4px" }}
                />
              </div>

              {/* dailyReadingTime (optional) */}
              <div>
                <label style={{ marginRight: "8px" }}>
                  Daily Reading Time Override (mins):
                </label>
                <input
                  type="number"
                  value={dailyReadingTime}
                  onChange={(e) => setDailyReadingTime(e.target.value)}
                  placeholder="(Leave blank for Firestore persona)"
                  style={{ padding: "4px" }}
                />
              </div>

              {/* quizTime (optional) */}
              <div>
                <label style={{ marginRight: "8px" }}>Quiz Time (mins):</label>
                <input
                  type="number"
                  value={quizTime}
                  onChange={(e) => setQuizTime(e.target.value)}
                  placeholder="(default 1)"
                  style={{ padding: "4px" }}
                />
              </div>

              {/* reviseTime (optional) */}
              <div>
                <label style={{ marginRight: "8px" }}>Revise Time (mins):</label>
                <input
                  type="number"
                  value={reviseTime}
                  onChange={(e) => setReviseTime(e.target.value)}
                  placeholder="(default 1)"
                  style={{ padding: "4px" }}
                />
              </div>

              {/* Book IDs (optional, comma-separated) */}
              <div>
                <label style={{ marginRight: "8px" }}>Book IDs (comma-separated):</label>
                <input
                  type="text"
                  value={bookIdsString}
                  onChange={(e) => setBookIdsString(e.target.value)}
                  placeholder="e.g. 'abcd123, efgh456'"
                  style={{ padding: "4px", width: "80%" }}
                />
              </div>

              {/* Chapter IDs (optional, comma-separated) */}
              <div>
                <label style={{ marginRight: "8px" }}>
                  Chapter IDs (comma-separated):
                </label>
                <input
                  type="text"
                  value={chapterIdsString}
                  onChange={(e) => setChapterIdsString(e.target.value)}
                  placeholder="e.g. 'ch1, ch2'"
                  style={{ padding: "4px", width: "80%" }}
                />
              </div>

              {/* Subchapter IDs (optional, comma-separated) */}
              <div>
                <label style={{ marginRight: "8px" }}>
                  Subchapter IDs (comma-separated):
                </label>
                <input
                  type="text"
                  value={subchapterIdsString}
                  onChange={(e) => setSubchapterIdsString(e.target.value)}
                  placeholder="e.g. 'subA, subB'"
                  style={{ padding: "4px", width: "80%" }}
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleGeneratePlan}
                style={{
                  marginTop: "10px",
                  padding: "8px 16px",
                  backgroundColor: colorScheme.accent || "#BB86FC",
                  color: "#000",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  width: "fit-content",
                }}
              >
                Generate Plan
              </button>
            </div>
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