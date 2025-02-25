// ReadingView.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";

// Helper: Format seconds -> "MM:SS"
function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * ReadingView
 * 
 * Fetches the subchapter data by subChapterId, then displays partial
 * reading logic (start/stop reading, text-size, truncated vs. expanded).
 *
 * Props:
 *   - subChapterId: string (ID from your plan activity)
 *   - userId: string (optional)
 *   - backendURL: for your fetch calls
 *   - onRefreshData: callback if you want to refresh external data after state changes
 */
export default function ReadingView({
  subChapterId,
  userId,
  backendURL = "http://localhost:3001",
  onRefreshData,
}) {
  // 1) State: subchapter data => once we fetch it
  const [subChapter, setSubChapter] = useState(null);

  // 2) localProficiency => "empty" | "reading" | "read" ...
  const [localProficiency, setLocalProficiency] = useState("empty");

  // 3) partial text or full text
  const [isExpanded, setIsExpanded] = useState(false);

  // 4) text-size
  const [fontSizeLevel, setFontSizeLevel] = useState(0);

  // 5) Reading times
  const [localStartMs, setLocalStartMs] = useState(null);
  const [localEndMs, setLocalEndMs] = useState(null);
  const [readingSeconds, setReadingSeconds] = useState(0);
  const [finalReadingTime, setFinalReadingTime] = useState(null);

  // =========================================
  // A) Fetch subchapter data from your backend
  // =========================================
  useEffect(() => {
    if (!subChapterId) return;

    async function fetchSubChapter() {
      try {
        // e.g. GET /api/subchapters/:id
        const res = await axios.get(`${backendURL}/api/subchapters/${subChapterId}`);
        // Expect shape: { subChapterId, subChapterName, summary, proficiency, wordCount, ... }
        const data = res.data;

        setSubChapter(data || null);

        // Set local proficiency from data if it exists
        setLocalProficiency(data.proficiency || "empty");

        // If they have readStartTime / readEndTime, we can parse them
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

    fetchSubChapter();
  }, [subChapterId, backendURL]);

  // =========================================
  // B) Timer effect if reading
  // =========================================
  useEffect(() => {
    if (localProficiency === "reading" && localStartMs && !localEndMs) {
      const tick = () => {
        const now = Date.now();
        const diff = now - localStartMs;
        setReadingSeconds(diff > 0 ? Math.floor(diff / 1000) : 0);
      };
      tick();
      const timerId = setInterval(tick, 1000);
      return () => clearInterval(timerId);
    } else {
      setReadingSeconds(0);
    }
  }, [localProficiency, localStartMs, localEndMs]);

  // Recompute final reading time if read
  useEffect(() => {
    if (localProficiency === "read" && localStartMs && localEndMs) {
      const totalSec = Math.floor((localEndMs - localStartMs) / 1000);
      if (totalSec > 0) {
        setFinalReadingTime(formatTime(totalSec));
      }
    }
  }, [localProficiency, localStartMs, localEndMs]);

  // If no subchapter data yet, show loading or fallback
  if (!subChapter) {
    return (
      <div style={{ color: "#fff", padding: "20px" }}>
        Loading subchapter {subChapterId} ...
      </div>
    );
  }

  // =========== Display Logic ==============
  const {
    subChapterName,
    summary = "",
    wordCount,
    proficiency,  // might exist in the data
  } = subChapter;

  // localProficiency might override if we do local changes
  // partial text
  const maxChars = 200;
  const truncated = summary.length > maxChars ? summary.slice(0, maxChars) + " ..." : summary;

  let displayedText;
  if (localProficiency === "empty") {
    displayedText = truncated;
  } else if (localProficiency === "reading") {
    displayedText = summary;
  } else {
    // "read" or "proficient" => partial or full
    displayedText = isExpanded ? summary : truncated;
  }

  // readingTime display
  let readingTimeDisplay = null;
  if (localProficiency === "reading" && localStartMs && !localEndMs) {
    readingTimeDisplay = `Reading Time: ${formatTime(readingSeconds)}`;
  } else if (localProficiency === "read" && finalReadingTime) {
    readingTimeDisplay = `Total Reading: ${finalReadingTime}`;
  }

  // =========== Handlers ===========
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
      // e.g. POST /api/complete-subchapter to mark start
      await axios.post(`${backendURL}/api/complete-subchapter`, {
        userId,
        subChapterId,
        startReading: true,
      });

      await postUserActivity("startReading");
      onRefreshData && onRefreshData();
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
      // e.g. POST to mark end
      await axios.post(`${backendURL}/api/complete-subchapter`, {
        userId,
        subChapterId,
        endReading: true,
      });

      await postUserActivity("stopReading");
      onRefreshData && onRefreshData();
    } catch (error) {
      console.error("Error stopping reading:", error);
      setLocalProficiency("reading");
      setIsExpanded(true);
      setLocalEndMs(null);
    }
  }

  // Expand/collapse if "read"/"proficient"
  const canShowExpandCollapse =
    localProficiency === "read" || localProficiency === "proficient";
  function toggleExpand() {
    setIsExpanded((prev) => !prev);
  }

  // text size
  const baseFontSize = 16 + fontSizeLevel * 2;

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={{ margin: 0 }}>{subChapterName || "Subchapter Title"}</h2>
        {wordCount && (
          <div style={infoStyle}>
            <strong>Words:</strong> {wordCount} |{" "}
            <strong>Est Time:</strong> {Math.ceil(wordCount / 200)} min
          </div>
        )}
        {readingTimeDisplay && (
          <div style={infoStyle}>
            <strong>{readingTimeDisplay}</strong>
          </div>
        )}
        <div>
          <button style={buttonStyle} onClick={() => setFontSizeLevel((p) => p - 1)}>A-</button>
          <button style={buttonStyle} onClick={() => setFontSizeLevel((p) => p + 1)}>A+</button>
        </div>
      </div>

      <div style={{ ...textStyle, fontSize: `${baseFontSize}px` }}>
        {displayedText}
      </div>

      <div style={actionsContainer}>
        {renderActionButtons(localProficiency)}
        {canShowExpandCollapse && (
          <button style={buttonStyle} onClick={toggleExpand}>
            {isExpanded ? "Collapse" : "Expand"}
          </button>
        )}
      </div>
    </div>
  );

  function renderActionButtons(prof) {
    switch (prof) {
      case "empty":
        return (
          <button style={buttonStyle} onClick={handleStartReading}>
            Start Reading
          </button>
        );
      case "reading":
        return (
          <button style={buttonStyle} onClick={handleStopReading}>
            Stop Reading
          </button>
        );
      case "read":
        return <div style={infoStyle}>Reading Complete</div>;
      case "proficient":
        return <div style={infoStyle}>You are Proficient!</div>;
      default:
        return null;
    }
  }
}

// ~~~~~~~~~~~~~ STYLES ~~~~~~~~~~~~~

const containerStyle = {
  backgroundColor: "rgba(255,255,255,0.1)",
  backdropFilter: "blur(6px)",
  padding: "15px",
  borderRadius: "6px",
  color: "#fff",
  margin: "20px 0",
};

const headerStyle = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "10px",
};

const infoStyle = {
  fontSize: "0.9rem",
  fontStyle: "italic",
  marginRight: "10px",
};

const textStyle = {
  marginBottom: "15px",
  lineHeight: "1.5",
  whiteSpace: "pre-line",
};

const actionsContainer = {
  display: "flex",
  gap: "8px",
};

const buttonStyle = {
  backgroundColor: "#444",
  color: "#fff",
  padding: "6px 12px",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
};