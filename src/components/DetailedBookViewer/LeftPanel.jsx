// LeftPanel.jsx

import React from "react";
import { playlistPanelStyle } from "./styles";

export default function LeftPanel({ items = [], currentIndex, setCurrentIndex }) {
  return (
    <div style={playlistPanelStyle}>
      <h2 style={{ marginBottom: "15px" }}>Session Steps</h2>
      {items.map((itm, idx) => {
        const active = idx === currentIndex;
        return (
          <div
            key={itm.id}
            style={{
              padding: "8px",
              borderRadius: "4px",
              marginBottom: "6px",
              backgroundColor: active ? "rgba(255,215,0,0.3)" : "transparent",
              cursor: "pointer",
            }}
            onClick={() => setCurrentIndex(idx)}
          >
            {idx + 1}. {itm.label} — {itm.type} ({itm.estimatedTime}min)
          </div>
        );
      })}
    </div>
  );
}