import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentIndex } from "./store/planSlice";

// EXAMPLE STYLES
const containerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: "#111",
  padding: "6px 12px",
  color: "#fff",
  height: "48px",
  boxSizing: "border-box",
};

const leftStyle = {
  fontSize: "0.8rem",
  color: "#ccc",
  display: "flex",
  alignItems: "center",
};

const centerStyle = {
  flex: 1,
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
  backgroundColor: "#4FC3F7", // default (reading), can be overridden
  margin: "0 8px", // spacing around the pill
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

function getActivityColor(activityType) {
  const lowerType = (activityType || "").toLowerCase();
  if (lowerType.includes("read")) return "#4FC3F7";   // bright blue
  if (lowerType.includes("quiz")) return "#E57373";   // red
  if (lowerType.includes("revis")) return "#FFD54F";  // yellow
  return "#BDBDBD";                                  // gray fallback
}

export default function TopBar({
  secondsLeft, // optional leftover time
  onClose = () => {},
  onFontSizeIncrease = () => {},
  onFontSizeDecrease = () => {},
  onStarClick = () => {},
}) {
  const dispatch = useDispatch();
  const { flattenedActivities, currentIndex } = useSelector((state) => state.plan);

  // handle prev/next
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

  // figure out if we disable them
  const disablePrev = currentIndex <= 0;
  const disableNext = !flattenedActivities || currentIndex >= (flattenedActivities.length - 1);

  // Build leftover time display (if needed)
  let timeDisplay = "";
  if (secondsLeft != null) {
    const mm = Math.floor(secondsLeft / 60);
    const ss = (secondsLeft % 60).toString().padStart(2, "0");
    timeDisplay = `${mm}:${ss} left`;
  }

  // Build activity pill text + color
  let pillText = "";
  let pillBg = "#BDBDBD";
  if (
    flattenedActivities &&
    currentIndex >= 0 &&
    currentIndex < flattenedActivities.length
  ) {
    const currentAct = flattenedActivities[currentIndex];
    if (currentAct) {
      const subCh = currentAct.subChapterName || "Untitled";
      const actType = (currentAct.type || "").toLowerCase();
      const wordCount = currentAct.wordCount || null;
      const estTime = currentAct.timeNeeded ||
        (wordCount ? Math.ceil(wordCount / 200) : null);

      let label = "";
      if (actType.includes("read")) label = "Reading";
      else if (actType.includes("quiz")) label = "Quiz";
      else if (actType.includes("revis")) label = "Revision";
      else label = "Activity";

      const timeText = estTime != null ? `(~${estTime} min)` : "";
      pillText = `${label}: ${subCh} ${timeText}`;
      pillBg = getActivityColor(actType);
    }
  }

  return (
    <div style={containerStyle}>
      {/* LEFT => leftover time */}
      <div style={leftStyle}>
        {timeDisplay}
      </div>

      {/* CENTER => prev arrow, pill, next arrow */}
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
          <div style={{ 
            ...pillStyle,
            backgroundColor: pillBg
          }}>
            {pillText}
          </div>
        )}

        {/* Next arrow */}
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
      </div>

      {/* RIGHT => small toolbar icons + close */}
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
        {/* close */}
        <div style={closeStyle} onClick={onClose}>
          ✕
        </div>
      </div>
    </div>
  );
}