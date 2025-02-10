import React, { useState } from "react";

/**
 * AcademicHomePage.jsx
 * Minimal modifications based on your requests:
 * 1) Removed "Mark as Completed" checkbox.
 * 2) Removed AI-powered recommendations section.
 * 3) Added a "Switch to Light Mode" button to the sidebar (bottom).
 */
function AcademicHomePage() {
  const userName = "John Doe"; // or fetch from context/user store
  const [today] = useState(new Date().toDateString()); // e.g. "Thu Sep 21 2023"

  // User’s goal: preparing for semester exams
  const userGoal = "Preparing for Semester Exams";
  const overallGoalProgress = 40; // e.g. 40% progress towards the user’s semester exam prep

  // Today’s tasks grouped by course
  const [dailyTasks, setDailyTasks] = useState([
    {
      courseId: 1,
      courseName: "Algorithms",
      tasks: [
        {
          id: "alg-read-1",
          type: "reading",
          label: "Chapter 1: Complexity Overview",
          estimatedTime: "30 min",
          completed: false,
        },
        {
          id: "alg-quiz-1",
          type: "quiz",
          label: "Complexity Quiz",
          estimatedTime: "15 min",
          completed: false,
        },
      ],
    },
    {
      courseId: 2,
      courseName: "Machine Learning",
      tasks: [
        {
          id: "ml-read-2",
          type: "reading",
          label: "Chapter 2: Linear Regression",
          estimatedTime: "45 min",
          completed: false,
        },
      ],
    },
    {
      courseId: 3,
      courseName: "Data Intensive Computing",
      tasks: [
        {
          id: "dic-read-1",
          type: "reading",
          label: "Lecture 4: MapReduce",
          estimatedTime: "25 min",
          completed: false,
        },
        {
          id: "dic-quiz-1",
          type: "quiz",
          label: "MapReduce Quiz",
          estimatedTime: "10 min",
          completed: false,
        },
      ],
    },
  ]);

  // Calculate daily completion
  const allTasks = dailyTasks.flatMap((course) => course.tasks);
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.completed).length;
  const dailyCompletion =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate total estimated time (simple parse from "xx min")
  const totalEstimatedTime = allTasks.reduce((acc, task) => {
    const match = task.estimatedTime.match(/\d+/);
    return match ? acc + parseInt(match[0]) : acc;
  }, 0);

  // Example daily history
  const dailyHistory = [
    { date: "Sep 18", timeSpent: 120 },
    { date: "Sep 19", timeSpent: 90 },
    { date: "Sep 20", timeSpent: 150 },
    { date: "Sep 21", timeSpent: 80 },
  ];

  // Handler to jump into a specific task
  const handleGoToTask = (courseId, taskId) => {
    alert(`Go directly to task ${taskId} in course ID ${courseId}`);
    // e.g., navigate(`/courses/${courseId}/tasks/${taskId}`);
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
      {/* ============ Sidebar ============ */}
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
        <h3 style={{ marginTop: 0 }}>Menu</h3>

        <button
          style={sidebarButtonStyle}
          onClick={() => alert("View All Courses clicked")}
        >
          View All Courses
        </button>
        <button
          style={sidebarButtonStyle}
          onClick={() => alert("Upload Material clicked")}
        >
          Upload Material
        </button>
        <button
          style={sidebarButtonStyle}
          onClick={() => alert("Change Configuration clicked")}
        >
          Change Configuration
        </button>

        {/* Light/Dark Mode Switch moved here */}
        <div style={{ marginTop: "auto" }}>
          <button
            style={sidebarButtonStyle}
            onClick={() => alert("Switch to Light Mode toggled!")}
          >
            Switch to Light Mode
          </button>
        </div>
      </aside>

      {/* ============ Main Content ============ */}
      <main style={{ flex: 1, padding: "30px" }}>
        {/* Header */}
        <div style={{ textAlign: "left", marginBottom: "30px" }}>
          <h1 style={{ margin: 0 }}>Welcome back, {userName}!</h1>
          <p style={{ margin: 0, fontSize: "1.2rem" }}>
            Here’s your personalized study plan
          </p>
          <p style={{ margin: "10px 0", fontSize: "0.9rem" }}>Today is {today}</p>
        </div>

        {/* ============ Goal Section ============ */}
        <section
          style={{
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "30px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Your Goal</h2>
          <p style={{ marginBottom: "10px" }}>{userGoal}</p>
          <div style={{ marginBottom: "10px" }}>
            <strong>Progress towards goal:</strong> {overallGoalProgress}%
          </div>
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.3)",
              height: "8px",
              width: "300px",
              borderRadius: "4px",
              overflow: "hidden",
              marginBottom: "15px",
            }}
          >
            <div
              style={{
                width: `${overallGoalProgress}%`,
                backgroundColor: "#FFD700",
                height: "100%",
                transition: "width 0.3s",
              }}
            />
          </div>
          <p style={{ fontSize: "0.85rem", margin: 0 }}>
            Keep going! You’re making great progress.
          </p>
        </section>

        {/* ============ Today’s Tasks ============ */}
        <section
          style={{
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "30px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Today’s Tasks</h2>
          <p style={{ marginBottom: "10px" }}>
            Estimated total study time: <strong>{totalEstimatedTime} min</strong>
          </p>
          <p style={{ marginBottom: "20px" }}>
            Overall completion for today: <strong>{dailyCompletion}%</strong>
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.3)",
                height: "8px",
                width: "300px",
                borderRadius: "4px",
                overflow: "hidden",
                marginTop: "5px",
              }}
            >
              <div
                style={{
                  width: `${dailyCompletion}%`,
                  backgroundColor: "#FFD700",
                  height: "100%",
                  transition: "width 0.3s",
                }}
              />
            </div>
          </p>

          {dailyTasks.map((course) => (
            <div key={course.courseId} style={{ marginBottom: "20px" }}>
              <h3 style={{ margin: "0 0 10px" }}>{course.courseName}</h3>

              {course.tasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    backgroundColor: "#333",
                    borderRadius: "8px",
                    padding: "15px",
                    marginBottom: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ flex: 1, marginRight: "20px" }}>
                    <p style={{ margin: 0 }}>
                      <strong>{task.type.toUpperCase()}:</strong> {task.label}
                    </p>
                    <p style={{ margin: "5px 0" }}>
                      Estimated Time: {task.estimatedTime}
                    </p>
                    {/* REMOVED the "Mark as Completed" checkbox/label */}
                  </div>

                  <button
                    style={continueButtonStyle}
                    onClick={() => handleGoToTask(course.courseId, task.id)}
                  >
                    Start Now
                  </button>
                </div>
              ))}
            </div>
          ))}
        </section>

        {/* ============ Daily History (recommendations removed) ============ */}
        <section
          style={{
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "10px",
            padding: "20px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Daily History</h2>
          <div style={{ display: "flex", gap: "30px" }}>
            {/* Daily History only */}
            <div style={{ flex: 1 }}>
              <h4 style={{ marginBottom: "10px" }}>Time Spent (Past Few Days)</h4>
              <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
                {dailyHistory.map((entry, idx) => (
                  <li key={idx} style={{ marginBottom: "5px" }}>
                    <strong>{entry.date}:</strong> {entry.timeSpent} min
                  </li>
                ))}
              </ul>
            </div>
            {/* (AI-powered recommendations removed) */}
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
  color: "#000",
  border: "none",
  borderRadius: "4px",
  padding: "10px 20px",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "opacity 0.3s",
};

export default AcademicHomePage;