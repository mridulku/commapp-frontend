// src/components/HomeHub/StatsStrip.jsx
import React from "react";
import { tokens, cardSX } from "./theme";
import StatsPanel from "./TopStatsPanel";   // keep your existing logic

export default function StatsStrip({ userId }) {
  // Re-use old StatsPanel numbers but render them in a scroll-row
  const stripStyle = {
    display:"flex",
    overflowX:"auto",
    gap: tokens.gap,
    paddingBottom:4,
  };
  return (
    <div style={stripStyle}>
      <StatsPanel userId={userId} />
    </div>
  );
}