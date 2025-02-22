// src/components/DetailedBookViewer/GridFillerPanel.jsx
import React from "react";

function GridFillerPanel({ title = "Panel Title" }) {
  const panelStyle = {
    backgroundColor: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(6px)",
    borderRadius: "6px",
    padding: "15px",
    color: "#fff",
  };

  return (
    <div style={panelStyle}>
      <h3>{title}</h3>
      <p style={{ marginTop: "0.5rem" }}>
        This is a placeholder panel. Replace me with real content.
      </p>
    </div>
  );
}

export default GridFillerPanel;