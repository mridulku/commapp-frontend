// QuizView.jsx
import React from "react";
import { useSelector } from "react-redux";

import RememberView from "../1.2RememberView/RememberView";
import UnderstandView from "../1.3UnderstandView/UnderstandView";
import ApplyView from "../1.5ApplyView/ApplyView";
import AnalyzeView from "../1.4AnalyzeView/AnalyzeView";

/**
 * QuizView
 *  - Accepts examId + activity
 *  - Chooses which stage subcomponent to render
 */
export default function QuizView({ examId, activity }) {
  const userId = useSelector((state) => state.auth?.userId || "demoUser");

  const quizStage = (activity.quizStage || "").toLowerCase();

  // If you want to do exam-based logic, you'd do something like:
  // if (examId === "myExam" && quizStage === "apply") {...} etc.

  switch (quizStage) {
    case "remember":
      return <RememberView examId={examId} activity={activity} />;
    case "understand":
      return <UnderstandView examId={examId} activity={activity} />;
    case "apply":
      return <ApplyView examId={examId} activity={activity} />;
    case "analyze":
      return <AnalyzeView examId={examId} activity={activity} />;
    default:
      return (
        <div style={styles.outerContainer}>
          <div style={styles.quizContentArea}>
            <h2>Unknown Quiz Stage: {activity.quizStage || "N/A"}</h2>
            <p>Exam ID: {examId}</p>
            <p>Activity data:</p>
            <pre style={{ backgroundColor: "#222", padding: "8px" }}>
              {JSON.stringify(activity, null, 2)}
            </pre>
          </div>
        </div>
      );
  }
}

const styles = {
  outerContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    padding: "20px",
    fontFamily: `'Inter', 'Roboto', sans-serif`,
  },
  quizContentArea: {
    flex: 1,
    overflowY: "auto",
    maxWidth: "60ch",
    margin: "0 auto",
    lineHeight: 1.6,
    fontSize: "1rem",
  },
};