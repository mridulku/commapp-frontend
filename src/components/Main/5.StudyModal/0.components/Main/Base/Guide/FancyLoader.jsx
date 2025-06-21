// FancyLoader.jsx   ← replace the previous version
import React, { useEffect, useState } from "react";
import { Box, Typography, LinearProgress, Fade } from "@mui/material";
import { motion } from "framer-motion";

const TIPS = [
  "Mapping chapters → concept graph …",
  "Tuning difficulty to your reading pace …",
  "Blending spaced-recall with fresh lessons …",
  "Building your personalised Gantt chart …"
];

/**  🔑  pass `expectedSecs` if you have a better estimate */
export default function FancyLoader({ expectedSecs = 60 }) {
  const   [tip, setTip]       = useState(0);
  const   [pct, setPct]       = useState(0);
  const   [remain, setRemain] = useState(expectedSecs);

  /* cycle helpful tips */
  useEffect(() => {
    const id = setInterval(() =>
      setTip((i) => (i + 1) % TIPS.length), 2800);
    return () => clearInterval(id);
  }, []);

  /* fake progress bar + live countdown */
  useEffect(() => {
    const   total    = expectedSecs * 1000;               // → ms
    const   interval = 250;                               // 4× / sec
    const   stepPct  = (interval / total) * 100;

    const id = setInterval(() => {
      setPct((p) => Math.min(99, p + stepPct));           // never hit 100 %
      setRemain((s) => Math.max(0, s - interval / 1000));
    }, interval);

    return () => clearInterval(id);
  }, [expectedSecs]);

  return (
    <Box sx={{
      position:"fixed", inset:0, display:"flex",
      flexDirection:"column", alignItems:"center",
      justifyContent:"center", gap:4, bgcolor:"#0e0f15",
      color:"#fff", zIndex:1300
    }}>
      {/* looping accent ring */}
      <motion.div
        animate={{ rotate:[0,360] }}
        transition={{ repeat:Infinity, duration:6, ease:"linear" }}
        style={{
          width:64, height:64, borderRadius:"50%",
          background:"conic-gradient(#BB86FC,#6EE7B7,#BB86FC)"
        }}
      />

      {/* progress + dynamic text */}
      <Box sx={{ width:280 }}>
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{ height:6, borderRadius:3,
               "& .MuiLinearProgress-bar":{ transition:"transform .25s" }}}
        />
        <Fade key={tip} in timeout={400}>
          <Typography
            variant="body2"
            align="center"
            sx={{ mt:1, opacity:.85 }}
          >
            {TIPS[tip]}
          </Typography>
        </Fade>

        {/* ETA line */}
        <Typography
          variant="caption"
          align="center"
          sx={{ mt:.5, display:"block", opacity:.6 }}
        >
          {remain > 0
            ? `≈ ${remain.toFixed(0)} s remaining – please hang on`
            : "Almost done …"}
        </Typography>
      </Box>
    </Box>
  );
}