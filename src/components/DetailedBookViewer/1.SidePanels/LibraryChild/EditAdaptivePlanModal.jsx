// src/components/DetailedBookViewer/EditAdaptivePlanModal.jsx

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  TextField,
  RadioGroup,
  Radio,
  Grid,
  CircularProgress,
  Tooltip,
  IconButton,
  FormControl,
  FormLabel,
  Paper
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoIcon from "@mui/icons-material/Info";
import CheckIcon from "@mui/icons-material/Check";

import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import QuizIcon from "@mui/icons-material/Quiz";
import RepeatIcon from "@mui/icons-material/Repeat";
import BookmarkAddedIcon from "@mui/icons-material/BookmarkAdded";

import axios from "axios";
import _ from "lodash";

/**
 * EditAdaptivePlanModal
 *
 * A multi-step modal for creating/editing an Adaptive Plan.
 *
 * Props:
 *  - open (bool): Controls whether the dialog is open
 *  - onClose (function): Callback when modal closes
 *  - userId (string): The user's ID (needed to create a plan)
 *  - backendURL (string): Base server URL, e.g. "https://api.example.com"
 *  - bookId (string): (Optional) Book ID to include in plan creation
 */
export default function EditAdaptivePlanModal({
  open,
  onClose,
  userId = null,
  backendURL = "http://localhost:3001",
  bookId = ""
}) {
  // ----------------------------
  // STEP STATE
  // ----------------------------
  const [activeStep, setActiveStep] = useState(0);
  const steps = ["Select Chapters", "Schedule & Mastery", "Review & Confirm"];

  // ----------------------------
  // STEP 1: CHAPTER SELECTION (Demo Data)
  // ----------------------------
  const [chapters, setChapters] = useState([
    {
      id: "ch1",
      title: "Chapter 1: Introduction",
      expanded: false,
      selected: true,
      subchapters: [
        { id: "ch1.1", title: "Subchapter 1.1", selected: true },
        { id: "ch1.2", title: "Subchapter 1.2", selected: true },
      ],
    },
    {
      id: "ch2",
      title: "Chapter 2: Advanced Topics",
      expanded: false,
      selected: true,
      subchapters: [
        { id: "ch2.1", title: "Subchapter 2.1", selected: true },
        { id: "ch2.2", title: "Subchapter 2.2", selected: true },
        { id: "ch2.3", title: "Subchapter 2.3", selected: true },
      ],
    },
  ]);

  const handleToggleChapter = (chapterIndex) => {
    const updatedChapters = [...chapters];
    const current = updatedChapters[chapterIndex];
    current.selected = !current.selected;
    // If chapter turned off, also unselect subchapters
    if (!current.selected) {
      current.subchapters.forEach((sc) => {
        sc.selected = false;
      });
    }
    updatedChapters[chapterIndex] = current;
    setChapters(updatedChapters);
  };

  const handleToggleSubchapter = (chapterIndex, subIndex) => {
    const updatedChapters = [...chapters];
    const subChapters = updatedChapters[chapterIndex].subchapters;
    subChapters[subIndex].selected = !subChapters[subIndex].selected;

    // If any subchapter is selected, parent chapter is selected
    const anySelected = subChapters.some((sc) => sc.selected);
    updatedChapters[chapterIndex].selected = anySelected;

    setChapters(updatedChapters);
  };

  const handleAccordionToggle = (chapterIndex) => {
    const updatedChapters = [...chapters];
    updatedChapters[chapterIndex].expanded =
      !updatedChapters[chapterIndex].expanded;
    setChapters(updatedChapters);
  };

  // ----------------------------
  // STEP 2: FORM FIELDS
  // ----------------------------
  const [targetDate, setTargetDate] = useState("");
  const [dailyReadingTime, setDailyReadingTime] = useState(30);
  const [masteryLevel, setMasteryLevel] = useState("mastery");

  // We'll derive quizTime/reviseTime from masteryLevel (or store them if needed).
  // For clarity, we won't store them in state; we'll just compute on the fly
  // right before the plan creation call.

  // ----------------------------
  // STEP 2 → 3: CREATE PLAN ON BACKEND
  // ----------------------------
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [serverError, setServerError] = useState(null);

  // We'll store the newly created plan's ID and creation time, in case we want to show it *immediately*,
  // but we also fetch the most recent plan from the server afterward for a final display.
  const [createdPlanId, setCreatedPlanId] = useState(null);
  const [createdAt, setCreatedAt] = useState(null);

  const createPlanOnBackend = async () => {
    if (!userId) {
      console.warn("No userId provided. Cannot create plan.");
      return;
    }

    try {
      setServerError(null);
      setIsCreatingPlan(true);

      // Derive quizTime & reviseTime from masteryLevel
      let quizTime = 1;
      let reviseTime = 1;
      if (masteryLevel === "mastery") {
        quizTime = 5;
        reviseTime = 5;
      } else if (masteryLevel === "revision") {
        quizTime = 3;
        reviseTime = 3;
      }

      // Build request body
      const requestBody = {
        userId,
        targetDate,       // e.g. "2025-03-21"
        dailyReadingTime, // user-specified minutes per day
        masteryLevel,     // "mastery", "revision", or "glance"
        quizTime,         // derived
        reviseTime,       // derived
      };

      // If bookId is provided, pass it, else might pass empty or skip
      if (bookId) {
        requestBody.bookId = bookId;
      } else {
        // optional: requestBody.bookId = "";
      }

      // (Chapters & subchapters are not being sent right now, as per your instructions)
      // If you do eventually want to pass them:
      // const selectedChapterIds = [];
      // const selectedSubchapterIds = [];
      // chapters.forEach((ch) => {
      //   if (ch.selected) {
      //     selectedChapterIds.push(ch.id);
      //   }
      //   ch.subchapters.forEach((sub) => {
      //     if (sub.selected) {
      //       selectedSubchapterIds.push(sub.id);
      //     }
      //   });
      // });
      // requestBody.selectedChapters = selectedChapterIds;
      // requestBody.selectedSubChapters = selectedSubchapterIds;

      // Example endpoint for creation:

      const createEndpoint = "https://generateadaptiveplan-zfztjkkvva-uc.a.run.app";

      const response = await axios.post(createEndpoint, requestBody, {
        headers: { "Content-Type": "application/json" },
      });

      // The response should contain the newly created plan
      const newPlan = response.data?.plan;
      setCreatedPlanId(newPlan?.id || null);
      setCreatedAt(newPlan?.createdAt || null);
    } catch (error) {
      console.error("Plan creation failed:", error);
      setServerError(error.message || "Plan creation failed");
    } finally {
      setIsCreatingPlan(false);
    }
  };

  // ----------------------------
  // STEP 3: FETCH & DISPLAY MOST RECENT PLAN
  // ----------------------------
  const [isFetchingPlan, setIsFetchingPlan] = useState(false);
  const [serverPlan, setServerPlan] = useState(null);
  const [aggregated, setAggregated] = useState(null);

  const fetchMostRecentPlan = async () => {
    if (!userId) {
      console.warn("No userId provided—can't fetch plan from backend.");
      return;
    }

    try {
      setIsFetchingPlan(true);
      setServerError(null);
      setServerPlan(null);

      // Suppose your endpoint is:
      // GET /api/adaptive-plans?userId=xxx
      const res = await axios.get(`${backendURL}/api/adaptive-plans`, {
        params: { userId },
      });
      const allPlans = res.data?.plans || [];
      if (!allPlans.length) {
        throw new Error("No plans found for this user.");
      }

      // Sort by creation time (descending) so the most recent is [0]
      allPlans.sort((a, b) => {
        const tA = new Date(a.createdAt).getTime();
        const tB = new Date(b.createdAt).getTime();
        return tB - tA;
      });
      const recentPlan = allPlans[0];
      setServerPlan(recentPlan);

      // optional: compute aggregator stats
      const agg = computeAggregation(recentPlan);
      setAggregated(agg);
    } catch (err) {
      console.error("Error fetching most recent plan:", err);
      setServerError(err.message || "Failed to fetch the plan.");
    } finally {
      setIsFetchingPlan(false);
    }
  };

  function computeAggregation(plan) {
    if (!plan || !plan.sessions) return null;
    let allActivities = [];
    plan.sessions.forEach((sess) => {
      if (sess.activities && Array.isArray(sess.activities)) {
        allActivities.push(...sess.activities);
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

  // ----------------------------
  // LOCAL FEASIBILITY CHECK (Optional)
  // ----------------------------
  const [planSummary, setPlanSummary] = useState({
    totalMinutes: 0,
    dailyMinutes: dailyReadingTime,
    totalDays: 0,
    feasible: true,
    reason: "",
  });
  const [isProcessingLocalCalc, setIsProcessingLocalCalc] = useState(false);

  const calculatePlanLocally = () => {
    setIsProcessingLocalCalc(true);

    // For local demonstration: map mastery -> minutes/subchapter
    let timePerSubchapter = 10;
    if (masteryLevel === "revision") timePerSubchapter = 5;
    if (masteryLevel === "glance") timePerSubchapter = 2;

    // Count selected subchapters:
    let subchapterCount = 0;
    chapters.forEach((ch) => {
      ch.subchapters.forEach((sub) => {
        if (sub.selected) subchapterCount += 1;
      });
    });

    const totalTime = subchapterCount * timePerSubchapter;
    const daysNeeded = dailyReadingTime > 0
      ? Math.ceil(totalTime / dailyReadingTime)
      : 9999;

    // Quick feasibility check comparing targetDate
    const today = new Date();
    const tDate = new Date(targetDate);
    let feasible = true;
    let reason = "";
    if (!isNaN(tDate.getTime())) {
      const msDiff = tDate - today;
      const daysAvailable = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
      if (daysNeeded > daysAvailable) {
        feasible = false;
        reason = `Needs ${daysNeeded} days but only ${daysAvailable} available.`;
      }
    }

    setTimeout(() => {
      setPlanSummary({
        totalMinutes: totalTime,
        dailyMinutes: dailyReadingTime,
        totalDays: daysNeeded,
        feasible,
        reason,
      });
      setIsProcessingLocalCalc(false);
    }, 300);
  };

  function formatTimestamp(ts) {
    if (!ts) return "N/A";
  
    // If ts is a Firestore Timestamp, it may have a method like toDate().
    // If it's just an object like { _seconds: number, _nanoseconds: number },
    // manually convert it to milliseconds:
    if (typeof ts.toDate === "function") {
      return ts.toDate().toLocaleString();
    } else if (ts._seconds) {
      const millis = ts._seconds * 1000;
      return new Date(millis).toLocaleString();
    }
  
    // If it's already a Date or something else:
    return String(ts);
  }

  // ----------------------------
  // STEPPER NAVIGATION
  // ----------------------------
  const handleNext = async () => {
    if (activeStep === 0) {
      // Step 0 -> Step 1
      setActiveStep(1);
      return;
    }

    if (activeStep === 1) {
      // Step 1 -> Step 2
      // 1) Perform local calculation
      calculatePlanLocally();

      // 2) Call createPlanOnBackend
      await createPlanOnBackend();

      // (Optionally wait ~1s)
      // await new Promise((r) => setTimeout(r, 1000));

      // 3) Move to step 3
      setActiveStep(2);

      // 4) Then fetch the newly created plan from server
      //    (We do it AFTER we show the step 3 so that there's a small delay)
      fetchMostRecentPlan();

      return;
    }

    if (activeStep === 2) {
      // Step 2 -> finished
      onClose();
    }
  };

  const handleBack = () => {
    if (activeStep === 0) {
      // If we are at step 0, close modal if "Back" pressed
      onClose();
    } else {
      setActiveStep(activeStep - 1);
    }
  };

  // ----------------------------
  // RENDER STEP CONTENT
  // ----------------------------
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        // STEP 1: SELECT CHAPTERS
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Chapters/Subchapters (Demo Only):
            </Typography>
            {chapters.map((ch, idx) => (
              <Accordion
                key={ch.id}
                expanded={ch.expanded}
                onChange={() => handleAccordionToggle(idx)}
                sx={{ marginBottom: 1 }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={ch.selected}
                        onChange={() => handleToggleChapter(idx)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    }
                    label={
                      <Typography sx={{ fontWeight: "bold" }}>
                        {ch.title}
                      </Typography>
                    }
                  />
                </AccordionSummary>
                <AccordionDetails>
                  {ch.subchapters.map((sub, sidx) => (
                    <FormControlLabel
                      key={sub.id}
                      control={
                        <Checkbox
                          checked={sub.selected}
                          onChange={() =>
                            handleToggleSubchapter(idx, sidx)
                          }
                        />
                      }
                      label={sub.title}
                      sx={{ display: "block", marginLeft: 3 }}
                    />
                  ))}
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        );

      case 1:
        // STEP 2: TARGET DATE, DAILY READING, MASTERY
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                  <CalendarMonthIcon
                    sx={{ fontSize: "1rem", verticalAlign: "middle" }}
                  />{" "}
                  Target Date
                </Typography>
                <Tooltip title="We use this to see if you can finish before your deadline.">
                  <IconButton size="small">
                    <InfoIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </Box>
              <TextField
                type="date"
                fullWidth
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                variant="outlined"
                size="small"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                  <AccessTimeIcon
                    sx={{ fontSize: "1rem", verticalAlign: "middle" }}
                  />{" "}
                  Daily Reading (min)
                </Typography>
                <Tooltip title="How many minutes you plan to read/study each day.">
                  <IconButton size="small">
                    <InfoIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </Box>
              <TextField
                type="number"
                fullWidth
                value={dailyReadingTime}
                onChange={(e) => setDailyReadingTime(Number(e.target.value))}
                variant="outlined"
                size="small"
              />
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                  <AssignmentTurnedInIcon
                    sx={{ fontSize: "1rem", verticalAlign: "middle" }}
                  />{" "}
                  Mastery Level
                </Typography>
                <Tooltip
                  title={
                    <Box>
                      <strong>Mastery:</strong> Deep understanding
                      <br />
                      <strong>Revision:</strong> Quick review
                      <br />
                      <strong>Glance:</strong> Minimal detail
                    </Box>
                  }
                >
                  <IconButton size="small">
                    <InfoIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </Box>
              <FormControl sx={{ mt: 1 }}>
                <FormLabel>Choose Level</FormLabel>
                <RadioGroup
                  row
                  value={masteryLevel}
                  onChange={(e) => setMasteryLevel(e.target.value)}
                >
                  <FormControlLabel
                    value="mastery"
                    control={<Radio />}
                    label="Mastery"
                  />
                  <FormControlLabel
                    value="revision"
                    control={<Radio />}
                    label="Revision"
                  />
                  <FormControlLabel
                    value="glance"
                    control={<Radio />}
                    label="Glance"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 2:
        // STEP 3: DISPLAY THE MOST RECENT PLAN
        return (
          <Box display="flex" flexDirection="column" gap={3}>
            {(isCreatingPlan || isFetchingPlan) && (
              <Box textAlign="center">
                <CircularProgress sx={{ mb: 1 }} />
                <Typography variant="body2">
                  {isCreatingPlan
                    ? "Creating plan on backend..."
                    : "Fetching plan from server..."}
                </Typography>
              </Box>
            )}

            {serverError && (
              <Typography variant="body1" color="error">
                {serverError}
              </Typography>
            )}

            {serverPlan && aggregated && !isFetchingPlan && !isCreatingPlan && (
              <>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: "bold", textAlign: "center" }}
                >
                  Your Plan is Ready!
                </Typography>

                {/* Show the plan ID and creation time (if available) for debugging */}
                <Typography
                  variant="body2"
                  sx={{ textAlign: "center", fontStyle: "italic" }}
                >
                  Plan ID: {serverPlan.id}
                </Typography>

                {/* 
                  We display the info in the requested order:
                  1) Target Date
                  2) Mastery Level
                  3) Unique Chapters
                  4) Unique Subchapters
                  5) Total Plan Time
                  6) Reading
                  7) Quiz
                  8) Revise
                  9) Plan Creation Time
                */}
                <Box
                  display="flex"
                  flexWrap="wrap"
                  justifyContent="center"
                  gap={2}
                  mt={2}
                >
                  {/* Target Date */}
                  <InfoCard
                    icon={<CalendarMonthIcon sx={{ fontSize: "2rem" }} />}
                    label="Target Date"
                    value={serverPlan.targetDate || "N/A"}
                  />

                  {/* Mastery Level */}
                  <InfoCard
                    icon={
                      <AssignmentTurnedInIcon sx={{ fontSize: "2rem" }} />
                    }
                    label="Mastery Level"
                    value={serverPlan.level || "N/A"}
                  />

                  {/* Unique Chapters */}
                  <InfoCard
                    icon={<BookmarkAddedIcon sx={{ fontSize: "2rem" }} />}
                    label="Unique Chapters"
                    value={aggregated.uniqueChapterCount}
                  />

                  {/* Unique Subchapters */}
                  <InfoCard
                    icon={<BookmarkAddedIcon sx={{ fontSize: "2rem" }} />}
                    label="Unique SubChapters"
                    value={aggregated.uniqueSubChapterCount}
                  />

                  {/* Total Plan Time */}
                  <InfoCard
                    icon={<AccessTimeIcon sx={{ fontSize: "2rem" }} />}
                    label="Total Plan Time"
                    value={`${aggregated.totalPlanTime} min`}
                  />

                  {/* Reading */}
                  <InfoCard
                    icon={<AutoStoriesIcon sx={{ fontSize: "2rem" }} />}
                    label="Reading"
                    value={`${aggregated.readTime} min`}
                  />

                  {/* Quiz */}
                  <InfoCard
                    icon={<QuizIcon sx={{ fontSize: "2rem" }} />}
                    label="Quiz"
                    value={`${aggregated.quizTime} min`}
                  />

                  {/* Revise */}
                  <InfoCard
                    icon={<RepeatIcon sx={{ fontSize: "2rem" }} />}
                    label="Revise"
                    value={`${aggregated.reviseTime} min`}
                  />

                  {/* Plan Creation Time */}
                  <InfoCard
                    icon={<InfoIcon sx={{ fontSize: "2rem" }} />}
                    label="Created At"
                    value={formatTimestamp(serverPlan.createdAt)}
                    />
                </Box>

                {/* 
                  Optionally, you can show feasibility check from local calculation:
                */}
                <Box textAlign="center" mt={3}>
                  {planSummary.feasible ? (
                    <Typography sx={{ color: "green", fontWeight: "bold" }}>
                      Your plan seems feasible!
                    </Typography>
                  ) : (
                    <Typography sx={{ color: "red", fontWeight: "bold" }}>
                      Your plan may not be feasible. {planSummary.reason}
                    </Typography>
                  )}
                </Box>
              </>
            )}

            {!isCreatingPlan && !isFetchingPlan && !serverError && !serverPlan && (
              <Typography variant="body2" fontStyle="italic">
                No plan data available.
              </Typography>
            )}
          </Box>
        );

      default:
        return <Typography>Unknown step</Typography>;
    }
  };

  // ----------------------------
  // RENDER
  // ----------------------------
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          Adaptive Plan Setup
        </Typography>
      </DialogTitle>

      <DialogContent>
        {/* STEPPER */}
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label, idx) => (
            <Step key={idx}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* MAIN STEP CONTENT */}
        {renderStepContent(activeStep)}
      </DialogContent>

      <DialogActions>
        {/* “Back” button is optional at step 0 (could close modal) or goes to previous step */}
        {activeStep > 0 ? (
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={isProcessingLocalCalc || isCreatingPlan || isFetchingPlan}
          >
            Back
          </Button>
        ) : (
          <Button variant="outlined" onClick={handleBack}>
            Close
          </Button>
        )}

        {/* Next or Confirm */}
        {activeStep < steps.length - 1 && (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={isProcessingLocalCalc || isCreatingPlan || isFetchingPlan}
            startIcon={<CheckIcon />}
          >
            Next
          </Button>
        )}
        {activeStep === steps.length - 1 &&
          !isProcessingLocalCalc &&
          !isCreatingPlan &&
          !isFetchingPlan && (
            <Button
              variant="contained"
              onClick={handleNext}
              startIcon={<CheckIcon />}
            >
              Confirm Plan
            </Button>
          )}
      </DialogActions>
    </Dialog>
  );
}

/**
 * InfoCard
 * A small helper component for displaying an icon + label + value
 * in a "dashboard-like" tile.
 */
function InfoCard({ icon, label, value }) {
  return (
    <Paper
      elevation={3}
      sx={{
        width: 170,
        height: 120,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        p: 1,
      }}
    >
      <Box textAlign="center" mb={1}>
        {icon}
      </Box>
      <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Paper>
  );
}