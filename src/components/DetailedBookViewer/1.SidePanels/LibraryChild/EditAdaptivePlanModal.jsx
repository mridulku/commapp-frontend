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
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckIcon from "@mui/icons-material/Check";
import InfoIcon from "@mui/icons-material/Info";
import QuizIcon from "@mui/icons-material/Quiz";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import RepeatIcon from "@mui/icons-material/Repeat";
import BookmarkAddedIcon from "@mui/icons-material/BookmarkAdded";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import axios from "axios";
import _ from "lodash";

/**
 * A multi-step form for creating/editing an Adaptive Plan.
 * Steps:
 *   1) Select Chapters/Subchapters
 *   2) Choose Target Date, Daily Reading Time, Mastery Level
 *   3) Display the plan from the server in a "dashboard" style, plus next-step options
 *
 * Props:
 *  - open (bool): controls whether the dialog is open
 *  - onClose (func): callback when modal closes
 *  - userId (string): the user's ID (needed for plan creation)
 *  - backendURL (string): your server root (e.g. "http://localhost:3001")
 */
export default function EditAdaptivePlanModal({
  open,
  onClose,
  userId = null,
  backendURL = "http://localhost:3001",
}) {
  // ---------------------------------------------------------
  //  STEP LOGIC
  // ---------------------------------------------------------
  const [activeStep, setActiveStep] = useState(0);
  const steps = ["Select Chapters", "Schedule & Mastery", "Review & Confirm"];

  // ---------------------------------------------------------
  //  STEP 1: CHAPTER SELECTION
  // ---------------------------------------------------------
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
    // Unselect subchapters if the chapter is turned off
    if (!current.selected) {
      current.subchapters = current.subchapters.map((sc) => ({
        ...sc,
        selected: false,
      }));
    }
    updatedChapters[chapterIndex] = current;
    setChapters(updatedChapters);
  };

  const handleToggleSubchapter = (chapterIndex, subIndex) => {
    const updatedChapters = [...chapters];
    const subChapters = [...updatedChapters[chapterIndex].subchapters];
    subChapters[subIndex].selected = !subChapters[subIndex].selected;

    // If any subchapter is selected, the parent chapter is considered selected
    const anySelected = subChapters.some((sc) => sc.selected);
    updatedChapters[chapterIndex].selected = anySelected;

    updatedChapters[chapterIndex].subchapters = subChapters;
    setChapters(updatedChapters);
  };

  const handleAccordionToggle = (chapterIndex) => {
    const updatedChapters = [...chapters];
    updatedChapters[chapterIndex].expanded =
      !updatedChapters[chapterIndex].expanded;
    setChapters(updatedChapters);
  };

  // ---------------------------------------------------------
  //  STEP 2: TARGET DATE, DAILY READING, MASTERY
  // ---------------------------------------------------------
  const [targetDate, setTargetDate] = useState("");
  const [dailyReadingTime, setDailyReadingTime] = useState(30); // in minutes
  const [masteryLevel, setMasteryLevel] = useState("mastery");

  // ---------------------------------------------------------
  //  DUMMY LOCAL CALCULATIONS (OPTIONAL, if you want some "feasibility" logic)
  // ---------------------------------------------------------
  const [isProcessing, setIsProcessing] = useState(false);
  const [planSummary, setPlanSummary] = useState({
    totalMinutes: 0,
    dailyMinutes: 0,
    totalDays: 0,
    feasible: true,
    reason: "",
  });

  const calculatePlan = () => {
    setIsProcessing(true);

    // map mastery level -> minutes per subchapter
    let timePerSubchapter = 10;
    if (masteryLevel === "revision") timePerSubchapter = 5;
    if (masteryLevel === "glance") timePerSubchapter = 2;

    // count subchapters selected
    let subchapterCount = 0;
    chapters.forEach((ch) => {
      ch.subchapters.forEach((sub) => {
        if (sub.selected) subchapterCount += 1;
      });
    });

    const totalTime = subchapterCount * timePerSubchapter;
    const daysNeeded =
      dailyReadingTime > 0 ? Math.ceil(totalTime / dailyReadingTime) : 9999;

    // basic feasibility check
    const today = new Date();
    const tDate = new Date(targetDate);
    let feasible = true;
    let reason = "";
    if (!isNaN(tDate.getTime())) {
      const msDiff = tDate.getTime() - today.getTime();
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
      setIsProcessing(false);
    }, 500);
  };

  const [alternateSuggestions, setAlternateSuggestions] = useState([]);

  // quickly generate mastery-level or daily-reading-time variations
  const generateSuggestions = () => {
    const subChCount = chapters.reduce((acc, ch) => {
      return (
        acc + ch.subchapters.filter((sub) => sub.selected).length
      );
    }, 0);

    const suggestions = [];
    // different mastery levels
    ["mastery", "revision", "glance"].forEach((lvl) => {
      let time = 10;
      if (lvl === "revision") time = 5;
      if (lvl === "glance") time = 2;

      const total = subChCount * time;
      const daysNeeded =
        dailyReadingTime > 0
          ? Math.ceil(total / dailyReadingTime)
          : 9999;

      suggestions.push({
        masteryLevel: lvl,
        dailyReadingTime,
        totalDays: daysNeeded,
      });
    });
    // different daily reading times
    [10, 20, 30, 60].forEach((possibleDaily) => {
      if (possibleDaily === dailyReadingTime) return; // skip current
      let time = 10;
      if (masteryLevel === "revision") time = 5;
      if (masteryLevel === "glance") time = 2;

      const total = subChCount * time;
      const daysNeeded =
        possibleDaily > 0
          ? Math.ceil(total / possibleDaily)
          : 9999;

      suggestions.push({
        masteryLevel,
        dailyReadingTime: possibleDaily,
        totalDays: daysNeeded,
      });
    });

    setAlternateSuggestions(suggestions);
  };

  const handleApplySuggestion = (sugg) => {
    setMasteryLevel(sugg.masteryLevel);
    setDailyReadingTime(sugg.dailyReadingTime);
    calculatePlan();
  };

  // ---------------------------------------------------------
  //  FETCH & DISPLAY REAL PLAN FROM BACKEND
  // ---------------------------------------------------------
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [serverPlan, setServerPlan] = useState(null);
  const [aggregated, setAggregated] = useState(null);
  const [serverError, setServerError] = useState(null);

  const handleCreateOrFetchPlan = async () => {
    if (!userId) {
      console.warn("No userId provided—can't fetch plan from backend!");
      return;
    }
    setIsCreatingPlan(true);
    setServerError(null);
    setServerPlan(null);

    try {
      // Just fetch existing plans from the server
      const res = await axios.get(`${backendURL}/api/adaptive-plans`, {
        params: { userId },
      });
      const allPlans = res.data.plans || [];
      if (!allPlans.length) {
        throw new Error("No plans found for this user.");
      }

      // you can sort if needed by "createdAt"
      // allPlans.sort((a, b) => b.createdAt - a.createdAt);
      const recentPlan = allPlans[0];

      setServerPlan(recentPlan);
      const agg = computeAggregation(recentPlan);
      setAggregated(agg);

    } catch (err) {
      console.error("Error fetching plan:", err);
      setServerError(err.message || "Failed to fetch plan.");
    } finally {
      setIsCreatingPlan(false);
    }
  };

  function computeAggregation(plan) {
    if (!plan || !plan.sessions) return null;
    let allActivities = [];
    plan.sessions.forEach((sess) => {
      if (sess.activities) {
        allActivities.push(...sess.activities);
      }
    });

    // plan-level totals
    const totalReadCount = allActivities.filter((a) => a.type === "READ").length;
    const totalQuizCount = allActivities.filter((a) => a.type === "QUIZ").length;
    const totalReviseCount = allActivities.filter(
      (a) => a.type === "REVISE"
    ).length;

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
      uniqueChapterCount
    };
  }

  // ---------------------------------------------------------
  //  STEPPER NAVIGATION
  // ---------------------------------------------------------
  const handleNext = async () => {
    if (activeStep === 0) {
      setActiveStep(1);
    } else if (activeStep === 1) {
      // do local calc
      calculatePlan();
      // also fetch the plan from server
      await handleCreateOrFetchPlan();
      setActiveStep(2);
    } else if (activeStep === 2) {
      // final confirm
      onClose();
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  // whenever step 2 -> step 3 is complete & local calc done, generate suggestions
  useEffect(() => {
    if (activeStep === 2 && !isProcessing && planSummary.totalMinutes > 0) {
      generateSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, isProcessing]);

  // ---------------------------------------------------------
  //  RENDER STEP CONTENT
  // ---------------------------------------------------------
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        // STEP 1: CHAPTER SELECTION
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Select Chapters/Subchapters:
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
          <Grid container spacing={4}>
            <Grid item xs={12} sm={6}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                  <span role="img" aria-label="calendar">📅</span> Target Date
                </Typography>
                <Tooltip title="We use this to check if you can finish before your deadline.">
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
                  <AccessTimeIcon sx={{ fontSize: "1rem", verticalAlign: "middle" }} /> Daily Reading (min)
                </Typography>
                <Tooltip title="How many minutes you plan to study each day.">
                  <IconButton size="small">
                    <InfoIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </Box>
              <TextField
                type="number"
                fullWidth
                value={dailyReadingTime}
                onChange={(e) => setDailyReadingTime(e.target.value)}
                variant="outlined"
                size="small"
              />
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                  <AssignmentTurnedInIcon sx={{ fontSize: "1rem", verticalAlign: "middle" }} /> Mastery Level
                </Typography>
                <Tooltip
                  title={
                    <Box>
                      <strong>Mastery:</strong> Deep understanding<br />
                      <strong>Revision:</strong> Quick review<br />
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
        // STEP 3: SHOW SERVER PLAN DETAILS in a "dashboard" style
        return (
          <Box display="flex" flexDirection="column" gap={3}>

            {isCreatingPlan && (
              <Box textAlign="center">
                <CircularProgress sx={{ mb: 1 }} />
                <Typography variant="body2">
                  Fetching plan from server...
                </Typography>
              </Box>
            )}

            {serverError && (
              <Typography variant="body1" color="error">
                {serverError}
              </Typography>
            )}

            {!isCreatingPlan && !serverError && serverPlan && aggregated && (
              <>
                {/* Title */}
                <Typography
                  variant="h5"
                  sx={{ fontWeight: "bold", textAlign: "center" }}
                >
                  Your Plan is Ready!
                </Typography>

                {/* Plan ID (small text) */}
                <Typography
                  variant="body2"
                  sx={{ textAlign: "center", fontStyle: "italic" }}
                >
                  Plan ID: {serverPlan.id}
                </Typography>

                {/* Infographic area */}
                <Box
                  display="flex"
                  flexWrap="wrap"
                  justifyContent="center"
                  gap={2}
                  mt={2}
                >
                  {/* Target Date Card */}
                  <InfoCard
                    icon={<CalendarMonthIcon sx={{ fontSize: "2rem" }} />}
                    label="Target Date"
                    value={serverPlan.targetDate || "N/A"}
                    tooltip="Deadline for completion"
                  />

                  {/* Mastery Level Card */}
                  <InfoCard
                    icon={<AssignmentTurnedInIcon sx={{ fontSize: "2rem" }} />}
                    label="Mastery Level"
                    value={serverPlan.level || "N/A"}
                    tooltip="How deeply you plan to study"
                  />

                  {/* Total Plan Time */}
                  <InfoCard
                    icon={<AccessTimeIcon sx={{ fontSize: "2rem" }} />}
                    label="Total Plan Time"
                    value={`${aggregated.totalPlanTime} min`}
                    tooltip="Sum of READ + QUIZ + REVISE times"
                  />

                  {/* Reading Time */}
                  <InfoCard
                    icon={<AutoStoriesIcon sx={{ fontSize: "2rem" }} />}
                    label="Reading"
                    value={`${aggregated.readTime} min`}
                    tooltip="Total reading time across all subchapters"
                  />

                  {/* Quiz Time */}
                  <InfoCard
                    icon={<QuizIcon sx={{ fontSize: "2rem" }} />}
                    label="Quiz"
                    value={`${aggregated.quizTime} min`}
                    tooltip="Total quiz time for comprehension checks"
                  />

                  {/* Revise Time */}
                  <InfoCard
                    icon={<RepeatIcon sx={{ fontSize: "2rem" }} />}
                    label="Revise"
                    value={`${aggregated.reviseTime} min`}
                    tooltip="Revision or practice time"
                  />

                  {/* Unique Chapters */}
                  <InfoCard
                    icon={<BookmarkAddedIcon sx={{ fontSize: "2rem" }} />}
                    label="Unique Chapters"
                    value={aggregated.uniqueChapterCount}
                    tooltip="How many distinct chapters are in this plan"
                  />

                  {/* Unique Subchapters */}
                  <InfoCard
                    icon={<BookmarkAddedIcon sx={{ fontSize: "2rem" }} />}
                    label="Unique Subchapters"
                    value={aggregated.uniqueSubChapterCount}
                    tooltip="Distinct subchapters covered"
                  />
                </Box>

                {/* Feasibility / suggestions */}
                <Box textAlign="center" mt={3}>
                  {/* Local feasibility check (optional) */}
                  {planSummary.feasible ? (
                    <Typography sx={{ color: "green", fontWeight: "bold" }}>
                      Your plan seems feasible!
                    </Typography>
                  ) : (
                    <Typography sx={{ color: "red", fontWeight: "bold" }}>
                      Your plan may not be feasible. {planSummary.reason}
                    </Typography>
                  )}

                  <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
                    Would you like to adjust your plan further?
                  </Typography>

                  {/* Increase/Decrease Time & Depth buttons */}
                  <Box display="flex" justifyContent="center" gap={2}>
                    <Button
                      variant="contained"
                      onClick={() => handleApplySuggestion({
                        masteryLevel: "mastery",
                        dailyReadingTime: dailyReadingTime + 10,
                      })}
                    >
                      Increase Time & Depth
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => handleApplySuggestion({
                        masteryLevel: "glance",
                        dailyReadingTime: Math.max(dailyReadingTime - 10, 5),
                      })}
                    >
                      Decrease Time & Depth
                    </Button>
                  </Box>
                </Box>
              </>
            )}

            {!isCreatingPlan && !serverError && !serverPlan && (
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

  // ---------------------------------------------------------
  //  RENDER
  // ---------------------------------------------------------
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
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {renderStepContent(activeStep)}
      </DialogContent>

      <DialogActions>
        {activeStep > 0 && activeStep < steps.length && (
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={isProcessing || isCreatingPlan}
          >
            Back
          </Button>
        )}
        {activeStep < steps.length - 1 && (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={isProcessing || isCreatingPlan}
            startIcon={<CheckIcon />}
          >
            Next
          </Button>
        )}
        {activeStep === steps.length - 1 && !isProcessing && !isCreatingPlan && (
          <Button variant="contained" onClick={handleNext} startIcon={<CheckIcon />}>
            Confirm Plan
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

/**
 * A small helper component to display an icon, label, and value
 * in a "dashboard-like" card or tile format.
 */
function InfoCard({ icon, label, value, tooltip }) {
  return (
    <Paper
      elevation={3}
      sx={{
        width: 160,
        height: 120,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        p: 1,
      }}
    >
      <Tooltip title={tooltip || ""}>
        <Box textAlign="center" mb={1}>
          {icon}
        </Box>
      </Tooltip>
      <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Paper>
  );
}