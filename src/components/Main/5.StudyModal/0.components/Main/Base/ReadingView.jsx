import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { fetchReadingTime, incrementReadingTime } from "../../../../../../store/readingSlice";
import { setCurrentIndex, fetchPlan } from "../../../../../../store/planSlice";

// Utility: format mm:ss
function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * chunkHtmlByParagraphs
 * Splits an HTML string into ~180-word pages by paragraphs.
 */
function chunkHtmlByParagraphs(htmlString, chunkSize = 180) {
  let sanitized = htmlString.replace(/\\n/g, "\n");
  sanitized = sanitized.replace(/\r?\n/g, " ");
  
  let paragraphs = sanitized
    .split(/<\/p>/i)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => p + "</p>");

  const pages = [];
  let currentPageHtml = "";
  let currentPageWordCount = 0;

  paragraphs.forEach((paragraph) => {
    const plainText = paragraph.replace(/<[^>]+>/g, "");
    const wordCount = plainText.split(/\s+/).filter(Boolean).length;
    if (currentPageWordCount + wordCount <= chunkSize) {
      currentPageHtml += paragraph;
      currentPageWordCount += wordCount;
    } else {
      if (currentPageHtml.trim().length > 0) {
        pages.push(currentPageHtml);
      }
      currentPageHtml = paragraph;
      currentPageWordCount = wordCount;
    }
  });

  if (currentPageHtml.trim().length > 0) {
    pages.push(currentPageHtml);
  }

  return pages;
}

/**
 * ReadingView
 * -----------
 * Props:
 *  - activity (object with .activityId, .subChapterId, .completed (bool), etc.)
 *  - onNeedsRefreshStatus (optional callback) => notify parent we need to re-fetch subchapter status
 */
