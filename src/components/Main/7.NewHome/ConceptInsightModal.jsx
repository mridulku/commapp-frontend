// ────────────────────────────────────────────────────────────────
// File: src/components/ConceptInsightModal.jsx   (v4 – full-width)
// ────────────────────────────────────────────────────────────────
import React from "react";
import {
  Dialog, DialogTitle, DialogContent, IconButton, Typography,
  Box, Stack, Chip, Avatar, Divider, Button, Tooltip
} from "@mui/material";

import CloseIcon         from "@mui/icons-material/Close";
import QueryStatsIcon    from "@mui/icons-material/QueryStats";
import TrendingUpIcon    from "@mui/icons-material/TrendingUp";
import LeaderboardIcon   from "@mui/icons-material/Leaderboard";
import QuizIcon          from "@mui/icons-material/Quiz";
import HistoryEduIcon    from "@mui/icons-material/HistoryEdu";
import PsychologyAltIcon from "@mui/icons-material/PsychologyAlt";

/* ─── tiny/shared ui helpers ─────────────────────────────────── */
const pill = (lab, bg = "#444") => (
  <Chip label={lab} size="small" sx={{ bgcolor: bg, color: "#fff", fontWeight: 600, height: 24, px: 1.5 }} />
);

const AvatarLite = ({ icon }) => (
  <Avatar sx={{ width: 32, height: 32, bgcolor: "rgba(255,255,255,.12)", color: "#fff", fontSize: 18 }}>
    {icon}
  </Avatar>
);

const ComingSoonPill = () => (
  <Chip label="COMING SOON" size="small" sx={{ ml: 1, bgcolor: "#ffa726", color: "#000", fontWeight: 700 }} />
);

/* disabled-but-styled button */
const ComingSoonButton = ({ variant = "contained", sx = {}, children, fullWidth = true }) => {
  const styleByVariant =
    variant === "contained"
      ? { bgcolor: "#BB86FC", color: "#000" }
      : { borderColor: "#BB86FC", color: "#BB86FC" };

  return (
    <Tooltip title="Coming soon">
      {/* Tooltip needs a wrapper because Button is disabled */}
      <span style={{ width: "100%" }}>
        <Button
          disabled
          variant={variant}
          fullWidth={fullWidth}
          sx={{
            fontWeight: 700,
            mt: 2,
            ...styleByVariant,
            ...sx,
            "&.Mui-disabled": { ...styleByVariant, opacity: 1, cursor: "not-allowed" }
          }}
        >
          {children}
          <ComingSoonPill />
        </Button>
      </span>
    </Tooltip>
  );
};

/* ─── stub data – replace with real queries later ─────────────── */
const SUMMARY = { yearsAsked: 12, avgMarks: 3.1, diff: "Medium" };
const YEAR_ROWS = [
  { y: 24, marks: 4, qs: 2, diff: "Advanced" },
  { y: 23, marks: 3, qs: 1, diff: "Intermediate" },
  { y: 22, marks: 5, qs: 2, diff: "Advanced" },
  { y: 21, marks: 2, qs: 1, diff: "Basic" }
];
const PROFICIENCY = { confidence: "High", quizzesDone: 8, mastery: 78 };

