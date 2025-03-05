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
 *  - No subchapter title/wordCount/time in UI
 *  - The reading content starts immediately
 *  - Start/Stop/Expand buttons are centered in the footer
 */
export default function ReadingView({ activity }) {
  if (!activity) {
    return <div style={styles.outerContainer}>No activity provided.</div>;
  }

  // 1) Extract subchapter ID
  const subChapterId = activity.subChapterId;

  // 2) Suppose we store user info in Redux
  const userId = useSelector((state) => state.auth?.userId || "demoUser");

  // 3) backend URL from env or store
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

  // ==================== State ====================
  const [subChapter, setSubChapter] = useState(null);
  const [localProficiency, setLocalProficiency] = useState("empty");
  const [isExpanded, setIsExpanded] = useState(false);

  // reading times
  const [localStartMs, setLocalStartMs] = useState(null);
  const [localEndMs, setLocalEndMs] = useState(null);
  const [readingSeconds, setReadingSeconds] = useState(0);
  const [finalReadingTime, setFinalReadingTime] = useState(null);

  // ==================== A) Fetch subchapter data ====================
  useEffect(() => {
    if (!subChapterId) return;

    async function fetchSubChapter() {
      try {
        const res = await axios.get(`${backendURL}/api/subchapters/${subChapterId}`);
        const data = res.data;
        if (!data) return;

        setSubChapter(data);
        setLocalProficiency(data.proficiency || "empty");

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

    // reset local states whenever subChapterId changes
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

  // ==================== C) Compute final reading time if "read" ====================
  useEffect(() => {
    if (localProficiency === "read" && localStartMs && localEndMs) {
      const totalSec = Math.floor((localEndMs - localStartMs) / 1000);
      if (totalSec > 0) {
        setFinalReadingTime(formatTime(totalSec));
      }
    }
  }, [localProficiency, localStartMs, localEndMs]);

  // ==================== If not loaded ====================
  if (!subChapter) {
    return (
      <div style={styles.outerContainer}>
        <p>Loading subchapter {subChapterId}...</p>
      </div>
    );
  }

  // ==================== Display logic ====================
  const { summary = "" } = subChapter;
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

  const canExpand = localProficiency === "read" || localProficiency === "proficient";

  return (
    <div style={styles.outerContainer}>
      {/* The reading content area - no title or stats above */}
      <div style={styles.readingContentArea}>
        {displayedText}
      </div>

      {/* The action buttons at the bottom, centered */}
      <div style={styles.footerActions}>
        {renderActionButtons(localProficiency)}
        {canExpand && (
          <button style={styles.btnStyle} onClick={toggleExpand}>
            {isExpanded ? "Collapse" : "Expand"}
          </button>
        )}
      </div>
    </div>
  );

  // Renders the appropriate action button (start, stop, or complete msg)
  function renderActionButtons(prof) {
    switch (prof) {
      case "empty":
        return (
          <button style={styles.btnStyle} onClick={handleStartReading}>
            Start Reading
          </button>
        );
      case "reading":
        return (
          <button style={styles.btnStyle} onClick={handleStopReading}>
            Stop Reading
          </button>
        );
      case "read":
        return (
          <div style={styles.readingDoneMsg}>
            <em>Reading Complete</em>
          </div>
        );
      case "proficient":
        return (
          <div style={styles.readingDoneMsg}>
            <em>You are Proficient!</em>
          </div>
        );
      default:
        return null;
    }
  }
}

// Styles
const styles = {
  outerContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000", // black background
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    padding: "20px",
    fontFamily: `'Inter', 'Roboto', 'Helvetica Neue', sans-serif`,

  },
  readingContentArea: {
    flex: 1,
    overflowY: "auto",
    lineHeight: 1.6,
    marginBottom: "10px",
    whiteSpace: "pre-line",
    maxWidth: "60ch",
    margin: "0 auto",
  },
  footerActions: {
    display: "flex",
    justifyContent: "center", // center horizontally
    alignItems: "center",
    gap: "8px",
    marginTop: "10px",
  },
  btnStyle: {
    backgroundColor: "#444",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "6px 12px",
    cursor: "pointer",
    fontSize: "0.85rem",
  },
  readingDoneMsg: {
    fontSize: "0.9rem",
    fontStyle: "italic",
  },
};