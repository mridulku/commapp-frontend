// src/components/DetailedBookViewer/ChildStats.jsx

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  LinearProgress,
  Button,
  Grid,
  Tooltip,
  IconButton,
} from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import SubjectIcon from "@mui/icons-material/Subject";
import SpeedIcon from "@mui/icons-material/Speed";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PsychologyIcon from "@mui/icons-material/Psychology";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import RepeatIcon from "@mui/icons-material/Repeat";
import EditIcon from "@mui/icons-material/Edit";

// Import the modal for editing the plan
import EditAdaptivePlanModal from "./EditAdaptivePlanModal";

/**
 * ChildStats
 *
 * Shows:
 *  - Book title as header
 *  - Two rows of factor cards:
 *      Row 1: chapters, sub-chapters, expected reading time, reading speed
 *      Row 2: plan type (with progress), reading, quiz, revision
 *  - "Today’s Progress" bar
 *  - "Resume Learning" button
 *  - "Edit Plan" icon button => opens EditAdaptivePlanModal
 *
 * Props:
 *  - userId (string)
 *  - bookId (string)
 *  - colorScheme (object)
 *  - onResume (function(bookId))
 */
export default function ChildStats({
  userId,
  bookId,
  colorScheme = {},
  onResume = () => {},
}) {
  // Example placeholders (replace with real data).
  const [bookTitle, setBookTitle] = useState("Sample Book Title");
  const [chapters, setChapters] = useState(10);
  const [subChapters, setSubChapters] = useState(50);
  const [expectedReadingTime, setExpectedReadingTime] = useState(120); // minutes
  const [readingSpeed, setReadingSpeed] = useState(250); // wpm

  // Plan Type progress (like Mastery vs. Revision)
  const [planType, setPlanType] = useState("Mastery");
  const [planTypeStats, setPlanTypeStats] = useState({ total: 100, done: 40 });

  // Reading/Quiz/Revision each with total/done in minutes
  const [readingExpected, setReadingExpected] = useState({ total: 60, done: 15 });
  const [quizExpected, setQuizExpected] = useState({ total: 20, done: 5 });
  const [revisionExpected, setRevisionExpected] = useState({ total: 40, done: 10 });

  // "Today’s Progress"
  const [todaysProgress, setTodaysProgress] = useState(40); // 40%

  // State to manage the Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Example existing plan data for the edit modal
  // Typically, you'd fetch this from an API or build it from states
  const existingPlanData = {
    targetDate: "2025-07-20",
    maxDays: 10,
    wpm: 250,
    dailyReadingTime: 30,
    quizTime: 5,
    reviseTime: 5,
    level: "mastery",
    selectedBooks: ["bookA", "bookB"],
    selectedChapters: ["ch1", "ch2"],
    selectedSubChapters: ["sub1", "sub2"],
  };

  useEffect(() => {
    if (!bookId) {
      // Reset stats if no book is selected
      setBookTitle("No Book Selected");
      setChapters(0);
      setSubChapters(0);
      setExpectedReadingTime(0);
      setReadingSpeed(0);
      setPlanType("N/A");
      setPlanTypeStats({ total: 100, done: 0 });
      setReadingExpected({ total: 0, done: 0 });
      setQuizExpected({ total: 0, done: 0 });
      setRevisionExpected({ total: 0, done: 0 });
      setTodaysProgress(0);
    } else {
      // Otherwise, fetch real data for user/book, e.g.:
      // GET /api/book-stats?userId=xxx&bookId=yyy
      // Then set states accordingly. For now, placeholders are used.
    }
  }, [bookId]);

  // Convert color scheme or fallback
  const bg = colorScheme.sidebarBg || "#222";
  const fg = colorScheme.textPrimary || "#FFF";
  const accent = colorScheme.accent || "#BB86FC";
  const borderC = colorScheme.borderColor || "#444";

  // Helper to format minutes
  function formatMinutes(min) {
    if (min <= 0) return "0 min";
    if (min < 60) return `${min} min`;
    const hrs = Math.floor(min / 60);
    const mins = min % 60;
    return mins ? `${hrs} hr ${mins} min` : `${hrs} hr`;
  }

  return (
    <Box
      sx={{
        backgroundColor: bg,
        color: fg,
        border: `1px solid ${borderC}`,
        borderRadius: "8px",
        p: 2,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {/* HEADER ROW => Book Title + Edit Plan icon button */}
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography
          variant="h5"
          sx={{ color: accent, fontWeight: "bold", mb: 1 }}
        >
          {bookTitle}
        </Typography>

        <IconButton
          onClick={() => setEditModalOpen(true)}
          sx={{ alignSelf: "flex-start", color: accent }}
          title="Edit Plan"
        >
          <EditIcon />
        </IconButton>
      </Box>

      {/* ROW 1: Chapters, Sub-chapters, Expected Reading, Reading Speed */}
      <Grid container spacing={2}>
        <Grid item xs={6} sm={6} md={3}>
          <FactorCard
            icon={<MenuBookIcon />}
            label="Chapters"
            value={chapters}
            tooltip="Total chapters in this book"
            accent={accent}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <FactorCard
            icon={<SubjectIcon />}
            label="Sub-Chapters"
            value={subChapters}
            tooltip="Total sub-sections in the book"
            accent={accent}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <FactorCard
            icon={<AccessTimeIcon />}
            label="Expected Reading"
            value={formatMinutes(expectedReadingTime)}
            tooltip="Estimated total time to read the main content"
            accent={accent}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <FactorCard
            icon={<SpeedIcon />}
            label="Reading Speed"
            value={`${readingSpeed} wpm`}
            tooltip="Your assumed words-per-minute reading speed"
            accent={accent}
          />
        </Grid>
      </Grid>

      {/* ROW 2: Plan Type (with progress), Reading, Quiz, Revision */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <FactorCardWithProgress
            icon={planType === "Mastery" ? <PsychologyIcon /> : <RepeatIcon />}
            label="Plan Type"
            total={planTypeStats.total}
            done={planTypeStats.done}
            tooltip={`This plan is set to: ${planType}`}
            accent={accent}
            extraValue={planType}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <FactorCardWithProgress
            icon={<MenuBookOutlinedIcon />}
            label="Reading"
            total={readingExpected.total}
            done={readingExpected.done}
            tooltip="Time allocated to reading in minutes"
            accent={accent}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <FactorCardWithProgress
            icon={<QuizOutlinedIcon />}
            label="Quiz"
            total={quizExpected.total}
            done={quizExpected.done}
            tooltip="Time allocated to quizzes in minutes"
            accent={accent}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <FactorCardWithProgress
            icon={<RepeatIcon />}
            label="Revision"
            total={revisionExpected.total}
            done={revisionExpected.done}
            tooltip="Time allocated to revision in minutes"
            accent={accent}
          />
        </Grid>
      </Grid>

      {/* Today's Progress Bar */}
      <Box>
        <Typography variant="body1" sx={{ fontWeight: "bold", mb: 0.5 }}>
          Today’s Progress: {todaysProgress}%
        </Typography>
        <LinearProgress
          variant="determinate"
          value={todaysProgress}
          sx={{
            height: 8,
            borderRadius: 2,
            backgroundColor: "rgba(255,255,255,0.2)",
            "& .MuiLinearProgress-bar": {
              backgroundColor: accent,
            },
          }}
        />
      </Box>

      {/* Resume Learning CTA */}
      <Box sx={{ mt: 1 }}>
        <Button
          variant="contained"
          onClick={() => onResume(bookId)}
          sx={{
            backgroundColor: accent,
            color: "#000",
            fontWeight: "bold",
            borderRadius: "4px",
            ":hover": { backgroundColor: "#9f6cd9" },
          }}
        >
          Resume Learning
        </Button>
      </Box>

      {/* EDIT PLAN MODAL */}
      <EditAdaptivePlanModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        userId={userId}
        colorScheme={colorScheme}
        existingPlanData={existingPlanData}
        onPlanUpdate={() => {
          // e.g. re-fetch or refresh data if needed
          console.log("Plan updated, do any refresh here if needed");
        }}
      />
    </Box>
  );
}

/**
 * FactorCard: A simple card (no progress bar).
 */
function FactorCard({ icon, label, value, tooltip, accent }) {
  return (
    <Tooltip title={tooltip || ""} arrow>
      <Box
        sx={{
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 2,
          p: 1.5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0.5,
          cursor: tooltip ? "help" : "default",
          backgroundColor: "rgba(255,255,255,0.06)",
          transition: "background-color 0.3s",
          ":hover": {
            backgroundColor: "rgba(255,255,255,0.12)",
          },
        }}
      >
        <Box sx={{ color: accent, fontSize: "1.75rem" }}>
          {icon}
        </Box>
        <Typography
          variant="caption"
          sx={{ textTransform: "uppercase", fontSize: "0.7rem" }}
        >
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
          {value}
        </Typography>
      </Box>
    </Tooltip>
  );
}

/**
 * FactorCardWithProgress: similar to FactorCard but includes a small progress bar.
 * Optionally, we can show an extraValue (like "Mastery") above the bar if needed.
 */
function FactorCardWithProgress({
  icon,
  label,
  total,
  done,
  tooltip,
  accent,
  extraValue,
}) {
  const percent = total ? Math.round((done / total) * 100) : 0;

  return (
    <Tooltip title={tooltip || ""} arrow>
      <Box
        sx={{
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 2,
          p: 1.5,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0.5,
          cursor: tooltip ? "help" : "default",
          backgroundColor: "rgba(255,255,255,0.06)",
          transition: "background-color 0.3s",
          ":hover": {
            backgroundColor: "rgba(255,255,255,0.12)",
          },
        }}
      >
        <Box sx={{ color: accent, fontSize: "1.75rem" }}>{icon}</Box>

        <Typography
          variant="caption"
          sx={{ textTransform: "uppercase", fontSize: "0.7rem" }}
        >
          {label}
        </Typography>

        {extraValue && (
          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
            {extraValue}
          </Typography>
        )}

        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
          {done} / {total} min
        </Typography>

        <LinearProgress
          variant="determinate"
          value={percent}
          sx={{
            width: "100%",
            height: 6,
            borderRadius: 1,
            backgroundColor: "rgba(255,255,255,0.2)",
            "& .MuiLinearProgress-bar": {
              backgroundColor: accent,
            },
          }}
        />

        <Typography variant="caption" sx={{ opacity: 0.8 }}>
          {percent}%
        </Typography>
      </Box>
    </Tooltip>
  );
}