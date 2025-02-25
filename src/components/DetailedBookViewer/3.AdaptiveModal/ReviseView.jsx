import React from "react";

export default function ReviseView({ subChapterId }) {
  return (
    <div style={reviseContainer}>
      <h2>Revise Component</h2>
      <p>This is a placeholder for revision content.</p>
      <p>Subchapter ID: <strong>{subChapterId || "N/A"}</strong></p>
    </div>
  );
}

const reviseContainer = {
  padding: "20px",
  color: "#fff",
  backgroundColor: "rgba(255, 165, 0, 0.3)", // orange-ish
  borderRadius: "8px",
};