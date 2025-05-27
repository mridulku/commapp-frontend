// ResultSummary.jsx
import React, { useState } from "react";
import LastAttemptPanel from "./LastAttemptPanel";

// 💡 copy the same style snippets you already use in QuizComponent
const styles = {
  banner:   { display:"flex", flexDirection:"column", alignItems:"center", gap:4, marginBottom:12 },
  iconPass: { fontSize:48, color:"#64dd17", lineHeight:1 },
  iconFail: { fontSize:48, color:"#ff5252", lineHeight:1 },
  headline:{ fontSize:24, fontWeight:700, textAlign:"center", color:"#fff" },
  statsRow:{ display:"flex", flexWrap:"wrap", justifyContent:"center", gap:16, marginBottom:12 },
  pill:    { background:"#263238", color:"#e0f2f1", padding:"4px 10px", borderRadius:14, fontSize:14 },
  toggle:  { background:"#37474f", color:"#fff", border:"none", borderRadius:14,
             padding:"4px 12px", cursor:"pointer", fontSize:13, whiteSpace:"nowrap" },
  footer:  { marginTop:18, display:"flex", justifyContent:"center" }
};

export default function ResultSummary({
  passed,
  percentage,
  gradingResults = [],
  lastAttempt,
  onContinue,          // e.g. handleQuizSuccess
  continueLabel = "Continue",
  stage = "",          //  <-- NEW
}) {
  const [showDetails, setShowDetails] = useState(false);
  const niceStage =
    stage ? stage.charAt(0).toUpperCase() + stage.slice(1) : "";

  return (
    <>
      {/* headline */}
      <div style={styles.banner}>
        <span style={passed ? styles.iconPass : styles.iconFail}>
          {passed ? "🎉" : "💡"}
        </span>
                <span style={styles.bannerText}>
          {passed
            ? <>You passed the <b>{niceStage}</b> stage.</>
            : <>You did not pass the <b>{niceStage}</b> stage.</>}
        </span>
      </div>

      {/* pills */}
      <div style={styles.statsRow}>
        <span style={styles.pill}><b>Score&nbsp;•&nbsp;</b>{percentage}</span>
        <span style={styles.pill}>
          <b>Correct&nbsp;•&nbsp;</b>
          {gradingResults.filter(r => (r?.score ?? 0) >= 1).length}
          &nbsp;/&nbsp;{gradingResults.length}
        </span>

        <button style={styles.toggle} onClick={()=>setShowDetails(p=>!p)}>
          {showDetails ? "▲ Hide details" : "▼ Show details"}
        </button>
      </div>

      {showDetails && (
        <LastAttemptPanel
          attempt={lastAttempt}
          show={showDetails}
          onToggle={()=>setShowDetails(p=>!p)}
          hideToggle        /* we already have a toggle outside */
        />
      )}

      {/* optional CTA */}
      {onContinue && (
        <div style={styles.footer}>
          <button style={{
            background: passed ? "#28a745" : "#9c27b0",
            color:"#fff", border:"none", padding:"10px 20px",
            borderRadius:6, fontWeight:600, cursor:"pointer"
          }}
          onClick={onContinue}>
            {continueLabel}
          </button>
        </div>
      )}
    </>
  );
}