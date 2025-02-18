import React, { useEffect, useState } from "react";
import axios from "axios";

function ActivityLog({ userId, subChapterId, backendURL }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ------------------------- Fetch Activities -------------------------
  const fetchActivities = async () => {
    if (!userId || !subChapterId) {
      setActivities([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const url = `${backendURL}/api/user-activities?userId=${userId}&subChapterId=${subChapterId}`;
      const res = await axios.get(url);
      if (res.data.success) {
        setActivities(res.data.data || []);
      } else {
        setError("Failed to fetch user activities");
      }
    } catch (err) {
      console.error("Error fetching user activities:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
    // eslint-disable-next-line
  }, [userId, subChapterId, backendURL]);

  // ------------------------- Post “Start Reading” -------------------------
  const handleStartReading = async () => {
    try {
      if (!userId || !subChapterId) {
        alert("User or subchapter not available.");
        return;
      }
      const url = `${backendURL}/api/user-activities`;
      await axios.post(url, {
        userId,
        subChapterId,
        type: "startReading", // your chosen type
      });

      // Refresh to see new event
      await fetchActivities();
    } catch (err) {
      console.error("Error creating startReading activity:", err);
      alert("Failed to create activity. See console for details.");
    }
  };

  // ------------------------- Render -------------------------
  if (loading) {
    return <div>Loading Activity Log...</div>;
  }

  if (error) {
    return <div style={{ color: "red" }}>Error: {error}</div>;
  }

  // We ALWAYS render the container + button,
  // then conditionally show the activities or "No activities" message
  return (
    <div style={{ marginTop: "20px" }}>
      <h2>Activity Log</h2>

      {/* The button is always visible, even if no activities */}
      <button
        style={{
          padding: "8px 16px",
          borderRadius: "4px",
          background: "#FFD700",
          color: "#000",
          fontWeight: "bold",
          marginBottom: "10px",
          border: "none",
          cursor: "pointer",
        }}
        onClick={handleStartReading}
      >
        Start Reading (Demo)
      </button>

      {activities.length === 0 ? (
        <p style={{ fontStyle: "italic" }}>No activities found.</p>
      ) : (
        activities.map((act) => {
          const itemStyle = {
            backgroundColor: "rgba(255,255,255,0.1)",
            padding: "10px",
            borderRadius: "6px",
            marginBottom: "8px",
          };

          let timeStr = "";
          if (typeof act.timestamp === "number") {
            timeStr = new Date(act.timestamp).toLocaleString();
          } else if (act.timestamp?._seconds) {
            timeStr = new Date(act.timestamp._seconds * 1000).toLocaleString();
          }

          return (
            <div key={act.activityId} style={itemStyle}>
              <p style={{ margin: 0 }}>
                <strong>Type:</strong> {act.type}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Timestamp:</strong> {timeStr || "N/A"}
              </p>
              {act.metadata && (
                <p style={{ margin: 0 }}>
                  <strong>Metadata:</strong> {JSON.stringify(act.metadata, null, 2)}
                </p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

export default ActivityLog;