// src/components/DetailedBookViewer/PanelC.jsx
import React from "react";

function PanelC() {
  const panelStyle = {
    backgroundColor: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(6px)",
    borderRadius: "6px",
    padding: "15px",
    color: "#fff",
  };

  return (
    <div style={panelStyle}>
      <h3>Panel C</h3>
      <p>Placeholder content for Panel C.</p>
    </div>
  );
}

export default PanelC;