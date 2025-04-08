// File: MyProfileBar.jsx
import React from "react";
import TimelapseIcon from "@mui/icons-material/Timelapse";   // For time studied
import WhatshotIcon from "@mui/icons-material/Whatshot";     // For streak
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents"; // For achievements
import StarBorderIcon from "@mui/icons-material/StarBorder"; // For milestone progress

export default function ProfilePanel() {
  // Example “rich” data – in real usage, pass these as props or from Redux
  const userName = "John Doe";
  const userEmail = "john.doe@example.com";
  const totalTimeStudied = "46h";
  const currentStreak = "7 days";
  const achievementsCount = 3;
  const nextMilestoneName = "Intermediate Mastery";
  const nextMilestoneProgress = 70; // in percent

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>My Profile</h2>

      {/* Profile Card with Avatar */}
      <div style={styles.profileCard}>
        <div style={styles.avatarSection}>
          <div style={styles.avatarCircle}>JD</div>
          <div>
            <h3 style={styles.userName}>{userName}</h3>
            <p style={styles.userEmail}>{userEmail}</p>
          </div>
        </div>
      </div>

      {/* Stats Row (3 cards) */}
      <div style={styles.statsRow}>
        {/* Total Time Studied */}
        <div style={{ ...styles.statCard, backgroundColor: "#4DD0E1" /* teal-ish */ }}>
          <div style={styles.statIconWrap}>
            <TimelapseIcon sx={{ fontSize: 30 }} />
          </div>
          <div style={styles.statTextWrap}>
            <p style={styles.statLabel}>Total Time Studied</p>
            <p style={styles.statValue}>{totalTimeStudied}</p>
          </div>
        </div>

        {/* Current Streak */}
        <div style={{ ...styles.statCard, backgroundColor: "#FFB74D" /* orange-ish */ }}>
          <div style={styles.statIconWrap}>
            <WhatshotIcon sx={{ fontSize: 30 }} />
          </div>
          <div style={styles.statTextWrap}>
            <p style={styles.statLabel}>Current Streak</p>
            <p style={styles.statValue}>{currentStreak}</p>
          </div>
        </div>

        {/* Achievements */}
        <div style={{ ...styles.statCard, backgroundColor: "#9575CD" /* purple-ish */ }}>
          <div style={styles.statIconWrap}>
            <EmojiEventsIcon sx={{ fontSize: 30 }} />
          </div>
          <div style={styles.statTextWrap}>
            <p style={styles.statLabel}>Achievements</p>
            <p style={styles.statValue}>{achievementsCount}</p>
          </div>
        </div>
      </div>

      {/* Next Milestone */}
      <div style={styles.milestoneCard}>
        <h3 style={{ margin: 0 }}>Next Milestone</h3>
        <p style={{ margin: "4px 0 12px" }}>{nextMilestoneName}</p>
        <div style={styles.milestoneRow}>
          {/* Example circular progress – faked with a ring + overlay */}
          <div style={styles.ringContainer}>
            <div style={styles.ringBackground}>
              <div
                style={{
                  ...styles.ringProgress,
                  // rotate the ring mask to represent progress
                  transform: `rotate(${(nextMilestoneProgress / 100) * 180}deg)`,
                }}
              />
            </div>
            <div style={styles.ringCenter}>
              <StarBorderIcon sx={{ fontSize: 28 }} />
            </div>
          </div>
          <div style={styles.milestoneTextWrap}>
            <p style={styles.milestoneLabel}>
              {nextMilestoneProgress}% Complete
            </p>
            <p style={styles.milestoneSub}>
              Keep going! You’re close to unlocking your next skill tier.
            </p>
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
  userName: {
    margin: 0,
    fontSize: "1.1rem",
  },
  userEmail: {
    margin: 0,
    fontSize: "0.9rem",
    opacity: 0.8,
  },
  statsRow: {
    display: "flex",
    gap: "16px",
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
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
  milestoneCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: 16,
  },
  milestoneRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginTop: 8,
  },
  ringContainer: {
    position: "relative",
    width: 80,
    height: 80,
  },
  ringBackground: {
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    backgroundColor: "#444",
    position: "relative",
    overflow: "hidden",
  },
  ringProgress: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: "50%",
    backgroundColor: "#FDD835", // golden-ish
    transformOrigin: "center center",
  },
  ringCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    color: "#fff",
  },
  milestoneTextWrap: {
    flex: 1,
  },
  milestoneLabel: {
    margin: 0,
    fontSize: "1rem",
    fontWeight: "bold",
  },
  milestoneSub: {
    margin: "4px 0 0",
    fontSize: "0.85rem",
    opacity: 0.8,
  },
};