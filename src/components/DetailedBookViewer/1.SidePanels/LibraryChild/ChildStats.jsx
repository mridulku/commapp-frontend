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
  Paper,
  CircularProgress
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
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import BookmarkAddedIcon from "@mui/icons-material/BookmarkAdded";
import InfoIcon from "@mui/icons-material/Info";

import axios from "axios";
import _ from "lodash";

// Import the modal for editing the plan
import EditAdaptivePlanModal from "./EditAdaptivePlanModal";

/**
 * ChildStats
 *
 * A panel that:
 *  1) Fetches the most recent plan for the given user/book from the backend
 *  2) Aggregates stats (reading, quiz, revise, etc.)
 *  3) Displays them in "infocard" style (icons + short labels)
 *  4) Shows "Today's Progress" and "Resume Learning" CTA
 *  5) Allows editing the plan via EditAdaptivePlanModal
 *
 * Props:
 *  - userId (string)
 *  - bookId (string)
 *  - colorScheme (object)
 *  - onResume (function(bookId))
 *  - backendURL (string) - optional, or can use an ENV variable
 */
export default function ChildStats({
  userId,
  bookId,
  colorScheme = {},
  onResume = () => {},
  backendURL = "http://localhost:3001",
}) {
  // 1) UI State for plan info
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState(null);
  const [serverPlan, setServerPlan] = useState(null);
  const [aggregated, setAggregated] = useState(null);

  // 2) Local states for "today’s progress" & "Resume Learning"
  const [todaysProgress, setTodaysProgress] = useState(0);

  // 3) Edit Plan Modal control
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Color scheme fallback
  const bg = colorScheme.sidebarBg || "#222";
  const fg = colorScheme.textPrimary || "#FFF";
  const accent = colorScheme.accent || "#BB86FC";
  const borderC = colorScheme.borderColor || "#444";

  // ----------------------------------------------------------
  // FETCH MOST RECENT PLAN FOR (userId, bookId) on mount or changes
  // ----------------------------------------------------------
  useEffect(() => {
    if (!userId || !bookId) {
      // If missing either, reset to no plan
      setServerPlan(null);
      setAggregated(null);
      setPlanError(null);
      setTodaysProgress(0);
      return;
    }

    const fetchPlan = async () => {
      try {
        setLoadingPlan(true);
        setPlanError(null);
        setServerPlan(null);
        setAggregated(null);

        // Example GET: /api/adaptive-plans?userId=xxx
        // Then filter or pick the one that matches this bookId, if needed
        const res = await axios.get(`${backendURL}/api/adaptive-plans`, {
          params: { userId },
        });

        const allPlans = res.data.plans || [];
        if (!allPlans.length) {
          throw new Error("No plans found for this user.");
        }

        // Potentially filter by this specific book if your plan has 'bookId' field
        // We'll assume each plan has a sessions[] that references a single book
        // If you store multiple books in a single plan, you'll need a different approach
        const matchingPlans = allPlans.filter((p) => {
          // optional check if p.bookId === bookId or if sessions belong to that book
          // if your plan doc doesn't have a direct 'bookId', you can skip filtering
          return true; // or (p.bookId === bookId)
        });

        if (!matchingPlans.length) {
          throw new Error(`No plan found for bookId: ${bookId}`);
        }

        // Sort so that the most recent plan is first, if you track createdAt
        // matchingPlans.sort((a, b) => b.createdAt - a.createdAt);

        const recentPlan = matchingPlans[0];
        setServerPlan(recentPlan);

        // compute aggregator
        const agg = computeAggregation(recentPlan);
        setAggregated(agg);

        // Example "today’s progress" logic
        // In a real scenario, you might read from plan sessions
        setTodaysProgress(45); // placeholder
      } catch (err) {
        console.error("Error fetching plan:", err);
        setPlanError(err.message || "Failed to fetch plan data.");
      } finally {
        setLoadingPlan(false);
      }
    };

    fetchPlan();
  }, [userId, bookId, backendURL]);

  /**
   * Helper: compute aggregator from the plan's sessions + activities
   */
  function computeAggregation(plan) {
    if (!plan || !plan.sessions) return null;

    let allActivities = [];
    plan.sessions.forEach((sess) => {
      if (sess.activities) {
        allActivities = allActivities.concat(sess.activities);
      }
    });

    // plan-level totals
    const totalReadCount = allActivities.filter((a) => a.type === "READ").length;
    const totalQuizCount = allActivities.filter((a) => a.type === "QUIZ").length;
    const totalReviseCount = allActivities.filter((a) => a.type === "REVISE").length;

    const readTime = _.sumBy(
      allActivities.filter((a) => a.type === "READ"),
      "timeNeeded"
    );
    const quizTime = _.sumBy(
      allActivities.filter((a) => a.type === "QUIZ"),
      "timeNeeded"
    );
    const reviseTime = _.sumBy(
      allActivities.filter((a) => a.type === "REVISE"),
      "timeNeeded"
    );

    const uniqueSubChapterCount = _.uniqBy(allActivities, "subChapterId").length;
    const uniqueChapterCount = _.uniqBy(allActivities, "chapterId").length;

    const totalPlanTime = readTime + quizTime + reviseTime;

    return {
      totalPlanTime,
      totalReadCount,
      totalQuizCount,
      totalReviseCount,
      readTime,
      quizTime,
      reviseTime,
      uniqueSubChapterCount,
      uniqueChapterCount,
    };
  }

  // Helper to format minutes
  function formatMinutes(min) {
    if (min <= 0) return "0 min";
    if (min < 60) return `${min} min`;
    const hrs = Math.floor(min / 60);
    const mins = min % 60;
    return mins ? `${hrs} hr ${mins} min` : `${hrs} hr`;
  }

  // Render a single "Info Card"
  const InfoCard = ({ icon, label, value, tooltip }) => (
    <Tooltip title={tooltip || ""} arrow>
      <Paper
        elevation={3}
        sx={{
          width: 140,
          height: 100,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          p: 1,
          backgroundColor: "rgba(255,255,255,0.06)",
          transition: "background-color 0.3s",
          ":hover": {
            backgroundColor: "rgba(255,255,255,0.12)",
          },
        }}
      >
        <Box sx={{ color: accent, fontSize: "1.8rem", mb: 0.5 }}>{icon}</Box>
        <Typography variant="caption" sx={{ textTransform: "uppercase", fontSize: "0.7rem" }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
          {value}
        </Typography>
      </Paper>
    </Tooltip>
  );

  // Prepare some local references for plan data
  const planName = serverPlan?.planName || "(No Name)";
  const planTargetDate = serverPlan?.targetDate || "N/A";
  const planLevel = serverPlan?.level || "N/A";
  const bookName = serverPlan?.bookName || "No Book Selected"; 
  // Or fallback from your existing code if the plan doesn't store bookName
  // e.g. if your plan doesn't have bookName, you might store it from the parent as well

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
      {/* HEADER: Book/Plan Title + Edit icon */}
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography
          variant="h5"
          sx={{ color: accent, fontWeight: "bold", mb: 1 }}
        >
          {bookId ? bookName : "No Book Selected"}
        </Typography>

        <IconButton
          onClick={() => setEditModalOpen(true)}
          sx={{ alignSelf: "flex-start", color: accent }}
          title="Edit Plan"
        >
          <EditIcon />
        </IconButton>
      </Box>

      {/* LOADING / ERROR STATES */}
      {loadingPlan && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CircularProgress size={20} />
          <Typography>Fetching plan data...</Typography>
        </Box>
      )}
      {planError && (
        <Typography sx={{ color: "red" }}>{planError}</Typography>
      )}

      {/* IF WE HAVE A PLAN & AGGREGATED DATA */}
      {!loadingPlan && !planError && serverPlan && aggregated && (
        <>
          {/* Small ID + Name text (for debugging) */}
          <Typography variant="body2" sx={{ fontStyle: "italic" }}>
            Plan ID: {serverPlan.id} | {planName}
          </Typography>

          {/* InfoCard Grid */}
          <Grid container spacing={2} justifyContent="center">
            {/* Target Date */}
            <Grid item>
              <InfoCard
                icon={<CalendarMonthIcon />}
                label="Target Date"
                value={planTargetDate}
                tooltip="Deadline to finish the plan"
              />
            </Grid>

            {/* Mastery Level */}
            <Grid item>
              <InfoCard
                icon={<AssignmentTurnedInIcon />}
                label="Mastery Level"
                value={planLevel}
                tooltip="How in-depth you plan to study"
              />
            </Grid>

            {/* Total Plan Time */}
            <Grid item>
              <InfoCard
                icon={<AccessTimeIcon />}
                label="Total Plan Time"
                value={`${formatMinutes(aggregated.totalPlanTime)}`}
                tooltip="Sum of read/quiz/revise times"
              />
            </Grid>

            {/* Reading Time */}
            <Grid item>
              <InfoCard
                icon={<MenuBookOutlinedIcon />}
                label="Reading"
                value={`${formatMinutes(aggregated.readTime)}`}
                tooltip="Total reading time"
              />
            </Grid>

            {/* Quiz Time */}
            <Grid item>
              <InfoCard
                icon={<QuizOutlinedIcon />}
                label="Quiz"
                value={`${formatMinutes(aggregated.quizTime)}`}
                tooltip="Total quiz time"
              />
            </Grid>

            {/* Revise Time */}
            <Grid item>
              <InfoCard
                icon={<RepeatIcon />}
                label="Revise"
                value={`${formatMinutes(aggregated.reviseTime)}`}
                tooltip="Time allocated for revision"
              />
            </Grid>

            {/* Unique Chapters */}
            <Grid item>
              <InfoCard
                icon={<MenuBookIcon />}
                label="Unique Chapters"
                value={aggregated.uniqueChapterCount}
                tooltip="Distinct chapters covered in this plan"
              />
            </Grid>

            {/* Unique SubChapters */}
            <Grid item>
              <InfoCard
                icon={<SubjectIcon />}
                label="Unique SubChaps"
                value={aggregated.uniqueSubChapterCount}
                tooltip="Distinct subchapters covered in this plan"
              />
            </Grid>
          </Grid>
        </>
      )}

      {/* Today’s Progress */}
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

      {/* Edit Plan Modal */}
      <EditAdaptivePlanModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        userId={userId}
        backendURL={backendURL}
        colorScheme={colorScheme}
        // You can pass existingPlanData if needed, or rely on the modal’s fetch logic
      />
    </Box>
  );
}