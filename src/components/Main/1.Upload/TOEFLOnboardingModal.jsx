// src/components/ToeflOnboarding/TOEFLOnboardingModal.jsx

import React, { useState } from "react";
import axios from "axios";
import { auth } from "../../../firebase";

export default function TOEFLOnboardingModal({
  open,
  onClose,
  onOpenPlanEditor,
  userId, // if you need the userId to mark onboarded
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isMarkingOnboarded, setIsMarkingOnboarded] = useState(false);

  // Handle finishing the entire onboarding => close + open plan editor (optional)
  const handleOnboardingComplete = (bookId) => {
    if (onClose) onClose();
    if (onOpenPlanEditor && bookId) {
      onOpenPlanEditor(bookId);
    }
  };

  // Example call to mark user onboarded in your backend
  const markUserOnboarded = async () => {
    if (!userId) return;
    setIsMarkingOnboarded(true);
    try {
      // Mark user as onboarded in your backend
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/learner-personas/onboard`,
        { userId }
      );
      console.log("TOEFL Onboarding => user marked as onboarded:", userId);

      // For demonstration, we could pass a “dummy” bookId or no ID
      // Then move on to the plan editor or skip it.
      handleOnboardingComplete(null);

    } catch (err) {
      console.error("Error marking user onboarded (TOEFL):", err);
      alert("Could not mark you onboarded. Please check console/logs.");
    } finally {
      setIsMarkingOnboarded(false);
    }
  };

  if (!open) return null;

  // Very simple 2‐step wizard
  const renderContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div style={innerContentStyle}>
            <h2 style={{ marginBottom: "1rem", color: "#fff" }}>
              Welcome to TOEFL Onboarding
            </h2>
            <p style={{ marginBottom: "1.5rem", color: "#ccc" }}>
              This flow will guide you through creating your TOEFL Reading, 
              Listening, Speaking, and Writing courses. 
            </p>
            <button 
              style={primaryButtonStyle} 
              onClick={() => setCurrentStep(1)}
            >
              Next
            </button>
          </div>
        );
      case 1:
        return (
          <div style={innerContentStyle}>
            <h2 style={{ marginBottom: "1rem", color: "#fff" }}>
              Ready to Begin?
            </h2>
            <p style={{ marginBottom: "1.5rem", color: "#ccc" }}>
              We'll now finalize your setup and mark you as fully onboarded. 
              After this, you can create or view your adaptive TOEFL plans.
            </p>
            <button 
              style={primaryButtonStyle} 
              onClick={markUserOnboarded}
              disabled={isMarkingOnboarded}
            >
              {isMarkingOnboarded ? "Marking Onboarded..." : "Finish Onboarding"}
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button onClick={onClose} style={closeButtonStyle}>X</button>
        {renderContent()}
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
  marginTop: "2rem",
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