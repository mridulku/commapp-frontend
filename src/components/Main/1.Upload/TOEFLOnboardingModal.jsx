import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";

// Firestore imports
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase"; // <-- Adjust path to wherever you export `db`

/**
 * TOEFLOnboardingModal
 *
 * Steps:
 *   0) Welcome
 *   1) Enter Plan Info (target date, daily time, currentKnowledge, goalLevel)
 *   2) Creating Plans
 *   3) All Done => Mark Onboarded & finish
 *
 * We no longer ask for 4 Book IDs. Instead, we fetch them from Firestore:
 *   userDoc => clonedToeflBooks => [ { oldBookId, newBookId }, ... ].
 *
 * Then createFourPlans() loops over those newBookIds and calls your plan creation endpoint.
 */
export default function TOEFLOnboardingModal({
  open,
  onClose,
  userId,
}) {
  const [currentStep, setCurrentStep] = useState(0);

  // -- The user’s 4 Book IDs, fetched from Firestore (clonedToeflBooks)
  const [toeflBooks, setToeflBooks] = useState([]); // each item => { oldBookId, newBookId }

  // -- Plan Info
  const [targetDate, setTargetDate] = useState("");
  const [dailyReadingTime, setDailyReadingTime] = useState(30);
  const [currentKnowledge, setCurrentKnowledge] = useState("none"); // “none/some/strong”
  const [goalLevel, setGoalLevel] = useState("basic"); // “basic/moderate/advanced”

  // -- Creating Plans
  const [isCreatingPlans, setIsCreatingPlans] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [planCreationResults, setPlanCreationResults] = useState([]);

  // -- Mark Onboarded
  const [isMarkingOnboarded, setIsMarkingOnboarded] = useState(false);

  const steps = ["Welcome", "Configure Plan Info", "Creating Plans", "All Done"];

  // Example plan creation endpoint
  const planCreationEndpoint =
    "https://generateadaptiveplan2-zfztjkkvva-uc.a.run.app";

  // ------------------------------
  // 1) Fetch the user doc from Firestore to get `clonedToeflBooks`
  // ------------------------------
  useEffect(() => {
    async function fetchUserDoc() {
      if (!userId) return;

      try {
        // Read the user doc
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          // e.g. userData.clonedToeflBooks => [ { oldBookId, newBookId }, ... ]
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

  // OPTIONAL: If you want a map from oldBookId -> skill name
  const skillMap = {
    "NwNZ8WWCz54Y4BeCli0c": "Reading",
    "fuyAbhDo3GXLbtEdZ9jj": "Listening",
    "5UWQEvQet8GgkZmjEwAO": "Speaking",
    "pFAfUSWtwipFZG2RStKg": "Writing",
  };

  // ------------------------------
  // Step transitions
  // ------------------------------
  const handleNext = async () => {
    if (currentStep === 0) {
      // from step 0 -> step 1
      setCurrentStep(1);
      return;
    }
    if (currentStep === 1) {
      // from step 1 -> step 2 => create plans
      setCurrentStep(2);
      await createFourPlans();
      return;
    }
    if (currentStep === 2) {
      // from step 2 -> step 3
      setCurrentStep(3);
      return;
    }
    if (currentStep === 3) {
      // step 3 => Mark onboarded & close
      await markUserOnboarded();
      if (onClose) onClose();
    }
  };

  const handleBack = () => {
    if (currentStep === 0) {
      if (onClose) onClose();
    } else {
      setCurrentStep((s) => s - 1);
    }
  };

  // ------------------------------
  // 2) createFourPlans => call your plan endpoint for each newBookId
  // ------------------------------
  async function createFourPlans() {
    setIsCreatingPlans(true);
    setServerError(null);
    setPlanCreationResults([]);

    try {
      // old code logic:
      // planType = `${currentKnowledge}-${goalLevel}`
      // if advanced => quizTime=5, reviseTime=5
      // if moderate => quizTime=3, reviseTime=3
      // else => quizTime=1, reviseTime=1

      let quizTime = 1;
      let reviseTime = 1;
      if (goalLevel === "advanced") {
        quizTime = 5;
        reviseTime = 5;
      } else if (goalLevel === "moderate") {
        quizTime = 3;
        reviseTime = 3;
      }
      const planType = `${currentKnowledge}-${goalLevel}`;

      const baseBody = {
        userId,
        targetDate,
        dailyReadingTime,
        planType,
        quizTime,
        reviseTime,
      };

      // Loop over each cloned book
      // e.g. toeflBooks = [ { oldBookId: "...", newBookId: "..." }, ... ]
      const promises = toeflBooks.map(async (bookObj) => {
        const skillName = skillMap[bookObj.oldBookId] || "TOEFL Course";
        const response = await axios.post(planCreationEndpoint, {
          ...baseBody,
          bookId: bookObj.newBookId,
        });
        // Suppose the response has { planId, planDoc }
        return {
          skill: skillName,
          planId: response.data.planId,
          planDoc: response.data.planDoc,
        };
      });

      const results = await Promise.all(promises);
      setPlanCreationResults(results);
    } catch (err) {
      console.error("Error creating TOEFL plans:", err);
      setServerError(err.message || "Failed to create TOEFL plans.");
    } finally {
      setIsCreatingPlans(false);
    }
  }

  // ------------------------------
  // 3) markUserOnboarded => same as before
  // ------------------------------
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
  // 4) Render steps
  // ------------------------------
  if (!open) return null;

  let stepContent = null;

  // Step 0 => Welcome
  if (currentStep === 0) {
    stepContent = (
      <div style={innerContentStyle}>
        <h2 style={{ marginBottom: "1rem", color: "#fff" }}>Welcome to TOEFL Onboarding</h2>
        <p style={{ marginBottom: "1.5rem", color: "#ccc" }}>
          We will set up Reading, Listening, Speaking, and Writing plans for you.
        </p>
      </div>
    );
  }

  // Step 1 => Collect Plan Info
  if (currentStep === 1) {
    stepContent = (
      <div style={innerContentStyle}>
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
          {/* Target Date */}
          <TextField
            label="Target Date"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            variant="outlined"
            size="small"
            style={{ backgroundColor: "#fff" }}
          />

          {/* Daily Reading Time */}
          <TextField
            label="Daily Reading Time (minutes)"
            type="number"
            value={dailyReadingTime}
            onChange={(e) => setDailyReadingTime(Number(e.target.value))}
            variant="outlined"
            size="small"
            style={{ backgroundColor: "#fff" }}
          />

          {/* Current Knowledge & Goal Level */}
          <div style={{ display: "flex", gap: "1rem" }}>
            <FormControl size="small" style={{ flex: 1, backgroundColor: "#fff" }}>
              <InputLabel>Current Knowledge</InputLabel>
              <Select
                label="Current Knowledge"
                value={currentKnowledge}
                onChange={(e) => setCurrentKnowledge(e.target.value)}
              >
                <MenuItem value="none">None</MenuItem>
                <MenuItem value="some">Some</MenuItem>
                <MenuItem value="strong">Strong</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" style={{ flex: 1, backgroundColor: "#fff" }}>
              <InputLabel>Goal Level</InputLabel>
              <Select
                label="Goal Level"
                value={goalLevel}
                onChange={(e) => setGoalLevel(e.target.value)}
              >
                <MenuItem value="basic">Basic</MenuItem>
                <MenuItem value="moderate">Moderate</MenuItem>
                <MenuItem value="advanced">Advanced</MenuItem>
              </Select>
            </FormControl>
          </div>
        </div>
      </div>
    );
  }

  // Step 2 => Creating Plans
  if (currentStep === 2) {
    stepContent = (
      <div style={innerContentStyle}>
        <h2 style={{ color: "#fff" }}>Creating TOEFL Plans...</h2>
        {isCreatingPlans && (
          <div style={{ marginTop: "1rem" }}>
            <CircularProgress style={{ color: "#fff" }} />
            <p style={{ color: "#ccc" }}>Please wait...</p>
          </div>
        )}

        {serverError && (
          <p style={{ color: "red", marginTop: "1rem" }}>{serverError}</p>
        )}

        {!isCreatingPlans &&
          !serverError &&
          planCreationResults.length > 0 && (
            <div
              style={{ marginTop: "1rem", textAlign: "left", color: "#ccc" }}
            >
              <p>Successfully created {planCreationResults.length} plans:</p>
              <ul>
                {planCreationResults.map((res) => (
                  <li key={res.planId}>
                    {res.skill} Plan => ID: {res.planId}
                  </li>
                ))}
              </ul>
            </div>
          )}
      </div>
    );
  }

  // Step 3 => All Done
  if (currentStep === 3) {
    stepContent = (
      <div style={innerContentStyle}>
        <h2 style={{ color: "#fff", marginBottom: "1rem" }}>All Done!</h2>
        <p style={{ color: "#ccc", marginBottom: "1.5rem" }}>
          Your TOEFL plans have been created. We’ll now finalize your onboarding.
        </p>
        <div style={{ textAlign: "left", color: "#ccc" }}>
          <ul>
            {planCreationResults.map((res) => (
              <li key={res.planId}>
                <strong>{res.skill}</strong> Plan ID: {res.planId}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  // ------------------------------
  // Footer Buttons
  // ------------------------------
  function renderButtons() {
    const isLastStep = currentStep === steps.length - 1;
    return (
      <div
        style={{
          marginTop: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        {/* Back button */}
        <button
          onClick={handleBack}
          style={secondaryButtonStyle}
          disabled={isCreatingPlans || isMarkingOnboarded}
        >
          Back
        </button>

        {/* Next or Finish button */}
        <button
          onClick={handleNext}
          style={primaryButtonStyle}
          disabled={isCreatingPlans || isMarkingOnboarded}
        >
          {isLastStep
            ? isMarkingOnboarded
              ? "Marking Onboarded..."
              : "Finish"
            : "Next"}
        </button>
      </div>
    );
  }

  // ------------------------------
  // Render the Modal
  // ------------------------------
  if (!open) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button onClick={onClose} style={closeButtonStyle}>
          X
        </button>

        <p style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>
          Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
        </p>

        {stepContent}
        {renderButtons()}
      </div>
    </div>
  );
}

/* -------------------------
 * Reuse your existing styles
 * ------------------------- */
const overlayStyle = {
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
};

const modalStyle = {
  backgroundColor: "rgba(0,0,0,0.8)",
  padding: "20px",
  borderRadius: "8px",
  width: "80vw",
  maxWidth: "600px",
  position: "relative",
};

const closeButtonStyle = {
  position: "absolute",
  top: 10,
  right: 10,
  background: "none",
  border: "none",
  color: "#fff",
  fontSize: "16px",
  cursor: "pointer",
};

const innerContentStyle = {
  marginTop: "1rem",
  textAlign: "center",
};

const primaryButtonStyle = {
  backgroundColor: "#9b59b6",
  border: "none",
  color: "#fff",
  padding: "0.5rem 1.25rem",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "1rem",
  fontWeight: "bold",
};

const secondaryButtonStyle = {
  backgroundColor: "transparent",
  border: "2px solid #9b59b6",
  color: "#fff",
  padding: "0.5rem 1.25rem",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "1rem",
  fontWeight: "bold",
};