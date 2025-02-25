// src/components/DetailedBookViewer/UserProfileAnalytics.jsx
import React, { useState, useEffect } from "react";
// If you do not want a top nav bar inside this component, remove NavigationBar import.
// import NavigationBar from "../DetailedBookViewer/NavigationBar";
import { auth } from "../../../firebase"; // Adjust import path as needed
import axios from "axios";

function UserProfileAnalytics() {
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
  // Rendering
  // ==============================
  return (
    <div
      style={{
        flex: 1,
        background: "linear-gradient(135deg, #0F2027, #203A43, #2C5364)",
        color: "#fff",
        fontFamily: "'Open Sans', sans-serif",
        padding: "20px",
        overflowY: "auto",
      }}
    >
      {/* If you do want a nav bar inside profile, uncomment:
      <NavigationBar />
      */}

      <h2>User Profile & Activity</h2>

      {authLoading && <p>Checking sign-in status...</p>}

      {!authLoading && !userId && (
        <p style={{ color: "red" }}>
          No user is currently logged in. Please sign in to view profile/activity.
        </p>
      )}

      {!authLoading && userId && (
        <>
          {/* Minimal user info */}
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "20px",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Global User Profile</h3>
            <p>
              <strong>User ID:</strong> {userId}
            </p>
            <p>
              (You could fetch more info about the user from /api/users or Firestore.)
            </p>
          </div>

          {/* Activity Log */}
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: "8px",
              padding: "20px",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Activity Log</h3>
            {loadingActivities && <p>Loading user activities...</p>}
            {error && <p style={{ color: "red" }}>Error: {error}</p>}

            {!loadingActivities && !error && activityLog.length === 0 && (
              <p style={{ fontStyle: "italic" }}>No recent activity found.</p>
            )}

            {!loadingActivities && !error && activityLog.length > 0 && (
              <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
                {activityLog.map((item) => (
                  <li key={item._id || item.id} style={logItemStyle}>
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

// Some inline style objects
const logItemStyle = {
  marginBottom: "15px",
  paddingLeft: "10px",
  borderLeft: "2px solid #FFD700",
};

const logDateStyle = {
  fontSize: "0.85rem",
  fontStyle: "italic",
  marginBottom: "2px",
};

const logContentStyle = {
  fontSize: "0.95rem",
};

export default UserProfileAnalytics;