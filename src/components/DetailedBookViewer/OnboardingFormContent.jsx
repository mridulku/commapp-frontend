import React, { useState, useEffect } from "react";
import { Box, Stepper, Step, StepLabel, CircularProgress } from "@mui/material";
import axios from "axios";
import { auth } from "../../firebase";

// Import your new components:
import OnboardingCarousel from "./OnboardingCarousel";
import UploadBook from "./UploadBook";
import ProcessAnimation from "./ProcessAnimation";
import EditAdaptivePlanModal from "./1.Sidepanels/LibraryChild/EditAdaptivePlanModal";

/**
 * OnboardingFormContent is the "parent container" that controls:
 *   Step 0 => Onboarding Carousel
 *   Step 1 => Upload Book
 *   Step 2 => ProcessAnimation
 *   Step 3 => EditAdaptivePlanModal
 *
 * We now also check the "learnerPersonas" collection to see if `isOnboarded` is true.
 * If `isOnboarded` is explicitly true, we skip the carousel (start at step 1).
 * Otherwise (false or missing), we show the carousel (step 0).
 */
export default function OnboardingFormContent() {
  // parentStep represents the user's current stage in the flow:
  // 0 => Onboarding Carousel
  // 1 => Upload Book
  // 2 => ProcessAnimation
  // 3 => EditAdaptivePlanModal
  const [parentStep, setParentStep] = useState(0);

  // For Stepper display, define these 3 steps (Upload, Analyze, Plan).
  // We do NOT include the carousel as a step in the Stepper, so it's hidden at step 0.
  const steps = ["Upload", "Analyze", "Plan"];

  // We fetch and store the current user ID
  const [currentUserId, setCurrentUserId] = useState(null);

  // Track whether we are still checking if user is onboarded
  const [isLoading, setIsLoading] = useState(true);

  // On mount, retrieve the current user from Firebase
  useEffect(() => {
    const user = auth.currentUser;
    if (user?.uid) {
      setCurrentUserId(user.uid);
    } else {
      setIsLoading(false); // No user, can't fetch onboarding status
    }
  }, []);

  // Once we have the user ID, call your backend to see if this user is onboarded
  useEffect(() => {
    if (!currentUserId) return;

    const fetchOnboardingStatus = async () => {
      try {
        console.log("Fetching /api/learner-personas for user:", currentUserId);
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/learner-personas`,
          {
            params: { userId: currentUserId },
          }
        );
        console.log("learner-personas response:", response.data);

        // We'll treat undefined or false as "not onboarded".
        // Only if isOnboarded === true do we skip the carousel.
        const isOnboarded = !!(response.data.success && response.data.data?.isOnboarded === true);

        if (isOnboarded) {
          // If user is onboarded => skip carousel => start at step 1
          setParentStep(1);
        } else {
          // Not onboarded => show carousel => step 0
          setParentStep(0);
        }
      } catch (error) {
        console.error("Error fetching learnerPersona:", error);
        // If any error, default to showing the carousel
        setParentStep(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOnboardingStatus();
  }, [currentUserId]);

  // ---- Stepper rendering logic ----
  const renderStepper = () => {
    // If we're on the carousel (step 0), do NOT show the Stepper
    if (parentStep === 0) return null;

    // Otherwise, Stepper is active.
    // parentStep=1 => active step=0, etc., so we subtract 1 to align them:
    return (
      <Box sx={{ mb: 3 }}>
        <Stepper activeStep={parentStep - 1}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>
    );
  };

  // ---- Callback handlers for child components ----
  const handleCarouselFinish = () => {
    // The user clicks "Start Uploading" from the carousel => move to step 1
    setParentStep(1);
  };

  const handleUploadComplete = () => {
    // Once uploading is finished, move to step 2 => ProcessAnimation
    setParentStep(2);
  };

  const handleAnalyzeComplete = () => {
    // Once the user is done with ProcessAnimation,
    // they might click "Create Plan" => step 3 => show EditAdaptivePlanModal
    setParentStep(3);
  };

  const handlePlanModalClose = () => {
    // E.g., once plan is done, you could do something else (close this view, route away, etc.)
    console.log("Plan creation complete or modal closed");
  };

  // ---- Main Rendering ----
  if (isLoading) {
    // While we're fetching the user's onboarding status from the server,
    // you can display a loading spinner or placeholder
    return (
      <Box
        sx={{
          height: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: "#fff", color: "#000", p: 2 }}>
      {/* Stepper (hidden during carousel) */}
      {renderStepper()}

      {/* Step 0 => Onboarding Carousel */}
      {parentStep === 0 && <OnboardingCarousel onFinish={handleCarouselFinish} />}

      {/* Step 1 => Upload Book */}
      {parentStep === 1 && (
        <UploadBook userId={currentUserId} onComplete={handleUploadComplete} />
      )}

      {/* Step 2 => ProcessAnimation */}
      {parentStep === 2 && (
        <ProcessAnimation
          userId={currentUserId}
          onShowPlanModal={handleAnalyzeComplete}
        />
      )}

      {/* Step 3 => EditAdaptivePlanModal (Plan Wizard) */}
      {parentStep === 3 && (
        <EditAdaptivePlanModal
          userId={currentUserId}
          open={true}
          onClose={handlePlanModalClose}
        />
      )}
    </Box>
  );
}