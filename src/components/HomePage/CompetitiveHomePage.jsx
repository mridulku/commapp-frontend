import React, { useState } from "react";

function CompetitiveHomePage() {
  // Hardcoded user name
  const userName = "Aspirant A"; 
  
  // Today's date
  const [today] = useState(new Date().toDateString()); 
  
  // Example list of core UPSC books / resources
  // Each has a 'title', 'todayTask', 'progress' (percentage), etc.
  const [upscBooks, setUpscBooks] = useState([
    {
      id: 1,
      title: "Indian Polity & Governance",
      todayTask: "Read Chapter: The Evolution of Indian Democracy",
      progress: 40, // 40% completed
    },
    {
      id: 2,
      title: "Modern India (History)",
      todayTask: "Revise: Colonial Policies & Their Impact",
      progress: 65,
    },
    {
      id: 3,
      title: "Indian Economy",
      todayTask: "Study: Fiscal Policy Basics",
      progress: 30,
    },
    {
      id: 4,
      title: "Environment & Ecology",
      todayTask: "Read: Biodiversity Acts & Amendments",
      progress: 20,
    },
    {
      id: 5,
      title: "Internal Security",
      todayTask: "Skim: Terrorism & Insurgency Tactics",
      progress: 10,
    },
  ]);

  // Additional highlights for "Focus Areas" or recommended chapters
  const [focusAreas] = useState([
    "Indian Polity: Governor vs. CM Powers",
    "Economy: GDP Calculation Methods",
    "History: Gandhian Movements Overview",
  ]);

  // Performance insights: could be daily or weekly stats
  const averageStudyTime = 2.5; // 2.5 hours daily on average
  const upcomingTasks = 3;      // tasks not assigned yet or waiting
  const overallProgress = 55;   // overall % of the plan
  const [scoreTrend] = useState("Rising"); // or "Stable"/"Falling"

  // Handler for "Start" or "Resume" button
  const handleStart = (bookId) => {
    alert(`Continue studying book with ID: ${bookId}`);
    // e.g. navigate to reading interface
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
          onClick={() => alert("View Full Study Plan clicked")}
        >
          View Full Study Plan
        </button>
        <button
          style={sidebarButtonStyle}
          onClick={() => alert("Performance Analytics clicked")}
        >
          Performance Analytics
        </button>
        <button
          style={sidebarButtonStyle}
          onClick={() => alert("Upcoming Practice Tests clicked")}
        >
          Upcoming Practice Tests
        </button>
      </aside>

      <main style={{ flex: 1, padding: "30px" }}>
        {/* Header */}
        <div style={{ textAlign: "left", marginBottom: "30px" }}>
          <h1 style={{ margin: 0 }}>UPSC Competitive Exam Dashboard</h1>
          <p style={{ margin: 0, fontSize: "1.2rem" }}>
            Your Study Plan for Today
          </p>
          <p style={{ margin: "10px 0", fontSize: "0.9rem" }}>Today is {today}</p>
        </div>

        {/* Today’s Tasks Section */}
        <section
          style={{
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "30px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Today’s Tasks</h2>
          <p>Focus on these core UPSC books and chapters:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {upscBooks.map((book) => (
              <div
                key={book.id}
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
                  <h3 style={{ margin: "5px 0" }}>{book.title}</h3>
                  <p style={{ margin: "5px 0" }}>{book.todayTask}</p>
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
                        width: `${book.progress}%`,
                        backgroundColor: "#FFD700",
                        height: "100%",
                        transition: "width 0.3s",
                      }}
                    />
                  </div>
                  <p style={{ fontSize: "0.8rem", marginTop: "5px" }}>
                    {book.progress}% complete
                  </p>
                </div>
                <button
                  style={startButtonStyle}
                  onClick={() => handleStart(book.id)}
                >
                  {book.progress < 100 ? "Resume" : "Review"}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Focus Areas Section */}
        <section
          style={{
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "30px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Focus Areas</h2>
          <p>
            Based on your recent performance, we recommend revisiting the following topics:
          </p>
          <ul style={{ listStyleType: "circle", marginLeft: "20px" }}>
            {focusAreas.map((fa, idx) => (
              <li key={idx} style={{ marginBottom: "5px" }}>
                {fa}
              </li>
            ))}
          </ul>
        </section>

        {/* Performance Insights */}
        <section
          style={{
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "30px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Performance Insights</h2>
          <div style={{ display: "flex", gap: "30px" }}>
            <div>
              <p>
                <strong>Average Study Time (Daily):</strong> {averageStudyTime} hours
              </p>
              <p>
                <strong>Upcoming Tasks:</strong> {upcomingTasks}
              </p>
            </div>
            <div>
              <p>
                <strong>Overall Progress:</strong> {overallProgress}%
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
                    width: `${overallProgress}%`,
                    backgroundColor: "#FFD700",
                    height: "100%",
                    transition: "width 0.3s",
                  }}
                />
              </div>
              <p>
                <strong>Score Trend:</strong> {scoreTrend}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// Common button style
const sidebarButtonStyle = {
  background: "none",
  border: "1px solid #FFD700",
  borderRadius: "4px",
  padding: "10px",
  color: "#FFD700",
  fontWeight: "bold",
  cursor: "pointer",
};

const startButtonStyle = {
  background: "#FFD700",
  border: "none",
  borderRadius: "4px",
  padding: "10px 20px",
  color: "#000",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "opacity 0.3s",
};

export default CompetitiveHomePage;