import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { fetchReadingTime, incrementReadingTime } from "../../../../../../store/readingSlice";

// Utility to format mm:ss
function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * ReadingView
 * -----------
 * Posts usage in 15s chunks to the server, but retains leftover partial seconds in local UI.
 * So the user sees a continuous timer with no backward jumps, 
 * while the server doc only increments by multiples of 15.
 */
export default function ReadingView({ activity }) {
  if (!activity) {
    return <div style={styles.outerContainer}>No activity provided.</div>;
  }

  const subChapterId = activity.subChapterId;
  const userId = useSelector((state) => state.auth?.userId || "demoUser");
  const planId = useSelector((state) => state.plan?.planDoc?.id);

  const dispatch = useDispatch();

  // Subchapter content
  const [subChapter, setSubChapter] = useState(null);

  // serverTime => total usage stored in Firestore (always multiple of 15).
  // leftoverSec => local leftover partial below 15s.
  // We'll combine them to show the displayedTime => serverTime + leftoverSec.
  const [serverTime, setServerTime] = useState(0); 
  const [leftoverSec, setLeftoverSec] = useState(0); 

  // The real-clock moment we last "snapped" or posted lumps. 
  // leftoverSec is how many seconds remain since the last multiple of 15.
  const [lastSnapMs, setLastSnapMs] = useState(null);

  // For a second-level local timer
  const [showDebug, setShowDebug] = useState(false);

  // Track subChapter changes
  const prevSubChapterId = useRef(null);

  // ----------------------------------------------------------------------------
  // 1) On mount / subChapter change => fetch subChapter content + usage
  // ----------------------------------------------------------------------------
  useEffect(() => {
    // If switching subCh => do final leftover lumps or not (we can do final leftover lumps if you like)
    if (prevSubChapterId.current && prevSubChapterId.current !== subChapterId) {
      // we won't post leftover lumps <15 here if you truly only want multiples of 15
      // or if you want partial leftover posted, do it here
    }
    prevSubChapterId.current = subChapterId;

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
        const resultAction = await dispatch(
          fetchReadingTime({ userId, planId, subChapterId })
        );
        if (fetchReadingTime.fulfilled.match(resultAction)) {
          // e.g. 30 if user previously posted 2 lumps
          const existingSec = resultAction.payload || 0; 
          setServerTime(existingSec);
          setLeftoverSec(0);
          setLastSnapMs(Date.now());
        }
      } catch (err) {
        console.error("fetchReadingTime error:", err);
      }
    }

    // reset states
    setSubChapter(null);
    setServerTime(0);
    setLeftoverSec(0);
    setLastSnapMs(null);

    if (subChapterId) {
      fetchSubChapterData();
      fetchUsage();
    }

    return () => {
      // on unmount => optionally post leftover lumps
      // if you want no partial leftover, do nothing 
    };
    // eslint-disable-next-line
  }, [subChapterId, userId, planId]);

  // ----------------------------------------------------------------------------
  // 2) local second timer => leftoverSec++ each second
  // ----------------------------------------------------------------------------
  useEffect(() => {
    const timerId = setInterval(() => {
      setLeftoverSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  // ----------------------------------------------------------------------------
  // 3) Heartbeat => check how many lumps of 15 we can post
  //    leftoverSec might be 31, meaning 2 lumps of 15 => 30 posted, leftover=1
  // ----------------------------------------------------------------------------
  useEffect(() => {
    if (!lastSnapMs) return;
    const heartbeatId = setInterval(async () => {
      // leftoverSec is how many seconds have passed since the last multiple-of-15 
      // plus any from previous lumps we posted
      if (leftoverSec >= 15) {
        // how many lumps can we post?
        let lumps = Math.floor(leftoverSec / 15); // e.g. 31 => lumps=2
        if (lumps > 0) {
          const totalToPost = lumps * 15; 
          // post lumps * 15 to server
          const resultAction = await dispatch(
            incrementReadingTime({ userId, planId, subChapterId, increment: totalToPost })
          );
          if (incrementReadingTime.fulfilled.match(resultAction)) {
            const newTotal = resultAction.payload || (serverTime + totalToPost);
            setServerTime(newTotal);
          }
          // leftover = leftoverSec % 15
          const remainder = leftoverSec % 15; 
          setLeftoverSec(remainder);
          setLastSnapMs(Date.now() - (remainder * 1000));
        }
      }
    }, 1000);

    return () => clearInterval(heartbeatId);
  }, [leftoverSec, lastSnapMs, userId, planId, subChapterId, serverTime, dispatch]);

  // displayedTime => serverTime + leftoverSec
  const displayedTime = serverTime + leftoverSec;

  // If subChapter not loaded => show loading
  if (!subChapter) {
    return (
      <div style={styles.outerContainer}>
        <p>Loading subchapter {subChapterId}...</p>
      </div>
    );
  }

  // show entire text
  let { summary = "" } = subChapter;
  summary = summary.replace(/\r?\n/g, "");

  return (
    <div style={styles.outerContainer}>
      <div style={styles.readingContentArea} dangerouslySetInnerHTML={{ __html: summary }} />

      <div style={{ marginTop: 12 }}>
        <strong>Reading Time: </strong>{formatTime(displayedTime)}
        <div style={{ fontSize: "0.9rem", marginTop: 4 }}>
          <em>Server usage posted in 15-second increments.</em>
        </div>
      </div>

      {/* Debug Overlay */}
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
              {JSON.stringify({ 
                activity, 
                subChapter, 
                serverTime, 
                leftoverSec 
              }, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
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
    maxWidth: "60ch",
    margin: "0 auto",
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
    maxHeight: "120px",
    overflowY: "auto",
    whiteSpace: "pre-wrap",
    marginTop: "4px",
  },
};