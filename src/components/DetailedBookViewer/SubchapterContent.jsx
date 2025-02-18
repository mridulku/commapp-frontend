import React, { useState, useEffect } from "react";
import axios from "axios";

// 1) Import our new QuizModal
import QuizModal from "./QuizModal";

function SubchapterContent({
  subChapter, // { subChapterId, proficiency, summary, wordCount, subChapterName, ... }
  userId,
  backendURL,
  onRefreshData,
}) {
  if (!subChapter) return null;

  // -----------------------------------------
  // 1) Local proficiency (for optimistic UI)
  // -----------------------------------------
  const [localProficiency, setLocalProficiency] = useState(
    subChapter.proficiency || "empty"
  );

  // -----------------------------------------
  // 2) isExpanded logic
  //    - We do NOT show expand/collapse button
  //      if proficiency is "empty" or "reading".
  //    - For "read"/"proficient", we show it.
  //    - On initial load, if "reading" => expanded,
  //      else => collapsed.
  // -----------------------------------------
  const [isExpanded, setIsExpanded] = useState(false);

  // Whenever we switch to a new sub-chapter ID, reset localProficiency & isExpanded
  useEffect(() => {
    const initialProf = subChapter.proficiency || "empty";
    setLocalProficiency(initialProf);

    if (initialProf === "reading") {
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
    }
  }, [subChapter.subChapterId, subChapter.proficiency]);

  // -----------------------------------------
  // 3) Font size
  // -----------------------------------------
  const [fontSizeLevel, setFontSizeLevel] = useState(0);
  const increaseFont = () => setFontSizeLevel((prev) => (prev < 2 ? prev + 1 : prev));
  const decreaseFont = () => setFontSizeLevel((prev) => (prev > -2 ? prev - 1 : prev));

  // -----------------------------------------
  // 4) Quiz modal - replaced inline modal with <QuizModal />
  // -----------------------------------------
  const [showQuizModal, setShowQuizModal] = useState(false);
  const openQuizModal = () => setShowQuizModal(true);
  const closeQuizModal = () => setShowQuizModal(false);

  // -----------------------------------------
  // 5) Reading Handlers
  // -----------------------------------------
  // "Start Reading" => proficiency="reading", text becomes expanded
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

  // "Stop Reading" => proficiency="read", remain expanded
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

  // -----------------------------------------
  // 6) Displayed text logic
  // -----------------------------------------
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

  // -----------------------------------------
  // 7) Expand/Collapse button logic
  // -----------------------------------------
  // Only "read" or "proficient" => show expand/collapse
  const canShowExpandCollapse =
    localProficiency === "read" || localProficiency === "proficient";

  const toggleExpand = () => setIsExpanded((prev) => !prev);

  // -----------------------------------------
  // 8) Styles
  // -----------------------------------------
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

  // -----------------------------------------
  // Render
  // -----------------------------------------
  return (
    <div style={panelStyle}>
      {/* ---------- TOP BAR ---------- */}
      <div style={titleBarStyle}>
        <h2 style={leftTitleStyle}>
          {subChapter.subChapterName || "Subchapter"}
        </h2>

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
        {/* The proficiency-specific section */}
        {renderActionButtons(localProficiency)}

        {/* Expand/Collapse if "read" or "proficient" */}
        {canShowExpandCollapse && (
          <button style={secondaryButtonStyle} onClick={toggleExpand}>
            {isExpanded ? "Collapse Content" : "Expand Content"}
          </button>
        )}
      </div>

      {/* ---------- QUIZ MODAL (now external) ---------- */}
      <QuizModal
        isOpen={showQuizModal}
        onClose={closeQuizModal}
        subChapterName={subChapter.subChapterName}
      />
    </div>
  );

  // -----------------------------------------
  // Helper: Return the single or multiple buttons
  // based on proficiency
  // -----------------------------------------
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