// src/components/DetailedBookViewer/PanelB.jsx
import React from "react";

function PanelB() {
  const panelStyle = {
    backgroundColor: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(6px)",
    borderRadius: "6px",
    padding: "15px",
    color: "#fff",
  };

  return (
    <div style={panelStyle}>
      <h3>Panel B</h3>
      <p>Placeholder content for Panel B.</p>
    </div>
  );
}

export default PanelB;