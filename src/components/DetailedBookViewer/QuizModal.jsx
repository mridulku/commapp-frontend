// src/components/DetailedBookViewer/QuizModal.jsx
import React from "react";
import ReactDOM from "react-dom";

/**
 * A basic quiz modal that appears on top of everything
 * when isOpen === true. Uses React Portal to render into 
 * #portal-root so it's not constrained by parent stacking contexts.
 */
function QuizModal({ isOpen, onClose, subChapterName }) {
  // If not open, render nothing.
  if (!isOpen) return null;

  // We'll mount the portal into this DOM node.
  const portalRoot = document.getElementById("portal-root");
  if (!portalRoot) {
    // If for some reason the portal root doesn't exist, bail out.
    return null;
  }

  // Overlay and modal styles with a high zIndex
  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999, // ensure it appears above everything
  };

  const modalContentStyle = {
    backgroundColor: "#fff",
    color: "#000",
    borderRadius: "6px",
    padding: "20px",
    width: "500px",
    maxWidth: "90%",
    position: "relative",
  };

  const closeModalButtonStyle = {
    position: "absolute",
    top: "10px",
    right: "10px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "1.2rem",
    fontWeight: "bold",
  };

  // "Primary" button style (optional)
  const primaryButtonStyle = {
    padding: "10px 20px",
    borderRadius: "4px",
    border: "none",
    backgroundColor: "#203A43",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "10px",
  };

  // We'll return the modal via ReactDOM.createPortal
  return ReactDOM.createPortal(
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <button style={closeModalButtonStyle} onClick={onClose}>
          ×
        </button>
        <h3>Quiz for {subChapterName}</h3>
        <p>This is a placeholder quiz. Replace with real questions or GPT-based logic!</p>
        <button style={primaryButtonStyle} onClick={onClose}>
          Close
        </button>
      </div>
    </div>,
    portalRoot
  );
}

export default QuizModal;