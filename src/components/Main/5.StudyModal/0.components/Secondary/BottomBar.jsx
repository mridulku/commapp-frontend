// BottomBar.jsx
import React from "react";
import { Box, Typography } from "@mui/material";

/**
 * Matches the TopBar gradient:
 *  background: "#222 linear-gradient(180deg, #2a2a2a, #222)"
 */
const bottomBarStyle = {
  display: "flex",
  alignItems: "center",
  padding: "8px 16px", // matches TopBar's padding
  height: 50,
  background: "#222 linear-gradient(180deg, #2a2a2a, #222)",
  color: "#fff",
  boxSizing: "border-box",
  fontFamily: "sans-serif",
};

/**
 * BottomBar
 * ---------
 * PROPS:
 *  - stepPercent (number)
 *  - currentIndex (number)
 *  - totalSteps (number)
 *
 * Shows: "Step X / Y (Z%)", all the way on the left in the same gradient style as TopBar
 */
export default function BottomBar({ stepPercent, currentIndex, totalSteps }) {
  return (
    <div style={bottomBarStyle}>
      <Box
        sx={{
          backgroundColor: "transparent",
          color: "#fff",
          borderRadius: 1,
          // We can remove any extra box color here
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: "bold" }}>
          Step {currentIndex + 1} / {totalSteps} ({stepPercent}%)
        </Typography>
      </Box>
    </div>
  );
}