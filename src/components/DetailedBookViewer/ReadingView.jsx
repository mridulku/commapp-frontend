import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";

/**
 * formatTime
 * Helper: convert totalSeconds to "MM:SS" format.
 */
function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * ReadingView (Redux-based)
 * -------------------------
 * 1) Extracts subChapterId from activity.
 * 2) Fetches subchapter data from backend => sets local states:
 *    - proficiency, text, read times.
 * 3) Start/stop reading => updates reading timer, calls server endpoints.
 * 4) Font-size adjustments, truncated vs. expanded text, etc.
 */
export default function ReadingView({ activity }) {
  if (!activity) {
    return <div style={outerContainer}>No activity provided.</div>;
  }

  // 1) Subchapter and user info
  const subChapterId = activity.subChapterId;
  const level = activity.level || "basic";
  // Suppose we store user info in Redux:
  const userId = useSelector((state) => state.auth?.userId || "demoUser");
  // or fallback to a prop if you prefer: function ReadingView({ activity, userId, ... })

  // 2) We can define a backend URL from env or Redux
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

  // ==================== State ====================
  const [subChapter, setSubChapter] = useState(null);
  const [localProficiency, setLocalProficiency] = useState("empty");
  const [isExpanded, setIsExpanded] = useState(false);
  const [fontSizeLevel, setFontSizeLevel] = useState(0);

  // Reading session times
  const [localStartMs, setLocalStartMs] = useState(null);
  const [localEndMs, setLocalEndMs] = useState(null);
  const [readingSeconds, setReadingSeconds] = useState(0);
  const [finalReadingTime, setFinalReadingTime] = useState(null);

  // ==================== A) Fetch subchapter data ====================
  useEffect(() => {
    if (!subChapterId) {
      return;
    }

    async function fetchSubChapter() {
      try {
        const res = await axios.get(`${backendURL}/api/subchapters/${subChapterId}`);
        const data = res.data;
        if (!data) return;

        setSubChapter(data);

        // If it has a proficiency, store it locally
        setLocalProficiency(data.proficiency || "empty");

        // If there are existing reading times, apply them
        if (data.readStartTime) {
          setLocalStartMs(new Date(data.readStartTime).getTime());
        }
        if (data.readEndTime) {
          setLocalEndMs(new Date(data.readEndTime).getTime());
        }
      } catch (err) {
        console.error("Error fetching subchapter details:", err);
      }
    }

    // Reset local states each time we change subChapterId
    setLocalProficiency("empty");
    setIsExpanded(false);
    setLocalStartMs(null);
    setLocalEndMs(null);
    setReadingSeconds(0);
    setFinalReadingTime(null);
    setSubChapter(null);

    fetchSubChapter();
  }, [subChapterId, backendURL]);

  // ==================== B) Reading Timer ====================
  useEffect(() => {
    // Only run the timer if localProficiency === "reading" and we have a startMs but no endMs
    if (localProficiency === "reading" && localStartMs && !localEndMs) {
      const tick = () => {
        const now = Date.now();
        const diff = now - localStartMs;
        setReadingSeconds(diff > 0 ? Math.floor(diff / 1000) : 0);
      };
      tick(); // run once immediately
      const timerId = setInterval(tick, 1000);
      return () => clearInterval(timerId);
    } else {
      // If we're not actively reading, reset readingSeconds
      setReadingSeconds(0);
    }
  }, [localProficiency, localStartMs, localEndMs]);

  // ==================== C) Compute final reading time if "read" ====================
  useEffect(() => {
    if (localProficiency === "read" && localStartMs && localEndMs) {
      const totalSec = Math.floor((localEndMs - localStartMs) / 1000);
      if (totalSec > 0) {
        setFinalReadingTime(formatTime(totalSec));
      }
    }
  }, [localProficiency, localStartMs, localEndMs]);

  // ==================== Early Return if not loaded ====================
  if (!subChapter) {
    return (
      <div style={outerContainer}>
        <p>Loading subchapter {subChapterId}...</p>
      </div>
    );
  }

  // ==================== Display Logic ====================
  const { subChapterName = "", summary = "", wordCount } = subChapter;
  const maxChars = 200;
  const truncatedText =
    summary.length > maxChars ? summary.slice(0, maxChars) + " ..." : summary;

  let displayedText;
  if (localProficiency === "empty") {
    // Not started => truncated
    displayedText = truncatedText;
  } else if (localProficiency === "reading") {
    // Currently reading => full
    displayedText = summary;
  } else {
    // "read" or "proficient"
    displayedText = isExpanded ? summary : truncatedText;
  }

  // Display reading time
  let readingTimeDisplay = "";
  if (localProficiency === "reading" && localStartMs && !localEndMs) {
    readingTimeDisplay = `Reading Time: ${formatTime(readingSeconds)}`;
  } else if (localProficiency === "read" && finalReadingTime) {
    readingTimeDisplay = `Total Reading: ${finalReadingTime}`;
  }

  // ==================== Handlers ====================
  async function postUserActivity(eventType) {
    try {
      await axios.post(`${backendURL}/api/user-activities`, {
        userId,
        subChapterId,
        eventType,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Error posting user activity:", err);
    }
  }

  async function handleStartReading() {
    setLocalProficiency("reading");
    setIsExpanded(true);
    const nowMs = Date.now();
    setLocalStartMs(nowMs);
    setLocalEndMs(null);

    try {
      await axios.post(`${backendURL}/api/complete-subchapter`, {
        userId,
        subChapterId,
        startReading: true,
      });
      await postUserActivity("startReading");
      // If you want to notify Redux or parent about changes, do so here.
    } catch (error) {
      console.error("Error starting reading:", error);
      setLocalProficiency("empty");
      setIsExpanded(false);
      setLocalStartMs(null);
    }
  }

  async function handleStopReading() {
    setLocalProficiency("read");
    setIsExpanded(true);
    const nowMs = Date.now();
    setLocalEndMs(nowMs);

    try {
      await axios.post(`${backendURL}/api/complete-subchapter`, {
        userId,
        subChapterId,
        endReading: true,
      });
      await postUserActivity("stopReading");
      // If you need to update some external state, do so.
    } catch (error) {
      console.error("Error stopping reading:", error);
      // revert
      setLocalProficiency("reading");
      setIsExpanded(true);
      setLocalEndMs(null);
    }
  }

  function toggleExpand() {
    setIsExpanded((prev) => !prev);
  }

  // If "read"/"proficient", show expand/collapse
  const canExpand = localProficiency === "read" || localProficiency === "proficient";
  // Base font size
  const baseFontSize = 16 + fontSizeLevel * 2;

  // ==================== Render ====================
  return (
    <div style={outerContainer}>
      {/* Header */}
      <div style={headerSection}>
        <h2 style={{ margin: 0 }}>{subChapterName || "Subchapter Title"}</h2>
        <div style={headerInfoRow}>
          {wordCount != null && (
            <div style={headerInfoItem}>
              <strong>Words:</strong> {wordCount}
            </div>
          )}
          {wordCount != null && (
            <div style={headerInfoItem}>
              <strong>Est Time:</strong> {Math.ceil(wordCount / 200)} min
            </div>
          )}
          {readingTimeDisplay && (
            <div style={headerInfoItem}>
              <strong>{readingTimeDisplay}</strong>
            </div>
          )}
        </div>
        {/* Font size controls */}
        <div style={fontSizeButtons}>
          <button style={btnStyle} onClick={() => setFontSizeLevel((p) => p - 1)}>
            A-
          </button>
          <button style={btnStyle} onClick={() => setFontSizeLevel((p) => p + 1)}>
            A+
          </button>
        </div>
      </div>

      {/* Main reading content */}
      <div style={{ ...readingContentArea, fontSize: `${baseFontSize}px` }}>
        {displayedText}
      </div>

      {/* Action buttons at bottom */}
      <div style={footerActions}>
        {renderActionButtons(localProficiency)}
        {canExpand && (
          <button style={btnStyle} onClick={toggleExpand}>
            {isExpanded ? "Collapse" : "Expand"}
          </button>
        )}
      </div>
    </div>
  );

  // Renders the appropriate action button (start, stop, etc.) based on proficiency
  function renderActionButtons(prof) {
    switch (prof) {
      case "empty":
        return (
          <button style={btnStyle} onClick={handleStartReading}>
            Start Reading
          </button>
        );
      case "reading":
        return (
          <button style={btnStyle} onClick={handleStopReading}>
            Stop Reading
          </button>
        );
      case "read":
        return (
          <div style={headerInfoItem}>
            <em>Reading Complete</em>
          </div>
        );
      case "proficient":
        return (
          <div style={headerInfoItem}>
            <em>You are Proficient!</em>
          </div>
        );
      default:
        return null;
    }
  }
}

// ----------------------------------------------------------------
// STYLES
// ----------------------------------------------------------------

const outerContainer = {
  width: "100%",
  height: "100%",
  backgroundColor: "#000", // black background
  color: "#fff",
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  padding: "20px",
};

const headerSection = {
  marginBottom: "16px",
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
};

const headerInfoRow = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const headerInfoItem = {
  fontSize: "0.85rem",
  fontStyle: "italic",
};

const fontSizeButtons = {
  display: "flex",
  gap: "6px",
};

const readingContentArea = {
  flex: 1,
  overflowY: "auto",
  lineHeight: 1.5,
  marginBottom: "10px",
  whiteSpace: "pre-line",
};

const footerActions = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const btnStyle = {
  backgroundColor: "#444",
  color: "#fff",
  border: "none",
  borderRadius: "4px",
  padding: "6px 12px",
  cursor: "pointer",
  fontSize: "0.85rem",
};