/* ─── ConceptCard.jsx (inline or separate file) ───────────────── */
import React from "react";
import { Typography, Stack } from "@mui/material";
import { motion } from "framer-motion";

const MotionCard = motion.div;        // if you already have MotionCard use that
const line = (emoji, text) => (
  <Stack direction="row" spacing={1}>
    <span style={{ fontSize: "1rem" }}>{emoji}</span>
    <Typography
      variant="caption"
      sx={{ opacity: 0.85, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}
    >
      {text}
    </Typography>
  </Stack>
);

export default function ConceptCard({ data, sx, lift, onClick }) {
  const { name, book, subject, grouping, chapter, subChap } = data;
  return (
    <MotionCard
      {...lift}
      onClick={onClick}
      style={{
        ...sx,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        padding: "16px",
        minHeight: 160,
      }}
    >
      {/* concept title */}
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
        {name}
      </Typography>

      {/* meta lines */}
      {line("📚", book)}
      {line("🧪", subject)}
      {line("🧩", grouping)}
      {line("📖", chapter)}
      {line("🔸", subChap)}
    </MotionCard>
  );
}