/* ─── main component ─────────────────────────────────────────── */
export default function ConceptInsightModal({ open, data = {}, onClose }) {
  if (!open) return null;

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { bgcolor: "#0f0f15", color: "#fff", borderRadius: 3 } }}
    >
      {/* HEADER */}
      <DialogTitle sx={{ pr: 7 }}>
        {data.name ?? data.label}
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 12, top: 12, color: "#fff" }}>
          <CloseIcon />
        </IconButton>
        <Typography variant="subtitle2" sx={{ mt: 0.5, opacity: 0.75 }}>
          {data.subject} 
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 2, pb: 4 }}>
        {/* 1️⃣  SUMMARY */}
        <Section title="Summary" icon={<QueryStatsIcon />}>

          {/* ── concept-specific blurb pulled from Firestore ────────── */}
  {data.summary && (
    <Typography sx={{ mb: 1, lineHeight: 1.6, opacity: 0.9 }}>
      {data.summary}
    </Typography>
  )}

  {Array.isArray(data.subPoints) && data.subPoints.length > 0 && (
    <Box component="ul" sx={{ pl: 3, mb: 2, opacity: 0.9 }}>
      {data.subPoints.map((pt, idx) => (
        <li key={idx}>
          <Typography component="span" variant="body2">
            {pt}
          </Typography>
        </li>
      ))}
    </Box>
  )}






          <StatRow icon={<TrendingUpIcon />} label="Appears in" value={`${SUMMARY.yearsAsked} / 15 papers`} />
          <StatRow
            icon={<LeaderboardIcon />}
            label="Average marks / year"
            value={SUMMARY.avgMarks.toFixed(1)}
          />
          <StatRow
            icon={<PsychologyAltIcon />}
            label="General difficulty"
            value={pill(
              SUMMARY.diff,
              SUMMARY.diff === "Low" ? "#66bb6a" : SUMMARY.diff === "Medium" ? "#ffa726" : "#ef5350"
            )}
          />
          <ComingSoonButton variant="contained">Practice Topic-wise Questions</ComingSoonButton>
        </Section>

        {/* 2️⃣  YEAR-WISE BREAKDOWN */}
        <Section title="Past-paper snapshot" icon={<HistoryEduIcon />}>
          <Stack spacing={1}>
            {YEAR_ROWS.map((r) => (
              <Stack key={r.y} direction="row" spacing={1} alignItems="center">
                <Typography sx={{ width: 50 }}>{20}{r.y}</Typography>
                {pill(`${r.marks} marks`, "#4fc3f7")}
                {pill(`${r.qs} Qs`, "#29b6f6")}
                {pill(
                  r.diff,
                  r.diff === "Basic" ? "#66bb6a" : r.diff === "Intermediate" ? "#ffa726" : "#ef5350"
                )}
              </Stack>
            ))}
          </Stack>
          <ComingSoonButton variant="outlined">Practice Similar Prev-Year Qs</ComingSoonButton>
        </Section>

        {/* 3️⃣  YOUR PROFICIENCY */}
        <Section title="Your proficiency" icon={<QuizIcon />}>
          <StatRow
            icon={<QuizIcon />}
            label="Confidence"
            value={pill(
              PROFICIENCY.confidence,
              PROFICIENCY.confidence === "Low"
                ? "#ef5350"
                : PROFICIENCY.confidence === "Medium"
                  ? "#ffa726"
                  : "#66bb6a"
            )}
          />
          <StatRow icon={<LeaderboardIcon />} label="Quizzes taken" value={`${PROFICIENCY.quizzesDone}`} />
          <StatRow
            icon={<TrendingUpIcon />}
            label="Mastery level"
            value={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: 120, height: 8, borderRadius: 4, bgcolor: "rgba(255,255,255,.15)", overflow: "hidden" }}>
                  <Box sx={{ width: `${PROFICIENCY.mastery}%`, height: "100%", bgcolor: "#BB86FC" }} />
                </Box>
                <Typography>{PROFICIENCY.mastery}%</Typography>
              </Box>
            }
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
            <ComingSoonButton variant="contained">Quick 5-Q Quiz</ComingSoonButton>
            <ComingSoonButton variant="outlined">Cover Remaining Gaps</ComingSoonButton>
          </Stack>
        </Section>
      </DialogContent>
    </Dialog>
  );
}

/* ─── layout helpers ─────────────────────────────────────────── */
const Section = ({ title, icon, children }) => (
  <Box sx={{ mt: 4 }}>
    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
      <AvatarLite icon={icon} />
      <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
    </Stack>
    <Divider sx={{ mb: 2, bgcolor: "#333" }} />
    {children}
  </Box>
);

const StatRow = ({ icon, label, value }) => (
  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
    <AvatarLite icon={icon} />
    <Typography sx={{ flex: 1 }}>{label}</Typography>
    {value}
  </Stack>
);
