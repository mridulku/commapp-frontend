import React, { useState } from "react";

function CasualHomePage() {
  // Hardcoded user name
  const userName = "Casual Reader";

  // Today's date
  const today = new Date().toDateString(); // e.g. "Fri Sep 22 2023"

  // Example self-help / personal development books
  const [books, setBooks] = useState([
    {
      id: 1,
      title: "Atomic Habits",
      todayTask: "Read: 'The Fundamentals of Habit Formation' (Chapter 2)",
      progress: 25, // 25% done
    },
    {
      id: 2,
      title: "The Power of Now",
      todayTask: "Reflect on the concept of 'living in the present moment' (Chapter 3)",
      progress: 40,
    },
    {
      id: 3,
      title: "How to Win Friends and Influence People",
      todayTask: "Study the principle: 'Become genuinely interested in other people' (Part 1)",
      progress: 10,
    },
    {
      id: 4,
      title: "Mindset (Carol Dweck)",
      todayTask: "Focus on 'Growth Mindset vs. Fixed Mindset' (Chapter 1)",
      progress: 55,
    },
  ]);

  // Daily Focus or Motivation: e.g., random quote or tip
  const dailyFocus = "“Small daily improvements over time lead to stunning results.” — Robin Sharma";

  // Reflection & Progress stats
  const dailyReadCompleted = 2; // how many reading tasks user completed today
  const overallCompletion = 35; // overall reading progress (just an example)

  // Handler for "Continue Reading" button
  const handleContinueReading = (bookId) => {
    alert(`Continue reading for book ID: ${bookId}`);
    // In a real app, navigate to reading view or something similar
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0F2027, #203A43, #2C5364)",
        fontFamily: "'Open Sans', sans-serif",
        color: "#fff",
      }}
    >
      {/* Sidebar / Quick Links */}
      <aside
        style={{
          width: "220px",
          backgroundColor: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(8px)",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Quick Links</h3>
        <button
          style={sidebarButtonStyle}
          onClick={() => alert("View All Books clicked")}
        >
          View All Books
        </button>
        <button
          style={sidebarButtonStyle}
          onClick={() => alert("Progress Tracker clicked")}
        >
          Progress Tracker
        </button>
        <button
          style={sidebarButtonStyle}
          onClick={() => alert("Daily Reflections clicked")}
        >
          Daily Reflections
        </button>
      </aside>

      <main style={{ flex: 1, padding: "30px" }}>
        {/* Header */}
        <div style={{ textAlign: "left", marginBottom: "30px" }}>
          <h1 style={{ margin: 0 }}>Welcome to Your Casual Learning Hub</h1>
          <p style={{ margin: 0, fontSize: "1.2rem" }}>
            Today’s Self-Help Reading &amp; Insights
          </p>
          <p style={{ margin: "10px 0", fontSize: "0.9rem" }}>Today is {today}</p>
        </div>

        {/* Daily Focus / Motivation */}
        <section
          style={{
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "30px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Daily Focus / Motivation</h2>
          <blockquote
            style={{
              fontStyle: "italic",
              borderLeft: "4px solid #FFD700",
              paddingLeft: "10px",
            }}
          >
            {dailyFocus}
          </blockquote>
        </section>

        {/* Today’s Reading Tasks */}
        <section
          style={{
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "30px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Today’s Reading Tasks</h2>
          <p>Here are your self-help books for the day:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {books.map((bk) => (
              <div
                key={bk.id}
                style={{
                  backgroundColor: "#333",
                  borderRadius: "8px",
                  padding: "15px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <h3 style={{ margin: "5px 0" }}>{bk.title}</h3>
                  <p style={{ margin: "5px 0" }}>{bk.todayTask}</p>
                  {/* Progress bar */}
                  <div
                    style={{
                      backgroundColor: "rgba(255,255,255,0.3)",
                      height: "8px",
                      width: "200px",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${bk.progress}%`,
                        backgroundColor: "#FFD700",
                        height: "100%",
                        transition: "width 0.3s",
                      }}
                    />
                  </div>
                  <p style={{ fontSize: "0.8rem", marginTop: "5px" }}>
                    {bk.progress}% complete
                  </p>
                </div>
                <button
                  style={continueButtonStyle}
                  onClick={() => handleContinueReading(bk.id)}
                >
                  {bk.progress < 100 ? "Continue Reading" : "Review"}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Reflection & Progress */}
        <section
          style={{
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "10px",
            padding: "20px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Reflection &amp; Progress</h2>
          <div style={{ display: "flex", gap: "30px" }}>
            <div>
              <p>
                <strong>Readings Completed Today:</strong> {dailyReadCompleted}
              </p>
              <p>
                <strong>Overall Completion:</strong> {overallCompletion}%
              </p>
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.3)",
                  width: "200px",
                  height: "8px",
                  borderRadius: "4px",
                  overflow: "hidden",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    width: `${overallCompletion}%`,
                    backgroundColor: "#FFD700",
                    height: "100%",
                    transition: "width 0.3s",
                  }}
                />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <p>
                <strong>Reflection Prompt:</strong> Think about <em>one</em> 
                insight you gained from today’s reading. How does it apply to 
                your daily life?
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

/** Reusable style objects */
const sidebarButtonStyle = {
  background: "none",
  border: "1px solid #FFD700",
  borderRadius: "4px",
  padding: "10px",
  color: "#FFD700",
  fontWeight: "bold",
  cursor: "pointer",
};

const continueButtonStyle = {
  background: "#FFD700",
  border: "none",
  borderRadius: "4px",
  padding: "10px 20px",
  color: "#000",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "opacity 0.3s",
};

export default CasualHomePage;