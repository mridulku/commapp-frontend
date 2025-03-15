import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentIndex } from "../0.store/planSlice";

const containerStyle = {
  display: "flex",
  flexDirection: "column", // so if you had a second row, it appears below
  backgroundColor: "#111",
  padding: "6px 12px",
  color: "#fff",
  boxSizing: "border-box",
};

const topRowStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
};

const leftStyle = {
  fontSize: "0.8rem",
  color: "#ccc",
  display: "flex",
  alignItems: "center",
};

const centerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const rightStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const arrowButtonStyle = {
  cursor: "pointer",
  fontSize: "1.1rem",
  color: "#fff",
  padding: "4px 6px",
  backgroundColor: "#333",
  borderRadius: "50%",
  border: "1px solid #555",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const pillStyle = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "999px",
  padding: "4px 10px",
  fontSize: "0.85rem",
  fontWeight: "bold",
  color: "#000",
  backgroundColor: "#4FC3F7", // default fallback
  margin: "0 8px",
};

const iconButtonStyle = {
  cursor: "pointer",
  fontSize: "0.9rem",
  color: "#ccc",
  backgroundColor: "#222",
  borderRadius: "4px",
  padding: "4px 6px",
};

const closeStyle = {
  cursor: "pointer",
  fontSize: "1.2rem",
};

// Simple example color function
function getActivityColor(activityType) {
  const lowerType = (activityType || "").toLowerCase();
  if (lowerType.includes("read")) return "#4FC3F7";   // bright blue
  if (lowerType.includes("quiz")) return "#E57373";   // red
  if (lowerType.includes("revis")) return "#FFD54F";  // yellow
  return "#BDBDBD";                                  // gray fallback
}

export default function TopBar({
  secondsLeft,
  onClose = () => {},
  onFontSizeIncrease = () => {},
  onFontSizeDecrease = () => {},
  onStarClick = () => {},
}) {
  const dispatch = useDispatch();

  // Pull data from Redux store
  const { flattenedActivities, currentIndex } = useSelector((state) => state.plan);

  // Local state to show/hide debug overlay on "i" hover
  const [showDebug, setShowDebug] = useState(false);

  // Handle prev/next activity
  function handlePrev() {
    if (currentIndex > 0) {
      dispatch(setCurrentIndex(currentIndex - 1));
    }
  }
  function handleNext() {
    if (flattenedActivities && currentIndex < flattenedActivities.length - 1) {
      dispatch(setCurrentIndex(currentIndex + 1));
    }
  }

  // Disabled state for arrows
  const disablePrev = currentIndex <= 0;
  const disableNext =
    !flattenedActivities || currentIndex >= (flattenedActivities.length - 1);

  // Leftover time display
  let timeDisplay = "";
  if (secondsLeft != null) {
    const mm = Math.floor(secondsLeft / 60);
    const ss = String(secondsLeft % 60).padStart(2, "0");
    timeDisplay = `${mm}:${ss} left`;
  }

  // Identify the current activity
  let pillText = "";
  let pillBg = "#BDBDBD";
  let currentAct = null;

  if (
    flattenedActivities &&
    currentIndex >= 0 &&
    currentIndex < flattenedActivities.length
  ) {
    currentAct = flattenedActivities[currentIndex];

    if (currentAct) {
      const subCh = currentAct.subChapterName || "Untitled";
      const actType = (currentAct.type || "").toLowerCase();

      let label = "Activity";
      if (actType.includes("read")) label = "Reading";
      else if (actType.includes("quiz")) label = "Quiz";
      else if (actType.includes("revis")) label = "Revision";

      pillText = `${label}: ${subCh}`;
      pillBg = getActivityColor(actType);
    }
  }

  return (
    <div style={containerStyle}>
      {/* Top row: the main bar (arrows, pill, close, etc.) */}
      <div style={topRowStyle}>
        <div style={leftStyle}>{timeDisplay}</div>

        <div style={centerStyle}>
          {/* Prev arrow */}
          <button
            style={{
              ...arrowButtonStyle,
              opacity: disablePrev ? 0.3 : 1,
              pointerEvents: disablePrev ? "none" : "auto",
              marginRight: "8px",
            }}
            onClick={handlePrev}
          >
            &lt;
          </button>

          {/* Activity Pill */}
          {pillText && (
            <div
              style={{
                ...pillStyle,
                backgroundColor: pillBg,
              }}
            >
              {pillText}
            </div>
          )}

          {/* Next arrow + debug icon */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <button
              style={{
                ...arrowButtonStyle,
                opacity: disableNext ? 0.3 : 1,
                pointerEvents: disableNext ? "none" : "auto",
                marginLeft: "8px",
              }}
              onClick={handleNext}
            >
              &gt;
            </button>

            {/* "i" button container, shown after right arrow */}
            <div
              style={styles.debugEyeContainer}
              onMouseEnter={() => setShowDebug(true)}
              onMouseLeave={() => setShowDebug(false)}
            >
              <div style={styles.debugEyeIcon}>i</div>

              {/* When hovered, show debug overlay (for currentAct) */}
              {showDebug && currentAct && (
                <div style={styles.debugOverlay}>
                  <h4 style={{ marginTop: 0 }}>Debug Info</h4>
                  <pre style={styles.debugPre}>
                    {JSON.stringify(currentAct, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side icons */}
        <div style={rightStyle}>
          <div style={iconButtonStyle} onClick={onFontSizeDecrease}>
            A-
          </div>
          <div style={iconButtonStyle} onClick={onFontSizeIncrease}>
            A+
          </div>
          <div style={iconButtonStyle} onClick={onStarClick}>
            ⭐
          </div>
          <div style={closeStyle} onClick={onClose}>
            ✕
          </div>
        </div>
      </div>
    </div>
  );
}

// Additional Debug Styles
const styles = {
  debugEyeContainer: {
    position: "relative",
    marginLeft: "8px",
  },
  debugEyeIcon: {
    width: "24px",
    height: "24px",
    backgroundColor: "#333",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "0.8rem",
    cursor: "pointer",
    border: "1px solid #555",
    textTransform: "uppercase",
  },
  debugOverlay: {
    position: "absolute",
    top: "30px", // just below the "i" icon
    right: 0,
    width: "240px",
    backgroundColor: "#222",
    border: "1px solid #444",
    borderRadius: "4px",
    padding: "8px",
    zIndex: 9999,
  },
  debugPre: {
    backgroundColor: "#333",
    padding: "6px",
    borderRadius: "4px",
    maxHeight: "120px",
    overflowY: "auto",
    whiteSpace: "pre-wrap",
    marginTop: "6px",
    fontSize: "0.75rem",
    lineHeight: 1.4,
    color: "#fff",
  },
};