// src/components/DetailedBookViewer/PanelA.jsx

import React from "react";
import { useHomeData } from "../DetailedBookViewer/2.1Overview/useHomeData"; // adjust path as needed

function PanelA() {
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

    // Step #4: Has user read at least one subchapter?
    hasReadSubchapter,
    loadingReadSubchapter,
    readSubchapterError,

    // Step #5: Has user completed at least one quiz?
    hasCompletedQuiz,
    loadingQuizCompleted,
    quizError,
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
    readingSpeedStepStatus = "done";
    readingSpeedDetail = `${readingSpeed} WPM`;
  }

  // ====================== STEP #4: READ YOUR FIRST SUBCHAPTER ======================
  let readSubchapterStepStatus = "start";
  let readSubchapterStepDetail = "No subchapters read yet.";

  if (loadingReadSubchapter) {
    readSubchapterStepDetail = "(Checking if you've read a subchapter...)";
  } else if (readSubchapterError) {
    readSubchapterStepDetail = `Error: ${readSubchapterError}`;
  } else if (hasReadSubchapter) {
    readSubchapterStepStatus = "done";
    readSubchapterStepDetail = "You finished reading at least one subchapter!";
  }

  // ====================== STEP #5: TAKE YOUR FIRST QUIZ ======================
  let quizStepStatus = "locked";
  let quizStepDetail = "You haven't taken any quiz yet.";

  if (loadingQuizCompleted) {
    quizStepDetail = "(Checking if you completed a quiz...)";
  } else if (quizError) {
    quizStepDetail = `Error: ${quizError}`;
  } else if (hasCompletedQuiz) {
    quizStepStatus = "done";
    quizStepDetail = "You have completed at least one quiz!";
  } else {
    // If user has read subchapter, we can unlock the quiz
    if (hasReadSubchapter) {
      quizStepStatus = "start";
      quizStepDetail = "Ready to attempt your first quiz!";
    }
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
      detail: readSubchapterStepDetail,
      status: readSubchapterStepStatus,
    },
    {
      id: 5,
      label: "Take Your First Quiz",
      detail: quizStepDetail,
      status: quizStepStatus,
    },
  ];

  const totalSteps = onboardingSteps.length;
  const doneCount = onboardingSteps.filter((s) => s.status === "done").length;
  const completionPercent = Math.round((doneCount / totalSteps) * 100);

  // ====================== PANEL STYLES ======================
  const panelStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: "8px",
    padding: "20px",
    color: "#fff",
    // adjust width or height to fit in your 2x2 grid
    minWidth: "250px",
    // You can also set maxHeight or make it scrollable, depending on your layout
  };

  const progressBarContainerStyle = {
    height: "10px",
    backgroundColor: "#444",
    borderRadius: "6px",
    margin: "10px 0",
  };

  const progressBarStyle = {
    width: `${completionPercent}%`,
    backgroundColor: "#FFD700",
    height: "100%",
    borderRadius: "6px",
    transition: "width 0.3s",
  };

  return (
    <div style={panelStyle} id="panelA">
      <h3 style={{ marginTop: 0 }}>Onboarding Steps</h3>
      <p style={{ fontSize: "0.9rem", marginTop: "5px" }}>
        A quick view of your onboarding progress:
      </p>

      {/* Progress bar */}
      <div style={progressBarContainerStyle}>
        <div style={progressBarStyle} />
      </div>
      <p style={{ margin: 0, fontSize: "0.85rem" }}>
        {doneCount}/{totalSteps} steps completed ({completionPercent}%)
      </p>

      {/* Steps list */}
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
          </div>
        ))}
      </div>
    </div>
  );
}

export default PanelA;