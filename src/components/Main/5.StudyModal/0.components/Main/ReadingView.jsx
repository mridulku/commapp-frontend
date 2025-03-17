import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ReadingView({ activity }) {
  if (!activity) {
    return <div style={styles.outerContainer}>No activity provided.</div>;
  }

  const subChapterId = activity.subChapterId;
  const userId = useSelector((state) => state.auth?.userId || "demoUser");
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

  const [subChapter, setSubChapter] = useState(null);
  const [localProficiency, setLocalProficiency] = useState("empty");
  const [isExpanded, setIsExpanded] = useState(false);

  const [localStartMs, setLocalStartMs] = useState(null);
  const [localEndMs, setLocalEndMs] = useState(null);
  const [readingSeconds, setReadingSeconds] = useState(0);
  const [finalReadingTime, setFinalReadingTime] = useState(null);

  const [showDebug, setShowDebug] = useState(false);

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

    setLocalProficiency("empty");
    setIsExpanded(false);
    setLocalStartMs(null);
    setLocalEndMs(null);
    setReadingSeconds(0);
    setFinalReadingTime(null);
    setSubChapter(null);

    fetchSubChapter();
  }, [subChapterId, backendURL]);

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

  useEffect(() => {
    if (localProficiency === "read" && localStartMs && localEndMs) {
      const totalSec = Math.floor((localEndMs - localStartMs) / 1000);
      if (totalSec > 0) {
        setFinalReadingTime(formatTime(totalSec));
      }
    }
  }, [localProficiency, localStartMs, localEndMs]);

  if (!subChapter) {
    return (
      <div style={styles.outerContainer}>
        <p>Loading subchapter {subChapterId}...</p>
      </div>
    );
  }

  // ============ THE KEY PART ============

  // 1) Read the field containing HTML (or partial HTML)
  let { summary = "" } = subChapter;

  // 2) Remove ALL raw newlines:
  //    This ensures absolutely no '\n\n' can appear as text.
  summary = summary.replace(/\r?\n/g, "");

  // 3) Truncate if needed:
  const maxChars = 200;
  const truncatedHtml =
    summary.length > maxChars ? summary.slice(0, maxChars) + " ..." : summary;

  let displayedHtml;
  if (localProficiency === "empty") {
    displayedHtml = truncatedHtml;
  } else if (localProficiency === "reading") {
    displayedHtml = summary;
  } else {
    displayedHtml = isExpanded ? summary : truncatedHtml;
  }

  // ============ ======================

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
      <div
        style={styles.readingContentArea}
        dangerouslySetInnerHTML={{ __html: displayedHtml }}
      />

      <div style={styles.footerActions}>
        {renderActionButtons(localProficiency)}
        {canExpand && (
          <button style={styles.btnStyle} onClick={toggleExpand}>
            {isExpanded ? "Collapse" : "Expand"}
          </button>
        )}
      </div>

      <div
        style={styles.debugEyeContainer}
        onMouseEnter={() => setShowDebug(true)}
        onMouseLeave={() => setShowDebug(false)}
      >
        <div style={styles.debugEyeIcon}>i</div>
        {showDebug && (
          <div style={styles.debugOverlay}>
            <h4 style={{ marginTop: 0 }}>Debug Info</h4>
            <div style={styles.debugBlock}>
              <strong>Activity:</strong>
              <pre style={styles.debugPre}>{JSON.stringify(activity, null, 2)}</pre>
            </div>
            <div style={styles.debugBlock}>
              <strong>SubChapter:</strong>
              <pre style={styles.debugPre}>{JSON.stringify(subChapter, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );

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

const styles = {
  outerContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    padding: "20px",
    fontFamily: `'Inter', 'Roboto', 'Helvetica Neue', sans-serif`,
    position: "relative",
  },
  readingContentArea: {
    flex: 1,
    overflowY: "auto",
    lineHeight: 1.6,
    marginBottom: "10px",
    maxWidth: "60ch",
    margin: "0 auto",
  },
  footerActions: {
    display: "flex",
    justifyContent: "center",
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
  debugEyeContainer: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  debugEyeIcon: {
    width: "24px",
    height: "24px",
    backgroundColor: "#333",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "0.8rem",
    cursor: "pointer",
    border: "1px solid #555",
    textTransform: "uppercase",
  },
  debugOverlay: {
    position: "absolute",
    top: "30px",
    right: 0,
    width: "300px",
    backgroundColor: "#222",
    border: "1px solid #444",
    borderRadius: "4px",
    padding: "8px",
    zIndex: 9999,
    fontSize: "0.8rem",
  },
  debugBlock: {
    marginBottom: "8px",
  },
  debugPre: {
    backgroundColor: "#333",
    padding: "6px",
    borderRadius: "4px",
    maxHeight: "120px",
    overflowY: "auto",
    whiteSpace: "pre-wrap",
    marginTop: "4px",
  },
};