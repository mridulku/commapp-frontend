// File: TopBar.jsx
// -----------------------------------------------------------------------------
// • Normal plans  → show clock, arrows, chapter/sub-chapter pills, font buttons.
// • Onboarding    (planDoc.level === "onboarding")
//        → hide EVERYTHING except:
//              – centered text  “Welcome to your NEET journey”
//              – the ✕ close button at the far right
// -----------------------------------------------------------------------------

import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentIndex } from "../../../../../store/planSlice";

/* ════════════════════ Shared inline-style objects ════════════════════ */

const containerStyle = {
  display:        "flex",
  flexDirection:  "column",
  background:     "#222 linear-gradient(180deg, #2a2a2a, #222)",
  padding:        "8px 16px",
  color:          "#fff",
  boxSizing:      "border-box",
};

const topRowStyle = {
  display:        "flex",
  alignItems:     "center",
  justifyContent: "space-between",
  width:          "100%",
};

/* … (the rest of the atomic style objects remain identical) … */

const leftStyle   = { display: "flex", alignItems: "center", fontSize: "0.9rem",
                      color: "#ccc", position: "relative" };
const centerStyle = { display: "flex", alignItems: "center", justifyContent:
                      "center", gap: "12px" };
const rightStyle  = { display: "flex", alignItems: "center", gap: "8px" };

const arrowButtonStyle = {
  cursor: "pointer", fontSize: "1.1rem", color: "#fff",
  padding: "4px 6px", backgroundColor: "#333", borderRadius: "50%",
  border: "1px solid #555", display: "flex", alignItems: "center",
  justifyContent: "center",
};

const iconButtonStyle  = {
  cursor: "pointer", fontSize: "0.9rem", color: "#ccc", backgroundColor: "#222",
  borderRadius: "4px", padding: "4px 6px",
};

const closeStyle = {
  cursor: "pointer", fontSize: "1.2rem", color: "#fff", backgroundColor: "#333",
  borderRadius: "50%", padding: "4px 6px", border: "1px solid #555",
};

const activityInfoStyle = { display: "flex", alignItems: "center", gap: "8px" };
const chapterLabelStyle     = { backgroundColor: "#ff69b4", color: "#000",
                                padding: "4px 8px", borderRadius: "4px",
                                fontSize: "0.85rem" };
const subchapterLabelStyle  = { backgroundColor: "#9370db", color: "#fff",
                                padding: "4px 8px", borderRadius: "4px",
                                fontSize: "0.85rem" };
const activityLabelStyle    = { backgroundColor: "#4caf50", color: "#fff",
                                padding: "4px 8px", borderRadius: "4px",
                                fontSize: "0.85rem" };
const fontButtonStyle = {
  cursor: "pointer", fontSize: "0.9rem", color: "#ccc", backgroundColor: "#222",
  borderRadius: "4px", padding: "4px 8px", border: "1px solid #444",
  position: "relative",
};
const fontDropdownStyle = {
  position: "absolute", top: "110%", right: 0, backgroundColor: "#333",
  border: "1px solid #555", borderRadius: "4px", zIndex: 9999,
  minWidth: "60px",
};
const fontOptionStyle = {
  padding: "6px 10px", color: "#fff", cursor: "pointer", fontSize: "0.85rem",
  borderBottom: "1px solid #444",
};

/* ═════════════════════════════════════════════════════════════════════ */

