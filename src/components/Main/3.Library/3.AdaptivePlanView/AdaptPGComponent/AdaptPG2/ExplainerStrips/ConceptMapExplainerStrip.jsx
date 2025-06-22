/* PlanExplainerPanel.jsx – v2: shared container background */
import React, { useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Collapse,
} from "@mui/material";
import ExpandMoreIcon  from "@mui/icons-material/ExpandMore";
import ExpandLessIcon  from "@mui/icons-material/ExpandLess";
import { motion }      from "framer-motion";

/* ─── static card data ─── */
const CARDS = [
  {
    emoji: "🧱",
    title: "Concepts, Not Chapters",
    blurb: "We’ve broken your entire syllabus and past papers into granular concepts—not textbook units.",
    grad: ["#6366f1", "#a5b4fc"], // violet
  },
  {
    emoji: "🔁",
    title: "Stage 1: Bloom’s Loop",
    blurb: "You’re currently working through each concept with Bloom-level questions to build deep understanding.",
    grad: ["#3b82f6", "#60a5fa"], // blue
  },
  {
    emoji: "📈",
    title: "Live Confidence Map",
    blurb: "Your accuracy and attempts feed into a concept-wise confidence %, updating as you learn.",
    grad: ["#10b981", "#6ee7b7"], // green
  },
  {
    emoji: "⏰",
    title: "Smart Spaced Repeats",
    blurb: "Weak or forgotten concepts resurface when needed. Strong ones reappear just in time to stay sharp.",
    grad: ["#f59e0b", "#fde68a"], // amber
  },
  {
    emoji: "🗺️",
    title: "Navigate with the Map",
    blurb: "Over time, this map becomes your master guide to revision, sprint planning, and mock targeting.",
    grad: ["#ec4899", "#f9a8d4"], // pink
  },
];


/* ─── glass card style ─── */
const CARD_SX = {
  borderRadius: 4,
  padding: "16px 14px",
  color: "#fff",
  backdropFilter: "blur(6px)",
  boxShadow: "0 8px 24px rgba(0,0,0,.55)",
};

/* hover animation */
const MotionDiv = motion("div");
const lift = {
  whileHover: {
    y: -4,
    boxShadow: "0 14px 30px rgba(0,0,0,.9)",
    transition: { type: "spring", stiffness: 250, damping: 20 },
  },
};

/* ================================================================= */
export default function PlanExplainerPanel({ sx = {} }) {
  const [open, setOpen] = useState(false);

  return (
    <Box
      sx={{
        mb: 2,
        border: "1px solid #555",
        borderRadius: 2,
        bgcolor: "#262626",
        overflow: "hidden",       /* keep rounded corners when open */
        ...sx,
      }}
    >
      {/* header strip */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.5,
          py: 0.75,
          cursor: "pointer",
          userSelect: "none",
        }}
        onClick={() => setOpen(!open)}
      >
        <Typography sx={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>
          How it works
        </Typography>
        <IconButton
          size="small"
          sx={{ color: "#fff", ml: "auto" }}
          disableRipple
        >
          {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      {/* expandable content */}
      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box
          sx={{
            display: "flex",
            overflowX: "auto",
            px: 1.5,
            pb: 1.5,
            "&::-webkit-scrollbar": { display: "none" },
            gap: 1.5,
          }}
        >
          {CARDS.map((c) => (
            <MotionDiv
              key={c.title}
              {...lift}
              style={{
                ...CARD_SX,
                flex: "0 0 190px",
                background: `linear-gradient(135deg, ${c.grad[0]} 0%, ${c.grad[1]} 100%)`,
              }}
            >
              <Box sx={{ fontSize: 36, textAlign: "center", mb: 1 }}>{c.emoji}</Box>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, mb: 0.5, lineHeight: 1.2 }}
              >
                {c.title}
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontSize: 12.5, opacity: 0.9, lineHeight: 1.3 }}
              >
                {c.blurb}
              </Typography>
            </MotionDiv>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}
