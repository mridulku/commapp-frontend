// QuizView.jsx
import React from "react";
import { useSelector } from "react-redux";

import RememberView from "./RememberView";
import UnderstandView from "./UnderstandView";
import ApplyView from "./ApplyView";
import AnalyzeView from "./AnalyzeView";

/**
 * QuizView (Shell)
 * ----------------
 *  - Reads activity.quizStage
 *  - Renders the appropriate child component:
 *      RememberView, UnderstandView, ApplyView, AnalyzeView
 *  - If none matches, it shows a fallback.
 */
export default function QuizView({ activity }) {
  const userId = useSelector((state) => state.auth?.userId || "demoUser");

  const quizStage = (activity.quizStage || "").toLowerCase();

  switch (quizStage) {
    case "remember":
      return <RememberView activity={activity} />;
    case "understand":
      return <UnderstandView activity={activity} />;
    case "apply":
      return <ApplyView activity={activity} />;
    case "analyze":
      return <AnalyzeView activity={activity} />;
    default:
      return (
        <div style={styles.outerContainer}>
          <div style={styles.quizContentArea}>
            <h2>Unknown Quiz Stage: {activity.quizStage || "N/A"}</h2>
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