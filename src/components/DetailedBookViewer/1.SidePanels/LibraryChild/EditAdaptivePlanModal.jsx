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
  CircularProgress,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";

import axios from "axios";
import _ from "lodash";

// Import the three child components
import ChapterSelection from "./ChapterSelection";
import PlanSelection from "./PlanSelection";
import PlanRender from "./PlanRender";

/**
 * EditAdaptivePlanModal (Parent)
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
  // STEP 1: CHAPTER SELECTION (state in parent, UI in child)
  // -------------------------------------------------
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
  // STEP 2: PLAN SELECTION (Target date, daily reading, mastery)
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
      // else if "glance": stays at (1,1)

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
  // STEP 3: FETCH MOST RECENT PLAN
  // -------------------------------------------------
  const [isFetchingPlan, setIsFetchingPlan] = useState(false);
  const [serverPlan, setServerPlan] = useState(null);
  const [aggregated, setAggregated] = useState(null);

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
          bookId,
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
      const recentPlan = allPlans[0];
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
    const totalReviseCount = allActivities.filter((a) => a.type === "REVISE")
      .length;

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
      // 1) Calculate feasibility locally
      calculatePlanLocally();
      // 2) Create plan on backend
      await createPlanOnBackend();
      // 3) Move to step 2
      setActiveStep(2);
      // 4) Then fetch the most recent plan
      fetchMostRecentPlan();
      return;
    }
    if (activeStep === 2) {
      // Final step => if dialog, close it
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
  // RENDER STEP CONTENT
  // -------------------------------------------------
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <ChapterSelection
            chapters={chapters}
            onToggleChapter={handleToggleChapter}
            onToggleSubchapter={handleToggleSubchapter}
            onAccordionToggle={handleAccordionToggle}
          />
        );
      case 1:
        return (
          <PlanSelection
            targetDate={targetDate}
            setTargetDate={setTargetDate}
            dailyReadingTime={dailyReadingTime}
            setDailyReadingTime={setDailyReadingTime}
            masteryLevel={masteryLevel}
            setMasteryLevel={setMasteryLevel}
          />
        );
      case 2:
        return (
          <PlanRender
            isCreatingPlan={isCreatingPlan}
            isFetchingPlan={isFetchingPlan}
            serverError={serverError}
            serverPlan={serverPlan}
            aggregated={aggregated}
            planSummary={planSummary}
          />
        );
      default:
        return <Typography sx={{ color: "#fff" }}>Unknown step</Typography>;
    }
  };

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
          disabled={isCreatingPlan || isFetchingPlan || isProcessingLocalCalc}
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

        {/* Next or Confirm button */}
        {activeStep < steps.length - 1 && (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={isCreatingPlan || isFetchingPlan || isProcessingLocalCalc}
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
          !isCreatingPlan &&
          !isFetchingPlan &&
          !isProcessingLocalCalc && (
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