export default function ReadingView({ activity, onNeedsRefreshStatus }) {
  if (!activity) {
    return <div style={styles.outerContainer}>No activity provided.</div>;
  }

  const { subChapterId, activityId, completed } = activity;
  const isComplete = completed === true; // single source of truth

  // Redux: userId, planId, currentIndex
  const userId = useSelector((state) => state.auth?.userId || "demoUser");
  const planId = useSelector((state) => state.plan?.planDoc?.id);
  const currentIndex = useSelector((state) => state.plan?.currentIndex);
  const dispatch = useDispatch();

  const [subChapter, setSubChapter] = useState(null);
  const [serverTime, setServerTime] = useState(0);
  const [leftoverSec, setLeftoverSec] = useState(0);
  const [lastSnapMs, setLastSnapMs] = useState(null);

  const [pages, setPages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // We'll track a reading start time so we can log it upon finishing
  const readingStartRef = useRef(null);

  // Show/hide debug overlay
  const [showDebug, setShowDebug] = useState(false);
  const prevSubChapterId = useRef(null);

  // Time breakdown from aggregator
  const [timeDetails, setTimeDetails] = useState([]);
  // Overlay for day-by-day breakdown
  const [showTimeDetailsOverlay, setShowTimeDetailsOverlay] = useState(false);

  // 1) On subChapter change => fetch subchapter + usage
  useEffect(() => {
    if (prevSubChapterId.current && prevSubChapterId.current !== subChapterId) {
      // If needed, handle leftover lumps or cleanup
    }
    prevSubChapterId.current = subChapterId;

    setSubChapter(null);
    setServerTime(0);
    setLeftoverSec(0);
    setLastSnapMs(null);
    setPages([]);
    setCurrentPageIndex(0);

    // Record a fresh reading start time
    readingStartRef.current = new Date();

    if (!subChapterId) return;

    async function fetchSubChapterData() {
      try {
        const res = await axios.get(`http://localhost:3001/api/subchapters/${subChapterId}`);
        setSubChapter(res.data);
      } catch (err) {
        console.error("Failed to fetch subchapter:", err);
      }
    }

    async function fetchUsage() {
      try {
        const actionRes = await dispatch(
          fetchReadingTime({ userId, planId, subChapterId })
        );
        if (fetchReadingTime.fulfilled.match(actionRes)) {
          const existingSec = actionRes.payload || 0;
          setServerTime(existingSec);
          setLeftoverSec(0);
          setLastSnapMs(Date.now());
        }
      } catch (err) {
        console.error("fetchReadingTime error:", err);
      }
    }

    fetchSubChapterData();
    fetchUsage();
  }, [subChapterId, userId, planId, dispatch]);

  // 2) Once subChapter.summary is loaded => chunk it
  useEffect(() => {
    if (!subChapter?.summary) return;
    const chunked = chunkHtmlByParagraphs(subChapter.summary, 180);
    setPages(chunked);
    setCurrentPageIndex(0);
  }, [subChapter]);

  // 3) local second-by-second => leftoverSec++, skip if done
  useEffect(() => {
    if (isComplete) return; // stop counting if activity is already complete
    const timerId = setInterval(() => {
      setLeftoverSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [isComplete]);

  // 4) lumps-of-15 => post lumps to the server, skip if done
  useEffect(() => {
    if (!lastSnapMs) return;
    if (isComplete) return; // do not submit lumps if done

    const heartbeatId = setInterval(async () => {
      if (leftoverSec >= 15) {
        const lumps = Math.floor(leftoverSec / 15);
        if (lumps > 0) {
          const totalToPost = lumps * 15;
          const resultAction = await dispatch(
            incrementReadingTime({
              activityId,
              userId,
              planId,
              subChapterId,
              increment: totalToPost,
            })
          );
          if (incrementReadingTime.fulfilled.match(resultAction)) {
            const newTotal = resultAction.payload || serverTime + totalToPost;
            setServerTime(newTotal);
          } else {
            console.error("Increment reading time failed:", resultAction);
          }
          const remainder = leftoverSec % 15;
          setLeftoverSec(remainder);
          setLastSnapMs(Date.now() - remainder * 1000);
        }
      }
    }, 1000);

    return () => clearInterval(heartbeatId);
  }, [
    leftoverSec,
    lastSnapMs,
    dispatch,
    userId,
    planId,
    subChapterId,
    serverTime,
    isComplete,
    activityId,
  ]);

  // 5) If we want day-by-day breakdown, fetch from getActivityTime
  useEffect(() => {
    if (!activityId) return;
    async function fetchTimeDetails() {
      try {
        const resp = await axios.get("http://localhost:3001/api/getActivityTime", {
          params: { activityId, type: "read" },
        });
        if (resp.data && resp.data.details) {
          setTimeDetails(resp.data.details);
        }
      } catch (err) {
        console.error("fetchTimeDetails error:", err);
      }
    }
    fetchTimeDetails();
  }, [activityId]);

  // Decide what time to display
  const displayedTime = isComplete
    ? serverTime // once complete, show aggregator total
    : serverTime + leftoverSec;

  function handleNextPage() {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  }

  function handlePrevPage() {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  }

  // 6) Finish reading => mark completed: true, re-fetch plan, move index
  async function handleFinishReading() {
    const readingEndTime = new Date();
    try {
      const oldIndex = currentIndex;

      // (A) Make a call to record reading usage
      await axios.post("http://localhost:3001/api/submitReading", {
        userId,
        activityId,
        subChapterId,
        readingStartTime: readingStartRef.current?.toISOString(),
        readingEndTime: readingEndTime.toISOString(),
        planId: planId ?? null,
        timestamp: new Date().toISOString(),
      });

      // (B) Mark the activity as completed in the DB
      const payload = {
        userId,
        planId,
        activityId,
        completed: true, // <= This is the key
      };
      // If there's a replicaIndex, pass it
      if (typeof activity.replicaIndex === "number") {
        payload.replicaIndex = activity.replicaIndex;
      }
      await axios.post("http://localhost:3001/api/markActivityCompletion", payload);

      // (C) Optionally re-fetch subchapter status, then re-fetch plan
      if (typeof onNeedsRefreshStatus === "function") {
        onNeedsRefreshStatus();
      }

      const backendURL = "http://localhost:3001";
      const fetchUrl = "/api/adaptive-plan";
      const fetchAction = await dispatch(
        fetchPlan({
          planId,
          backendURL,
          fetchUrl,
        })
      );

      // (D) set next index
      if (fetchPlan.fulfilled.match(fetchAction)) {
        dispatch(setCurrentIndex(oldIndex + 1));
      } else {
        dispatch(setCurrentIndex(oldIndex + 1));
      }
    } catch (err) {
      console.error("Error submitting reading data:", err);
      dispatch(setCurrentIndex(currentIndex + 1));
    }
  }

  if (!subChapter) {
    return (
      <div style={styles.outerContainer}>
        <p>Loading subchapter {subChapterId}...</p>
      </div>
    );
  }
  if (pages.length === 0) {
    return (
      <div style={styles.outerContainer}>
        <p>No content to display.</p>
      </div>
    );
  }

  const currentPageHtml = pages[currentPageIndex];

  return (
    <div style={styles.outerContainer}>
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h2 style={{ margin: 0 }}>
            Reading
            <span style={styles.clockWrapper}>
              <span style={styles.clockIcon}>🕒</span>
              {formatTime(displayedTime)}

              {/* Show day-by-day breakdown only if completed */}
              {isComplete && (
                <span
                  style={styles.infoIcon}
                  onClick={() => setShowTimeDetailsOverlay(!showTimeDetailsOverlay)}
                >
                  i
                </span>
              )}
            </span>
          </h2>
        </div>

        <div style={styles.cardBody}>
          <div
            style={styles.pageContent}
            dangerouslySetInnerHTML={{ __html: currentPageHtml }}
          />
        </div>

        <div style={styles.cardFooter}>
          <div style={styles.navButtons}>
            {currentPageIndex > 0 && (
              <button style={styles.button} onClick={handlePrevPage}>
                Previous
              </button>
            )}
            {currentPageIndex < pages.length - 1 && (
              <button style={styles.button} onClick={handleNextPage}>
                Next
              </button>
            )}

            {currentPageIndex === pages.length - 1 && (
              <button
                style={{
                  ...styles.finishButton,
                  opacity: isComplete ? 0.6 : 1,
                  cursor: isComplete ? "not-allowed" : "pointer",
                }}
                onClick={isComplete ? undefined : handleFinishReading}
                disabled={isComplete}
              >
                {isComplete ? "Reading Already Complete" : "Finish Reading"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Time Details Overlay */}
      {showTimeDetailsOverlay && (
        <div style={styles.timeDetailsOverlay}>
          <h4 style={{ marginTop: 0 }}>Reading Time Breakdown by Day</h4>
          {timeDetails && timeDetails.length > 0 ? (
            <ul style={{ paddingLeft: "1.25rem", marginTop: "0.5rem" }}>
              {timeDetails.map((item, idx) => (
                <li key={idx} style={{ marginBottom: "0.4rem" }}>
                  <strong>{item.dateStr || "No date"}</strong>:{" "}
                  {item.totalSeconds} sec
                </li>
              ))}
            </ul>
          ) : (
            <p>No day-by-day data found.</p>
          )}
        </div>
      )}

      {/* Debug Info */}
      <div
        style={styles.debugEyeContainer}
        onMouseEnter={() => setShowDebug(true)}
        onMouseLeave={() => setShowDebug(false)}
      >
        <div style={styles.debugEyeIcon}>i</div>
        {showDebug && (
          <div style={styles.debugOverlay}>
            <h4 style={{ marginTop: 0 }}>Debug Info</h4>
            <pre style={styles.debugPre}>
              {JSON.stringify(
                {
                  activity,
                  subChapter,
                  serverTime,
                  leftoverSec,
                  currentPageIndex,
                  totalPages: pages.length,
                  completed,
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// --------------------------------
// Styles
// --------------------------------
const styles = {
  outerContainer: {
    position: "relative",
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
    color: "#fff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxSizing: "border-box",
    padding: "20px",
    fontFamily: `'Inter', 'Roboto', sans-serif`,
  },
  card: {
    width: "80%",
    maxWidth: "700px",
    backgroundColor: "#111",
    borderRadius: "8px",
    border: "1px solid #333",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    overflow: "hidden",
  },
  cardHeader: {
    background: "#222",
    padding: "12px 16px",
    borderBottom: "1px solid #333",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  clockWrapper: {
    marginLeft: "16px",
    fontSize: "0.9rem",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    color: "#ddd",
    backgroundColor: "#333",
    padding: "4px 8px",
    borderRadius: "4px",
  },
  clockIcon: {
    fontSize: "1rem",
  },
  infoIcon: {
    backgroundColor: "#444",
    color: "#fff",
    fontWeight: "bold",
    borderRadius: "50%",
    width: "20px",
    height: "20px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "0.8rem",
    marginLeft: "4px",
  },
  cardBody: {
    flex: 1,
    padding: "16px",
    overflowY: "auto",
  },
  pageContent: {
    fontSize: "1.1rem",
    lineHeight: 1.6,
  },
  cardFooter: {
    borderTop: "1px solid #333",
    padding: "12px 16px",
  },
  navButtons: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "8px",
  },
  button: {
    backgroundColor: "#444",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: "4px",
    cursor: "pointer",
  },
  finishButton: {
    backgroundColor: "#28a745",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  timeDetailsOverlay: {
    position: "absolute",
    top: "64px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "#222",
    border: "1px solid #444",
    borderRadius: "4px",
    padding: "12px",
    zIndex: 10000,
    maxWidth: "300px",
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
    border: "1px solid",
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
  debugPre: {
    backgroundColor: "#333",
    padding: "6px",
    borderRadius: "4px",
    maxHeight: "150px",
    overflowY: "auto",
    whiteSpace: "pre-wrap",
    marginTop: "4px",
  },
};