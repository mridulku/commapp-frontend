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
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import RepeatIcon from "@mui/icons-material/Repeat";
import EditIcon from "@mui/icons-material/Edit";

import axios from "axios";
import _ from "lodash";

// Import the modal for editing the plan
import EditAdaptivePlanModal from "./EditAdaptivePlanModal";

/**
 * ChildStats
 *
 * Shows an "infographical" summary of the user's most recent plan for a specific book:
 *   - Row 1: Target Date, Level, Total Plan Time, Unique Chapters, Unique Subchapters
 *   - Row 2 (with progress bars): Reading, Quiz, Revise, Overall Time
 *   - "Today's Progress" bar
 *   - "Resume Learning" button
 *   - "Edit Plan" icon => opens EditAdaptivePlanModal
 *
 * Props:
 *  - userId (string)
 *  - bookId (string)
 *  - colorScheme (object)
 *  - onResume (function(bookId))
 *  - backendURL (string) - optional or from env
 */
export default function ChildStats({
  userId,
  bookId,
  colorScheme = {},
  onResume = () => {},
  backendURL = "http://localhost:3001",
}) {
  // States for fetching and storing plan data
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planError, setPlanError] = useState(null);
  const [serverPlan, setServerPlan] = useState(null);
  const [aggregated, setAggregated] = useState(null);

  // "Today’s Progress" as a separate bar
  const [todaysProgress, setTodaysProgress] = useState(0);

  // Edit Plan Modal
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Color scheme fallback
  const bg = colorScheme.sidebarBg || "#222";
  const fg = colorScheme.textPrimary || "#FFF";
  const accent = colorScheme.accent || "#BB86FC";
  const borderC = colorScheme.borderColor || "#444";

  // ---------------------------------------------------------
  // Fetch the plan for userId + bookId whenever they change
  // ---------------------------------------------------------
  useEffect(() => {
    if (!userId || !bookId) {
      // reset everything if missing
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

        // GET /api/adaptive-plans?userId=xxx
        const res = await axios.get(`${backendURL}/api/adaptive-plans`, {
          params: { userId },
        });
        const allPlans = res.data.plans || [];
        if (!allPlans.length) {
          throw new Error("No plans found for this user.");
        }

        // Filter or pick the plan for this book if your plan doc has "bookId"
        const matchingPlans = allPlans.filter((p) => {
          // if p.bookId === bookId, or something similar
          return true; // or p.bookId === bookId
        });
        if (!matchingPlans.length) {
          throw new Error(`No plan found for bookId: ${bookId}`);
        }

        // Sort if needed for "most recent"
        // matchingPlans.sort((a, b) => b.createdAt - a.createdAt);

        const recentPlan = matchingPlans[0];
        setServerPlan(recentPlan);

        // compute aggregator
        const agg = computeAggregation(recentPlan);
        setAggregated(agg);

        // Example placeholder for "today’s progress"
        setTodaysProgress(30);
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
   * Summarizes plan sessions/activities:
   *  - total reading/quiz/revise time
   *  - unique chapters / sub-chapters
   */
  function computeAggregation(plan) {
    if (!plan || !plan.sessions) return null;

    let allActivities = [];
    plan.sessions.forEach((sess) => {
      if (sess.activities) {
        allActivities.push(...sess.activities);
      }
    });

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

    const totalPlanTime = readTime + quizTime + reviseTime;

    const uniqueChapterCount = _.uniqBy(allActivities, "chapterId").length;
    const uniqueSubChapterCount = _.uniqBy(allActivities, "subChapterId").length;

    return {
      readTime,
      quizTime,
      reviseTime,
      totalPlanTime,
      uniqueChapterCount,
      uniqueSubChapterCount,
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

  // InfoCard: No progress bar
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
          color: fg,
          transition: "background-color 0.3s",
          ":hover": {
            backgroundColor: "rgba(255,255,255,0.12)",
          },
        }}
      >
        <Box sx={{ color: accent, fontSize: "1.8rem", mb: 0.5 }}>
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
      </Paper>
    </Tooltip>
  );

  // InfoCard with progress bar (done vs. total)
  const InfoCardWithProgress = ({ icon, label, total, done = 0, tooltip }) => {
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;

    return (
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
            color: fg,
            transition: "background-color 0.3s",
            ":hover": {
              backgroundColor: "rgba(255,255,255,0.12)",
            },
          }}
        >
          <Box sx={{ color: accent, fontSize: "1.8rem", mb: 0.5 }}>
            {icon}
          </Box>
          <Typography
            variant="caption"
            sx={{ textTransform: "uppercase", fontSize: "0.7rem" }}
          >
            {label}
          </Typography>

          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
            {formatMinutes(done)} / {formatMinutes(total)}
          </Typography>

          <LinearProgress
            variant="determinate"
            value={percent}
            sx={{
              width: "85%",
              height: 6,
              borderRadius: 1,
              backgroundColor: "rgba(255,255,255,0.2)",
              "& .MuiLinearProgress-bar": {
                backgroundColor: accent,
              },
              mt: 0.5,
            }}
          />
          <Typography variant="caption" sx={{ mt: 0.3 }}>
            {percent}%
          </Typography>
        </Paper>
      </Tooltip>
    );
  };

  // If we have data, define everything
  const planTitle = serverPlan?.planName || "(No Name)";
  const targetDate = serverPlan?.targetDate || "N/A";
  const masteryLevel = serverPlan?.level || "N/A";

  // If aggregator is found, we show times. "done" is 0 for now
  let readTime = 0, quizTime = 0, reviseTime = 0, totalPlanTime = 0;
  let uniqueChapterCount = 0, uniqueSubChapterCount = 0;

  if (aggregated) {
    readTime = aggregated.readTime;
    quizTime = aggregated.quizTime;
    reviseTime = aggregated.reviseTime;
    totalPlanTime = aggregated.totalPlanTime;
    uniqueChapterCount = aggregated.uniqueChapterCount;
    uniqueSubChapterCount = aggregated.uniqueSubChapterCount;
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
      {/* HEADER => Book Title + Edit */}
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography
          variant="h5"
          sx={{ color: accent, fontWeight: "bold", mb: 1 }}
        >
          {bookId ? planTitle : "No Book Selected"}
        </Typography>

        <IconButton
          onClick={() => setEditModalOpen(true)}
          sx={{ alignSelf: "flex-start", color: accent }}
          title="Edit Plan"
        >
          <EditIcon />
        </IconButton>
      </Box>

      {/* LOADING / ERROR */}
      {loadingPlan && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <CircularProgress size={20} />
          <Typography>Fetching plan data...</Typography>
        </Box>
      )}
      {planError && (
        <Typography sx={{ color: "red" }}>{planError}</Typography>
      )}

      {/* MAIN DISPLAY if plan + aggregator exist */}
      {!loadingPlan && !planError && serverPlan && aggregated && (
        <>
          {/* Debug: plan ID + name */}
          <Typography variant="body2" sx={{ fontStyle: "italic" }}>
            Plan ID: {serverPlan.id} | {planTitle}
          </Typography>

          {/* 
            ROW 1 => 
              1) Target Date
              2) Mastery Level
              3) Total Plan Time
              4) Unique Chapters
              5) Unique Sub-Chapters 
          */}
          <Grid container spacing={2} justifyContent="center" sx={{ mb: 1 }}>
            <Grid item>
              <InfoCard
                icon={<CalendarMonthIcon />}
                label="Target Date"
                value={targetDate}
                tooltip="Deadline to finish"
              />
            </Grid>
            <Grid item>
              <InfoCard
                icon={<AssignmentTurnedInIcon />}
                label="Mastery Level"
                value={masteryLevel}
                tooltip="How deeply you plan to learn"
              />
            </Grid>
            <Grid item>
              <InfoCard
                icon={<AccessTimeIcon />}
                label="Total Plan Time"
                value={formatMinutes(totalPlanTime)}
                tooltip="Sum of read + quiz + revise"
              />
            </Grid>
            <Grid item>
              <InfoCard
                icon={<MenuBookIcon />}
                label="Chapters"
                value={uniqueChapterCount}
                tooltip="Distinct chapters in plan"
              />
            </Grid>
            <Grid item>
              <InfoCard
                icon={<SubjectIcon />}
                label="Sub-Chapters"
                value={uniqueSubChapterCount}
                tooltip="Distinct subchapters"
              />
            </Grid>
          </Grid>

          {/* 
            ROW 2 => each with a progress bar
              1) Reading
              2) Quiz
              3) Revise
              4) Overall Time
            "done" is 0 for now
          */}
          <Grid container spacing={2} justifyContent="center">
            <Grid item>
              <InfoCardWithProgress
                icon={<MenuBookOutlinedIcon />}
                label="Reading"
                total={readTime}
                done={0}
                tooltip="Reading progress"
              />
            </Grid>
            <Grid item>
              <InfoCardWithProgress
                icon={<QuizOutlinedIcon />}
                label="Quiz"
                total={quizTime}
                done={0}
                tooltip="Quiz progress"
              />
            </Grid>
            <Grid item>
              <InfoCardWithProgress
                icon={<RepeatIcon />}
                label="Revise"
                total={reviseTime}
                done={0}
                tooltip="Revision progress"
              />
            </Grid>
            <Grid item>
              <InfoCardWithProgress
                icon={<AccessTimeIcon />}
                label="Overall Time"
                total={totalPlanTime}
                done={0}
                tooltip="Total time spent so far"
              />
            </Grid>
          </Grid>
        </>
      )}

      {/* TODAY’S PROGRESS */}
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
        backendURL={backendURL}
        colorScheme={colorScheme}
      />
    </Box>
  );
}