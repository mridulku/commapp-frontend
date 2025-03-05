// src/components/HIDDIT/EditAdaptivePlanModal.jsx

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
  Paper,
  DialogActions,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import axios from "axios";
import _ from "lodash";

// CHILD COMPONENTS (Wizard steps)
import ChapterSelection from "./ChapterSelection";
import PlanSelection from "./PlanSelection";
import PlanRender from "./PlanRender";

// REPLACE: (Remove) => import AdaptivePlayerModal from "../../3.AdaptiveModal/AdaptivePlayerModal";
// NEW IMPORT: your Redux-based plan fetcher
import PlanFetcher from "../../PlanFetcher";

/**
 * EditAdaptivePlanModal
 *
 * A multi-step wizard that:
 *  1) Selects chapters
 *  2) Picks schedule (target date, daily reading, mastery level)
 *  3) Shows final plan summary
 *  4) On confirm => automatically opens the (NEW) Plan Fetcher in a modal
 *
 * Props:
 *  - renderAsDialog (bool)
 *  - open (bool)
 *  - onClose (func)
 *  - userId (string)
 *  - backendURL (string)
 *  - bookId (string)
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
  // STEPS
  // -------------------------------------------------
  const [activeStep, setActiveStep] = useState(0);
  const steps = ["Select Chapters", "Schedule & Mastery", "Review & Confirm"];

  // Step 1: Chapter selection
  const [chapters, setChapters] = useState([]);
  useEffect(() => {
    async function fetchChapters() {
      try {
        const res = await axios.get(`${backendURL}/api/process-book-data`, {
          params: { userId, bookId },
        });
        const data = res.data || {};
        if (data.chapters && Array.isArray(data.chapters)) {
          // Transform
          const transformed = data.chapters.map((chap) => ({
            id: chap.id,
            title: chap.name,
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

  const handleToggleChapter = (chapterIndex) => {
    const updated = [...chapters];
    const c = updated[chapterIndex];
    c.selected = !c.selected;
    if (!c.selected) {
      c.subchapters.forEach((sc) => (sc.selected = false));
    }
    updated[chapterIndex] = c;
    setChapters(updated);
  };

  const handleToggleSubchapter = (chapterIndex, subIndex) => {
    const updated = [...chapters];
    const subChaps = updated[chapterIndex].subchapters;
    subChaps[subIndex].selected = !subChaps[subIndex].selected;
    updated[chapterIndex].selected = subChaps.some((sc) => sc.selected);
    setChapters(updated);
  };

  const handleAccordionToggle = (chapterIndex) => {
    const updated = [...chapters];
    updated[chapterIndex].expanded = !updated[chapterIndex].expanded;
    setChapters(updated);
  };

  // Step 2: Plan selection
  const [targetDate, setTargetDate] = useState("");
  const [dailyReadingTime, setDailyReadingTime] = useState(30);
  const [masteryLevel, setMasteryLevel] = useState("mastery");

  // For plan creation
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [createdPlan, setCreatedPlan] = useState(null);
  const [createdPlanId, setCreatedPlanId] = useState(null);
  const [createdAt, setCreatedAt] = useState(null);

  async function createPlanOnBackend() {
    if (!userId) {
      console.warn("No userId provided—cannot create plan.");
      return;
    }
    try {
      setServerError(null);
      setIsCreatingPlan(true);

      let quizTime = 1;
      let reviseTime = 1;
      if (masteryLevel === "mastery") {
        quizTime = 5;
        reviseTime = 5;
      } else if (masteryLevel === "revision") {
        quizTime = 3;
        reviseTime = 3;
      }

      const body = {
        userId,
        targetDate,
        dailyReadingTime,
        masteryLevel,
        quizTime,
        reviseTime,
      };
      if (bookId) {
        body.bookId = bookId;
      }

      // Example:
      const createEndpoint =
        "https://generateadaptiveplan-zfztjkkvva-uc.a.run.app";

      const response = await axios.post(createEndpoint, body, {
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
  }

  // Step 3: Fetch newly created or most recent plan
  const [isFetchingPlan, setIsFetchingPlan] = useState(false);
  const [serverPlan, setServerPlan] = useState(null);
  const [aggregated, setAggregated] = useState(null);

  async function fetchMostRecentPlan() {
    if (!userId) {
      console.warn("No userId => can't fetch plan.");
      return;
    }
    try {
      setIsFetchingPlan(true);
      setServerError(null);
      setServerPlan(null);

      const res = await axios.get(`${backendURL}/api/adaptive-plans`, {
        params: { userId, bookId },
      });
      const allPlans = res.data?.plans || [];
      if (!allPlans.length) {
        throw new Error("No plans found for user/book combination.");
      }
      // sort by createdAt desc
      allPlans.sort((a, b) => {
        const tA = new Date(a.createdAt).getTime();
        const tB = new Date(b.createdAt).getTime();
        return tB - tA;
      });
      const recentPlan = allPlans[0];
      setServerPlan(recentPlan);

      const agg = computeAggregation(recentPlan);
      setAggregated(agg);
    } catch (err) {
      console.error("Error fetching plan:", err);
      setServerError(err.message || "Failed to fetch plan.");
    } finally {
      setIsFetchingPlan(false);
    }
  }

  function computeAggregation(plan) {
    if (!plan || !plan.sessions) return null;
    let allActs = [];
    plan.sessions.forEach((sess) => {
      if (Array.isArray(sess.activities)) {
        allActs.push(...sess.activities);
      }
    });
    const totalReadCount = allActs.filter((a) => a.type === "READ").length;
    const totalQuizCount = allActs.filter((a) => a.type === "QUIZ").length;
    const totalReviseCount = allActs.filter((a) => a.type === "REVISE").length;

    const readTime = _.sumBy(
      allActs.filter((a) => a.type === "READ"),
      "timeNeeded"
    );
    const quizTime = _.sumBy(
      allActs.filter((a) => a.type === "QUIZ"),
      "timeNeeded"
    );
    const reviseTime = _.sumBy(
      allActs.filter((a) => a.type === "REVISE"),
      "timeNeeded"
    );

    const uniqueSubChapterCount = _.uniqBy(allActs, "subChapterId").length;
    const uniqueChapterCount = _.uniqBy(allActs, "chapterId").length;
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

  // Local feasibility (rough calc)
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

    // simulate some delay
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
  // (OLD) ADAPTIVE PLAYER MODAL STATE - remove it?
  // -------------------------------------------------
  const [showPlayer, setShowPlayer] = useState(false);
  const [playerPlanId, setPlayerPlanId] = useState(null);

  // We'll use a new MUI dialog for the PlanFetcher instead
  const [showReduxPlanDialog, setShowReduxPlanDialog] = useState(false);

  // -------------------------------------------------
  // NAVIGATION
  // -------------------------------------------------
  const handleNext = async () => {
    if (activeStep === 0) {
      setActiveStep(1);
      return;
    }
    if (activeStep === 1) {
      calculatePlanLocally();
      await createPlanOnBackend();
      setActiveStep(2);
      fetchMostRecentPlan();
      return;
    }
    if (activeStep === 2) {
      // final step => close wizard if dialog
      if (renderAsDialog && onClose) {
        onClose();
      }
      // Then open the "player" => now it's the new PlanFetcher in a separate dialog
      if (serverPlan && serverPlan.id) {
        setPlayerPlanId(serverPlan.id);
        setShowReduxPlanDialog(true);
      }
    }
  };

  const handleBack = () => {
    if (activeStep === 0) {
      if (renderAsDialog && onClose) {
        onClose();
      }
    } else {
      setActiveStep(activeStep - 1);
    }
  };

  function renderStepContent(step) {
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
  }

  const content = (
    <Box
      sx={
        renderAsDialog
          ? {}
          : {
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

  return (
    <>
      {renderAsDialog ? (
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
      ) : (
        <Box>{content}</Box>
      )}

      {/* Instead of old <AdaptivePlayerModal> usage, we have a new dialog for PlanFetcher */}
      <Dialog
        open={showReduxPlanDialog}
        onClose={() => setShowReduxPlanDialog(false)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>Plan Viewer</DialogTitle>
        <DialogContent>
          {playerPlanId ? (
            <PlanFetcher
              planId={playerPlanId}
              // If needed, pass userId or other props
            />
          ) : (
            <Typography>No planId found. Cannot load plan.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowReduxPlanDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}