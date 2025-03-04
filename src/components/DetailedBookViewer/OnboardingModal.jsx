// src/components/DetailedBookViewer/OnboardingModal.jsx

import React, { useState } from "react";
import OnboardingChatContent from "./OnboardingChatContent";
import OnboardingFormContent from "./OnboardingFormContent";

/**
 * OnboardingModal (Parent)
 * 
 * Key change:
 *   - We removed "overflowY: 'auto'" from `modalStyle` and replaced it with "overflow: 'hidden'".
 *   - This removes the scroll bar entirely. If your content is taller than the screen, it may be cut off.
 *     If that happens, you might prefer "overflowY: 'auto'" but that does show a scrollbar.
 */
export default function OnboardingModal({ open, onClose }) {
  const enableChat = false;
  const [activeView, setActiveView] = useState("form");

  if (!open) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <button onClick={onClose} style={closeButtonStyle}>
          X
        </button>

        {/* If you want to re-enable Chat in the future, uncomment tab UI here */}
        {enableChat ? (
          <div style={{ marginTop: "1rem" }}>
            {activeView === "chat" ? (
              <OnboardingChatContent />
            ) : (
              <OnboardingFormContent />
            )}
          </div>
        ) : (
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
  // IMPORTANT: remove any forced scrolling:
  // overflowY: "auto", // remove
  // Instead, hide overflow or allow visible:
  overflow: "hidden",

  // If content is bigger than the screen, it might get cut off.
  // If that’s not desired, try `overflow: "visible"` (still no scrollbar,
  // but content might overflow outside the modal).
  // overflow: "visible",

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