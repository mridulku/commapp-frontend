import React, { useState, useEffect } from "react";
import NavigationBar from "../DetailedBookViewer/NavigationBar";
// If you have your firebase.js in "../../firebase", adjust as needed:
import { auth } from "../../firebase";
import axios from "axios";

/**
 * UserProfileAnalytics.jsx (Single-file approach)
 * 1) Grabs userId from Firebase Auth
 * 2) Fetches user activities from a backend API ("/api/user-activities?userId=xxx")
 * 3) Displays them in a simple list
 * No direct Firestore usage, so no need for "db" import here.
 */
function UserProfileAnalytics() {
  // 1) Local state: userId from Auth
  const [userId, setUserId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // 2) Activity log states
  const [activityLog, setActivityLog] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [error, setError] = useState(null);

  // We'll assume your backend URL is in an env variable, or you can hard-code:
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

  // ==============================
  // Step A: Listen to auth state
  // ==============================
  useEffect(() => {
    // Listen for Firebase Auth changes:
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
      // If no user is logged in, we won't fetch
      setActivityLog([]);
      return;
    }

    // Otherwise, fetch from your Express API
    const fetchActivities = async () => {
      setLoadingActivities(true);
      setError(null);
      try {
        // e.g. GET /api/user-activities?userId=acbhbtiODoPPcks2CP6Z
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
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Reuse your existing NavigationBar */}
      <NavigationBar />

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
        <h2>User Profile & Activity</h2>

        {/* If Auth is still loading */}
        {authLoading && <p>Checking sign-in status...</p>}

        {/* If user is not logged in after auth loading finishes */}
        {!authLoading && !userId && (
          <p style={{ color: "red" }}>
            No user is currently logged in. Please sign in to view profile/activity.
          </p>
        )}

        {/* If user is logged in, we can show something about them + activity */}
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
                (You could fetch more info about the user from /api/users or a Firestore doc.)
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