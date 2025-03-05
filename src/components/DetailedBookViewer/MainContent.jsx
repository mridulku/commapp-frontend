import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentIndex } from "./redux/planSlice";

import ReadingView from "./ReadingView";
import QuizView from "./QuizView";
import ReviseView from "./ReviseView";

export default function MainContent() {
  const dispatch = useDispatch();
  const { flattenedActivities, currentIndex } = useSelector((state) => state.plan);

  // 1) If no activities
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
        <div>
          <h2>Unknown Activity: {currentAct.type}</h2>
          <pre>{JSON.stringify(currentAct, null, 2)}</pre>
        </div>
      );
  }

  // 5) Render
  return (
    <div style={styles.container}>
      <h2>Selected Activity ({currentIndex + 1} / {flattenedActivities.length})</h2>

      {/* Content area in a position: relative container,
          so we can absolutely position the arrow buttons */}
      <div style={styles.contentArea}>
        {content}

        {/* Left Arrow */}
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

        {/* Right Arrow */}
        <button
          style={{
            ...styles.arrowButton,
            right: "10px",
            opacity: currentIndex < flattenedActivities.length - 1 ? 1 : 0.3,
            pointerEvents:
              currentIndex < flattenedActivities.length - 1 ? "auto" : "none",
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
    padding: 20,
    // You can remove or customize to fit your layout
  },
  contentArea: {
    position: "relative",
    minHeight: "300px", // just to have space for arrows to show in the middle
    border: "1px solid #ccc",
    borderRadius: 8,
    padding: 16,
    marginTop: 10,
  },
  arrowButton: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "1px solid #ccc",
    background: "#fff",
    cursor: "pointer",
    fontSize: "1.2rem",
    // You could add boxShadow or any hover styling
  },
};