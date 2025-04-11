import React, { useEffect, useState, useRef } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../../../../../firebase"; // Adjust path if needed
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";

import { fetchQuizTime, incrementQuizTime } from "../../../../../../store/quizTimeSlice";
import { setCurrentIndex, fetchPlan } from "../../../../../../store/planSlice";

// Render each question
import QuizQuestionRenderer from "./QuizSupport/QuizQuestionRenderer";

// GPT generation logic
import { generateQuestions } from "./QuizSupport/QuizQuestionGenerator";

// ============== Utility ==============
function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * QuizView
 * --------
 * A "card-based" quiz:
 *   - Generates questions for the chosen subchapter/stage
 *   - Times the user in lumps of 15 seconds
 *   - On submit => local/GPT grading => pass/fail
 *   - If pass => automatically marks the quiz "completed: true"
 *   - If fail => revision logic
 */
export default function QuizView({
  activity,

  userId = "",
  examId = "general",
  quizStage = "remember",
  subChapterId = "",
  attemptNumber = 1,
  onQuizComplete,
  onQuizFail,
}) {
  const planId = useSelector((state) => state.plan.planDoc?.id);
  const currentIndex = useSelector((state) => state.plan.currentIndex);
  const dispatch = useDispatch();
  const [showDebug, setShowDebug] = useState(false);

  // Extract activityId & replicaIndex from the activity
  const { activityId, replicaIndex } = activity || {};

  // ---------- Quiz State ----------
  const [questionTypes, setQuestionTypes] = useState([]);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [gradingResults, setGradingResults] = useState([]);
  const [showGradingResults, setShowGradingResults] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);
  const [finalPercentage, setFinalPercentage] = useState("");

  // Additional info
  const [subchapterSummary, setSubchapterSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  // ---------- Timer / lumps ----------
  const [serverTotal, setServerTotal] = useState(0);
  const [localLeftover, setLocalLeftover] = useState(0);
  const [lastSnapMs, setLastSnapMs] = useState(null);

  const docIdRef = useRef("");

  // ---------- Pagination ----------
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pages, setPages] = useState([]);
  const QUESTIONS_PER_PAGE = 3;

  // For environment-based OpenAI key
  const openAiKey = import.meta.env.VITE_OPENAI_KEY || "";

  // ===================================================
  // 1) On mount => fetch questionTypes from Firestore
  // ===================================================
  useEffect(() => {
    async function fetchQuestionTypes() {
      try {
        const snap = await getDocs(collection(db, "questionTypes"));
        const arr = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setQuestionTypes(arr);
      } catch (err) {
        console.error("Error fetching question types:", err);
      }
    }
    fetchQuestionTypes();
  }, []);

  // ===================================================
  // 2) On mount => build docId, fetch usage, generate quiz
  // ===================================================
  useEffect(() => {
    if (!userId || !subChapterId) {
      console.log("QuizView: userId or subChapterId missing => skip generation.");
      return;
    }
    // docId => user_plan_subCh_quizStage_attempt_date
    const dateStr = new Date().toISOString().substring(0, 10);
    const docId = `${userId}_${planId}_${subChapterId}_${quizStage}_${attemptNumber}_${dateStr}`;
    docIdRef.current = docId;

    // Reset local states
    setServerTotal(0);
    setLocalLeftover(0);
    setLastSnapMs(null);
    setGeneratedQuestions([]);
    setUserAnswers([]);
    setGradingResults([]);
    setShowGradingResults(false);
    setQuizPassed(false);
    setFinalPercentage("");
    setError("");
    setStatus("");
    setLoading(true);

    // A) fetch existing usage
    async function fetchQuizSubActivityTime() {
      try {
        const resultAction = await dispatch(fetchQuizTime({ docId }));
        if (fetchQuizTime.fulfilled.match(resultAction)) {
          const existingSec = resultAction.payload || 0;
          setServerTotal(existingSec);
          setLocalLeftover(0);
          setLastSnapMs(Date.now());
        }
      } catch (err) {
        console.error("fetchQuizTime error:", err);
      }
    }

    // B) Generate quiz
    async function doGenerateQuestions() {
      try {
        setStatus("Generating questions via GPT...");
        const result = await generateQuestions({
          userId,
          planId,
          db,
          subChapterId,
          examId,
          quizStage,
          openAiKey,
        });

        if (!result.success) {
          console.error("generateQuestions => error:", result.error);
          setStatus(`Generation error: ${result.error}`);
          setLoading(false);
          return;
        }

        const allQs = result.questionsData?.questions || [];

        // fetch subchapter summary for GPT grading context
        let summary = "";
        try {
          const ref = doc(db, "subchapters_demo", subChapterId);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            summary = snap.data().summary || "";
          }
        } catch (err) {
          console.error("Error fetching subchapter summary:", err);
        }

        setGeneratedQuestions(allQs);
        setUserAnswers(allQs.map(() => "")); // one answer slot per question
        setSubchapterSummary(summary);
        setStatus(`Successfully generated ${allQs.length} questions.`);

        // Build pagination pages
        const newPages = [];
        for (let i = 0; i < allQs.length; i += QUESTIONS_PER_PAGE) {
          const slice = [];
          for (let j = i; j < i + QUESTIONS_PER_PAGE && j < allQs.length; j++) {
            slice.push(j);
          }
          newPages.push(slice);
        }
        setPages(newPages);
        setCurrentPageIndex(0);
      } catch (err) {
        console.error("Error in doGenerateQuestions:", err);
        setStatus("Error: " + err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchQuizSubActivityTime();
    doGenerateQuestions();
    // eslint-disable-next-line
  }, [userId, subChapterId, quizStage, attemptNumber, planId]);

  // ===================================================
  // 3) local second timer => leftover++
  // ===================================================
  useEffect(() => {
    const timerId = setInterval(() => {
      setLocalLeftover((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  // ===================================================
  // 4) Heartbeat => lumps of 15
  // ===================================================
  useEffect(() => {
    if (!lastSnapMs) return;
    const heartbeatId = setInterval(() => {
      const nowMs = Date.now();
      let diffMs = nowMs - lastSnapMs;

      while (diffMs >= 15000 && localLeftover >= 15) {
        const lumps = Math.floor(localLeftover / 15);
        if (lumps <= 0) break;

        const toPost = lumps * 15;
        dispatch(
          incrementQuizTime({
            docId: docIdRef.current,
            increment: toPost,
            activityId,
            userId,
            planId,
            subChapterId,
            quizStage,
            dateStr: new Date().toISOString().substring(0, 10),
            attemptNumber,
          })
        ).then((action) => {
          if (incrementQuizTime.fulfilled.match(action)) {
            const newTotal = action.payload || serverTotal + toPost;
            setServerTotal(newTotal);
          }
        });

        const remainder = localLeftover % 15;
        setLocalLeftover(remainder);
        setLastSnapMs((prev) => (prev ? prev + lumps * 15000 : nowMs));
        diffMs -= lumps * 15000;
      }
    }, 1000);
    return () => clearInterval(heartbeatId);
  }, [
    lastSnapMs,
    localLeftover,
    serverTotal,
    dispatch,
    userId,
    planId,
    subChapterId,
    quizStage,
    attemptNumber,
  ]);

  // displayedTime => sum lumps + leftover
  const displayedTime = serverTotal + localLeftover;

  // ===================================================
  // Quiz logic: handle user answers, grading, submission
  // ===================================================

  function handleAnswerChange(qIndex, newVal) {
    const updated = [...userAnswers];
    updated[qIndex] = newVal;
    setUserAnswers(updated);
  }

  async function handleQuizSubmit() {
    // We'll gather all answers, run local & GPT grading, then post to server.
    if (!generatedQuestions.length) {
      alert("No questions to submit.");
      return;
    }
    setLoading(true);
    setStatus("Grading quiz...");
    setError("");
  
    const overallResults = new Array(generatedQuestions.length).fill(null);
  
    // Separate locally gradable vs open-ended
    const localItems = [];
    const openEndedItems = [];
  
    generatedQuestions.forEach((qObj, i) => {
      const uAns = userAnswers[i] || "";
      if (isLocallyGradableType(qObj.type)) {
        localItems.push({ qObj, userAnswer: uAns, originalIndex: i });
      } else {
        openEndedItems.push({ qObj, userAnswer: uAns, originalIndex: i });
      }
    });
  
    // A) local grading
    localItems.forEach((item) => {
      const { score, feedback } = localGradeQuestion(item.qObj, item.userAnswer);
      overallResults[item.originalIndex] = { score, feedback };
    });
  
    // B) GPT grading for open-ended
    if (openEndedItems.length > 0) {
      if (!openAiKey) {
        // no key => mark 0
        openEndedItems.forEach((itm) => {
          overallResults[itm.originalIndex] = {
            score: 0,
            feedback: "No GPT key; cannot grade open-ended question.",
          };
        });
      } else {
        const { success, gradingArray, error: gptErr } = await gradeOpenEndedBatch({
          openAiKey,
          subchapterSummary,
          items: openEndedItems,
        });
  
        if (!success) {
          console.error("GPT grading error:", gptErr);
          openEndedItems.forEach((itm) => {
            overallResults[itm.originalIndex] = {
              score: 0,
              feedback: "GPT error: " + gptErr,
            };
          });
        } else {
          // fill into overallResults
          gradingArray.forEach((res, idx) => {
            const origIndex = openEndedItems[idx].originalIndex;
            overallResults[origIndex] = res;
          });
        }
      }
    }
  
    // compute final numeric
    const totalScore = overallResults.reduce((acc, r) => acc + (r?.score || 0), 0);
    const qCount = overallResults.length;
    const avgFloat = qCount > 0 ? totalScore / qCount : 0;
    const percentageString = (avgFloat * 100).toFixed(2) + "%";
    setFinalPercentage(percentageString);
  
    // Pass threshold => 100%
    const passThreshold = 1.0;
    const isPassed = avgFloat >= passThreshold;
    setQuizPassed(isPassed);
  
    // C) Submit to your server => /api/submitQuiz
    try {
      const payload = {
        userId,
        activityId,
        subchapterId: subChapterId,
        quizType: quizStage,
        quizSubmission: generatedQuestions.map((qObj, idx) => ({
          ...qObj,
          userAnswer: userAnswers[idx],
          score: overallResults[idx]?.score ?? 0,
          feedback: overallResults[idx]?.feedback ?? "",
        })),
        score: percentageString,
        totalQuestions: qCount,
        attemptNumber,
        planId,
      };
  
      console.log("[QuizView] handleQuizSubmit => final payload:", payload);
      await axios.post("http://localhost:3001/api/submitQuiz", payload);
      console.log("Quiz submission saved on server!");
    } catch (err) {
      console.error("Error submitting quiz:", err);
      setError("Error submitting quiz: " + err.message);
    }
  
    // D) If passed => mark aggregator doc + re-fetch plan => remain on oldIndex
    if (isPassed) {
      try {
        // Exactly like ReadingView does:
        const oldIndex = currentIndex;
  
        // 1) Mark aggregator => completed: true
        const aggregatorPayload = {
          userId,
          planId,
          activityId,
          completed: true, // 100% pass => completed
        };
        // if there's a replicaIndex, include it
        if (typeof activity.replicaIndex === "number") {
          aggregatorPayload.replicaIndex = activity.replicaIndex;
        }
  
        await axios.post("http://localhost:3001/api/markActivityCompletion", aggregatorPayload);
        console.log("[QuizView] aggregator => completed =>", aggregatorPayload);
  
        // 2) Re-fetch the plan
        const backendURL = "http://localhost:3001";
        const fetchUrl = "/api/adaptive-plan";
        const fetchAction = await dispatch(fetchPlan({ planId, backendURL, fetchUrl }));
  
        // 3) After plan loads => forcibly set currentIndex = oldIndex
        if (fetchPlan.fulfilled.match(fetchAction)) {
          dispatch(setCurrentIndex(oldIndex));
        } else {
          // fallback => also oldIndex
          dispatch(setCurrentIndex(oldIndex));
        }
      } catch (err) {
        console.error("Error marking aggregator or re-fetching plan =>", err);
        // fallback => do not move
        dispatch(setCurrentIndex(currentIndex));
      }
    }
  
    // E) Show grading results => user sees pass/fail screen
    setGradingResults(overallResults);
    setShowGradingResults(true);
    setLoading(false);
    setStatus("Grading complete.");
  }

  // ===================================================
  // Buttons after Grading
  // ===================================================

  // 1) If quiz is passed => we auto-mark the activity as completed => call onQuizComplete
  async function handleQuizSuccess() {
    try {
      // (A) Mark the aggregator doc => completed: true
      //     If we have a replicaIndex, pass it
      if (activityId) {
        const payload = {
          userId,
          planId,
          activityId,
          completed: true,
        };
        if (typeof replicaIndex === "number") {
          payload.replicaIndex = replicaIndex;
        }

        await axios.post("http://localhost:3001/api/markActivityCompletion", payload);
        console.log("[QuizView] handleQuizSuccess => activity completed =>", payload);
      }

      // (B) Then call onQuizComplete if provided
      if (onQuizComplete) {
        onQuizComplete();
      }

      // (C) Move user to next activity
      dispatch(setCurrentIndex(currentIndex + 1));
    } catch (err) {
      console.error("handleQuizSuccess error:", err);
      // fallback
      dispatch(setCurrentIndex(currentIndex + 1));
    }
  }

  // 2) If quiz is failed => "Take Revision Now" => call onQuizFail
  function handleTakeRevisionNow() {
    if (onQuizFail) {
      onQuizFail();
    }
  }

  // 3) If quiz is failed => "Take Revision Later" => new logic => Mark as deferred, re-fetch plan, go next
  async function handleTakeRevisionLater() {
    try {
      const oldIndex = currentIndex;

      // Mark this activity as "deferred"
      if (activityId) {
        const defPayload = {
          userId,
          planId,
          activityId,
          completed: false,        // or you could do "completionStatus":"deferred" if you want
        };
        if (typeof replicaIndex === "number") {
          defPayload.replicaIndex = replicaIndex;
        }

        await axios.post("http://localhost:3001/api/markActivityCompletion", defPayload);
        console.log(`Activity '${activityId}' marked as completed=false (deferred)`);
      }

      // Re-fetch plan
      const backendURL = "http://localhost:3001";
      const fetchUrl = "/api/adaptive-plan";

      const fetchAction = await dispatch(
        fetchPlan({
          planId,
          backendURL,
          fetchUrl,
        })
      );

      // Move next
      if (fetchPlan.fulfilled.match(fetchAction)) {
        dispatch(setCurrentIndex(oldIndex + 1));
      } else {
        dispatch(setCurrentIndex(oldIndex + 1));
      }
    } catch (err) {
      console.error("Error in handleTakeRevisionLater:", err);
      dispatch(setCurrentIndex(currentIndex + 1));
    }
  }

  // ===================================================
  // PAGINATION & Rendering
  // ===================================================
  const hasQuestions = generatedQuestions.length > 0 && pages.length > 0;
  const isOnLastPage = currentPageIndex === pages.length - 1;
  const currentQuestions = pages[currentPageIndex] || [];

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

  return (
    <div style={styles.outerContainer}>
      <div style={styles.card}>

        {/* Top Header => "Quiz" + clock */}
        <div style={styles.cardHeader}>
          <h2 style={{ margin: 0 }}>
            Quiz
            <span style={styles.clockWrapper}>
              <span style={styles.clockIcon}>🕒</span>
              {formatTime(displayedTime)}
            </span>
          </h2>
        </div>

        {/* Body => either quiz questions or grading results */}
        <div style={styles.cardBody}>
          {loading && <p style={{ color: "#fff" }}>Loading... {status}</p>}
          {!loading && status && !error && (
            <p style={{ color: "lightgreen" }}>{status}</p>
          )}
          {error && <p style={{ color: "red" }}>{error}</p>}

          {/* QUIZ QUESTIONS => if not yet submitted */}
          {!showGradingResults && hasQuestions && (
            <div>
              {currentQuestions.map((qIndex) => {
                const questionObj = generatedQuestions[qIndex];
                const grading = gradingResults[qIndex] || null;
                return (
                  <div key={qIndex} style={styles.questionContainer}>
                    <QuizQuestionRenderer
                      questionObj={questionObj}
                      index={qIndex}
                      userAnswer={userAnswers[qIndex]}
                      onUserAnswerChange={(val) => handleAnswerChange(qIndex, val)}
                      score={grading?.score ?? null}
                      feedback={grading?.feedback ?? null}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* GRADING RESULTS => if showGradingResults == true */}
          {showGradingResults && (
            <div style={styles.gradingContainer}>
              <h3>Overall Summary</h3>
              <p>
                Your final score: <b>{finalPercentage}</b>
              </p>
              {quizPassed ? (
                <p style={{ color: "lightgreen" }}>You passed!</p>
              ) : (
                <p style={{ color: "red" }}>You did not pass.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer => pagination or "Submit" or pass/fail buttons */}
        <div style={styles.cardFooter}>
          <div style={styles.navButtons}>
            {/* 1) If not graded yet => show pagination + last page => Submit */}
            {!showGradingResults && hasQuestions && (
              <>
                {currentPageIndex > 0 && (
                  <button style={styles.button} onClick={handlePrevPage}>
                    Previous
                  </button>
                )}
                {!isOnLastPage && (
                  <button style={styles.button} onClick={handleNextPage}>
                    Next
                  </button>
                )}
                {isOnLastPage && (
                  <button style={styles.submitButton} onClick={handleQuizSubmit}>
                    Submit Quiz
                  </button>
                )}
              </>
            )}

            {/* 2) If showGradingResults => show pass/fail flows */}
            {showGradingResults && quizPassed && (
              // If quiz passed => single "Finish" => quiz success
              <button style={styles.finishButton} onClick={handleQuizSuccess}>
                Finish
              </button>
            )}
            {showGradingResults && !quizPassed && (
              // If quiz failed => "Take Revision Now" or "Take Revision Later"
              <>
                <button style={styles.button} onClick={handleTakeRevisionNow}>
                  Take Revision Now
                </button>
                <button style={styles.button} onClick={handleTakeRevisionLater}>
                  Take Revision Later
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Debug Overlay (optional) */}
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
                  userId,
                  planId,
                  subChapterId,
                  quizStage,
                  attemptNumber,
                  serverTotal,
                  localLeftover,
                  pages: pages.map((p) => p.join(",")),
                  currentPageIndex,
                  showGradingResults,
                  finalPercentage,
                  quizPassed,
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

// --------------------------------------------------------------------
// Local vs GPT grading
// --------------------------------------------------------------------
function isLocallyGradableType(qType) {
  switch (qType) {
    case "multipleChoice":
    case "trueFalse":
    case "fillInBlank":
    case "ranking":
      return true;
    default:
      return false;
  }
}

function localGradeQuestion(qObj, userAnswer) {
  let score = 0;
  let feedback = "";
  switch (qObj.type) {
    case "multipleChoice": {
      const correctIndex = qObj.correctIndex;
      const userIndex = parseInt(userAnswer, 10);
      if (!isNaN(userIndex) && userIndex === correctIndex) {
        score = 1.0;
        feedback = "Correct!";
      } else {
        score = 0.0;
        const correctOpt =
          Array.isArray(qObj.options) && qObj.options[correctIndex];
        feedback = `Incorrect. Correct option: ${correctOpt}`;
      }
      break;
    }
    case "trueFalse": {
      if (userAnswer === qObj.correctValue) {
        score = 1.0;
        feedback = "Correct!";
      } else {
        score = 0.0;
        feedback = `Incorrect. The correct answer was "${qObj.correctValue}".`;
      }
      break;
    }
    case "fillInBlank": {
      const correct =
        (userAnswer || "").trim().toLowerCase() ===
        (qObj.answerKey || "").trim().toLowerCase();
      if (correct) {
        score = 1.0;
        feedback = "Correct fill-in!";
      } else {
        score = 0.0;
        feedback = `Incorrect. Expected: "${qObj.answerKey}".`;
      }
      break;
    }
    case "ranking":
      score = 0.0;
      feedback = "Ranking not implemented yet.";
      break;
    default:
      score = 0.0;
      feedback = "Unrecognized question type for local grading.";
  }
  return { score, feedback };
}

async function gradeOpenEndedBatch({ openAiKey, subchapterSummary, items }) {
  // your GPT-based grading code unchanged
  // ...
}

// ============== Styles ==============
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
  submitButton: {
    backgroundColor: "purple",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "bold",
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
  questionContainer: {
    backgroundColor: "#333",
    padding: "8px",
    borderRadius: "4px",
    marginBottom: "1rem",
  },
  gradingContainer: {
    marginTop: "1rem",
    backgroundColor: "#222",
    padding: "1rem",
    borderRadius: "4px",
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