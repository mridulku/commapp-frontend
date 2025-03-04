// src/components/DetailedBookViewer/OnboardingFormContent.jsx

import React, { useState, useEffect } from "react";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Typography
} from "@mui/material";
import axios from "axios";
import { auth } from "../../firebase";

// Import your new components:
import OnboardingCarousel from "./OnboardingCarousel";
import UploadBook from "./UploadBook";
import ProcessAnimation from "./ProcessAnimation";
import EditAdaptivePlanModal from "./1.Sidepanels/LibraryChild/EditAdaptivePlanModal";

/**
 * OnboardingFormContent is the "parent container" that controls:
 *   Step 0 => OnboardingCarousel
 *   Step 1 => UploadBook
 *   Step 2 => ProcessAnimation
 *   Step 3 => EditAdaptivePlanModal
 *
 * We also check the "learnerPersonas" collection for isOnboarded => skip carousel if true.
 */
export default function OnboardingFormContent() {
  const [parentStep, setParentStep] = useState(0); // 0..3
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // We'll define 3 steps with short summaries
  const stepsData = [
    {
      label: "Upload",
      summary: "Choose your PDF & specify title",
    },
    {
      label: "Analyze",
      summary: "AI processes your content",
    },
    {
      label: "Plan",
      summary: "Review & finalize your study plan",
    },
  ];

  useEffect(() => {
    const user = auth.currentUser;
    if (user?.uid) {
      setCurrentUserId(user.uid);
    } else {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const fetchOnboardingStatus = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/learner-personas`,
          { params: { userId: currentUserId } }
        );
        const isOnboarded = !!(
          response.data.success && response.data.data?.isOnboarded === true
        );
        if (isOnboarded) {
          // skip carousel
          setParentStep(1);
        } else {
          // show carousel
          setParentStep(0);
        }
      } catch (error) {
        console.error("Error fetching learnerPersona:", error);
        setParentStep(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOnboardingStatus();
  }, [currentUserId]);

  // Step callbacks
  const handleCarouselFinish = () => setParentStep(1);
  const handleUploadComplete = () => setParentStep(2);
  const handleAnalyzeComplete = () => setParentStep(3);
  const handlePlanModalClose = () => {
    console.log("Plan creation complete or modal closed");
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          height: "200px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // We'll only render the stepper if parentStep >= 1
  const renderStepper = () => {
    if (parentStep === 0) return null;

    // MUI Stepper custom styling
    // - White text for labels
    // - Purple color for active/completed icons
    const stepperSx = {
      mb: 3,
      // Label text
      "& .MuiStepLabel-label": {
        color: "#fff",         // White text
        fontWeight: 500,
      },
      // Step number inside the circle
      "& .MuiStepIcon-text": {
        fill: "#fff",          // White number
      },
      // Default circle color (for inactive steps)
      "& .MuiStepIcon-root": {
        color: "#666",         // Gray for non-active steps
      },
      // Active step circle color
      "& .Mui-active .MuiStepIcon-root": {
        color: "#9b59b6",      // Purple for current step
      },
      // Completed step circle color
      "& .Mui-completed .MuiStepIcon-root": {
        color: "#9b59b6",      // Purple for completed steps
      },
      // Optionally adjust the connector line color
      "& .MuiStepConnector-line": {
        borderColor: "#999",   // lighter or darker grey
      },
    };

    return (
      <Box sx={{ width: "100%", textAlign: "center" }}>
        <Stepper
          alternativeLabel
          activeStep={parentStep - 1}
          sx={stepperSx}
        >
          {stepsData.map((step, index) => (
            <Step key={step.label}>
              <StepLabel>
                {/* We can render the main label in bold */}
                <Typography variant="body1" sx={{ color: "#fff", fontWeight: "bold" }}>
                  {step.label}
                </Typography>
                {/* And a smaller subtext summary in grey */}
                <Typography variant="caption" sx={{ color: "#bbb" }}>
                  {step.summary}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        backgroundColor: "transparent",
        color: "#fff",
        p: 0,
      }}
    >
      {/* Stepper at the top (hidden if step=0) */}
      {renderStepper()}

      {/* Step 0 => Onboarding Carousel */}
      {parentStep === 0 && <OnboardingCarousel onFinish={handleCarouselFinish} />}

      {/* Step 1 => UploadBook */}
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

      {/* Step 3 => EditAdaptivePlanModal */}
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