// File: ReadingView.jsx
import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { fetchReadingTime, incrementReadingTime } from "../../../../../../store/readingSlice";
import { setCurrentIndex } from "../../../../../../store/planSlice";

// Utility: format mm:ss
function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// chunk by paragraphs
function chunkHtmlByParagraphs(htmlString, chunkSize = 180) {
  // remove / interpret any literal "\n"
  let sanitized = htmlString.replace(/\\n/g, "\n");  // if your data has literal backslash-n
  sanitized = sanitized.replace(/\r?\n/g, " ");      // turn real newlines into spaces

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

export default function ReadingView({ activity }) {
  if (!activity) {
    return <div style={styles.outerContainer}>No activity provided.</div>;
  }

  const subChapterId = activity.subChapterId;
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

  // We'll track a reading start time so that we can submit it upon finishing
  const readingStartRef = useRef(null);

  const [showDebug, setShowDebug] = useState(false);
  const prevSubChapterId = useRef(null);

  // 1) On subChapter change => fetch subchapter + usage
  useEffect(() => {
    if (prevSubChapterId.current && prevSubChapterId.current !== subChapterId) {
      // If needed, handle leftover lumps or cleanup here
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subChapterId, userId, planId]);

  // 2) Once we have subChapter.summary, chunk it up
  useEffect(() => {
    if (!subChapter?.summary) return;
    const chunked = chunkHtmlByParagraphs(subChapter.summary, 180);
    setPages(chunked);
    setCurrentPageIndex(0);
  }, [subChapter]);

  // 3) Increase leftoverSec every second to track local reading time
  useEffect(() => {
    const timerId = setInterval(() => {
      setLeftoverSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  // 4) Every second, check if leftoverSec >= 15 => post lumps of 15
  useEffect(() => {
    if (!lastSnapMs) return;
    const heartbeatId = setInterval(async () => {
      if (leftoverSec >= 15) {
        const lumps = Math.floor(leftoverSec / 15);
        if (lumps > 0) {
          const totalToPost = lumps * 15;
          const resultAction = await dispatch(
            incrementReadingTime({ userId, planId, subChapterId, increment: totalToPost })
          );
          if (incrementReadingTime.fulfilled.match(resultAction)) {
            const newTotal = resultAction.payload || serverTime + totalToPost;
            setServerTime(newTotal);
          }
          const remainder = leftoverSec % 15;
          setLeftoverSec(remainder);
          setLastSnapMs(Date.now() - remainder * 1000);
        }
      }
    }, 1000);
    return () => clearInterval(heartbeatId);
  }, [leftoverSec, lastSnapMs, dispatch, userId, planId, subChapterId, serverTime]);

  const displayedTime = serverTime + leftoverSec;

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

  // 5) When user finishes, log to your /api/submitReading endpoint and then move on
  async function handleFinishReading() {
    const readingEndTime = new Date();

    try {
      // Make the POST call to record reading
      await axios.post("http://localhost:3001/api/submitReading", {
        userId,
        subChapterId,
        readingStartTime: readingStartRef.current?.toISOString(),
        readingEndTime: readingEndTime.toISOString(),
        // Optional if needed:
        // productReadingPerformance: someMetricYouMightHave || null,
        planId: planId ?? null,
        timestamp: new Date().toISOString(), // or any date you want
      });

      // Once submission is successful, move to next index
      dispatch(setCurrentIndex(currentIndex + 1));
    } catch (err) {
      console.error("Error submitting reading data:", err);
      // Decide if you still want to move on or handle errors differently
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
            </span>
          </h2>
        </div>

        <div style={styles.cardBody}>
          {/* Use dangerouslySetInnerHTML to preserve HTML */}
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
              <button style={styles.finishButton} onClick={handleFinishReading}>
                Finish Reading
              </button>
            )}
          </div>
        </div>
      </div>

      {/** Debug info **/}
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
                  readingStartTime: readingStartRef.current,
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

// ------------------------------------------------
// Styles
// ------------------------------------------------
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