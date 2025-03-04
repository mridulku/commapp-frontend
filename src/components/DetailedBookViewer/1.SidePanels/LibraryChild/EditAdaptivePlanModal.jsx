// src/components/DetailedBookViewer/EditAdaptivePlanModal.jsx

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
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
  Paper,
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
 * A multi-step wizard for creating/editing an Adaptive Plan.
 *
 * Props:
 *  - renderAsDialog (bool): If true, render inside a <Dialog>. If false, render inline.
 *  - open (bool): Whether the dialog is open (only relevant if renderAsDialog = true)
 *  - onClose (function): Callback when closing the dialog (only relevant if renderAsDialog = true)
 *  - userId (string): The user's ID (needed to create a plan)
 *  - backendURL (string): Base server URL
 *  - bookId (string): (Optional) Book ID to include
 */
export default function EditAdaptivePlanModal({
  renderAsDialog = true,
  open = false,
  onClose,
  userId = null,
  backendURL = "http://localhost:3001",
  bookId = "",
}) {
  // -------------------------------------------------
  // STEP MANAGEMENT
  // -------------------------------------------------
  const [activeStep, setActiveStep] = useState(0);
  const steps = ["Select Chapters", "Schedule & Mastery", "Review & Confirm"];

  // Keep track of a newly created plan object
  const [createdPlan, setCreatedPlan] = useState(null);

  // -------------------------------------------------
  // STEP 1: CHAPTER SELECTION
  // -------------------------------------------------
  // We fetch chapters from /api/process-book-data if both userId && bookId exist
  const [chapters, setChapters] = useState([]);

  useEffect(() => {
    async function fetchChapters() {
      try {
        const response = await axios.get(`${backendURL}/api/process-book-data`, {
          params: { userId, bookId },
        });
        const data = response.data || {};

        if (data.chapters && Array.isArray(data.chapters)) {
          // Transform returned data into the format we need
          const transformed = data.chapters.map((chap) => ({
            id: chap.id,
            title: chap.name, // from 'name' in DB
            expanded: false,
            selected: true,
            subchapters: (chap.subchapters || []).map((sub) => ({
              id: sub.id,
              title: sub.name,
              selected: true,
            })),
          }));
          setChapters(transformed);
        }
      } catch (error) {
        console.error("Error fetching chapters:", error);
      }
    }

    if (userId && bookId) {
      fetchChapters();
    }
  }, [userId, bookId, backendURL]);

  // Toggle entire chapter selection
  const handleToggleChapter = (chapterIndex) => {
    const updatedChapters = [...chapters];
    const current = updatedChapters[chapterIndex];
    current.selected = !current.selected;
    if (!current.selected) {
      current.subchapters.forEach((sc) => (sc.selected = false));
    }
    updatedChapters[chapterIndex] = current;
    setChapters(updatedChapters);
  };

  // Toggle individual subchapter selection
  const handleToggleSubchapter = (chapterIndex, subIndex) => {
    const updatedChapters = [...chapters];
    const subChaps = updatedChapters[chapterIndex].subchapters;
    subChaps[subIndex].selected = !subChaps[subIndex].selected;

    // If at least one subchapter is selected, mark the parent chapter as selected
    const anySelected = subChaps.some((sc) => sc.selected);
    updatedChapters[chapterIndex].selected = anySelected;
    setChapters(updatedChapters);
  };

  // Expand/collapse the accordion
  const handleAccordionToggle = (chapterIndex) => {
    const updatedChapters = [...chapters];
    updatedChapters[chapterIndex].expanded = !updatedChapters[chapterIndex]
      .expanded;
    setChapters(updatedChapters);
  };

  // -------------------------------------------------
  // STEP 2: FORM FIELDS
  // -------------------------------------------------
  const [targetDate, setTargetDate] = useState("");
  const [dailyReadingTime, setDailyReadingTime] = useState(30);
  const [masteryLevel, setMasteryLevel] = useState("mastery");

  // -------------------------------------------------
  // BACKEND CREATION
  // -------------------------------------------------
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [serverError, setServerError] = useState(null);

  const [createdPlanId, setCreatedPlanId] = useState(null);
  const [createdAt, setCreatedAt] = useState(null);

  /**
   * createPlanOnBackend
   * Hits the external "create" endpoint to generate an Adaptive Plan.
   */
  const createPlanOnBackend = async () => {
    if (!userId) {
      console.warn("No userId provided. Cannot create plan.");
      return;
    }
    try {
      setServerError(null);
      setIsCreatingPlan(true);

      // Decide quizTime & reviseTime based on masteryLevel
      let quizTime = 1;
      let reviseTime = 1;
      if (masteryLevel === "mastery") {
        quizTime = 5;
        reviseTime = 5;
      } else if (masteryLevel === "revision") {
        quizTime = 3;
        reviseTime = 3;
      }
      // else if masteryLevel === "glance"
      // stays at quizTime = 1, reviseTime = 1

      const requestBody = {
        userId,
        targetDate,
        dailyReadingTime,
        masteryLevel,
        quizTime,
        reviseTime,
      };
      if (bookId) {
        requestBody.bookId = bookId;
      }

      // Example endpoint for plan creation (replace if needed):
      const createEndpoint =
        "https://generateadaptiveplan-zfztjkkvva-uc.a.run.app";

      const response = await axios.post(createEndpoint, requestBody, {
        headers: { "Content-Type": "application/json" },
      });

      const newPlan = response.data?.plan;
      // Save the newly created plan in local state
      setCreatedPlan(newPlan);
      setCreatedPlanId(newPlan?.id || null);
      setCreatedAt(newPlan?.createdAt || null);
    } catch (error) {
      console.error("Plan creation failed:", error);
      setServerError(error.message || "Plan creation failed");
    } finally {
      setIsCreatingPlan(false);
    }
  };

  // -------------------------------------------------
  // STEP 3: FETCH MOST RECENT PLAN (User + Book)
  // -------------------------------------------------
  const [isFetchingPlan, setIsFetchingPlan] = useState(false);
  const [serverPlan, setServerPlan] = useState(null);
  const [aggregated, setAggregated] = useState(null);

  /**
   * fetchMostRecentPlan
   * Calls /api/adaptive-plans with userId and bookId as query params.
   * We'll get all matching plans, then pick the most recent by createdAt.
   */
  const fetchMostRecentPlan = async () => {
    if (!userId) {
      console.warn("No userId provided—can't fetch plan.");
      return;
    }
    try {
      setIsFetchingPlan(true);
      setServerError(null);
      setServerPlan(null);

      // GET /api/adaptive-plans?userId=...&bookId=...
      const res = await axios.get(`${backendURL}/api/adaptive-plans`, {
        params: {
          userId,
          bookId, // so we only get the plans for *this* user + *this* book
        },
      });

      const allPlans = res.data?.plans || [];
      if (!allPlans.length) {
        throw new Error("No plans found for this user/book combination.");
      }
      // Sort by createdAt descending
      allPlans.sort((a, b) => {
        const tA = new Date(a.createdAt).getTime();
        const tB = new Date(b.createdAt).getTime();
        return tB - tA;
      });
      const recentPlan = allPlans[0]; // The most recent plan

      setServerPlan(recentPlan);

      // Compute reading/quiz/revise totals
      const agg = computeAggregation(recentPlan);
      setAggregated(agg);
    } catch (err) {
      console.error("Error fetching plan:", err);
      setServerError(err.message || "Failed to fetch the plan.");
    } finally {
      setIsFetchingPlan(false);
    }
  };

  /**
   * Compute total times and counts from plan sessions.
   */
  function computeAggregation(plan) {
    if (!plan || !plan.sessions) return null;
    let allActivities = [];
    plan.sessions.forEach((sess) => {
      if (Array.isArray(sess.activities)) {
        allActivities.push(...sess.activities);
      }
    });

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
      uniqueChapterCount,
    };
  }

  // -------------------------------------------------
  // LOCAL FEASIBILITY CALC
  // -------------------------------------------------
  const [isProcessingLocalCalc, setIsProcessingLocalCalc] = useState(false);
  const [planSummary, setPlanSummary] = useState({
    totalMinutes: 0,
    dailyMinutes: dailyReadingTime,
    totalDays: 0,
    feasible: true,
    reason: "",
  });

  function calculatePlanLocally() {
    setIsProcessingLocalCalc(true);

    // Rough local estimate of reading times
    let timePerSubchapter = 10;
    if (masteryLevel === "revision") timePerSubchapter = 5;
    if (masteryLevel === "glance") timePerSubchapter = 2;

    let subchapterCount = 0;
    chapters.forEach((ch) => {
      ch.subchapters.forEach((sub) => {
        if (sub.selected) {
          subchapterCount += 1;
        }
      });
    });

    const totalTime = subchapterCount * timePerSubchapter;
    const daysNeeded =
      dailyReadingTime > 0 ? Math.ceil(totalTime / dailyReadingTime) : 9999;

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

    // Fake 6-second delay to mimic some local processing
    setTimeout(() => {
      setPlanSummary({
        totalMinutes: totalTime,
        dailyMinutes: dailyReadingTime,
        totalDays: daysNeeded,
        feasible,
        reason,
      });
      setIsProcessingLocalCalc(false);
    }, 6000);
  }

  function formatTimestamp(ts) {
    if (!ts) return "N/A";
    // If it's a Firestore Timestamp object with .toDate()
    if (typeof ts.toDate === "function") {
      return ts.toDate().toLocaleString();
    }
    // If it's an object with _seconds
    if (ts._seconds) {
      const millis = ts._seconds * 1000;
      return new Date(millis).toLocaleString();
    }
    // Otherwise assume it's a standard date string
    return String(ts);
  }

  // -------------------------------------------------
  // NAVIGATION
  // -------------------------------------------------
  const handleNext = async () => {
    if (activeStep === 0) {
      // Move from step 0 to 1
      setActiveStep(1);
      return;
    }
    if (activeStep === 1) {
      // (1) Calculate feasibility locally
      calculatePlanLocally();
      // (2) Create plan on backend
      await createPlanOnBackend();
      // (3) Move to step 2
      setActiveStep(2);
      // (4) Then fetch the most recent plan (User + Book)
      fetchMostRecentPlan();
      return;
    }
    if (activeStep === 2) {
      // Final confirmation => close dialog if we have one
      if (renderAsDialog && onClose) {
        onClose();
      }
    }
  };

  const handleBack = () => {
    if (activeStep === 0) {
      // If it's a dialog, close on back from step 0
      if (renderAsDialog && onClose) {
        onClose();
      }
    } else {
      setActiveStep(activeStep - 1);
    }
  };

  // -------------------------------------------------
  // STEP CONTENT RENDER
  // -------------------------------------------------
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return step0SelectChapters();
      case 1:
        return step1ScheduleMastery();
      case 2:
        return step2ReviewConfirm();
      default:
        return <Typography sx={{ color: "#fff" }}>Unknown step</Typography>;
    }
  };

  // Step 0: CHAPTER SELECTION
  function step0SelectChapters() {
    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold", color: "#fff" }}>
          Select Chapters/Subchapters:
        </Typography>
        {chapters.length === 0 && (
          <Typography variant="body2" sx={{ color: "#ccc" }}>
            No chapters found or not yet loaded.
          </Typography>
        )}
        {chapters.map((ch, idx) => (
          <Accordion
            key={ch.id}
            expanded={ch.expanded}
            onChange={() => handleAccordionToggle(idx)}
            sx={{
              marginBottom: 1,
              backgroundColor: "#262626",
              color: "#fff",
            }}
          >
            <AccordionSummary
              expandIcon={
                <ExpandMoreIcon sx={{ color: "#fff", fontSize: "1.5rem" }} />
              }
            >
              <FormControlLabel
                sx={{ color: "#fff" }}
                control={
                  <Checkbox
                    checked={ch.selected}
                    onChange={() => handleToggleChapter(idx)}
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      color: "#B39DDB",
                      "&.Mui-checked": { color: "#B39DDB" },
                    }}
                  />
                }
                label={
                  <Typography sx={{ fontWeight: "bold", color: "#fff" }}>
                    {ch.title}
                  </Typography>
                }
              />
            </AccordionSummary>
            <AccordionDetails
              sx={{ backgroundColor: "#1f1f1f", color: "#fff" }}
            >
              {ch.subchapters.map((sub, sidx) => (
                <FormControlLabel
                  key={sub.id}
                  control={
                    <Checkbox
                      checked={sub.selected}
                      onChange={() => handleToggleSubchapter(idx, sidx)}
                      sx={{
                        color: "#B39DDB",
                        "&.Mui-checked": { color: "#B39DDB" },
                      }}
                    />
                  }
                  label={sub.title}
                  sx={{ display: "block", marginLeft: 3, color: "#fff" }}
                />
              ))}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  }

  // Step 1: TARGET DATE, DAILY READING, MASTERY
  function step1ScheduleMastery() {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: "bold", color: "#fff" }}
            >
              <CalendarMonthIcon
                sx={{ fontSize: "1rem", verticalAlign: "middle", color: "#B39DDB" }}
              />{" "}
              Target Date
            </Typography>
            <Tooltip title="We use this to see if you can finish in time.">
              <IconButton size="small" sx={{ color: "#B39DDB" }}>
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
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "#fff",
                backgroundColor: "#333",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#B39DDB",
              },
              "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#D1C4E9",
              },
            }}
            InputLabelProps={{
              style: { color: "#fff" },
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: "bold", color: "#fff" }}
            >
              <AccessTimeIcon
                sx={{ fontSize: "1rem", verticalAlign: "middle", color: "#B39DDB" }}
              />{" "}
              Daily Reading (min)
            </Typography>
            <Tooltip title="Minutes per day you can dedicate">
              <IconButton size="small" sx={{ color: "#B39DDB" }}>
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
            sx={{
              "& .MuiOutlinedInput-root": {
                color: "#fff",
                backgroundColor: "#333",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#B39DDB",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#D1C4E9",
              },
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: "bold", color: "#fff" }}
            >
              <AssignmentTurnedInIcon
                sx={{ fontSize: "1rem", verticalAlign: "middle", color: "#B39DDB" }}
              />{" "}
              Mastery Level
            </Typography>
            <Tooltip
              title={
                <Box sx={{ color: "#fff" }}>
                  <strong>Mastery:</strong> Deep understanding
                  <br />
                  <strong>Revision:</strong> Quick review
                  <br />
                  <strong>Glance:</strong> Minimal detail
                </Box>
              }
            >
              <IconButton size="small" sx={{ color: "#B39DDB" }}>
                <InfoIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </Box>
          <FormControl sx={{ mt: 1 }}>
            <FormLabel sx={{ color: "#fff" }}>Choose Level</FormLabel>
            <RadioGroup
              row
              value={masteryLevel}
              onChange={(e) => setMasteryLevel(e.target.value)}
            >
              {["mastery", "revision", "glance"].map((val) => (
                <FormControlLabel
                  key={val}
                  value={val}
                  control={
                    <Radio
                      sx={{
                        color: "#B39DDB",
                        "&.Mui-checked": { color: "#B39DDB" },
                      }}
                    />
                  }
                  label={val.charAt(0).toUpperCase() + val.slice(1)}
                  sx={{ color: "#fff" }}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Grid>
      </Grid>
    );
  }

  // Step 2: REVIEW & CONFIRM
  function step2ReviewConfirm() {
    return (
      <Box sx={{ color: "#fff" }}>
        {(isCreatingPlan || isFetchingPlan) && (
          <Box textAlign="center" mb={2}>
            <CircularProgress sx={{ color: "#B39DDB" }} />
            <Typography variant="body2" sx={{ mt: 1, color: "#fff" }}>
              {isCreatingPlan
                ? "Creating plan on backend..."
                : "Fetching plan from server..."}
            </Typography>
          </Box>
        )}

        {serverError && (
          <Typography variant="body1" sx={{ color: "#f44336" }}>
            {serverError}
          </Typography>
        )}

        {serverPlan && aggregated && !isFetchingPlan && !isCreatingPlan && (
          <>
            <Typography
              variant="h5"
              sx={{ fontWeight: "bold", textAlign: "center", color: "#fff" }}
            >
              Your Plan is Ready!
            </Typography>

            <Typography
              variant="body2"
              sx={{ textAlign: "center", fontStyle: "italic", color: "#ccc" }}
            >
              Plan ID: {serverPlan.id}
            </Typography>

            <Box
              display="flex"
              flexWrap="wrap"
              justifyContent="center"
              gap={2}
              mt={2}
            >
              <InfoCard
                icon={<CalendarMonthIcon sx={{ fontSize: "2rem" }} />}
                label="Target Date"
                value={serverPlan.targetDate || "N/A"}
              />
              <InfoCard
                icon={<AssignmentTurnedInIcon sx={{ fontSize: "2rem" }} />}
                label="Mastery Level"
                value={serverPlan.level || "N/A"}
              />
              <InfoCard
                icon={<BookmarkAddedIcon sx={{ fontSize: "2rem" }} />}
                label="Unique Chapters"
                value={aggregated.uniqueChapterCount}
              />
              <InfoCard
                icon={<BookmarkAddedIcon sx={{ fontSize: "2rem" }} />}
                label="Unique SubChapters"
                value={aggregated.uniqueSubChapterCount}
              />
              <InfoCard
                icon={<AccessTimeIcon sx={{ fontSize: "2rem" }} />}
                label="Total Plan Time"
                value={`${aggregated.totalPlanTime} min`}
              />
              <InfoCard
                icon={<AutoStoriesIcon sx={{ fontSize: "2rem" }} />}
                label="Reading"
                value={`${aggregated.readTime} min`}
              />
              <InfoCard
                icon={<QuizIcon sx={{ fontSize: "2rem" }} />}
                label="Quiz"
                value={`${aggregated.quizTime} min`}
              />
              <InfoCard
                icon={<RepeatIcon sx={{ fontSize: "2rem" }} />}
                label="Revise"
                value={`${aggregated.reviseTime} min`}
              />
              <InfoCard
                icon={<InfoIcon sx={{ fontSize: "2rem" }} />}
                label="Created At"
                value={formatTimestamp(serverPlan.createdAt)}
              />
            </Box>

            <Box textAlign="center" mt={3}>
              {planSummary.feasible ? (
                <Typography sx={{ color: "#4caf50", fontWeight: "bold" }}>
                  Your plan seems feasible!
                </Typography>
              ) : (
                <Typography sx={{ color: "#f44336", fontWeight: "bold" }}>
                  This plan may not be feasible. {planSummary.reason}
                </Typography>
              )}
            </Box>
          </>
        )}

        {!isCreatingPlan && !isFetchingPlan && !serverError && !serverPlan && (
          <Typography variant="body2" fontStyle="italic" sx={{ color: "#ccc" }}>
            No plan data available.
          </Typography>
        )}
      </Box>
    );
  }

  // InfoCard sub-component for step2ReviewConfirm
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
          backgroundColor: "#2e2e2e",
          color: "#fff",
        }}
      >
        <Box textAlign="center" mb={1} sx={{ color: "#B39DDB" }}>
          {icon}
        </Box>
        <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
          {label}
        </Typography>
        <Typography variant="body1">{value}</Typography>
      </Paper>
    );
  }

  // -------------------------------------------------
  // MAIN RENDER
  // -------------------------------------------------
  const content = (
    <Box
      sx={
        renderAsDialog
          ? {}
          : {
              // If rendering inline, apply a dark background area
              p: 2,
              backgroundColor: "#1f1f1f",
              borderRadius: 1,
              marginY: 2,
              color: "#fff",
            }
      }
    >
      <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2, color: "#fff" }}>
        Adaptive Plan Setup
      </Typography>

      <Stepper
        activeStep={activeStep}
        sx={{
          mb: 3,
          "& .MuiStepLabel-label": { color: "#fff" },
          "& .MuiSvgIcon-root": { color: "#B39DDB" },
          "& .MuiStepIcon-text": { fill: "#fff" },
          "& .MuiStepIcon-root.Mui-completed": { color: "#B39DDB" },
        }}
      >
        {steps.map((label, idx) => (
          <Step key={idx}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {renderStepContent(activeStep)}

      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
        <Button
          variant="outlined"
          onClick={handleBack}
          disabled={isProcessingLocalCalc || isCreatingPlan || isFetchingPlan}
          sx={{
            borderColor: "#B39DDB",
            color: "#fff",
            "&:hover": {
              borderColor: "#D1C4E9",
            },
          }}
        >
          Back
        </Button>

        {activeStep < steps.length - 1 && (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={isProcessingLocalCalc || isCreatingPlan || isFetchingPlan}
            startIcon={<CheckIcon />}
            sx={{
              backgroundColor: "#B39DDB",
              "&:hover": { backgroundColor: "#D1C4E9" },
              color: "#fff",
            }}
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
              sx={{
                backgroundColor: "#B39DDB",
                "&:hover": { backgroundColor: "#D1C4E9" },
                color: "#fff",
              }}
            >
              Confirm Plan
            </Button>
          )}
      </Box>
    </Box>
  );

  if (renderAsDialog) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        // KEY: This ensures we have one scrollable area for the entire modal
        scroll="paper"
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            backgroundColor: "#1f1f1f",
            color: "#fff",
          },
        }}
      >
        <DialogTitle sx={{ backgroundColor: "#1f1f1f", color: "#fff" }}>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            Adaptive Plan Setup
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: "#1f1f1f", color: "#fff" }}>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  // Otherwise, render inline (no MUI dialog)
  return <>{content}</>;
}