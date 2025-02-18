import React, { useState, useRef } from "react";
import axios from "axios";

function SubchapterContent({
  subChapter,
  userId,
  backendURL,
  onRefreshData,
}) {
  if (!subChapter) return null;

  const [fontSizeLevel, setFontSizeLevel] = useState(0);
  const [isReading, setIsReading] = useState(false);

  const [highlights, setHighlights] = useState([]);
  const highlightCounter = useRef(1);
  const [activeQA, setActiveQA] = useState(null);

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

  const fontButtonStyle = {
    padding: "5px 8px",
    borderRadius: "4px",
    border: "none",
    background: "#FFD700",
    color: "#000",
    cursor: "pointer",
    fontWeight: "bold",
  };

  const buttonStyle = {
    padding: "10px 20px",
    borderRadius: "4px",
    border: "none",
    background: "#FFD700",
    color: "#000",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "opacity 0.3s",
  };

  const baseFontSize = 16 + fontSizeLevel * 2;
  const contentStyle = {
    whiteSpace: "pre-line",
    marginBottom: "15px",
    fontSize: `${baseFontSize}px`,
    lineHeight: "1.5",
  };

  const highlightLogContainerStyle = {
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: "10px",
    borderRadius: "6px",
    marginTop: "20px",
  };

  const highlightItemStyle = {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: "10px",
    borderRadius: "4px",
    marginBottom: "10px",
  };

  const highlightTitleStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  };

  const smallButtonStyle = {
    padding: "6px 12px",
    borderRadius: "4px",
    border: "none",
    background: "#FFD700",
    color: "#000",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "opacity 0.3s",
  };

  const chatBubbleUserStyle = {
    alignSelf: "flex-end",
    backgroundColor: "rgba(255,255,255,0.3)",
    padding: "8px",
    borderRadius: "6px",
    margin: "6px 0",
    whiteSpace: "pre-wrap",
  };

  const chatBubbleAssistantStyle = {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,215,0,0.3)",
    padding: "8px",
    borderRadius: "6px",
    margin: "6px 0",
    whiteSpace: "pre-wrap",
  };

  const qaInputContainerStyle = {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  };

  const qaInputStyle = {
    flex: 1,
    padding: "8px",
    borderRadius: "4px",
    border: "none",
    outline: "none",
    fontSize: "1rem",
  };

  const handleStartReading = async () => {
    try {
      await axios.post(`${backendURL}/api/complete-subchapter`, {
        userId,
        subChapterId: subChapter.subChapterId,
        startReading: true,
      });
      onRefreshData && onRefreshData();
      setIsReading(true);
    } catch (err) {
      console.error("Error starting reading:", err);
      alert("Failed to start reading.");
    }
  };

  const handleFinishReading = async () => {
    try {
      await axios.post(`${backendURL}/api/complete-subchapter`, {
        userId,
        subChapterId: subChapter.subChapterId,
        endReading: true,
      });
      onRefreshData && onRefreshData();
      setIsReading(false);
    } catch (err) {
      console.error("Error finishing reading:", err);
      alert("Failed to finish reading.");
    }
  };

  // Derive if user has started/finished reading
  const hasStartedReading = !!subChapter.readStartTime;
  const hasFinishedReading = !!subChapter.readEndTime;

  // For reading duration
  const formatTimestamp = (ts) => {
    if (!ts) return null;
    if (ts.seconds) {
      return new Date(ts.seconds * 1000).toLocaleString();
    }
    return new Date(ts).toLocaleString();
  };

  const tsToMs = (ts) => {
    if (!ts) return 0;
    if (ts.seconds) {
      return ts.seconds * 1000;
    }
    return new Date(ts).getTime();
  };

  const readingDuration = (() => {
    if (hasStartedReading && hasFinishedReading) {
      const startTimeMs = tsToMs(subChapter.readStartTime);
      const endTimeMs = tsToMs(subChapter.readEndTime);
      const diffMin = (endTimeMs - startTimeMs) / 1000 / 60;
      return Math.round(diffMin * 10) / 10;
    }
    return null;
  })();

  const increaseFont = () => setFontSizeLevel((prev) => (prev < 2 ? prev + 1 : prev));
  const decreaseFont = () => setFontSizeLevel((prev) => (prev > -2 ? prev - 1 : prev));

  // Show only 200 chars plus "....." if truncated
  const maxChars = 200;
  let truncatedSummary = "";
  if (subChapter.summary) {
    const raw = subChapter.summary.slice(0, maxChars);
    truncatedSummary = raw + (subChapter.summary.length > maxChars ? "....." : "");
  }

  // If not reading => show truncated text
  const displayText = isReading ? subChapter.summary : truncatedSummary;

  // We remove the top Start Reading button => only the bottom if truncated (and the reading flow row might show "Stop Reading" if isReading).
  return (
    <div style={panelStyle}>
      {/* ====== TOP BAR ====== */}
      <div style={titleBarStyle}>
        <h2 style={leftTitleStyle}>{subChapter.subChapterName || "Subchapter"}</h2>

        <div style={rightInfoContainerStyle}>
          {subChapter.wordCount && (
            <div style={smallInfoTextStyle}>
              <strong>Words:</strong> {subChapter.wordCount} |{" "}
              <strong>Est Time:</strong> {Math.ceil(subChapter.wordCount / 200)} min
            </div>
          )}
          <div style={fontButtonContainerStyle}>
            <button style={fontButtonStyle} onClick={decreaseFont}>
              A-
            </button>
            <button style={fontButtonStyle} onClick={increaseFont}>
              A+
            </button>
          </div>
        </div>
      </div>

      {/* ====== Start/Finish Buttons + Timestamps ====== */}
      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        {/* Only show the "Stop Reading" if user started but not finished reading and isReading is true */}
        {hasStartedReading && !hasFinishedReading && isReading && (
          <button style={buttonStyle} onClick={handleFinishReading}>
            Stop Reading
          </button>
        )}

        {hasStartedReading && (
          <p style={{ margin: 0 }}>
            <strong>Started:</strong> {formatTimestamp(subChapter.readStartTime)}
          </p>
        )}
        {hasFinishedReading && (
          <p style={{ margin: 0 }}>
            <strong>Finished:</strong> {formatTimestamp(subChapter.readEndTime)}
          </p>
        )}
        {readingDuration && (
          <p style={{ margin: 0 }}>
            <strong>Duration:</strong> {readingDuration} mins
          </p>
        )}
      </div>

      {/* ====== The main text (200 chars or full) ====== */}
      <div style={contentStyle} onMouseUp={() => {/* highlight logic if desired */}}>
        {displayText}
      </div>

      {/* If not reading and summary is longer than 200 chars, show "Start Reading" at bottom */}
      {!isReading && subChapter.summary && subChapter.summary.length > maxChars && (
        <div style={{ textAlign: "center" }}>
          <button style={buttonStyle} onClick={handleStartReading}>
            Start Reading
          </button>
        </div>
      )}

      {/* If reading, show 'Stop Reading' at bottom too */}
      {isReading && !hasFinishedReading && (
        <div style={{ textAlign: "center" }}>
          <button style={buttonStyle} onClick={handleFinishReading}>
            Stop Reading
          </button>
        </div>
      )}

      {/* If you still want highlights or Q&A */}
      {highlights.length > 0 && (
        <div style={highlightLogContainerStyle}>
          <h3 style={{ marginTop: 0 }}>Highlights &amp; Questions</h3>
          {/* ... highlight logic ... */}
        </div>
      )}
    </div>
  );
}

export default SubchapterContent;