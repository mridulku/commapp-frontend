// src/components/DetailedBookViewer/PanelA.jsx
import React from "react";

function PanelA() {
  const panelStyle = {
    backgroundColor: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(6px)",
    borderRadius: "6px",
    padding: "15px",
    color: "#fff",
  };

  return (
    <div style={panelStyle}>
      <h3>Panel A</h3>
      <p>Placeholder content for Panel A.</p>
    </div>
  );
}

export default PanelA;