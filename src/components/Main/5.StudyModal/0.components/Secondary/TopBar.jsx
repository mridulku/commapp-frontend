// TopBar.jsx
import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentIndex } from "../../../../../store/planSlice";

// Basic container styles
const containerStyle = {
  display: "flex",
  flexDirection: "column",
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

// A helper to pick color for "Reading", "Quiz", "Revision", etc.
function getActivityColor(activityType) {
  const lowerType = (activityType || "").toLowerCase();
  if (lowerType.includes("read")) return "#4FC3F7";   // bright blue
  if (lowerType.includes("quiz")) return "#E57373";   // red
  if (lowerType.includes("revis")) return "#FFD54F";  // yellow
  return "#BDBDBD";                                   // gray fallback
}

/**
 * TopBar
 *
 * PROPS:
 *  - dailyTime (number): total day-level usage in seconds (from Redux or PlanFetcher)
 *  - onClose, onFontSizeIncrease, onFontSizeDecrease, onStarClick (callbacks)
 */
export default function TopBar({
  dailyTime,
  onClose = () => {},
  onFontSizeIncrease = () => {},
  onFontSizeDecrease = () => {},
  onStarClick = () => {},
}) {
  const dispatch = useDispatch();

  // We still use plan's flattenedActivities & currentIndex for navigation
  const { flattenedActivities, currentIndex } = useSelector((state) => state.plan);

  // Local state to show/hide debug overlay on "i" hover
  const [showDebug, setShowDebug] = useState(false);

  // Convert dailyTime (seconds) to mm:ss
  let timeDisplay = "";
  if (typeof dailyTime === "number") {
    const mm = Math.floor(dailyTime / 60);
    const ss = String(dailyTime % 60).padStart(2, "0");
    timeDisplay = `Today’s Study Time: ${mm}:${ss}`;
  }

  // Activity navigation logic
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

  const disablePrev = currentIndex <= 0;
  const disableNext =
    !flattenedActivities || currentIndex >= (flattenedActivities.length - 1);

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
      <div style={topRowStyle}>
        {/* Left side => Day-level time display */}
        <div style={leftStyle}>{timeDisplay}</div>

        {/* Center => prev/next arrows, activity pill, debug icon */}
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
            <div style={{ ...pillStyle, backgroundColor: pillBg }}>
              {pillText}
            </div>
          )}

          {/* Next arrow & debug */}
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

            {/* "i" debug eye */}
            <div
              style={debugStyles.debugEyeContainer}
              onMouseEnter={() => setShowDebug(true)}
              onMouseLeave={() => setShowDebug(false)}
            >
              <div style={debugStyles.debugEyeIcon}>i</div>
              {showDebug && currentAct && (
                <div style={debugStyles.debugOverlay}>
                  <h4 style={{ marginTop: 0 }}>Debug Info</h4>
                  <pre style={debugStyles.debugPre}>
                    {JSON.stringify(currentAct, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side => font size & star & close */}
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

const debugStyles = {
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
    top: "30px",
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