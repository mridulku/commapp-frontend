// StageView.jsx
import React from "react";
import { useSelector } from "react-redux";
import StageManager from "./StageManager";

// Import the new dummy components
import CumulativeQuiz from "../CumulativeComp/CumulativeQuiz";
import CumulativeRevision from "../CumulativeComp/CumulativeRevision";

export default function StageView({ examId, activity }) {
  const userId = useSelector((state) => state.auth?.userId || "demoUser");
  const quizStage = (activity.quizStage || "").toLowerCase();

  // 1) If no quizStage found
  if (!quizStage) {
    return (
      <div style={styles.outerContainer}>
        <h2>No quizStage found</h2>
        <pre style={{ backgroundColor: "#222", padding: "8px", color: "#fff" }}>
          {JSON.stringify(activity, null, 2)}
        </pre>
      </div>
    );
  }

  // 2) Check for special "cumulative" stages
  if (quizStage === "cumulativequiz") {
    // Render the CumulativeQuiz dummy component
    return (
      <div style={styles.outerContainer}>
        <CumulativeQuiz examId={examId} activity={activity} userId={userId} />
      </div>
    );
  }

  if (quizStage === "cumulativerevision") {
    // Render the CumulativeRevision dummy component
    return (
      <div style={styles.outerContainer}>
        <CumulativeRevision examId={examId} activity={activity} userId={userId} />
      </div>
    );
  }

  // 3) Otherwise, default to the existing StageManager approach
  return (
    <div style={styles.outerContainer}>
      <StageManager
        examId={examId}
        activity={activity}
        quizStage={quizStage}
        userId={userId}
      />
    </div>
  );
}

const styles = {
  outerContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
    color: "#fff",
    padding: "20px",
    boxSizing: "border-box",
    fontFamily: `'Inter', 'Roboto', sans-serif`,
  },
};