import React, { useState, useEffect } from "react";
import axios from "axios";

// Existing child
import QuizModal from "./QuizModal";
import SummaryModal from "./SummaryModal";
// New Doubts Modal
import DoubtsModal from "./DoubtsModal";

const openAIKey = import.meta.env.VITE_OPENAI_KEY;

function SubchapterContent({
  subChapter, // e.g. { subChapterId, proficiency, summary, wordCount, subChapterName, ... }
  userId,
  backendURL,
  onRefreshData,
}) {
  if (!subChapter) return null;

  // ------------------------------------------------
  // 1) Local proficiency (for optimistic UI)
  // ------------------------------------------------
  const [localProficiency, setLocalProficiency] = useState(
    subChapter.proficiency || "empty"
  );

  // ------------------------------------------------
  // 2) isExpanded logic
  // ------------------------------------------------
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const initialProf = subChapter.proficiency || "empty";
    setLocalProficiency(initialProf);

    if (initialProf === "reading") {
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
    }
  }, [subChapter.subChapterId, subChapter.proficiency]);

  // ------------------------------------------------
  // 3) Font size
  // ------------------------------------------------
  const [fontSizeLevel, setFontSizeLevel] = useState(0);
  const increaseFont = () => setFontSizeLevel((prev) => (prev < 2 ? prev + 1 : prev));
  const decreaseFont = () => setFontSizeLevel((prev) => (prev > -2 ? prev - 1 : prev));

  // ------------------------------------------------
  // 4) Quiz Modal
  // ------------------------------------------------
  const [showQuizModal, setShowQuizModal] = useState(false);
  const openQuizModal = () => setShowQuizModal(true);
  const closeQuizModal = () => setShowQuizModal(false);

  // ------------------------------------------------
  // 5) Summary Modal
  // ------------------------------------------------
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const openSummaryModal = () => setShowSummaryModal(true);
  const closeSummaryModal = () => setShowSummaryModal(false);

  // ------------------------------------------------
  // 6) Doubts Modal (new)
  // ------------------------------------------------
  const [showDoubtsModal, setShowDoubtsModal] = useState(false);
  const openDoubtsModal = () => setShowDoubtsModal(true);
  const closeDoubtsModal = () => setShowDoubtsModal(false);

  // ------------------------------------------------
  // 7) Reading Handlers
  // ------------------------------------------------
  const handleStartReading = async () => {
    // Optimistic update
    setLocalProficiency("reading");
    setIsExpanded(true);
    try {
      await axios.post(`${backendURL}/api/complete-subchapter`, {
        userId,
        subChapterId: subChapter.subChapterId,
        startReading: true,
      });
      onRefreshData && onRefreshData();
    } catch (error) {
      console.error("Error starting reading:", error);
      alert("Failed to start reading.");
      // revert
      setLocalProficiency("empty");
      setIsExpanded(false);
    }
  };

  const handleStopReading = async () => {
    // Optimistic update
    setLocalProficiency("read");
    setIsExpanded(true);
    try {
      await axios.post(`${backendURL}/api/complete-subchapter`, {
        userId,
        subChapterId: subChapter.subChapterId,
        endReading: true,
      });
      onRefreshData && onRefreshData();
    } catch (error) {
      console.error("Error stopping reading:", error);
      alert("Failed to stop reading.");
      // revert
      setLocalProficiency("reading");
      setIsExpanded(true);
    }
  };

  // ------------------------------------------------
  // 8) Displayed text logic (truncation)
  // ------------------------------------------------
  const maxChars = 200;
  const rawText = subChapter.summary || "";
  const truncatedText =
    rawText.length > maxChars ? rawText.slice(0, maxChars) + " ..." : rawText;

  let displayedText;
  if (localProficiency === "empty") {
    displayedText = truncatedText;
  } else if (localProficiency === "reading") {
    displayedText = rawText;
  } else {
    // "read" or "proficient"
    displayedText = isExpanded ? rawText : truncatedText;
  }

  // ------------------------------------------------
  // 9) Expand/Collapse logic
  // ------------------------------------------------
  const canShowExpandCollapse =
    localProficiency === "read" || localProficiency === "proficient";

  const toggleExpand = () => setIsExpanded((prev) => !prev);

  // ------------------------------------------------
  // Styles
  // ------------------------------------------------
  const panelStyle = {
    backgroundColor: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(6px)",
    padding: "15px",
    borderRadius: "6px",
    marginBottom: "20px",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  };

  const titleBarStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid rgba(255,255,255,0.3)",
    paddingBottom: "5px",
  };

  const leftSectionStyle = {
    display: "flex",
    alignItems: "center",
    gap: "10px", // spacing between subchapter name + Summarize + Ask Doubt
  };

  const leftTitleStyle = {
    fontSize: "1.2rem",
    margin: 0,
  };

  const rightInfoContainerStyle = {
    display: "flex",
    alignItems: "center",
    gap: "15px",
  };

  const smallInfoTextStyle = {
    fontStyle: "italic",
    fontSize: "0.9rem",
  };

  const fontButtonContainerStyle = {
    display: "flex",
    alignItems: "center",
    gap: "5px",
  };

  const primaryButtonStyle = {
    padding: "10px 20px",
    borderRadius: "4px",
    border: "none",
    background: "#FFD700", // bright yellow
    color: "#000",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "opacity 0.3s",
    marginTop: "10px",
  };

  const secondaryButtonStyle = {
    padding: "10px 20px",
    borderRadius: "4px",
    border: "none",
    background: "#aaa", // dull gray
    color: "#000",
    fontWeight: "normal",
    cursor: "pointer",
    transition: "opacity 0.3s",
    marginTop: "10px",
  };

  const baseFontSize = 16 + fontSizeLevel * 2;
  const contentStyle = {
    whiteSpace: "pre-line",
    marginBottom: "15px",
    fontSize: `${baseFontSize}px`,
    lineHeight: "1.5",
  };

  const bottomCenterStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
    marginTop: "20px",
  };

  // ------------------------------------------------
  // Render
  // ------------------------------------------------
  return (
    <div style={panelStyle}>
      {/* ---------- TOP BAR ---------- */}
      <div style={titleBarStyle}>
        {/* Left side: Subchapter name + Summarize + Ask Doubt button */}
        <div style={leftSectionStyle}>
          <h2 style={leftTitleStyle}>
            {subChapter.subChapterName || "Subchapter"}
          </h2>

          {/* Summarize button */}
          <button style={primaryButtonStyle} onClick={openSummaryModal}>
            Summarize
          </button>

          {/* Ask Doubt button (new) */}
          <button style={primaryButtonStyle} onClick={openDoubtsModal}>
            Ask Doubt
          </button>
        </div>

        {/* Right side: word count + font size */}
        <div style={rightInfoContainerStyle}>
          {subChapter.wordCount && (
            <div style={smallInfoTextStyle}>
              <strong>Words:</strong> {subChapter.wordCount} |{" "}
              <strong>Est Time:</strong> {Math.ceil(subChapter.wordCount / 200)} min
            </div>
          )}
          <div style={fontButtonContainerStyle}>
            <button style={primaryButtonStyle} onClick={decreaseFont}>
              A-
            </button>
            <button style={primaryButtonStyle} onClick={increaseFont}>
              A+
            </button>
          </div>
        </div>
      </div>

      {/* ---------- MAIN TEXT ---------- */}
      <div style={contentStyle}>{displayedText}</div>

      {/* ---------- BOTTOM BUTTONS ---------- */}
      <div style={bottomCenterStyle}>
        {renderActionButtons(localProficiency)}

        {canShowExpandCollapse && (
          <button style={secondaryButtonStyle} onClick={toggleExpand}>
            {isExpanded ? "Collapse Content" : "Expand Content"}
          </button>
        )}
      </div>

      {/* ---------- QUIZ MODAL ---------- */}
      <QuizModal
        isOpen={showQuizModal}
        onClose={closeQuizModal}
        subChapterName={subChapter.subChapterName}
        subChapterId={subChapter.subChapterId}
        subChapterContent={subChapter.summary}
        userId={userId}
        backendURL={backendURL}
      />

      {/* ---------- SUMMARY MODAL ---------- */}
      <SummaryModal
        isOpen={showSummaryModal}
        onClose={closeSummaryModal}
        subChapterName={subChapter.subChapterName}
        subChapterContent={subChapter.summary}
      />

      {/* ---------- DOUBTS MODAL (New) ---------- */}
      <DoubtsModal
       isOpen={showDoubtsModal}
       onClose={closeDoubtsModal}
       subChapterName={subChapter.subChapterName}
       subChapterId={subChapter.subChapterId}
       subChapterContent={subChapter.summary}
       userId={userId}
       backendURL={backendURL}
       openAIKey={import.meta.env.VITE_OPENAI_KEY}
/>
    </div>
  );

  // ----------------------------------------------
  // Helper to render the correct reading/quiz button
  // ----------------------------------------------
  function renderActionButtons(prof) {
    switch (prof) {
      case "empty":
        return (
          <button style={primaryButtonStyle} onClick={handleStartReading}>
            Start Reading
          </button>
        );

      case "reading":
        return (
          <button style={primaryButtonStyle} onClick={handleStopReading}>
            Stop Reading
          </button>
        );

      case "read":
        return (
          <button style={primaryButtonStyle} onClick={openQuizModal}>
            Take Quiz
          </button>
        );

      case "proficient":
        return (
          <button style={primaryButtonStyle} onClick={openQuizModal}>
            Take Another Quiz
          </button>
        );

      default:
        return null;
    }
  }
}

export default SubchapterContent;