// src/components/DetailedBookViewer/PanelC.jsx
import React, { useState, useEffect } from "react";
import { auth } from "../../firebase"; // Adjust path if needed
import axios from "axios";

function PanelC() {
  const [userId, setUserId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Activity log
  const [activityLog, setActivityLog] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [error, setError] = useState(null);

  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

  // Listen to Firebase Auth
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) setUserId(user.uid);
      else setUserId(null);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch user activities
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

  return (
    <div style={panelStyle}>
      <h3 style={{ marginTop: 0 }}>User Activity Log</h3>

      {authLoading && <p>Checking sign-in status...</p>}

      {!authLoading && !userId && (
        <p style={{ color: "red" }}>
          No user is currently logged in. Please sign in to view activity.
        </p>
      )}

      {!authLoading && userId && (
        <>
          {/* Additional user info if desired */}
          <div style={infoBoxStyle}>
            <p>
              <strong>User ID:</strong> {userId}
            </p>
          </div>

          <div style={activityBoxStyle}>
            <h4 style={{ marginTop: 0 }}>Recent Activity</h4>
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

/** Styling for a panel in your 2x2 grid, similar to Panels A or B. */
const panelStyle = {
  backgroundColor: "rgba(255,255,255,0.1)",
  borderRadius: "8px",
  padding: "20px",
  color: "#fff",
  fontFamily: "'Open Sans', sans-serif",
  overflowY: "auto",
  maxHeight: "100%",
};

const infoBoxStyle = {
  backgroundColor: "rgba(255,255,255,0.1)",
  borderRadius: "6px",
  padding: "10px",
  marginBottom: "15px",
};

const activityBoxStyle = {
  backgroundColor: "rgba(255,255,255,0.1)",
  borderRadius: "6px",
  padding: "10px",
};

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

export default PanelC;