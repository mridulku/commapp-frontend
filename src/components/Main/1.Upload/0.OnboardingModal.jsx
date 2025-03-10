// src/components/DetailedBookViewer/OnboardingModal.jsx

import React, { useState } from "react";
import OnboardingChatContent from "./1.1OnboardingChatContent";
import OnboardingFormContent from "./1.2OnboardingFormContent";

/**
 * OnboardingModal (Parent)
 * 
 * We hide the Chat tab (enableChat=false) and always show the Form content.
 * If you want to re-enable Chat in the future, set enableChat=true and uncomment
 * the tab UI below.
 */
export default function OnboardingModal({ open, onClose }) {
  const enableChat = false;
  const [activeView, setActiveView] = useState("form");

  if (!open) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* Close "X" button */}
        <button onClick={onClose} style={closeButtonStyle}>
          X
        </button>

        {enableChat ? (
          <div style={{ marginTop: "1rem" }}>
            {activeView === "chat" ? (
              <OnboardingChatContent />
            ) : (
              <OnboardingFormContent />
            )}
          </div>
        ) : (
          // Chat disabled => always show form
          <div style={{ marginTop: "1rem" }}>
            <OnboardingFormContent />
          </div>
        )}
      </div>
    </div>
  );
}

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
  maxWidth: "1000px",
  // Let the child control the scrolling:
  overflow: "hidden", // or "visible"
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