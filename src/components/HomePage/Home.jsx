import React from "react";
import NavigationBar from "../DetailedBookViewer/NavigationBar";
import { useHomeData } from "./useHomeData";

function Home() {
  // Pull data from our custom hook
  const {
    // Book
    book,
    loadingBook,
    bookError,

    // Goal
    goal,
    loadingGoal,
    goalError,

    // Reading Speed
    readingSpeed,
    loadingSpeed,
    speedError,
  } = useHomeData();

  // ====================== STEP #1: UPLOAD A BOOK ======================
  let uploadBookStepStatus = "start";
  let uploadBookDetail = "No book uploaded yet.";

  if (loadingBook) {
    uploadBookDetail = "(Loading your book...)";
  } else if (bookError) {
    uploadBookDetail = `Error loading book: ${bookError}`;
  } else if (book) {
    uploadBookStepStatus = "done";
    uploadBookDetail = `You uploaded: ${book.name}`;
  }

  // ====================== STEP #2: SET YOUR LEARNING GOAL ======================
  let goalStepStatus = "start";
  let goalStepDetail = "No goal set yet.";

  if (loadingGoal) {
    goalStepDetail = "(Loading your goal...)";
  } else if (goalError) {
    goalStepDetail = `Error loading goal: ${goalError}`;
  } else if (goal) {
    goalStepStatus = "done";
    goalStepDetail = `Goal: ${goal}`;
  }

  // ====================== STEP #3: CONFIRM READING SPEED ======================
  let readingSpeedStepStatus = "start";
  let readingSpeedDetail = "Reading speed not set yet.";

  if (loadingSpeed) {
    readingSpeedDetail = "(Loading reading speed...)";
  } else if (speedError) {
    readingSpeedDetail = `Error loading speed: ${speedError}`;
  } else if (readingSpeed) {
    // We have an integer readingSpeed => "done"
    readingSpeedStepStatus = "done";
    readingSpeedDetail = `${readingSpeed} WPM`;
  }

  // ====================== BUILD THE ONBOARDING STEPS ======================
  const onboardingSteps = [
    {
      id: 1,
      label: "Upload a Book",
      detail: uploadBookDetail,
      status: uploadBookStepStatus,
    },
    {
      id: 2,
      label: "Set Your Learning Goal",
      detail: goalStepDetail,
      status: goalStepStatus,
    },
    {
      id: 3,
      label: "Confirm Reading Speed",
      detail: readingSpeedDetail,
      status: readingSpeedStepStatus,
    },
    {
      id: 4,
      label: "Read Your First Subchapter",
      detail: null,
      status: "start",
    },
    {
      id: 5,
      label: "Take Your First Quiz",
      detail: null,
      status: "locked",
    },
    {
      id: 6,
      label: "Complete Your First Study Session",
      detail: null,
      status: "locked",
    },
  ];

  // Calculate the progress bar
  const totalSteps = onboardingSteps.length;
  const doneCount = onboardingSteps.filter((s) => s.status === "done").length;
  const completionPercent = Math.round((doneCount / totalSteps) * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <NavigationBar />

      <div
        style={{
          flex: 1,
          background: "linear-gradient(135deg, #0F2027, #203A43, #2C5364)",
          color: "#fff",
          padding: "20px",
          overflowY: "auto",
        }}
      >
        {/* Combined "Welcome" + "Getting Started" */}
        <div
          style={{
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Welcome to the Adaptive Learning Platform</h2>
          <p style={{ fontSize: "0.95rem", lineHeight: "1.5" }}>
            We tailor a plan specifically for your reading speed and goals.
            As you study and take quizzes, the platform learns about you
            and adapts the plan to best fit your needs.
          </p>

          <h3 style={{ marginTop: "20px" }}>Getting Started</h3>
          <p style={{ fontSize: "0.9rem", marginTop: 0 }}>
            Follow these steps to make the best use of our platform:
          </p>

          {/* Progress bar */}
          <div style={{ margin: "10px 0" }}>
            <div
              style={{
                height: "10px",
                backgroundColor: "#444",
                borderRadius: "6px",
              }}
            >
              <div
                style={{
                  width: `${completionPercent}%`,
                  backgroundColor: "#FFD700",
                  height: "100%",
                  borderRadius: "6px",
                  transition: "width 0.3s",
                }}
              />
            </div>
            <p style={{ margin: "5px 0 0", fontSize: "0.85rem" }}>
              {doneCount}/{totalSteps} steps completed ({completionPercent}%)
            </p>
          </div>

          {/* Steps */}
          <div style={{ marginTop: "15px" }}>
            {onboardingSteps.map((step) => (
              <div
                key={step.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "10px",
                  padding: "8px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(255,255,255,0.2)",
                }}
              >
                {/* Icon */}
                <div style={{ marginRight: "8px" }}>
                  {step.status === "done" ? (
                    <span
                      style={{
                        display: "inline-block",
                        width: "20px",
                        height: "20px",
                        backgroundColor: "limegreen",
                        borderRadius: "4px",
                        textAlign: "center",
                        color: "#000",
                        fontWeight: "bold",
                      }}
                    >
                      ✓
                    </span>
                  ) : step.status === "locked" ? (
                    <span
                      style={{
                        display: "inline-block",
                        width: "20px",
                        height: "20px",
                        backgroundColor: "#ccc",
                        borderRadius: "4px",
                        textAlign: "center",
                      }}
                    >
                      🔒
                    </span>
                  ) : step.status === "start" ? (
                    <span
                      style={{
                        display: "inline-block",
                        width: "20px",
                        height: "20px",
                        backgroundColor: "#FFD700",
                        borderRadius: "4px",
                        textAlign: "center",
                        color: "#000",
                        fontWeight: "bold",
                      }}
                    >
                      →
                    </span>
                  ) : (
                    <span
                      style={{
                        display: "inline-block",
                        width: "20px",
                        height: "20px",
                        backgroundColor: "#aaa",
                        borderRadius: "4px",
                      }}
                    />
                  )}
                </div>

                {/* Step Label & Detail */}
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: "0.95rem" }}>{step.label}</strong>
                  {step.detail && (
                    <div style={{ fontSize: "0.8rem", marginTop: "2px" }}>
                      {step.detail}
                    </div>
                  )}
                </div>

                {/* "Start" Button if "start" */}
                {step.status === "start" && (
                  <button
                    style={{
                      padding: "6px 10px",
                      border: "none",
                      borderRadius: "4px",
                      backgroundColor: "#FFD700",
                      color: "#000",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "0.85rem",
                    }}
                    onClick={() => alert(`Starting: ${step.label}`)}
                  >
                    Start
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* (2) Today’s Plan + (3) 3-card row remain the same below */}
        {/* ... the rest of your Home content ... */}
      </div>
    </div>
  );
}

export default Home;