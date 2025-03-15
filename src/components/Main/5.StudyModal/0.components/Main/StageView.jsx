// StageView.jsx
import React from "react";
import { useSelector } from "react-redux";
import StageManager from "./StageManager";

export default function StageView({ examId, activity }) {
  const userId = useSelector((state) => state.auth?.userId || "demoUser");
  const quizStage = (activity.quizStage || "").toLowerCase();

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

  // Pass all traffic to StageManager
  return (
    <div style={styles.outerContainer}>
      <StageManager examId={examId} activity={activity} quizStage={quizStage} userId={userId} />
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