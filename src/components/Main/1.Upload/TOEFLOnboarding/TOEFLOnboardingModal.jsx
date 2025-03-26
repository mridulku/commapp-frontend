import React, { useState, useEffect } from "react";
import axios from "axios";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../firebase";

// We’ll use some Material UI for visuals
import {
  Container,
  Paper,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Slider,
  Button,
  Box,
  Divider,
  LinearProgress,
} from "@mui/material";

// Import the Carousel for step 0
import TOEFLOnboardingCarousel from "./TOEFLOnboardingCarousel";

/**
 * TOEFLOnboardingModal
 *
 * Steps:
 *   0) TOEFLOnboardingCarousel (fullscreen overlay)
 *   1) Collect basic plan info (How soon is exam? Daily study minutes?)
 *   2) Processing screen while we create 4 adaptive plans => show "done" screen
 */
export default function TOEFLOnboardingModal({ open, onClose, userId }) {
  const [currentStep, setCurrentStep] = useState(0);

  // ------------------------------
  // FIRESTORE: fetch user data / book IDs
  // ------------------------------
  const [toeflBooks, setToeflBooks] = useState([]); // e.g. { oldBookId, newBookId }
  useEffect(() => {
    async function fetchUserDoc() {
      if (!userId) return;
      try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (Array.isArray(userData.clonedToeflBooks)) {
            setToeflBooks(userData.clonedToeflBooks);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user doc:", err);
      }
    }
    fetchUserDoc();
  }, [userId]);

  // ------------------------------
  // STEP DATA
  // ------------------------------

  // For "Step 1" (Exam Timeframe & Daily Study):
  // We’ll store them in state so we can pass them to the plan creation.
  const [examTimeframe, setExamTimeframe] = useState("1_month");
  const [dailyReadingTime, setdailyReadingTime] = useState(30);

  // We'll compute the target date from timeframe once user finishes Step 1
  const [targetDate, setTargetDate] = useState("");

  // We’ll hard-code these for the plan creation request:
  const currentKnowledge = "none"; // or "some", etc.
  const goalLevel = "advanced"; // or "basic", "moderate", etc.

  // For plan creation status (Step 2)
  const [isCreatingPlans, setIsCreatingPlans] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [planCreationResults, setPlanCreationResults] = useState([]);
  const [isDone, setIsDone] = useState(false); // once plan creation finishes
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [isTakingLong, setIsTakingLong] = useState(false);

  // Step labels - we only have 3 steps in this version
  const steps = ["Intro Slides", "Plan Info", "Processing"];

  // Map from oldBookId to skill name
  const skillMap = {
    "NwNZ8WWCz54Y4BeCli0c": "Reading",
    "fuyAbhDo3GXLbtEdZ9jj": "Listening",
    "5UWQEvQet8GgkZmjEwAO": "Speaking",
    "pFAfUSWtwipFZG2RStKg": "Writing",
  };

  // Example endpoint
  const planCreationEndpoint = "https://generateadaptiveplan2-zfztjkkvva-uc.a.run.app";

  // ------------------------------
  // STEP NAV
  // ------------------------------
  const handleNext = async () => {
    // Step 1 => Step 2: we compute the date, start the processing screen
    if (currentStep === 1) {
      computeTargetDate();
      setCurrentStep(2); // Move to "Processing" step
      // We'll trigger the plan creation once we mount Step 2
      return;
    }
    // Step 2 => finish (mark onboarded, close)
    if (currentStep === 2) {
      await markUserOnboarded();
      if (onClose) onClose();
      return;
    }

    // Step 0 => Step 1
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    // If we’re at Step 1, going back => Step 0
    if (currentStep === 1) {
      setCurrentStep(0);
      return;
    }
    // If we’re at Step 2, you can decide if you want to allow going back or not.
    // Here, let's just do it for demonstration:
    if (currentStep === 2) {
      setCurrentStep(1);
      return;
    }
    // If we’re at Step 0, close
    if (onClose) onClose();
  };

  // ------------------------------
  // Step 1 logic: compute the date from timeframe
  // ------------------------------
  const TIMEFRAME_OFFSETS = {
    "1_week": 7,
    "2_weeks": 14,
    "1_month": 30,
    "2_months": 60,
    "6_months": 180,
    "not_sure": 60, // default to e.g. 2 months
  };
  function computeTargetDate() {
    const offset = TIMEFRAME_OFFSETS[examTimeframe] || 30;
    const date = new Date();
    date.setDate(date.getDate() + offset);
    // Store in "yyyy-mm-dd" so we can pass to backend easily
    const iso = date.toISOString().substring(0, 10);
    setTargetDate(iso);
  }

  // ------------------------------
  // Step 2: The Plan Creation + Animated Progress
  // ------------------------------
  // Rotating messages
  const LOADING_MESSAGES = [
    "Analyzing your data...",
    "Generating your reading plan...",
    "Creating listening modules...",
    "Finalizing writing tasks...",
    "Reviewing everything...",
  ];

  // Start plan creation once we enter Step 2
  useEffect(() => {
    if (currentStep === 2) {
      // Start the progress animation
      startProgressAnimation();

      // Immediately call createFourPlans
      createFourPlans();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  function startProgressAnimation() {
    setProgress(0);
    setIsDone(false);
    setIsTakingLong(false);

    // Increments 5% every second => total ~20s to 100%
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const nextVal = prev + 5;
        if (nextVal >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return nextVal;
      });
    }, 1000);

    // Rotate messages every 3 seconds
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }

  // Whenever progress hits 100%, if we’re not done => isTakingLong
  useEffect(() => {
    if (progress === 100 && !isDone && currentStep === 2) {
      setIsTakingLong(true);
    }
  }, [progress, isDone, currentStep]);

  async function createFourPlans() {
    setIsCreatingPlans(true);
    setServerError(null);
    setPlanCreationResults([]);

    try {
      // Hard-coded knowledge + goal => "none-advanced"
      // Adjust quizTime / reviseTime if you want different logic
      const planType = `${currentKnowledge}-${goalLevel}`;
      const quizTime = 3;
      const reviseTime = 3;

      const baseBody = {
        userId,
        targetDate,
        dailyReadingTime,
        planType,
        quizTime,
        reviseTime,
      };

      // Post plan creation for each TOEFL book
      const promises = toeflBooks.map(async (bookObj) => {
        const skillName = skillMap[bookObj.oldBookId] || "TOEFL Course";
        const response = await axios.post(planCreationEndpoint, {
          ...baseBody,
          bookId: bookObj.newBookId,
        });
        return {
          skill: skillName,
          planId: response.data.planId,
          planDoc: response.data.planDoc,
        };
      });

      const results = await Promise.all(promises);
      setPlanCreationResults(results);
      console.log("Plan creation succeeded, results:", results);

      // Mark that we’re done
      setIsDone(true);
    } catch (err) {
      console.error("Error creating TOEFL plans:", err);
      setServerError(err.message || "Failed to create TOEFL plans.");
    } finally {
      setIsCreatingPlans(false);
    }
  }

  // ------------------------------
  // Mark User Onboarded
  // ------------------------------
  const [isMarkingOnboarded, setIsMarkingOnboarded] = useState(false);
  async function markUserOnboarded() {
    if (!userId) return;
    try {
      setIsMarkingOnboarded(true);
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/learner-personas/onboard`,
        { userId }
      );
      console.log("User marked as onboarded (TOEFL):", userId);
    } catch (err) {
      console.error("Error marking user onboarded:", err);
      alert("Failed to mark you onboarded. Check console/logs.");
    } finally {
      setIsMarkingOnboarded(false);
    }
  }

  // ------------------------------
  // RENDER
  // ------------------------------
  if (!open) return null;

  // Step 0 => Fullscreen Carousel
  if (currentStep === 0) {
    return (
      <div style={styles.carouselOverlay}>
        <button style={styles.carouselCloseButton} onClick={onClose}>
          X
        </button>
        <TOEFLOnboardingCarousel
          onFinish={() => setCurrentStep(1)} // Move to Step 1
        />
      </div>
    );
  }

  // If we’re not on step 0 => show the "modal" container
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button onClick={onClose} style={styles.closeButton}>
          X
        </button>

        <p style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>
          Step {currentStep} of {steps.length}: {steps[currentStep]}
        </p>

        {renderStepContent()}
        {renderButtons()}
      </div>
    </div>
  );

  // ------------------------------
  // Step-specific UI
  // ------------------------------
  function renderStepContent() {
    if (currentStep === 1) {
      return renderPlanInfoForm();
    }
    if (currentStep === 2) {
      return renderProcessingScreen();
    }
    return null;
  }

  // Step 1 UI
  function renderPlanInfoForm() {
    return (
      <div style={styles.innerContent}>
        <h2 style={{ marginBottom: "1rem", color: "#fff" }}>Configure Your TOEFL Plan</h2>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            backgroundColor: "rgba(255,255,255,0.1)",
            padding: "1rem",
            borderRadius: "8px",
          }}
        >
          {/* EXAM TIMEFRAME */}
          <div>
            <p style={{ color: "#fff", margin: "0 0 4px" }}>
              How soon do you plan to take your TOEFL exam?
            </p>
            <RadioGroup
              name="exam-timeframe"
              value={examTimeframe}
              onChange={(e) => setExamTimeframe(e.target.value)}
            >
              <FormControlLabel
                value="1_week"
                control={<Radio sx={{ color: "#fff" }} />}
                label="In 1 Week"
                sx={{ color: "#fff" }}
              />
              <FormControlLabel
                value="2_weeks"
                control={<Radio sx={{ color: "#fff" }} />}
                label="In 2 Weeks"
                sx={{ color: "#fff" }}
              />
              <FormControlLabel
                value="1_month"
                control={<Radio sx={{ color: "#fff" }} />}
                label="In 1 Month"
                sx={{ color: "#fff" }}
              />
              <FormControlLabel
                value="2_months"
                control={<Radio sx={{ color: "#fff" }} />}
                label="In 2 Months"
                sx={{ color: "#fff" }}
              />
              <FormControlLabel
                value="6_months"
                control={<Radio sx={{ color: "#fff" }} />}
                label="In 6 Months"
                sx={{ color: "#fff" }}
              />
              <FormControlLabel
                value="not_sure"
                control={<Radio sx={{ color: "#fff" }} />}
                label="Not sure yet"
                sx={{ color: "#fff" }}
              />
            </RadioGroup>
          </div>

          <Divider style={{ backgroundColor: "#bbb" }} />

          {/* DAILY STUDY TIME */}
          <div>
            <p style={{ color: "#fff", margin: "0 0 4px" }}>
              How many minutes do you plan to study each day?
            </p>
            <Slider
              value={dailyReadingTime}
              onChange={(e, val) => setdailyReadingTime(val)}
              step={5}
              min={5}
              max={120}
              valueLabelDisplay="auto"
              sx={{ color: "#fff" }}
            />
            <p style={{ color: "#ccc" }}>{dailyReadingTime} minutes/day</p>
          </div>
        </div>
      </div>
    );
  }

  // Step 2 UI
  function renderProcessingScreen() {
    // If we have an error
    if (serverError) {
      return (
        <div style={styles.innerContent}>
          <h2 style={{ color: "#fff" }}>Oops!</h2>
          <p style={{ color: "red" }}>{serverError}</p>
          <p style={{ color: "#ccc" }}>Please try again later.</p>
        </div>
      );
    }

    // If plan creation is still in progress OR we haven't recognized it as done
    if (!isDone) {
      return (
        <div style={styles.innerContent}>
          {/* If progress <100 and not taking too long => normal */}
          {!isTakingLong && (
            <>
              <h2 style={{ color: "#fff", marginBottom: "1rem" }}>
                Preparing Your TOEFL Plan
              </h2>
              <p style={{ color: "#ccc", marginBottom: "1.5rem" }}>
                Please hold on while we build your personalized plan.
              </p>

              <Box sx={{ width: "100%", marginBottom: 2 }}>
                <LinearProgress variant="determinate" value={progress} />
              </Box>
              <p style={{ color: "#ccc", marginBottom: "1.5rem" }}>
                {progress}% Complete
              </p>

              {/* Rotating message */}
              <p style={{ color: "#ccc" }}>
                {LOADING_MESSAGES[messageIndex]}
              </p>
            </>
          )}

          {/* If we’re at 100% but not done => taking longer */}
          {isTakingLong && (
            <>
              <h2 style={{ color: "#fff", marginBottom: "1rem" }}>Still Working...</h2>
              <p style={{ color: "#ccc", marginBottom: "1.5rem" }}>
                It’s taking a bit longer than usual. We’re still preparing your plan.
              </p>
              <Box sx={{ width: "100%", marginBottom: 2 }}>
                <LinearProgress variant="indeterminate" />
              </Box>
              <p style={{ color: "#ccc" }}>Please don’t close this page yet.</p>
            </>
          )}
        </div>
      );
    }

    // If done => show success
    return (
      <div style={styles.innerContent}>
        <h2 style={{ color: "#fff" }}>Your Plan is Ready!</h2>
        <p style={{ color: "#ccc", marginBottom: "1rem" }}>
          We’ve finished creating your TOEFL study plan. Click “Finish” to finalize.
        </p>
        {/* We won't display planCreationResults to the user here,
            but we can log to console or do so in your real UI */}
      </div>
    );
  }

  // ------------------------------
  // Bottom button row
  // ------------------------------
  function renderButtons() {
    // On step 2 => if the plan creation is done (isDone = true), the button is “Finish.”
    // On step 2 => if not done, maybe the button is disabled or says "Working..."
    return (
      <div
        style={{
          marginTop: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        {/* BACK BUTTON */}
        {currentStep > 0 && (
          <button
            onClick={handleBack}
            style={styles.secondaryButton}
            disabled={isCreatingPlans || isMarkingOnboarded}
          >
            Back
          </button>
        )}

        {/* NEXT / FINISH BUTTON */}
        <button
          onClick={handleNext}
          style={styles.primaryButton}
          disabled={isCreatingPlans || isMarkingOnboarded}
        >
          {renderNextButtonLabel()}
        </button>
      </div>
    );
  }

  function renderNextButtonLabel() {
    if (currentStep === 2) {
      // If we’re at Step 2, is the plan done?
      if (!isDone) {
        return "Preparing...";
      }
      if (isMarkingOnboarded) {
        return "Marking Onboarded...";
      }
      return "Finish";
    }
    // If Step 1 => "Next"
    return "Next";
  }
}

// ------------------------------
// STYLES
// ------------------------------
const styles = {
  carouselOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  carouselCloseButton: {
    position: "absolute",
    top: 10,
    right: 10,
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: "18px",
    cursor: "pointer",
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: "20px",
    borderRadius: "8px",
    width: "80vw",
    maxWidth: "600px",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    background: "none",
    border: "none",
    color: "#fff",
    fontSize: "16px",
    cursor: "pointer",
  },
  innerContent: {
    marginTop: "1rem",
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: "#9b59b6",
    border: "none",
    color: "#fff",
    padding: "0.5rem 1.25rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "bold",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    border: "2px solid #9b59b6",
    color: "#fff",
    padding: "0.5rem 1.25rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "bold",
  },
};