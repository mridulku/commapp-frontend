// MainContent.jsx
import React from "react";
import { useSelector } from "react-redux";

import ReadingView from "./ReadingView";
import StageView from "./StageView";

export default function MainContent({ examId }) {
  const { flattenedActivities, currentIndex } = useSelector(
    (state) => state.plan
  );

  // 1) No activities
  if (!flattenedActivities || flattenedActivities.length === 0) {
    return <div style={styles.container}>No activities to display.</div>;
  }

  // 2) Out of range
  if (currentIndex < 0 || currentIndex >= flattenedActivities.length) {
    return (
      <div style={styles.container}>
        <p>No activity selected or index out of range.</p>
      </div>
    );
  }

  // 3) The current activity
  const currentAct = flattenedActivities[currentIndex];
  if (!currentAct) {
    return (
      <div style={styles.container}>
        <p>Activity not found for index {currentIndex}.</p>
      </div>
    );
  }

  // 4) Determine which view to render
  const activityType = (currentAct.type || "").toLowerCase();
  let content;
  switch (activityType) {
    case "read":
    case "reading":
      content = <ReadingView activity={currentAct} />;
      break;

    case "quiz":
      // pass examId as a prop to QuizView
      content = <StageView examId={examId} activity={currentAct} />;
      break;

    

    default:
      content = (
        <div style={{ padding: 20, color: "#fff" }}>
          <h2>Unknown Activity: {currentAct.type}</h2>
          <pre>{JSON.stringify(currentAct, null, 2)}</pre>
        </div>
      );
  }

  // 5) Render
  return (
    <div style={styles.container}>
      <div style={styles.contentArea}>{content}</div>
    </div>
  );
}

const styles = {
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#000",
    color: "#fff",
    boxSizing: "border-box",
  },
  contentArea: {
    position: "relative",
    flex: 1,
    backgroundColor: "#000",
    overflow: "hidden",
    padding: "10px",
  },
};