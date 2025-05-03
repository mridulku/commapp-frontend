// BottomBar.jsx  (plain JSX version)
import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentIndex } from "../../../../../store/planSlice";

/* ─── reused colours ─── */
const ACCENT_PINK   = "#ff69b4";
const ACCENT_PURPLE = "#9370db";
const ACCENT_GREEN  = "#4caf50";

/* ─── bar + button styles ─── */
const barStyle = {
  display:        "flex",
  alignItems:     "center",
  justifyContent: "space-between",
  padding:        "8px 16px",
  height:         50,
  background:     "#222 linear-gradient(180deg,#2a2a2a,#222)",
  color:          "#fff",
  boxSizing:      "border-box",
  fontFamily:     "sans-serif",
};

const arrowBtn = {
  cursor:       "pointer",
  fontSize:     "1.1rem",
  color:        "#fff",
  padding:      "4px 6px",
  background:   "#333",
  border:       "1px solid #555",
  borderRadius: "50%",
  display:      "flex",
  alignItems:   "center",
  justifyContent:"center",
};

const pill = (bg, fg="#000") => ({
  backgroundColor: bg,
  color:           fg,
  padding:         "4px 8px",
  borderRadius:    "4px",
  fontSize:        "0.8rem",
  whiteSpace:      "nowrap",
});

export default function BottomBar({
  stepPercent   = 0,
  currentIndex  = 0,
  totalSteps    = 1,
  dailyTime     = 0,
}) {
  const dispatch = useDispatch();
  const { planDoc, flattenedActivities } = useSelector((s) => s.plan) || {};

  const [showTT, setShowTT] = useState(false);


  /* hide on onboarding plans */
  const level = planDoc && planDoc.level ? String(planDoc.level).toLowerCase() : "";
  if (level === "onboarding") return null;

  /* timer tooltip */

  /* nav helpers */
  const handlePrev = () =>
    currentIndex > 0 && dispatch(setCurrentIndex(currentIndex - 1));
  const handleNext = () =>
    flattenedActivities &&
    currentIndex < flattenedActivities.length - 1 &&
    dispatch(setCurrentIndex(currentIndex + 1));

  const disablePrev = currentIndex <= 0;
  const disableNext =
    !flattenedActivities ||
    currentIndex >= flattenedActivities.length - 1;

  /* pill labels */
  let chapter = "Unknown";
  let subchap = "Unknown";
  let actType = "Activity";
  if (flattenedActivities && flattenedActivities[currentIndex]) {
    const a   = flattenedActivities[currentIndex];
    chapter   = a.chapterName    || chapter;
    subchap   = a.subChapterName || subchap;
    const t   = (a.type || "").toLowerCase();
    if (t.includes("read"))       actType = "Reading";
    else if (t.includes("quiz"))  actType = "Quiz";
    else if (t.includes("revis")) actType = "Revision";
  }

  /* time format */
  const fmt = (sec) => {
    if (sec >= 3600) { const h=Math.floor(sec/3600), m=Math.floor((sec%3600)/60);
      return `${h}h ${m}m`; }
    if (sec >= 60)   { const m=Math.floor(sec/60), s=String(sec%60).padStart(2,"0");
      return `${m}m ${s}s`; }
    return `${sec}s`;
  };
  const timeStr = fmt(dailyTime);

  return (
    <div style={barStyle}>
      {/* LEFT –– progress */}
      <span style={{ fontSize:"0.8rem", fontWeight:"bold" }}>
        Step {currentIndex + 1} / {totalSteps} ({stepPercent}%)
      </span>

      {/* CENTER –– arrows + pills */}
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <button
          style={{ ...arrowBtn, opacity: disablePrev?0.3:1 }}
          disabled={disablePrev}
          onClick={handlePrev}
        >
          &lt;
        </button>

        <span style={pill(ACCENT_PINK, "#000")}>{chapter}</span>
        <span style={pill(ACCENT_PURPLE, "#fff")}>{subchap}</span>
        <span style={pill(ACCENT_GREEN, "#fff")}>{actType}</span>

        <button
          style={{ ...arrowBtn, opacity: disableNext?0.3:1 }}
          disabled={disableNext}
          onClick={handleNext}
        >
          &gt;
        </button>
      </div>

      {/* RIGHT –– timer */}
      <div
        style={{ position:"relative", cursor:"default" }}
        onMouseEnter={()=>setShowTT(true)}
        onMouseLeave={()=>setShowTT(false)}
      >
        <span style={{ fontSize:"1.2rem", marginRight:4 }}>🕒</span>
        <span style={{ fontWeight:600 }}>{timeStr}</span>

        {showTT && (
          <div
            style={{
              position:"absolute", top:"120%", right:0,
              background:"#333", color:"#fff",
              fontSize:"0.75rem", padding:"4px 8px",
              borderRadius:4, whiteSpace:"nowrap",
            }}
          >
            Today's Study Time: {timeStr}
          </div>
        )}
      </div>
    </div>
  );
}