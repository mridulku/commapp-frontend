// src/components/DetailedBookViewer/OnboardingFormContent.jsx

import React, { useState, useEffect } from "react";
import { Box, Stepper, Step, StepLabel } from "@mui/material";
import axios from "axios";
import { auth } from "../../firebase";

// Import the new components:
import OnboardingCarousel from "./OnboardingCarousel";
import UploadBook from "./UploadBook";

// Import your existing components (assuming these paths are correct)
import ProcessAnimation from "./ProcessAnimation";
import EditAdaptivePlanModal from "./1.Sidepanels/LibraryChild/EditAdaptivePlanModal";

/**
 * OnboardingFormContent is now the "parent container" that controls:
 *   Step 0 => Onboarding Carousel
 *   Step 1 => Upload Book
 *   Step 2 => Process Animation
 *   Step 3 => EditAdaptivePlanModal
 *
 * We show the Stepper only at steps >= 1.
 */
export default function OnboardingFormContent() {
  // parentStep represents the user's current stage in the flow:
  // 0 => Onboarding Carousel
  // 1 => Upload Book
  // 2 => ProcessAnimation
  // 3 => EditAdaptivePlanModal
  const [parentStep, setParentStep] = useState(0);

  // For Stepper display, we define these 3 steps (Upload, Analyze, Plan).
  // We do NOT include the carousel as a step in the Stepper
  // so that it remains hidden during the carousel.
  const steps = ["Upload", "Analyze", "Plan"];

  // We may need the current user ID to pass into child components for uploading, etc.
  const [currentUserId, setCurrentUserId] = useState(null);

  // On mount, retrieve the current user
  useEffect(() => {
    const user = auth.currentUser;
    if (user?.uid) {
      setCurrentUserId(user.uid);
    }
  }, []);

  // ---- Stepper rendering logic ----
  const renderStepper = () => {
    // If we're on the carousel (step 0), do NOT show the Stepper
    if (parentStep === 0) return null;

    // Otherwise, Stepper is active. However, parentStep=1 => active step=0, etc.
    // so we subtract 1 to align them:
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
    // If needed, once plan is done, you could do something else (e.g. close, route away)
    console.log("Plan creation complete or modal closed");
  };

  // ---- Main Rendering ----
  return (
    <Box sx={{ backgroundColor: "#fff", color: "#000", p: 2 }}>
      {/* Stepper (hidden during carousel) */}
      {renderStepper()}

      {/* Step 0 => Onboarding Carousel */}
      {parentStep === 0 && (
        <OnboardingCarousel onFinish={handleCarouselFinish} />
      )}

      {/* Step 1 => Upload Book */}
      {parentStep === 1 && (
        <UploadBook
          userId={currentUserId}
          onComplete={handleUploadComplete}
        />
      )}

      {/* Step 2 => ProcessAnimation */}
      {parentStep === 2 && (
        <ProcessAnimation
          userId={currentUserId}
          onShowPlanModal={handleAnalyzeComplete}
        />
      )}

      {/* Step 3 => EditAdaptivePlanModal (or Plan Wizard) */}
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