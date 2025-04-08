// File: src/components/ProfilePanel.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";

import EmailIcon from "@mui/icons-material/Email";
import EventIcon from "@mui/icons-material/Event";      // calendar icon
import TimelapseIcon from "@mui/icons-material/Timelapse"; // total time
import WhatshotIcon from "@mui/icons-material/Whatshot";    // streak

export default function ProfilePanel({ userId }) {
  // userDoc from /api/user
  const [userEmail, setUserEmail] = useState("unknown@example.com");
  const [joinedDate, setJoinedDate] = useState(null);

  // From /api/daily-time-all
  const [totalTimeSec, setTotalTimeSec] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  // On mount => fetch user doc
  useEffect(() => {
    if (!userId) return;

    async function fetchUserDoc() {
      try {
        // e.g. GET /api/user?userId=xxx
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/user`, {
          params: { userId },
        });
        if (res.data?.success && res.data.user) {
          const { username, createdAt } = res.data.user;
          setUserEmail(username || "no-email@example.com");

          // Parse joined date
          if (createdAt) {
            // E.g. "2025-04-08T11:45:18.000Z"
            const d = new Date(createdAt);
            if (!isNaN(d.valueOf())) {
              setJoinedDate(d);
            }
          }
        } else {
          console.warn("No user doc found or success=false.");
        }
      } catch (err) {
        console.error("Error fetching user doc:", err);
      }
    }

    fetchUserDoc();
  }, [userId]);

  // Then fetch all daily usage
  useEffect(() => {
    if (!userId) return;

    async function fetchAllDailyTimes() {
      try {
        // e.g. GET /api/daily-time-all?userId=xxx
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/daily-time-all`, {
          params: { userId },
        });
        if (res.data && res.data.success) {
          const records = res.data.records || [];
          // sum total
          let totalSec = 0;
          const dateMap = new Map();
          records.forEach((r) => {
            totalSec += (r.sumSeconds || 0);
            dateMap.set(r.dateStr, r.sumSeconds || 0);
          });
          setTotalTimeSec(totalSec);

          // compute streak
          const streakDays = computeStreak(dateMap);
          setCurrentStreak(streakDays);
        } else {
          console.warn("No data from daily-time-all endpoint");
        }
      } catch (err) {
        console.error("Error fetching daily-time-all:", err);
      }
    }
    fetchAllDailyTimes();
  }, [userId]);

  // Compute consecutive-day streak going backward from today
  function computeStreak(dateMap) {
    let streakCount = 0;
    const today = new Date();
    while (true) {
      const dateStr = formatDate(today);
      const usage = dateMap.get(dateStr) || 0;
      if (usage > 0) {
        streakCount++;
        today.setDate(today.getDate() - 1);
      } else {
        break;
      }
    }
    return streakCount;
  }

  function formatDate(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function formatDateNice(d) {
    // e.g. "Apr 8, 2025"
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Convert totalTimeSec => "Xh Ym"
  function formatTotalTime(sec) {
    const hours = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  }

  const totalTimeStr = formatTotalTime(totalTimeSec);

  // The avatar text => uppercase first letter of email
  const avatarChar = userEmail?.[0]?.toUpperCase() || "U";

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>My Profile</h2>

      {/* Profile top area: email + joined date */}
      <div style={styles.profileCard}>
        <div style={styles.avatarSection}>
          <div style={styles.avatarCircle}>{avatarChar}</div>
          <div>
            {/* Email row */}
            <p style={styles.userEmail}>
              <EmailIcon sx={{ fontSize: 16, verticalAlign: "middle", mr: 1 }} />
              {userEmail}
            </p>

            {/* Joined row (only if joinedDate is available) */}
            {joinedDate && (
              <p style={styles.joinedDate}>
                <EventIcon sx={{ fontSize: 16, verticalAlign: "middle", mr: 1 }} />
                Joined on {formatDateNice(joinedDate)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats: total time + streak, in vertical column */}
      <div style={styles.statsColumn}>
        {/* Total Time Studied */}
        <div style={{ ...styles.statCard, backgroundColor: "#4DD0E1" }}>
          <div style={styles.statIconWrap}>
            <TimelapseIcon sx={{ fontSize: 30 }} />
          </div>
          <div style={styles.statTextWrap}>
            <p style={styles.statLabel}>Total Time Studied</p>
            <p style={styles.statValue}>{totalTimeStr}</p>
          </div>
        </div>

        {/* Current Streak */}
        <div style={{ ...styles.statCard, backgroundColor: "#FFB74D" }}>
          <div style={styles.statIconWrap}>
            <WhatshotIcon sx={{ fontSize: 30 }} />
          </div>
          <div style={styles.statTextWrap}>
            <p style={styles.statLabel}>Current Streak</p>
            <p style={styles.statValue}>{currentStreak} days</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Inline styles
const styles = {
  container: {
    width: "100%",
    maxWidth: "720px",
    margin: "0 auto",
    color: "#fff",
    fontFamily: "'Open Sans', sans-serif",
  },
  header: {
    marginBottom: 16,
    borderBottom: "1px solid #555",
    paddingBottom: 8,
  },
  profileCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: "16px",
    marginBottom: 16,
  },
  avatarSection: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: "50%",
    backgroundColor: "#888",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#fff",
    fontSize: "1.2rem",
    fontWeight: "bold",
  },
  userEmail: {
    margin: 0,
    fontSize: "0.95rem",
    opacity: 0.9,
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  joinedDate: {
    margin: 0,
    marginTop: 6,
    fontSize: "0.85rem",
    opacity: 0.8,
    display: "flex",
    alignItems: "center",
  },
  statsColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  statCard: {
    borderRadius: 8,
    padding: "12px",
    color: "#000",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  statIconWrap: {
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: "50%",
    width: 48,
    height: 48,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  statTextWrap: {
    display: "flex",
    flexDirection: "column",
  },
  statLabel: {
    margin: 0,
    fontSize: "0.8rem",
  },
  statValue: {
    margin: 0,
    fontSize: "1.2rem",
    fontWeight: "bold",
  },
};