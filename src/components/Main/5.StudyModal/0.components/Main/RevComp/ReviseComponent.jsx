// File: ReviseView.jsx
import React, { useEffect, useState, useRef } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../../../firebase"; // Adjust path as needed
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";

// GPT logic
import { generateRevisionContent } from "./RevSupport/RevisionContentGenerator";
// revise-time actions
import {
  fetchReviseTime,
  incrementReviseTime,
} from "../../../../../../store/reviseTimeSlice";
import { setCurrentIndex } from "../../../../../../store/planSlice";

/** Utility to format mm:ss */
function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Splits an HTML string into ~180-word pages by paragraphs.
 */
function chunkHtmlByParagraphs(htmlString, chunkSize = 180) {
  let sanitized = htmlString.replace(/\\n/g, "\n"); // convert literal "\n"
  sanitized = sanitized.replace(/\r?\n/g, " "); // remove real newlines -> spaces

  // Split by </p>, then re-append </p> to each chunk
  let paragraphs = sanitized
    .split(/<\/p>/i)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => p + "</p>");

  const pages = [];
  let currentPageHtml = "";
  let currentPageWordCount = 0;

  paragraphs.forEach((paragraph) => {
    // remove HTML tags for word count
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

function buildRevisionConfigDocId(exam, stage) {
  const capExam = exam.charAt(0).toUpperCase() + exam.slice(1);
  const capStage = stage.charAt(0).toUpperCase() + stage.slice(1);
  return `revise${capExam}${capStage}`;
}

/** Convert GPT-based revisionData into an HTML string we can page-chunk. */
function createHtmlFromGPTData(revisionData) {
  if (!revisionData) return "";

  let html = "";
  if (revisionData.title) {
    html += `<h3>${revisionData.title}</h3>`;
  }

  if (Array.isArray(revisionData.concepts)) {
    revisionData.concepts.forEach((cObj) => {
      html += `<h4>${cObj.conceptName}</h4>`;
      if (Array.isArray(cObj.notes)) {
        html += "<ul>";
        cObj.notes.forEach((n) => {
          html += `<li>${n}</li>`;
        });
        html += "</ul>";
      }
    });
  }
  return html;
}

/**
 * ReviseView
 * ----------
 * Props:
 *  - userId          (string)
 *  - examId          (default "general")
 *  - quizStage       (e.g. "remember"/"understand"/"apply"/"analyze")
 *  - subChapterId    (string)
 *  - revisionNumber  (number)
 *  - onRevisionDone  (function) => Called when "Take Quiz Now" finishes
 *  - activityId      (string) => The activity's unique ID; needed for deferral
 */
export default function ReviseView({
  userId,
  examId = "general",
  quizStage = "remember",
  subChapterId = "",
  revisionNumber = 1,
  onRevisionDone,
  activity, // The ID we'll defer if user chooses "Take Quiz Later"
}) {
  const planId = useSelector((state) => state.plan?.planDoc?.id);
  const currentIndex = useSelector((state) => state.plan?.currentIndex);
  const dispatch = useDispatch();

  const { activityId } = activity;


  // docId for usage logs
  const docIdRef = useRef("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  // GPT => chunked pages
  const [revisionHtml, setRevisionHtml] = useState("");
  const [pages, setPages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // lumps-of-15
  const [serverTime, setServerTime] = useState(0);
  const [localLeftover, setLocalLeftover] = useState(0);
  const [lastSnapMs, setLastSnapMs] = useState(null);

  // -------------------------------------------
  // 1) On mount => fetch usage + GPT content
  // -------------------------------------------
  useEffect(() => {
    if (!userId || !subChapterId) {
      console.log(
        "ReviseView: missing userId/subChapterId => skipping generation."
      );
      return;
    }

    const openAiKey = import.meta.env.VITE_OPENAI_KEY || "";
    const dateStr = new Date().toISOString().substring(0, 10);
    const docId = `${userId}_${planId}_${subChapterId}_${quizStage}_rev${revisionNumber}_${dateStr}`;
    docIdRef.current = docId;

    // reset states
    setLoading(true);
    setStatus("Loading revision config...");
    setError("");
    setServerTime(0);
    setLocalLeftover(0);
    setLastSnapMs(null);
    setRevisionHtml("");
    setPages([]);
    setCurrentPageIndex(0);

    async function doFetchUsage() {
      try {
        const actionRes = await dispatch(fetchReviseTime({ docId }));
        if (fetchReviseTime.fulfilled.match(actionRes)) {
          const existingSec = actionRes.payload || 0;
          setServerTime(existingSec);
          setLocalLeftover(0);
          setLastSnapMs(Date.now());
        }
      } catch (err) {
        console.error("fetchReviseTime error:", err);
      }
    }

    async function doGenerateGPT() {
      try {
        const docIdForConfig = buildRevisionConfigDocId(examId, quizStage);
        // fetch Firestore doc => "revisionConfigs/docIdForConfig"
        const revRef = doc(db, "revisionConfigs", docIdForConfig);
        const snap = await getDoc(revRef);
        if (!snap.exists()) {
          setStatus(`No revisionConfig doc found for '${docIdForConfig}'.`);
          setLoading(false);
          return;
        }
        const configData = snap.data();

        setStatus("Generating revision content via GPT...");
        const result = await generateRevisionContent({
          db,
          subChapterId,
          openAiKey,
          revisionConfig: configData,
          userId,
          quizStage,
        });

        if (!result.success) {
          setStatus("Failed to generate revision content.");
          setError(result.error || "Unknown GPT error.");
          setLoading(false);
          return;
        }

        // Convert GPT data => HTML => chunk
        const fullHtml = createHtmlFromGPTData(result.revisionData);
        setRevisionHtml(fullHtml);
        setStatus("Revision content generated.");
      } catch (err) {
        console.error("ReviseView => GPT generation error:", err);
        setError(err.message || "Error generating GPT content");
      } finally {
        setLoading(false);
      }
    }

    doFetchUsage();
    doGenerateGPT();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userId,
    subChapterId,
    examId,
    quizStage,
    revisionNumber,
    planId,
    dispatch,
  ]);

  // Once revisionHtml => chunk
  useEffect(() => {
    if (!revisionHtml) return;
    const chunked = chunkHtmlByParagraphs(revisionHtml, 180);
    setPages(chunked);
    setCurrentPageIndex(0);
  }, [revisionHtml]);

  // local second timer => leftover++
  useEffect(() => {
    const secondTimer = setInterval(() => {
      setLocalLeftover((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(secondTimer);
  }, []);

  // lumps-of-15 => incrementReviseTime
  useEffect(() => {
    if (!lastSnapMs) return;
    const heartbeatId = setInterval(async () => {
      if (localLeftover >= 15) {
        const lumps = Math.floor(localLeftover / 15);
        if (lumps > 0) {
          const toPost = lumps * 15;
          const incrRes = await dispatch(
            incrementReviseTime({
              docId: docIdRef.current,
              increment: toPost,
              userId,
              planId,
              subChapterId,
              quizStage,
              dateStr: new Date().toISOString().substring(0, 10),
              revisionNumber,
            })
          );
          if (incrementReviseTime.fulfilled.match(incrRes)) {
            const newTotal = incrRes.payload || serverTime + toPost;
            setServerTime(newTotal);
          }
          const remainder = localLeftover % 15;
          setLocalLeftover(remainder);
          setLastSnapMs(Date.now() - remainder * 1000);
        }
      }
    }, 1000);
    return () => clearInterval(heartbeatId);
  }, [
    lastSnapMs,
    localLeftover,
    dispatch,
    userId,
    planId,
    subChapterId,
    quizStage,
    revisionNumber,
    serverTime,
  ]);

  // displayed time => serverTime + localLeftover
  const displayedTime = serverTime + localLeftover;

  // Pagination
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

  // -----------------------
  // Shared function to mark the revision attempt done on the server
  // -----------------------
  async function submitRevisionAttempt() {
    const payload = {
      userId,
      subchapterId: subChapterId,
      revisionType: quizStage,
      revisionNumber,
      planId,
    };
    await axios.post("http://localhost:3001/api/submitRevision", payload);
    console.log("Revision attempt recorded on server!");
  }

  // -----------------------
  // "Take Quiz Now" => calls onRevisionDone
  // -----------------------
  async function handleTakeQuizNow() {
    try {
      await submitRevisionAttempt();
      // Then run existing logic
      onRevisionDone?.();
    } catch (err) {
      console.error("Error submitting revision attempt (Take Quiz Now):", err);
      alert("Failed to record revision attempt.");
    }
  }



  // -----------------------
  // "Take Quiz Later" => FIRST mark deferred, THEN do existing logic
  // -----------------------
  async function handleTakeQuizLater() {
    try {
      // 1) Mark the activity as deferred (right away)
      if (activityId) {
        await axios.post("http://localhost:3001/api/markActivityCompletion", {
          userId,
          planId,
          activityId,
          completionStatus: "deferred",
        });
        console.log(`Activity '${activityId}' marked deferred!`);
      }

      // 2) Next, submit the revision attempt
      await submitRevisionAttempt();

      // 3) Finally, skip the quiz by moving to the next left panel item
      dispatch(setCurrentIndex(currentIndex + 1));
    } catch (err) {
      console.error("Error in handleTakeQuizLater:", err);
      alert("Failed to record revision attempt and/or mark deferred.");
      // We'll still move forward for now
      dispatch(setCurrentIndex(currentIndex + 1));
    }
  }

  // fallback if no pages
  if (!pages.length && !loading) {
    return (
      <div style={styles.outerContainer}>
        <p>No revision content to display.</p>
      </div>
    );
  }

  const currentPageHtml = pages[currentPageIndex] || "";

  return (
    <div style={styles.outerContainer}>
      <div style={styles.card}>
        {/* Header => "Revision" + clock */}
        <div style={styles.cardHeader}>
          <h2 style={{ margin: 0 }}>Revision</h2>
          <div style={styles.clockWrapper}>
            <span style={styles.clockIcon}>🕒</span>
            {formatTime(displayedTime)}
          </div>
        </div>

        {/* Body => chunked HTML */}
        <div style={styles.cardBody}>
          {loading && <p>Loading... {status}</p>}
          {!loading && error && <p style={{ color: "red" }}>{error}</p>}
          {!loading && status && !error && (
            <p style={{ color: "lightgreen" }}>{status}</p>
          )}

          <div
            style={styles.pageContent}
            dangerouslySetInnerHTML={{ __html: currentPageHtml }}
          />
        </div>

        {/* Footer => Prev, Next, or 2 "Finish" buttons on last page */}
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
              <>
                {/* 1) Take Quiz Now => calls handleTakeQuizNow */}
                <button style={styles.button} onClick={handleTakeQuizNow}>
                  Take Quiz Now
                </button>

                {/* 2) Take Quiz Later => "defer" first, THEN do the existing stuff */}
                <button style={styles.button} onClick={handleTakeQuizLater}>
                  Take Quiz Later
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------- Styles -----------------------
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
    display: "flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#333",
    color: "#ddd",
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
};