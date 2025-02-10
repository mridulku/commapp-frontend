import React, { useState } from "react";

/**
 * UserProfileAnalytics.jsx
 * Enhanced to show how each metric influences the AI-driven adaptive learning.
 */
function UserProfileAnalytics() {
  // =====================================================
  // State: expanded to include new data from your list
  // =====================================================
  const [userStats, setUserStats] = useState({
    userName: "John Doe",
    age: 25,
    educationalBackground: "Undergraduate",
    languagePreference: "English",
    readingSpeedWpm: 280, // words per minute
    totalWordsRead: 45000,
    subchaptersCompleted: 18,
    totalSubchapters: 25,
    averageQuizScore: 82, // in percentage

    // Difficulty aptitude
    difficultyAptitude: {
      highDifficultyScore: 75,
      mediumDifficultyScore: 85,
      lowDifficultyScore: 90,
    },

    // Engagement
    engagement: {
      totalTimeSpentMinutes: 360, // total minutes across platform
      frequencyOfVisits: "Daily",
      averageSessionLengthMinutes: 15,
    },

    // Mastery in different subjects
    masteryBySubject: {
      math: 80,
      biology: 72,
      physics: 94,
    },

    // Learning style
    learningStyle: {
      explanationMode: "Video", // e.g. "Text", "Video", "Analogy"...
      stepByStepPreference: true,
    },

    // Session history
    sessionHistory: [
      { date: "2023-08-01", wordsRead: 1200, minutesSpent: 10, quizScore: 70 },
      { date: "2023-08-02", wordsRead: 2000, minutesSpent: 15, quizScore: 85 },
      { date: "2023-08-03", wordsRead: 2200, minutesSpent: 18, quizScore: 90 },
      { date: "2023-08-04", wordsRead: 1000, minutesSpent: 8, quizScore: 95 },
    ],
  });

  // =====================================================
  // Handlers / Computation Helpers
  // =====================================================
  const handleUpdateReadingSpeed = () => {
    const newSpeed = prompt("Enter new reading speed (WPM):", userStats.readingSpeedWpm);
    if (newSpeed && !isNaN(newSpeed)) {
      setUserStats((prev) => ({
        ...prev,
        readingSpeedWpm: parseInt(newSpeed),
      }));
    }
  };

  const handleUpdateAge = () => {
    const newAge = prompt("Enter your age:", userStats.age);
    if (newAge && !isNaN(newAge)) {
      setUserStats((prev) => ({
        ...prev,
        age: parseInt(newAge),
      }));
    }
  };

  const getSubchapterProgressPct = () => {
    if (userStats.totalSubchapters === 0) return 0;
    return (userStats.subchaptersCompleted / userStats.totalSubchapters) * 100;
  };

  const totalHoursSpent = (userStats.engagement.totalTimeSpentMinutes / 60).toFixed(1);

  // =====================================================
  // Helper: color-coded difficulty or performance
  // Could do more sophisticated logic here
  // =====================================================
  const getColorByScore = (score) => {
    if (score >= 80) return "#4CAF50"; // green
    if (score >= 60) return "#FFC107"; // yellow
    return "#F44336"; // red
  };

  return (
    <div style={containerStyle}>
      {/* ============ Sidebar ============ */}
      <aside style={sidebarStyle}>
        <h3 style={{ marginTop: 0 }}>Menu</h3>
        <button style={sidebarButtonStyle} onClick={() => alert("View Profile clicked")}>
          View Profile
        </button>
        <button style={sidebarButtonStyle} onClick={() => alert("Analytics clicked")}>
          Analytics
        </button>
        <button style={sidebarButtonStyle} onClick={() => alert("Settings clicked")}>
          Settings
        </button>
      </aside>

      {/* ============ Main Content ============ */}
      <main style={{ flex: 1, padding: "30px" }}>
        <h1 style={{ marginBottom: "20px" }}>User Profile & Analytics</h1>

        {/* =====================================
            Global User Profile & Demographics
           ===================================== */}
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Global User Profile</h2>
          <div style={{ display: "flex", gap: "30px", flexWrap: "wrap" }}>
            <div>
              <p style={infoLineStyle}>
                <strong>Name:</strong> {userStats.userName}
              </p>
              <p style={infoLineStyle}>
                <strong>Age:</strong> {userStats.age}{" "}
                <button style={inlineButtonStyle} onClick={handleUpdateAge}>
                  Update
                </button>
              </p>
              <p style={infoLineStyle}>
                <strong>Educational Background:</strong>{" "}
                {userStats.educationalBackground}
              </p>
              <p style={infoLineStyle}>
                <strong>Language Preference:</strong> {userStats.languagePreference}
              </p>
            </div>
            <div>
              <p style={infoLineStyle}>
                <strong>Preferred Explanation Mode:</strong>{" "}
                {userStats.learningStyle.explanationMode}{" "}
                <span style={{ fontSize: "0.8rem", color: "#FFD700" }}>
                  (AI Impact: We prioritize {userStats.learningStyle.explanationMode.toLowerCase()} content 
                  in lessons & quizzes.)
                </span>
              </p>
              <p style={infoLineStyle}>
                <strong>Step-by-step Preference:</strong>{" "}
                {userStats.learningStyle.stepByStepPreference ? "Yes" : "No"}{" "}
                <span style={{ fontSize: "0.8rem", color: "#FFD700" }}>
                  (AI Impact: Explanations given in smaller, sequential chunks.)
                </span>
              </p>
              <p style={infoLineStyle}>
                <strong>Reading Speed (WPM):</strong> {userStats.readingSpeedWpm}{" "}
                <button style={inlineButtonStyle} onClick={handleUpdateReadingSpeed}>
                  Update
                </button>
                <br />
                <span style={{ fontSize: "0.8rem", color: "#FFD700" }}>
                  (AI Impact: Study plans & quiz length adapt to this speed 
                  in real-time.)
                </span>
              </p>
              <p style={infoLineStyle}>
                <strong>Total Words Read:</strong> {userStats.totalWordsRead}
              </p>
            </div>
          </div>
        </div>

        {/* =====================================
            Reading & Subchapter Progress
           ===================================== */}
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Reading & Subchapter Progress</h2>
          <div style={{ display: "flex", gap: "30px", flexWrap: "wrap" }}>
            <div>
              <p style={infoLineStyle}>
                <strong>Subchapters Completed:</strong>{" "}
                {userStats.subchaptersCompleted} / {userStats.totalSubchapters}{" "}
                <span style={{ fontSize: "0.8rem", color: "#FFD700" }}>
                  (AI sees you're {getSubchapterProgressPct().toFixed(1)}% done 
                  and adjusts next content accordingly.)
                </span>
              </p>
              {/* Subchapter Completion Progress Bar */}
              <div style={{ marginTop: "15px", maxWidth: "250px" }}>
                <label style={labelStyle}>Subchapter Completion:</label>
                <div style={progressBarContainerStyle}>
                  <div
                    style={{
                      ...progressBarFillStyle,
                      width: `${getSubchapterProgressPct()}%`,
                    }}
                  />
                </div>
                <p style={progressTextStyle}>
                  {getSubchapterProgressPct().toFixed(1)}% Completed
                </p>
              </div>
            </div>
            <div>
              <p style={{ fontSize: "0.9rem", marginTop: "5px" }}>
                <strong>Adaptive Content Delivery:</strong> 
                <br />
                {getSubchapterProgressPct() > 70
                  ? "You are progressing quickly! AI is preparing more advanced topics. ✅"
                  : "You still have subchapters to go—AI will reinforce key concepts to ensure full understanding. 🔄"}
              </p>
            </div>
          </div>
        </div>

        {/* =====================================
            Quiz Performance & Mastery
           ===================================== */}
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Quiz Performance & Mastery</h2>
          <p style={{ margin: "5px 0" }}>
            <strong>Average Quiz Score:</strong>{" "}
            <span style={{ color: getColorByScore(userStats.averageQuizScore) }}>
              {userStats.averageQuizScore}%
            </span>{" "}
            <span style={{ fontSize: "0.8rem", color: "#FFD700" }}>
              (AI Impact: If consistently high, AI raises difficulty to challenge you. 
              If low, AI provides extra practice & simpler explanations.)
            </span>
          </p>

          {/* Mastery by Subject */}
          <div style={{ marginTop: "20px" }}>
            <h4 style={{ marginBottom: "10px" }}>Mastery by Subject</h4>
            <div style={{ display: "flex", gap: "30px" }}>
              {Object.entries(userStats.masteryBySubject).map(([subject, score]) => (
                <div key={subject}>
                  <p style={infoLineStyle}>
                    <strong>{subject.toUpperCase()}:</strong>{" "}
                    <span style={{ color: getColorByScore(score) }}>{score}%</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: "0.9rem", fontStyle: "italic", marginTop: "10px" }}>
            *Subject mastery updates after each quiz. AI uses these levels to
            select next modules & question difficulty.
          </p>
        </div>

        {/* =====================================
            Difficulty Aptitude
           ===================================== */}
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Difficulty Aptitude</h2>
          <div style={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
            <div>
              <p style={{ ...infoLineStyle, color: getColorByScore(userStats.difficultyAptitude.highDifficultyScore) }}>
                <strong>High Difficulty Score:</strong>{" "}
                {userStats.difficultyAptitude.highDifficultyScore}%
              </p>
              <p style={{ ...infoLineStyle, color: getColorByScore(userStats.difficultyAptitude.mediumDifficultyScore) }}>
                <strong>Medium Difficulty Score:</strong>{" "}
                {userStats.difficultyAptitude.mediumDifficultyScore}%
              </p>
              <p style={{ ...infoLineStyle, color: getColorByScore(userStats.difficultyAptitude.lowDifficultyScore) }}>
                <strong>Low Difficulty Score:</strong>{" "}
                {userStats.difficultyAptitude.lowDifficultyScore}%
              </p>
            </div>
            <div>
              <p style={{ fontSize: "0.9rem" }}>
                <strong>AI Difficulty Scaling:</strong>
                <br />
                {userStats.difficultyAptitude.highDifficultyScore >= 70
                  ? "You excel at high difficulty—AI adds advanced questions. 📈"
                  : "AI is balancing difficulty levels to keep you challenged but not overwhelmed. 🔄"}
              </p>
            </div>
          </div>
        </div>

        {/* =====================================
            Engagement Metrics
           ===================================== */}
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Engagement & AI Study Optimization</h2>
          <div style={{ display: "flex", gap: "40px", flexWrap: "wrap" }}>
            <div>
              <p style={infoLineStyle}>
                <strong>Total Time on Platform:</strong> {totalHoursSpent} hours
              </p>
              <p style={infoLineStyle}>
                <strong>Visit Frequency:</strong> {userStats.engagement.frequencyOfVisits}
              </p>
              <p style={infoLineStyle}>
                <strong>Average Session Length:</strong>{" "}
                {userStats.engagement.averageSessionLengthMinutes} minutes
              </p>
            </div>
            <div style={{ fontSize: "0.9rem" }}>
              <strong>AI Insights:</strong>
              <ul style={{ marginTop: "5px", paddingLeft: "18px" }}>
                {userStats.engagement.averageSessionLengthMinutes < 15 ? (
                  <li>
                    Your sessions are short! AI suggests short, frequent study bursts 
                    for better retention. ⏳
                  </li>
                ) : (
                  <li>
                    Good session length—AI will maintain standard chunk sizes. ✅
                  </li>
                )}
                {userStats.engagement.frequencyOfVisits === "Daily" ? (
                  <li>
                    You're logging in daily—AI is scheduling spaced-repetition reviews. 🔔
                  </li>
                ) : (
                  <li>
                    Less frequent visits—AI may group content to match your schedule. ⚖️
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* =====================================
            Session History
           ===================================== */}
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Session History</h2>
          {userStats.sessionHistory.length === 0 ? (
            <p style={{ fontStyle: "italic" }}>No session data available.</p>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thTdStyle}>Date</th>
                  <th style={thTdStyle}>Words Read</th>
                  <th style={thTdStyle}>Time Spent (min)</th>
                  <th style={thTdStyle}>Quiz Score (%)</th>
                </tr>
              </thead>
              <tbody>
                {userStats.sessionHistory.map((session, index) => (
                  <tr key={index}>
                    <td style={thTdStyle}>{session.date}</td>
                    <td style={thTdStyle}>{session.wordsRead}</td>
                    <td style={thTdStyle}>{session.minutesSpent}</td>
                    <td
                      style={{
                        ...thTdStyle,
                        color: getColorByScore(session.quizScore),
                      }}
                    >
                      {session.quizScore}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* =====================================
            AI Suggestions or Next Steps
           ===================================== */}
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>AI Suggestions & Next Steps</h2>
          <p style={{ margin: "8px 0" }}>
            <strong>Based on Your Current Data, the AI Recommends:</strong>
          </p>
          <ul style={{ listStyleType: "circle", paddingLeft: "20px" }}>
            {/* Example logic-driven suggestions */}
            {userStats.averageQuizScore < 80 && (
              <li>
                Revisit subchapters with lower quiz scores to boost comprehension.
              </li>
            )}
            {userStats.difficultyAptitude.highDifficultyScore > 70 && (
              <li>
                AI will introduce advanced-level tasks next. Keep up the great work!
              </li>
            )}
            {getSubchapterProgressPct() < 50 && (
              <li>
                Complete more subchapters to unlock additional practice quizzes.
              </li>
            )}
            <li>
              Maintain your daily login streak to enable deeper spaced-repetition
              strategies.
            </li>
          </ul>
          <p style={{ fontSize: "0.9rem", fontStyle: "italic", marginTop: "5px" }}>
            These suggestions update automatically as your stats change.
          </p>
        </div>
      </main>
    </div>
  );
}

/****************************************
 * Reusable Style Objects
 ****************************************/
const containerStyle = {
  display: "flex",
  minHeight: "100vh",
  background: "linear-gradient(135deg, #0F2027, #203A43, #2C5364)",
  fontFamily: "'Open Sans', sans-serif",
  color: "#fff",
};

const sidebarStyle = {
  width: "220px",
  backgroundColor: "rgba(255,255,255,0.1)",
  backdropFilter: "blur(8px)",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "15px",
};

const sidebarButtonStyle = {
  background: "none",
  border: "1px solid #FFD700",
  borderRadius: "4px",
  padding: "10px",
  color: "#FFD700",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "background 0.2s",
  textAlign: "left",
};

const cardStyle = {
  backgroundColor: "rgba(255,255,255,0.1)",
  borderRadius: "10px",
  padding: "20px",
  marginBottom: "30px",
};

const cardTitleStyle = {
  marginTop: 0,
  marginBottom: "10px",
  borderBottom: "1px solid rgba(255,255,255,0.3)",
  paddingBottom: "5px",
};

const infoLineStyle = {
  margin: "5px 0",
};

const inlineButtonStyle = {
  marginLeft: "10px",
  background: "#FFD700",
  color: "#000",
  border: "none",
  borderRadius: "4px",
  padding: "4px 8px",
  fontWeight: "bold",
  cursor: "pointer",
};

const labelStyle = {
  display: "block",
  marginBottom: "5px",
};

const progressBarContainerStyle = {
  backgroundColor: "rgba(255,255,255,0.3)",
  borderRadius: "6px",
  overflow: "hidden",
  height: "10px",
  width: "100%",
};

const progressBarFillStyle = {
  height: "100%",
  background: "#FFD700",
  transition: "width 0.3s",
};

const progressTextStyle = {
  fontSize: "0.9rem",
  marginTop: "5px",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "10px",
};

const thTdStyle = {
  border: "1px solid rgba(255,255,255,0.3)",
  padding: "8px",
  textAlign: "center",
  fontSize: "0.9rem",
};

export default UserProfileAnalytics;