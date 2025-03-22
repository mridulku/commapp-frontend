import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";

// Utility to format mm:ss
function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ReadingView({ activity }) {
  // For demonstration, we’re still expecting "activity" to have at least { subChapterId }.
  // If none is provided, we show a fallback.
  if (!activity) {
    return <div style={styles.outerContainer}>No activity provided.</div>;
  }

  const subChapterId = activity.subChapterId;
  const userId = useSelector((state) => state.auth?.userId || "demoUser");

  // If your plan is stored in Redux similarly to the revision code:
  const planId = useSelector((state) => state.plan?.planDoc?.id);

  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

  // === Local State ===
  const [subChapter, setSubChapter] = useState(null);

  // We’ll track local reading state/proficiency just for UI
  const [localProficiency, setLocalProficiency] = useState("empty"); 
  // "empty" => haven't started
  // "reading" => currently reading
  // "read" => finished reading

  const [isExpanded, setIsExpanded] = useState(false);

  const [localStartMs, setLocalStartMs] = useState(null);
  const [localEndMs, setLocalEndMs] = useState(null);
  const [readingSeconds, setReadingSeconds] = useState(0);
  const [finalReadingTime, setFinalReadingTime] = useState(null);

  // For demonstration, we’ll track a “productReadingPerformance” – 
  // you can imagine a numeric or string measure of performance
  const [productReadingPerformance, setProductReadingPerformance] = useState("N/A");

  // For debug overlay
  const [showDebug, setShowDebug] = useState(false);

  // --- Fetch subchapter for display ---
  useEffect(() => {
    if (!subChapterId) return;

    async function fetchSubChapter() {
      try {
        // The same GET approach as before
        const res = await axios.get(`${backendURL}/api/subchapters/${subChapterId}`);
        const data = res.data;
        if (!data) return;

        setSubChapter(data);
      } catch (err) {
        console.error("Error fetching subchapter details:", err);
      }
    }

    // Reset local states on each new subChapterId
    setLocalProficiency("empty");
    setIsExpanded(false);
    setLocalStartMs(null);
    setLocalEndMs(null);
    setReadingSeconds(0);
    setFinalReadingTime(null);
    setSubChapter(null);
    setProductReadingPerformance("N/A");

    fetchSubChapter();
  }, [subChapterId, backendURL]);

  // --- If currently "reading", update the readingSeconds every second ---
  useEffect(() => {
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
      setReadingSeconds(0);
    }
  }, [localProficiency, localStartMs, localEndMs]);

  // --- Once user is "read" (stopped reading), compute final time ---
  useEffect(() => {
    if (localProficiency === "read" && localStartMs && localEndMs) {
      const totalSec = Math.floor((localEndMs - localStartMs) / 1000);
      if (totalSec > 0) {
        setFinalReadingTime(formatTime(totalSec));
      }
    }
  }, [localProficiency, localStartMs, localEndMs]);

  // --- Start Reading Handler ---
  async function handleStartReading() {
    setLocalProficiency("reading");
    setIsExpanded(true);
    setLocalStartMs(Date.now());
    setLocalEndMs(null);
  }

  // --- Stop (Done) Reading Handler ---
  async function handleStopReading() {
    // 1) Update local state so UI shows "read"
    setLocalProficiency("read");
    setIsExpanded(true);
    const nowMs = Date.now();
    setLocalEndMs(nowMs);

    // 2) Build payload for our new "submitReading" endpoint
    const readingStartTime = new Date(localStartMs).toISOString();
    const readingEndTime = new Date(nowMs).toISOString();
    const readingTimestamp = new Date().toISOString(); // The time we log the event

    const payload = {
      userId,
      subChapterId,
      readingStartTime,
      readingEndTime,
      productReadingPerformance,
      planId,
      // "timestamp" is the final recorded time of the submission
      timestamp: readingTimestamp,
    };

    try {
      // 3) Post it to our new API
      await axios.post(`${backendURL}/api/submitReading`, payload);
      console.log("Reading submission successful:", payload);
    } catch (error) {
      console.error("Error submitting reading record:", error);
      alert("Failed to submit reading record.");
      // Optional: revert local changes or handle error
    }
  }

  // --- Expand/Collapse UI ---
  function toggleExpand() {
    setIsExpanded((prev) => !prev);
  }

  if (!subChapter) {
    return (
      <div style={styles.outerContainer}>
        <p>Loading subchapter {subChapterId}...</p>
      </div>
    );
  }

  // ============ Summaries & Display ============

  let { summary = "" } = subChapter;
  // Remove raw newlines:
  summary = summary.replace(/\r?\n/g, "");

  const maxChars = 200;
  const truncatedHtml =
    summary.length > maxChars ? summary.slice(0, maxChars) + " ..." : summary;

  let displayedHtml;
  if (localProficiency === "empty") {
    displayedHtml = truncatedHtml;
  } else if (localProficiency === "reading") {
    displayedHtml = summary;
  } else {
    // If "read", let user expand or collapse
    displayedHtml = isExpanded ? summary : truncatedHtml;
  }

  // ============ JSX Return ============

  return (
    <div style={styles.outerContainer}>
      <div
        style={styles.readingContentArea}
        dangerouslySetInnerHTML={{ __html: displayedHtml }}
      />

      <div style={styles.footerActions}>
        {renderActionButtons(localProficiency)}
        {localProficiency === "read" && (
          <button style={styles.btnStyle} onClick={toggleExpand}>
            {isExpanded ? "Collapse" : "Expand"}
          </button>
        )}
      </div>

      {/* Show reading stats if desired */}
      <div style={{ marginTop: "8px" }}>
        {localProficiency === "reading" && (
          <div>Reading time so far: {formatTime(readingSeconds)}</div>
        )}
        {localProficiency === "read" && finalReadingTime && (
          <div>Total Reading Time: {finalReadingTime}</div>
        )}
        <div>ProductReadingPerformance: {productReadingPerformance}</div>
      </div>

      {/* Debug overlay */}
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

  // Helper to show the relevant button
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
            Done Reading
          </button>
        );
      case "read":
        return (
          <div style={styles.readingDoneMsg}>
            <em>Reading Complete</em>
          </div>
        );
      default:
        return null;
    }
  }
}

// ============ Basic Styles ============

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