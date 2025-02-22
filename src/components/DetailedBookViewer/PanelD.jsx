// src/components/DetailedBookViewer/PanelD.jsx
import React from "react";

function PanelD() {
  const panelStyle = {
    backgroundColor: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(6px)",
    borderRadius: "6px",
    padding: "15px",
    color: "#fff",
  };

  return (
    <div style={panelStyle}>
      <h3>Panel D</h3>
      <p>Placeholder content for Panel D.</p>
    </div>
  );
}

export default PanelD;