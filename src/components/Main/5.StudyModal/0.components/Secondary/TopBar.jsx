import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentIndex } from "../../../../../store/planSlice";

// Basic container styles
const containerStyle = {
  display: "flex",
  flexDirection: "column",
  background: "#222 linear-gradient(180deg, #2a2a2a, #222)",
  padding: "8px 16px",
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
  display: "flex",
  alignItems: "center",
  fontSize: "0.9rem",
  color: "#ccc",
  position: "relative",
};

const centerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "12px",
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
  color: "#fff",
  backgroundColor: "#333",
  borderRadius: "50%",
  padding: "4px 6px",
  border: "1px solid #555",
};

// Label styles for activity info (horizontally arranged)
const activityInfoStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const chapterLabelStyle = {
  backgroundColor: "#ff69b4", // pink background
  color: "#000",
  padding: "4px 8px",
  borderRadius: "4px",
  fontSize: "0.85rem",
};

const subchapterLabelStyle = {
  backgroundColor: "#9370db", // purple background
  color: "#fff",
  padding: "4px 8px",
  borderRadius: "4px",
  fontSize: "0.85rem",
};

const activityLabelStyle = {
  backgroundColor: "#4caf50", // green background for activity type
  color: "#fff",
  padding: "4px 8px",
  borderRadius: "4px",
  fontSize: "0.85rem",
};

const fontButtonStyle = {
  cursor: "pointer",
  fontSize: "0.9rem",
  color: "#ccc",
  backgroundColor: "#222",
  borderRadius: "4px",
  padding: "4px 8px",
  border: "1px solid #444",
  position: "relative",
};

const fontDropdownStyle = {
  position: "absolute",
  top: "110%",
  right: 0,
  backgroundColor: "#333",
  border: "1px solid #555",
  borderRadius: "4px",
  zIndex: 9999,
  minWidth: "60px",
};

const fontOptionStyle = {
  padding: "6px 10px",
  color: "#fff",
  cursor: "pointer",
  fontSize: "0.85rem",
  borderBottom: "1px solid #444",
};

export default function TopBar({
  dailyTime,
  onClose = () => {},
  onFontSizeIncrease = () => {},
  onFontSizeDecrease = () => {},
  onStarClick = () => {},
}) {
  const dispatch = useDispatch();
  const { flattenedActivities, currentIndex } = useSelector((state) => state.plan);

  // Local state for font menu dropdown and time tooltip
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showTimeTooltip, setShowTimeTooltip] = useState(false);

  // Format the daily time (e.g. "3h 50m 10s")
  const formatDailyTime = (totalSec) => {
    if (totalSec >= 3600) {
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      return `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
    } else if (totalSec >= 60) {
      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      return `${m}m ${s.toString().padStart(2, "0")}s`;
    } else {
      return `${totalSec}s`;
    }
  };

  const formattedTime = formatDailyTime(dailyTime);
  const tooltipText = `Today's Study Time: ${formattedTime}`;

  // Determine current activity details
  let chapterName = "Unknown Chapter";
  let subchapterName = "Unknown Subchapter";
  let activityType = "Activity";
  if (flattenedActivities && currentIndex >= 0 && currentIndex < flattenedActivities.length) {
    const currentAct = flattenedActivities[currentIndex];
    chapterName = currentAct.chapterName || chapterName;
    subchapterName = currentAct.subChapterName || subchapterName;
    const typeLower = (currentAct.type || "").toLowerCase();
    if (typeLower.includes("read")) activityType = "Reading";
    else if (typeLower.includes("quiz")) activityType = "Quiz";
    else if (typeLower.includes("revis")) activityType = "Revision";
  }

  // Navigation arrow handlers
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
  const disableNext = !flattenedActivities || currentIndex >= (flattenedActivities.length - 1);

  return (
    <div style={containerStyle}>
      <div style={topRowStyle}>
        {/* Left Section: Clock icon and time display */}
        <div style={leftStyle}>
          <div
            style={{ marginRight: "6px", cursor: "default", position: "relative" }}
            onMouseEnter={() => setShowTimeTooltip(true)}
            onMouseLeave={() => setShowTimeTooltip(false)}
          >
            <span style={{ fontSize: "1.2rem" }}>🕒</span>
            {showTimeTooltip && (
              <div style={{
                position: "absolute",
                top: "120%",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "#333",
                color: "#fff",
                fontSize: "0.75rem",
                padding: "4px 8px",
                borderRadius: "4px",
                zIndex: 10,
                whiteSpace: "nowrap"
              }}>
                {tooltipText}
              </div>
            )}
          </div>
          <span style={{ fontSize: "1rem", fontWeight: "bold" }}>{formattedTime}</span>
        </div>

        {/* Center Section: Navigation arrows and activity info (horizontally stacked) */}
        <div style={centerStyle}>
          <button
            style={{
              ...arrowButtonStyle,
              marginRight: "8px",
              opacity: disablePrev ? 0.3 : 1,
              pointerEvents: disablePrev ? "none" : "auto",
            }}
            onClick={handlePrev}
          >
            &lt;
          </button>

          <div style={activityInfoStyle}>
            <div style={chapterLabelStyle}>Chapter: {chapterName}</div>
            <div style={subchapterLabelStyle}>Subchapter: {subchapterName}</div>
            <div style={activityLabelStyle}>{activityType}</div>
          </div>

          <button
            style={{
              ...arrowButtonStyle,
              marginLeft: "8px",
              opacity: disableNext ? 0.3 : 1,
              pointerEvents: disableNext ? "none" : "auto",
            }}
            onClick={handleNext}
          >
            &gt;
          </button>
        </div>

        {/* Right Section: Font options and Close button */}
        <div style={rightStyle}>
          <div
            style={fontButtonStyle}
            onClick={() => setShowFontMenu(!showFontMenu)}
          >
            A-+
            {showFontMenu && (
              <div style={fontDropdownStyle}>
                <div
                  style={fontOptionStyle}
                  onClick={() => {
                    onFontSizeDecrease();
                    setShowFontMenu(false);
                  }}
                >
                  A-
                </div>
                <div
                  style={{ ...fontOptionStyle, borderBottom: "none" }}
                  onClick={() => {
                    onFontSizeIncrease();
                    setShowFontMenu(false);
                  }}
                >
                  A+
                </div>
              </div>
            )}
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
  // (No debug styles since debug icon is removed)
};