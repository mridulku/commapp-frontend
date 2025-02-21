import React from "react";
import NavigationBar from "../DetailedBookViewer/NavigationBar";
import { useHomeData } from "./useHomeData";

function Home() {
  // 1) Pull data from our new hook
  const { book, userId, loadingBook, error } = useHomeData();

  // 2) We'll dynamically update the step detail for "Upload a Book"
  //    If there's a book, show that name. If no book, maybe keep it locked or "start".
  //    For example:

  // Decide step status for #1
  let uploadBookStepStatus = "start";
  let uploadBookDetail = "No book uploaded yet.";

  if (loadingBook) {
    uploadBookDetail = "(Loading your book...)";
  } else if (error) {
    // If there's an error, show error message
    uploadBookDetail = `Error loading book: ${error}`;
  } else if (book) {
    // We have a book, so "done"
    uploadBookStepStatus = "done";
    uploadBookDetail = `You uploaded: ${book.name}`;
  }

  // The rest of your steps
  const onboardingSteps = [
    {
      id: 1,
      label: "Upload a Book",
      detail: uploadBookDetail,
      status: uploadBookStepStatus
    },
    {
      id: 2,
      label: "Set Your Learning Goal",
      detail: "Goal: Achieve Mastery",
      status: "done"
    },
    {
      id: 3,
      label: "Confirm Reading Speed",
      detail: "200 WPM",
      status: "done"
    },
    {
      id: 4,
      label: "Read Your First Subchapter",
      detail: null,
      status: "start"
    },
    {
      id: 5,
      label: "Take Your First Quiz",
      detail: null,
      status: "locked"
    },
    {
      id: 6,
      label: "Complete Your First Study Session",
      detail: null,
      status: "locked"
    }
  ];

  // The rest remains basically the same
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
          overflowY: "auto"
        }}
      >
        {/* Combined "Welcome" + "Getting Started" */}
        <div
          style={{
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "20px"
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
                borderRadius: "6px"
              }}
            >
              <div
                style={{
                  width: `${completionPercent}%`,
                  backgroundColor: "#FFD700",
                  height: "100%",
                  borderRadius: "6px",
                  transition: "width 0.3s"
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
                  backgroundColor: "rgba(255,255,255,0.2)"
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
                        fontWeight: "bold"
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
                        textAlign: "center"
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
                        fontWeight: "bold"
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
                        borderRadius: "4px"
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
                      fontSize: "0.85rem"
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

        {/* Today’s Plan + 3-card row remain the same */}
        {/* ... the rest of your Home content ... */}
      </div>
    </div>
  );
}

export default Home;