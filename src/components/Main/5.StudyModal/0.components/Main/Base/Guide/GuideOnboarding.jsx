import React, { useState, useEffect } from "react";
import axios from "axios";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../../../../firebase";
import { useSelector, useDispatch } from "react-redux";
// Adjust the import path to your actual planSlice or wherever setCurrentIndex is exported from
import { setCurrentIndex } from "../../../../../../../store/planSlice";

import {
  RadioGroup,
  FormControlLabel,
  Radio,
  Slider,
  Divider,
} from "@mui/material";

export default function GuideOnboarding({ userId }) {
  // ----------------------
  // Redux
  // ----------------------
  const dispatch = useDispatch();
  // If your store shape is different, adjust here. This is just an example:
  const currentIndex = useSelector((state) => state.plan?.currentIndex ?? 0);

  // We have 2 steps: 0 => Form, 1 => Success
  const [currentStep, setCurrentStep] = useState(0);

  // Books
  const [toeflBooks, setToeflBooks] = useState([]);
  useEffect(() => {
    if (!userId) return;
    async function fetchUserDoc() {
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

  // Form inputs
  const [examTimeframe, setExamTimeframe] = useState("1_month");
  const [dailyReadingTime, setDailyReadingTime] = useState(30);

  // Hard-coded
  const currentKnowledge = "none";
  const goalLevel = "advanced";

  // Plan creation endpoint & results
  const planCreationEndpoint =
    "https://generateadaptiveplan2-zfztjkkvva-uc.a.run.app";
  const [planCreationResults, setPlanCreationResults] = useState([]);
  const [isCreatingPlans, setIsCreatingPlans] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Once done, mark user as onboarded
  const [isMarkingOnboarded, setIsMarkingOnboarded] = useState(false);

  // For computing target date
  const TIMEFRAME_OFFSETS = {
    "1_week": 7,
    "2_weeks": 14,
    "1_month": 30,
    "2_months": 60,
    "6_months": 180,
    not_sure: 60,
  };

  // Main navigation
  async function handleNext() {
    // Step 0 => Step 1: first create the plans
    if (currentStep === 0) {
      await createPlans();
      setCurrentStep(1);
      return;
    }
    // Step 1 => done => mark user onboarded + increment activity index
    if (currentStep === 1) {
      await markUserOnboarded();
      // Once onboarding is done, we increment the activity index by 1
      dispatch(setCurrentIndex(currentIndex + 1));

      console.log("Onboarding complete. Possibly navigate to /app");
    }
  }

  function handleBack() {
    // Only let the user go back from step 1 => step 0, if desired
    if (currentStep === 1) {
      setCurrentStep(0);
    }
  }

  // Creates the plans for each of the user's TOEFL books
  async function createPlans() {
    setIsCreatingPlans(true);
    setServerError(null);
    setPlanCreationResults([]);
    try {
      // Calculate a targetDate based on timeframe
      const offset = TIMEFRAME_OFFSETS[examTimeframe] || 30;
      const date = new Date();
      date.setDate(date.getDate() + offset);
      const targetDate = date.toISOString().substring(0, 10);

      // Basic body for each plan
      const planType = `${currentKnowledge}-${goalLevel}`;
      const quizTime = 3;
      const reviseTime = 3;

      const promises = toeflBooks.map(async (bookObj) => {
        const response = await axios.post(planCreationEndpoint, {
          userId,
          targetDate,
          dailyReadingTime,
          planType,
          quizTime,
          reviseTime,
          bookId: bookObj.newBookId,
        });
        return {
          planId: response.data.planId,
          planDoc: response.data.planDoc,
        };
      });

      const results = await Promise.all(promises);
      setPlanCreationResults(results);
      console.log("Plan creation succeeded:", results);
    } catch (err) {
      console.error("Error creating TOEFL plans:", err);
      setServerError(err.message || "Failed to create TOEFL plans.");
    } finally {
      setIsCreatingPlans(false);
    }
  }

  // Mark user onboarded
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

  // Toggling plan IDs (debugging info)
  const [showPlanIds, setShowPlanIds] = useState(false);

  // --------------------------------
  // Render
  // --------------------------------
  return (
    <div style={styles.pageWrapper}>
      <div style={styles.mainContainer}>
        {renderStepContent()}

        <div style={styles.btnContainer}>
          {/* We only show Back if we’re on step 1 */}
          {currentStep === 1 && (
            <button
              onClick={handleBack}
              style={styles.secondaryButton}
              disabled={isCreatingPlans || isMarkingOnboarded}
            >
              Back
            </button>
          )}

          <button
            onClick={handleNext}
            style={styles.primaryButton}
            disabled={isCreatingPlans || isMarkingOnboarded}
          >
            {renderNextButtonLabel()}
          </button>
        </div>
      </div>
    </div>
  );

  function renderNextButtonLabel() {
    if (currentStep === 0) {
      return isCreatingPlans ? "Creating..." : "Next";
    }
    if (currentStep === 1) {
      return isMarkingOnboarded ? "Marking..." : "Next";
    }
    return "Next";
  }

  // STEP CONTENT
  function renderStepContent() {
    if (currentStep === 0) {
      // Step 0 => configuration form
      return (
        <div style={styles.contentContainer}>
          <h2 style={{ marginBottom: "1rem", color: "#fff" }}>
            Configure Your TOEFL Plan
          </h2>
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

            <div>
              <p style={{ color: "#fff", margin: "0 0 4px" }}>
                How many minutes do you plan to study each day?
              </p>
              <Slider
                value={dailyReadingTime}
                onChange={(e, val) => setDailyReadingTime(val)}
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

    // Step 1 => success/confirmation
    return (
      <div style={styles.contentContainer}>
        {serverError ? (
          <>
            <h2 style={{ color: "#fff" }}>Oops!</h2>
            <p style={{ color: "red" }}>Something went wrong: {serverError}</p>
            <p style={{ color: "#ccc", marginBottom: "1rem" }}>
              Please try again or contact support.
            </p>
          </>
        ) : (
          <>
            {/* Big icon or infographic placeholder */}
            <div style={styles.infographicWrapper}>
              <div style={styles.bigIconPlaceholder}>✓</div>
              <h3 style={{ color: "#fff", marginTop: "1rem" }}>
                Your Plan Is Ready!
              </h3>
            </div>

            <div style={styles.summaryContainer}>
              <p style={{ color: "#fff", fontWeight: "bold", marginBottom: 8 }}>
                Exam Timeframe:
              </p>
              <p style={{ color: "#ccc", marginBottom: 16 }}>
                {formatExamTimeframe(examTimeframe)}
              </p>

              <p style={{ color: "#fff", fontWeight: "bold", marginBottom: 8 }}>
                Daily Study Time:
              </p>
              <p style={{ color: "#ccc", marginBottom: 16 }}>
                {dailyReadingTime} minutes/day
              </p>

              <p style={{ color: "#ccc", marginBottom: "1rem" }}>
                We’ve created a personalized TOEFL plan for you. Next, we’ll
                guide you on how to use the platform to start learning!
              </p>
            </div>
          </>
        )}

        {/* Toggle for plan IDs (debug info) */}
        {planCreationResults && planCreationResults.length > 0 && (
          <div style={styles.debugInfoContainer}>
            <button
              style={styles.infoButton}
              onClick={() => setShowPlanIds(!showPlanIds)}
            >
              {showPlanIds ? "Hide Plan IDs" : "Show Plan IDs"}
            </button>
            {showPlanIds && (
              <ul style={{ color: "#ccc", marginTop: 8 }}>
                {planCreationResults.map((res, index) => (
                  <li key={index}>
                    Plan ID: {res.planId}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  }

  function formatExamTimeframe(value) {
    switch (value) {
      case "1_week":
        return "1 Week";
      case "2_weeks":
        return "2 Weeks";
      case "1_month":
        return "1 Month";
      case "2_months":
        return "2 Months";
      case "6_months":
        return "6 Months";
      case "not_sure":
        return "Not sure yet";
      default:
        return "1 Month (default)";
    }
  }
}

// ------------------------------------------------
// Styles
// ------------------------------------------------
const styles = {
  pageWrapper: {
    width: "100%",
    minHeight: "100vh",
    backgroundColor: "#000",
    color: "#fff",
  },
  mainContainer: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "2rem 1rem",
  },
  contentContainer: {
    marginTop: "1rem",
  },
  btnContainer: {
    marginTop: "1.5rem",
    display: "flex",
    justifyContent: "space-between",
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
  infographicWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 24,
  },
  bigIconPlaceholder: {
    fontSize: 50,
    lineHeight: "60px",
    width: 60,
    height: 60,
    borderRadius: "50%",
    backgroundColor: "#9b59b6",
    color: "#fff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  summaryContainer: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: "1rem",
    borderRadius: "8px",
  },
  debugInfoContainer: {
    marginTop: "1.5rem",
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: "1rem",
    borderRadius: "8px",
  },
  infoButton: {
    backgroundColor: "#2980b9",
    border: "none",
    color: "#fff",
    padding: "0.25rem 0.75rem",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
};