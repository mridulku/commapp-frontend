import React from "react";
import { useSelector } from "react-redux";
import ReadingView from "./ReadingView";
import QuizView from "./QuizView";
import ReviseView from "./ReviseView";

export default function MainContent() {
  const { flattenedActivities, currentIndex } = useSelector((state) => state.plan);

  // 1) If no activities or empty array
  if (!flattenedActivities || flattenedActivities.length === 0) {
    return <div style={styles.container}>No activities to display.</div>;
  }

  // 2) If currentIndex is out of range
  if (currentIndex < 0 || currentIndex >= flattenedActivities.length) {
    return (
      <div style={styles.container}>
        <p>No activity selected or index out of range.</p>
      </div>
    );
  }

  // 3) Get the current activity
  const currentAct = flattenedActivities[currentIndex];
  if (!currentAct) {
    return (
      <div style={styles.container}>
        <p>Activity not found for index {currentIndex}.</p>
      </div>
    );
  }

  // 4) Switch on type
  const activityType = (currentAct.type || "").toLowerCase();
  let content;
  switch (activityType) {
    case "read":
    case "reading":
      content = <ReadingView activity={currentAct} />;
      break;
    case "quiz":
      content = <QuizView activity={currentAct} />;
      break;
    case "revise":
    case "revision":
      content = <ReviseView activity={currentAct} />;
      break;
    default:
      content = (
        <div>
          <h2>Unknown Activity: {currentAct.type}</h2>
          <pre>{JSON.stringify(currentAct, null, 2)}</pre>
        </div>
      );
  }

  return (
    <div style={styles.container}>
      <h2>Selected Activity</h2>
      {content}
    </div>
  );
}

const styles = {
  container: {
    padding: 20,
  },
};