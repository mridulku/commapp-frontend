import React, { useState } from "react";

function VocationalHomePage() {
  // Hardcoded user name
  const userName = "Developer Dan";

  // Today's date
  const today = new Date().toDateString(); // e.g. "Mon Sep 25 2023"

  // Example coding courses
  // Each has: title, today's task, and a progress %
  const [codingCourses, setCodingCourses] = useState([
    {
      id: 1,
      title: "Python Programming Fundamentals",
      todayTask: "Lesson: Introduction to Python (Chapter 1)",
      progress: 30,
    },
    {
      id: 2,
      title: "JavaScript Essentials",
      todayTask: "Lesson: DOM Manipulation Basics",
      progress: 45,
    },
    {
      id: 3,
      title: "Web Development Bootcamp",
      todayTask: "Build a simple HTML/CSS landing page",
      progress: 10,
    },
    {
      id: 4,
      title: "Data Structures & Algorithms in Practice",
      todayTask: "Implement a Stack & Queue in code",
      progress: 25,
    },
  ]);

  // Next Steps & Challenges
  // Example: suggestions for coding challenges, or recommended practice
  const nextSteps = [
    "Try solving 2 coding challenges on HackerRank",
    "Review JavaScript arrow functions and scopes",
    "Practice debugging Python code in an IDE",
  ];

  // Overall progress summary
  const totalCodingHours = 15; // how many hours user coded in total
  const overallProgress = 35; // e.g. 35% of the entire vocational plan

  // Handler for "Start" or "Resume" button
  const handleStartLesson = (courseId) => {
    alert(`Continue or start lesson for Course ID: ${courseId}`);
    // Navigate or load course content
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
          onClick={() => alert("Access Code Sandbox clicked")}
        >
          Access Code Sandbox
        </button>
        <button
          style={sidebarButtonStyle}
          onClick={() => alert("Watch Video Tutorials clicked")}
        >
          Watch Video Tutorials
        </button>
        <button
          style={sidebarButtonStyle}
          onClick={() => alert("View Full Curriculum clicked")}
        >
          View Full Curriculum
        </button>
      </aside>

      <main style={{ flex: 1, padding: "30px" }}>
        {/* Header */}
        <div style={{ textAlign: "left", marginBottom: "30px" }}>
          <h1 style={{ margin: 0 }}>Welcome to Your Coding Journey</h1>
          <p style={{ margin: 0, fontSize: "1.2rem" }}>
            Today’s Coding Tasks
          </p>
          <p style={{ margin: "10px 0", fontSize: "0.9rem" }}>Today is {today}</p>
        </div>

        {/* Today’s Tasks */}
        <section
          style={{
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "30px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Today’s Tasks</h2>
          <p>Focus on these coding courses and lessons today:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            {codingCourses.map((course) => (
              <div
                key={course.id}
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
                  <h3 style={{ margin: "5px 0" }}>{course.title}</h3>
                  <p style={{ margin: "5px 0" }}>{course.todayTask}</p>
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
                        width: `${course.progress}%`,
                        backgroundColor: "#FFD700",
                        height: "100%",
                        transition: "width 0.3s",
                      }}
                    />
                  </div>
                  <p style={{ fontSize: "0.8rem", marginTop: "5px" }}>
                    {course.progress}% complete
                  </p>
                </div>
                <button
                  style={startButtonStyle}
                  onClick={() => handleStartLesson(course.id)}
                >
                  {course.progress < 100 ? "Start Lesson" : "Review"}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Next Steps & Challenges */}
        <section
          style={{
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "30px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Next Steps & Challenges</h2>
          <p>Based on your progress, here are recommended practice ideas:</p>
          <ul style={{ listStyleType: "circle", marginLeft: "20px" }}>
            {nextSteps.map((step, idx) => (
              <li key={idx} style={{ marginBottom: "5px" }}>
                {step}
              </li>
            ))}
          </ul>
        </section>

        {/* Overall Progress */}
        <section
          style={{
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "10px",
            padding: "20px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Overall Progress</h2>
          <p>
            <strong>Total Coding Hours:</strong> {totalCodingHours} hrs
          </p>
          <p>
            <strong>Overall Plan Completion:</strong> {overallProgress}%
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
        </section>
      </main>
    </div>
  );
}

/** Shared style objects */
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

export default VocationalHomePage;