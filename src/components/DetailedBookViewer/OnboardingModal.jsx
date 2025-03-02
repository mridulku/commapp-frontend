// src/components/DetailedBookViewer/OnboardingModal.jsx

import React, { useState } from "react";
import OnboardingChatContent from "./OnboardingChatContent";
import OnboardingFormContent from "./OnboardingFormContent";

/**
 * OnboardingModal (Parent)
 *
 * A single overlay that toggles between "Chat" or "Form" tabs.
 * Props:
 *  - open (bool) : whether the modal is visible
 *  - onClose (fn): closes the modal
 */
export default function OnboardingModal({ open, onClose }) {
  // Toggle between "chat" and "form"
  const [activeView, setActiveView] = useState("chat");

  if (!open) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* Close "X" button */}
        <button onClick={onClose} style={closeButtonStyle}>
          X
        </button>

        {/* Header with 2 buttons => Chat / Form */}
        <div style={tabsContainerStyle}>
          <button
            onClick={() => setActiveView("chat")}
            style={{
              ...tabButtonStyle,
              backgroundColor: activeView === "chat" ? "#444" : "#333",
            }}
          >
            Chat
          </button>
          <button
            onClick={() => setActiveView("form")}
            style={{
              ...tabButtonStyle,
              backgroundColor: activeView === "form" ? "#444" : "#333",
            }}
          >
            Form
          </button>
        </div>

        {/* Conditionally render either Chat or Form content */}
        <div style={{ marginTop: "1rem" }}>
          {activeView === "chat" ? (
            <OnboardingChatContent />
          ) : (
            <OnboardingFormContent />
          )}
        </div>
      </div>
    </div>
  );
}

/** Basic styling for the overlay */
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

/**
 * The main modal container: adjusted to be wider/taller
 * so the onboarding form + plan wizard is not cramped.
 */
const modalStyle = {
  backgroundColor: "rgba(0,0,0,0.8)",
  padding: "20px",
  borderRadius: "8px",

  // Use a relative or percentage-based width for more space
  width: "80vw",
  // Optionally cap the maximum width
  maxWidth: "1000px",

  // Keep or adjust the height as needed
  maxHeight: "80vh",
  overflowY: "auto",
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

const tabsContainerStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "1rem",
  marginBottom: "1rem",
};

const tabButtonStyle = {
  padding: "8px 16px",
  border: "none",
  borderRadius: "4px",
  color: "#fff",
  cursor: "pointer",
};