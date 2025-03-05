import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentIndex } from "./store/planSlice";

import ReadingView from "./ReadingView";
import QuizView from "./QuizView";
import ReviseView from "./ReviseView";

export default function MainContent() {
  const dispatch = useDispatch();
  const { flattenedActivities, currentIndex } = useSelector((state) => state.plan);

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

  // Handlers for Prev / Next
  function handlePrev() {
    if (currentIndex > 0) {
      dispatch(setCurrentIndex(currentIndex - 1));
    }
  }

  function handleNext() {
    if (currentIndex < flattenedActivities.length - 1) {
      dispatch(setCurrentIndex(currentIndex + 1));
    }
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
      content = <QuizView activity={currentAct} />;
      break;
    case "revise":
    case "revision":
      content = <ReviseView activity={currentAct} />;
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
      {/* We removed the "Selected Activity (X / Y)" heading */}
      <div style={styles.contentArea}>
        {content}

        {/* Navigation Arrows */}
        <button
          style={{
            ...styles.arrowButton,
            left: "10px",
            opacity: currentIndex > 0 ? 1 : 0.3,
            pointerEvents: currentIndex > 0 ? "auto" : "none",
          }}
          onClick={handlePrev}
        >
          &lt;
        </button>

        <button
          style={{
            ...styles.arrowButton,
            right: "10px",
            opacity:
              currentIndex < flattenedActivities.length - 1 ? 1 : 0.3,
            pointerEvents:
              currentIndex < flattenedActivities.length - 1
                ? "auto"
                : "none",
          }}
          onClick={handleNext}
        >
          &gt;
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    /* Occupy all available space, black background */
    flex: 1,
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#000",
    color: "#fff",
    boxSizing: "border-box",
    /* No border, so it merges with left panel’s black background */
  },
  contentArea: {
    position: "relative",
    flex: 1,
    /* Also black or very dark; remove the border and radius */
    backgroundColor: "#000",
    overflow: "hidden",
    /* You can add some padding if you like, or keep it minimal */
    padding: "10px",
  },
  arrowButton: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    border: "1px solid #555",
    backgroundColor: "#333",
    color: "#fff",
    cursor: "pointer",
    fontSize: "1.2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};