export default function TopBar({
  dailyTime,
  onClose = () => {},
  onFontSizeIncrease = () => {},
  onFontSizeDecrease = () => {},
}) {
  const dispatch = useDispatch();

  const { planDoc, flattenedActivities, currentIndex } = useSelector(
        (state) => state.plan
      );
    
      /* ✅ ALWAYS declare hooks first */
      const [showFontMenu,    setShowFontMenu]    = useState(false);
      const [showTimeTooltip, setShowTimeTooltip] = useState(false);
    
      /* then compute the flag & maybe return */
      const isOnboarding =
        planDoc && planDoc.level &&
        planDoc.level.toLowerCase() === "onboarding";
  



  if (isOnboarding) {
    return (
      <div style={containerStyle}>
        <div style={topRowStyle}>
          {/*   nothing on the left, nothing in the middle spacer  */}
          <div style={{ flex: 1, textAlign: "center" }}>
            <span style={{ fontSize: "1rem", fontWeight: 600 }}>
              Welcome&nbsp;to&nbsp;your&nbsp;NEET&nbsp;journey
            </span>
          </div>

          {/*   ✕ close button remains on the far right             */}
          <div style={rightStyle}>
            <div style={closeStyle} onClick={onClose}>✕</div>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------- */
  /* 2️⃣  Normal flow (all the existing widgets)                    */
  /* ------------------------------------------------------------- */

  /* Local state for dropdown / tooltip */
  

  /* ───────────────── Time formatting helper ─────────────────── */
  const formatDailyTime = (sec) => {
    if (sec >= 3600) {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = sec % 60;
      return `${h}h ${m.toString().padStart(2, "0")}m ${s
        .toString()
        .padStart(2, "0")}s`;
    }
    if (sec >= 60) {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}m ${s.toString().padStart(2, "0")}s`;
    }
    return `${sec}s`;
  };
  const formattedTime = formatDailyTime(dailyTime);
  const tooltipText   = `Today's Study Time: ${formattedTime}`;

  /* ───────────────── Current activity metadata ───────────────── */
  let chapterName    = "Unknown Chapter";
  let subchapterName = "Unknown Subchapter";
  let activityType   = "Activity";
  if (
    flattenedActivities &&
    currentIndex >= 0 &&
    currentIndex < flattenedActivities.length
  ) {
    const act  = flattenedActivities[currentIndex];
    chapterName    = act.chapterName     || chapterName;
    subchapterName = act.subChapterName  || subchapterName;
    const t = (act.type || "").toLowerCase();
    if (t.includes("read"))  activityType = "Reading";
    else if (t.includes("quiz")) activityType = "Quiz";
    else if (t.includes("revis")) activityType = "Revision";
  }

  /* ───────────────── Navigation helpers ─────────────────────── */
  const handlePrev  = () => currentIndex > 0 &&
                            dispatch(setCurrentIndex(currentIndex - 1));
  const handleNext  = () => flattenedActivities &&
                            currentIndex < flattenedActivities.length - 1 &&
                            dispatch(setCurrentIndex(currentIndex + 1));
  const disablePrev = currentIndex <= 0;
  const disableNext = !flattenedActivities ||
                      currentIndex >= flattenedActivities.length - 1;

  /* ───────────────────────── Render ──────────────────────────── */
  return (
    <div style={containerStyle}>
      <div style={topRowStyle}>

        {/* LEFT: clock */}
        <div style={leftStyle}>
          <div
            style={{ marginRight: 6, cursor: "default", position: "relative" }}
            onMouseEnter={() => setShowTimeTooltip(true)}
            onMouseLeave={() => setShowTimeTooltip(false)}
          >
            <span style={{ fontSize: "1.2rem" }}>🕒</span>
            {showTimeTooltip && (
              <div
                style={{
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
                  whiteSpace: "nowrap",
                }}
              >
                {tooltipText}
              </div>
            )}
          </div>
          <span style={{ fontSize: "1rem", fontWeight: "bold" }}>
            {formattedTime}
          </span>
        </div>

        {/* CENTER: arrows + pills */}
        <div style={centerStyle}>
          <button
            style={{
              ...arrowButtonStyle,
              marginRight: 8,
              opacity: disablePrev ? 0.3 : 1,
              pointerEvents: disablePrev ? "none" : "auto",
            }}
            onClick={handlePrev}
          >
            &lt;
          </button>

          <div style={activityInfoStyle}>
            <div style={chapterLabelStyle}>Chapter: {chapterName}</div>
            <div style={subchapterLabelStyle}>
              Subchapter: {subchapterName}
            </div>
            <div style={activityLabelStyle}>{activityType}</div>
          </div>

          <button
            style={{
              ...arrowButtonStyle,
              marginLeft: 8,
              opacity: disableNext ? 0.3 : 1,
              pointerEvents: disableNext ? "none" : "auto",
            }}
            onClick={handleNext}
          >
            &gt;
          </button>
        </div>

        {/* RIGHT: font-size toggle + close */}
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