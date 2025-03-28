// File: StageView.jsx
import React from "react";
import { useSelector } from "react-redux";
import StageManager from "./StageManager";
import CumulativeQuiz from "../CumulativeComp/CumulativeQuiz";
import CumulativeRevision from "../CumulativeComp/CumulativeRevision";

export default function StageView({ examId, activity }) {
  const userId = useSelector((state) => state.auth?.userId || "demoUser");

  // If this is "read" type, there's no quizStage on it. If it's a quiz type, we might have quizStage
  const activityType = (activity.type || "").toLowerCase();
  const quizStage = (activity.quizStage || "").toLowerCase();

  // 1) Check for special "cumulative" stages
  if (quizStage === "cumulativequiz") {
    return (
      <div style={styles.outerContainer}>
        <CumulativeQuiz examId={examId} activity={activity} userId={userId} />
      </div>
    );
  }
  if (quizStage === "cumulativerevision") {
    return (
      <div style={styles.outerContainer}>
        <CumulativeRevision examId={examId} activity={activity} userId={userId} />
      </div>
    );
  }

  // 2) Otherwise => pass to StageManager, even if it's reading
  //    The StageManager will see if it's "read" type or a known quizStage, and show the right tab.
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