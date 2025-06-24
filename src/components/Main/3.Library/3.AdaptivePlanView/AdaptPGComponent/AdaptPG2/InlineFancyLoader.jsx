// ────────────────────────────────────────────────────────────────
// File: src/components/InlineFancyLoader.jsx   (v1 – 2025-06-23)
// ────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from "react";
import { Box, Typography, LinearProgress, Fade } from "@mui/material";
import { motion } from "framer-motion";

const TIPS = [
  "Crunching mastery data …",
  "Sequencing sessions …",
  "Balancing difficulty …",
  "Almost there …"
];

export default function InlineFancyLoader({
  height        = 140,
  expectedSecs  = 25,
  status        = "Fetching …",
  flat          = false          // NEW
}) {
  const [tip, setTip]       = useState(0);
  const [pct, setPct]       = useState(0);
  const [remain, setRemain] = useState(expectedSecs);

  /* cycle tips */
  useEffect(() => {
    const id = setInterval(() => setTip(i => (i + 1) % TIPS.length), 2600);
    return () => clearInterval(id);
  }, []);

  /* fake progress */
  useEffect(() => {
    const total = expectedSecs * 1000;
    const step  = 250;                  // 4× per second
    const incPct = (step / total) * 100;
    const id = setInterval(() => {
      setPct(p => Math.min(99, p + incPct));
      setRemain(r => Math.max(0, r - step / 1000));
    }, step);
    return () => clearInterval(id);
  }, [expectedSecs]);

  return (
    <Box
      sx={{
        width: "100%",
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        
        color: "#fff",

         bgcolor: flat ? "transparent" : "#0e0f15",
         border: flat ? 0 : "1px solid rgba(255,255,255,.12)",
        
        borderRadius: 2,
        px: 3
      }}
    >
      {/* rotating ring */}
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "conic-gradient(#BB86FC,#6EE7B7,#BB86FC)"
        }}
      />

      {/* progress + text */}
      <Box sx={{ width: "100%", maxWidth: 360, mt: 2 }}>
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{
            height: 5,
            borderRadius: 3,
            "& .MuiLinearProgress-bar": { transition: "transform .25s" }
          }}
        />

        <Fade key={tip} in timeout={400}>
          <Typography variant="body2" align="center" sx={{ mt: 1, opacity: 0.85 }}>
            {TIPS[tip]}
          </Typography>
        </Fade>

        <Typography variant="caption" align="center" sx={{ display: "block", opacity: 0.6 }}>
          {status}&nbsp;{remain > 0 ? `≈ ${remain.toFixed(0)} s left` : "Almost done …"}
        </Typography>
      </Box>
    </Box>
  );
}
