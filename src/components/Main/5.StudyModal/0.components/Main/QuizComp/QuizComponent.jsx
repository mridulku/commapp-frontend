import React, { useEffect, useState, useRef } from "react";
import { doc, getDoc, collection, getDocs, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../../../firebase"; // Adjust path if needed
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";

import { fetchQuizTime, incrementQuizTime } from "../../../../../../store/quizTimeSlice";
import { setCurrentIndex, fetchPlan } from "../../../../../../store/planSlice";
import { refreshSubchapter } from "../../../../../../store/aggregatorSlice";

import { CircularProgress, Fade, Chip } from "@mui/material";

import AccessTimeIcon from "@mui/icons-material/AccessTimeRounded";

import Tooltip from "@mui/material/Tooltip";


function Pill({ label, icon }) {
  return (
    <Chip
      icon={icon}
      label={label}
      size="small"
      sx={{
        bgcolor: "#263238",
        color:  "#eceff1",
        fontWeight: 500,
        ".MuiChip-icon": { color: "#eceff1", ml: -.4 }  // icon colour
      }}
    />
  );
}


import {
  gradeOpenEndedBatch as gradeOpenEndedBatchREAL
} from "./QuizSupport/QuizQuestionGrader";

import useConceptMastery from "./QuizSupport/useConceptMastery";



// Render each question
import QuizQuestionRenderer from "./QuizSupport/QuizQuestionRenderer";

import LastAttemptPanel from "./QuizSupport/LastAttemptPanel";

// GPT generation logic
import { generateQuestions } from "./QuizSupport/QuizQuestionGenerator";

// ============== Utility ==============
function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Re-usable logic from HistoryView for final pass/fail per concept
 */

// helper ✨
function LoadingOverlay({ text = "Loading…" }) {
  return (
    <Fade in>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,0,0,0.65)",
          zIndex: 50,
        }}
      >
        <CircularProgress size={48} color="secondary" />
        <span style={{ marginTop: 12, color: "#eee" }}>{text}</span>
      </div>
    </Fade>
  );
}


function computeConceptStatuses(allAtts) {
  const conceptStatusMap = new Map();
  const conceptSet = new Set();

  const sorted = [...allAtts].sort((a, b) => a.attemptNumber - b.attemptNumber);
  sorted.forEach((attempt) => {
    (attempt.conceptStats || []).forEach((cs) => {
      conceptSet.add(cs.conceptName);
      if (!conceptStatusMap.has(cs.conceptName)) {
        conceptStatusMap.set(cs.conceptName, "NOT_TESTED");
      }
      if (cs.passOrFail === "PASS") {
        conceptStatusMap.set(cs.conceptName, "PASS");
      } else if (cs.passOrFail === "FAIL") {
        // Only mark FAIL if not already PASS
        if (conceptStatusMap.get(cs.conceptName) !== "PASS") {
          conceptStatusMap.set(cs.conceptName, "FAIL");
        }
      }
    });
  });

  return { conceptSet, conceptStatusMap };
}


const QUIZ_CACHE_COLL = "quizCache";





/** Build a *stable* doc-id: (no date component!) */
function buildQuizCacheId(userId, planId, subChapterId, stage, attempt) {
  return `${userId}_${planId}_${subChapterId}_${stage}_q${attempt}`;
}

/** try → read cached quiz (returns questions[] | null) */
async function fetchQuizCache(db, cacheId) {
  const snap = await getDoc(doc(db, QUIZ_CACHE_COLL, cacheId));
  return snap.exists() ? snap.data().questions ?? null : null;
}

/* ---------- tiny helpers for completed-attempt info ---------- */
async function fetchQuizMeta(db, cacheId) {
  const snap = await getDoc(doc(db, QUIZ_CACHE_COLL, cacheId));
  return snap.exists() ? snap.data() : {};
}
function markAttemptDone(db, cacheId, passed, pct) {
  return setDoc(
    doc(db, QUIZ_CACHE_COLL, cacheId),
    {
      attemptCompleted : true,
      passed,
      scoredPercentage : pct,
      gradedAt         : serverTimestamp(),
    },
    { merge: true }
  );
}

/** write fresh quiz to cache */
async function saveQuizCache(db, cacheId, questions) {
  await setDoc(
    doc(db, QUIZ_CACHE_COLL, cacheId),
    {
      questions,
      created: serverTimestamp(),
    },
    { merge: false }          // overwrite only on new attempt #
  );
}

/* ------------------------------------------------------------------
   ConceptInlineBar
   - summary chip  :   “✓ 2 / 5”
   - on hover      :   tooltip with one ✓ / ✕ / – per concept
-------------------------------------------------------------------*/

/* ------------------------------------------------------------------
   ConceptInlineBar  (fixed)
   - summary chip  : “✓ 2 / 5”
   - on hover      : shows one ✓ / ✕ / – per concept
-------------------------------------------------------------------*/
/* -------------------------------------------------------------
   Compact concept bar  ✓ 2 / 3  (tooltip shows individual names)
----------------------------------------------------------------*/
function ConceptInlineBar({ conceptStatuses = [] }) {
  const passCount = conceptStatuses.filter(c => c.status === "PASS").length;
  const total     = conceptStatuses.length;

  /* build “✓ Concept A”, “✗ Concept B” … one per line */
  const tooltipText = conceptStatuses
    .map(c => `${c.status === "PASS" ? "✓" : "✗"} ${c.conceptName}`)
    .join("\n");

  return (
    <Tooltip title={<pre style={{ margin: 0 }}>{tooltipText}</pre>} arrow>
      {/* the <span> is what users hover */}
      <span
        style={{
          marginLeft: "auto",
          background: "#37474f",     /* blue-grey 800 */
          color: "#e0f7fa",          /* cyan-50       */
          padding: "2px 8px",
          borderRadius: 4,
          fontSize: 13,
          userSelect: "none",
          cursor: "default",         /* makes it obvious it's hoverable */
          display: "inline-block"
        }}
      >
        {passCount === total ? "✓" : "✗"} {passCount} / {total}
      </span>
    </Tooltip>
  );
}

/**
 * QuizView
 * --------
 * A "card-based" quiz with:
 *  - Aggregator-based concept mastery widget (top-right).
 *  - Generates questions via GPT, times user in lumps of 15s.
 *  - On submit => local/GPT grading => pass/fail => aggregator updates.
 * 
 * 
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

  // ---------- Aggregator states for concept mastery ----------
 // one-liner now:
const {
  loading     : loadingConceptData,
  masteredCount,
  inProgressCount,
  notTestedCount,
  conceptStatuses
} = useConceptMastery(subChapterId, quizStage);

const [viewState, setViewState] = useState("DECIDING");


  // ─── Recent-attempt accordion ────────────────────────────────
const [lastAttempt, setLastAttempt]   = useState(null);   // { questions, results, score, passed }
const [showLastAttempt, setShowLastAttempt] = useState(false);

  // ---------- Quiz State ----------
  const [questionTypes, setQuestionTypes] = useState([]);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [gradingResults, setGradingResults] = useState([]);
  
  const [showGradingResults, setShowGradingResults] = useState(false);
  const [quizPassed,         setQuizPassed]         = useState(false);
  const [noQuestions,        setNoQuestions]        = useState(false); // NEW


  const [stageMastered,   setStageMastered]    = useState(null);   // NEW
const [quizFinished, setQuizFinished] = useState(false);

  const [finalPercentage, setFinalPercentage] = useState("");

  // Additional info
  const [subchapterSummary, setSubchapterSummary] = useState("");
  const [loading, setLoading] = useState(false);    // For quiz loading/generation
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



  // ============================================================
  //  1) Fetch aggregator mastery data for this quizStage
  // ============================================================
  useEffect(() => {
  // run once we have the IDs – regardless of stageMastered value
  if (!userId || !planId || !subChapterId) return;
    async function fetchAggregator() {
      try {
        const resp = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/subchapter-status`, {
          params: { userId, planId, subchapterId: subChapterId },
        });
        if (resp.data) {
          const stageObj = resp.data.quizStagesData?.[quizStage] || {};
          const allStats = stageObj.allAttemptsConceptStats || [];
          const { conceptSet, conceptStatusMap } = computeConceptStatuses(allStats);
          const totalConcepts = conceptSet.size;

          const passCount = [...conceptStatusMap.values()].filter((v) => v === "PASS").length;
          const failCount = [...conceptStatusMap.values()].filter((v) => v === "FAIL").length;
          const notTested = totalConcepts - passCount - failCount;

           // ✔︎ everything mastered?  (and there is at least one concept)
   // mastered only when every concept has at least one PASS and zero FAILs
const mastered =
  totalConcepts > 0 &&          // there are concepts in this stage
  failCount     === 0 &&        // none have ever failed
  notTested     === 0 &&        // all were tested
  passCount     === totalConcepts; // and all of them passed

setStageMastered(mastered);

setViewState(mastered ? "MASTERED" : "GENERATING");

          setMasteredCount(passCount);
          setInProgressCount(failCount);
          setNotTestedCount(notTested);

          // Build array for expanded display
          const statusesArr = [];
          conceptSet.forEach((cName) => {
            const finalStat = conceptStatusMap.get(cName) || "NOT_TESTED";
            statusesArr.push({ conceptName: cName, status: finalStat });
          });
          statusesArr.sort((a, b) => a.conceptName.localeCompare(b.conceptName));
          setConceptStatuses(statusesArr);
        }
      } catch (err) {
        console.error("Error fetching aggregator subchapter data:", err);
      } finally {
      }
    }
    fetchAggregator();
  }, [userId, planId, subChapterId, quizStage]);



  // ============================================================
  //  2) On mount => fetch questionTypes from Firestore
  // ============================================================
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

  useEffect(() => {
  if (stageMastered === true) setNoQuestions(true);
}, [stageMastered]);

  // ============================================================
  //  3) On mount => build docId, fetch usage, generate quiz
  // ============================================================
  useEffect(() => {
  /* don’t even enter until we know mastery == false */
  if (!userId || !subChapterId || !planId || stageMastered !== false) {
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
/* B) 1️⃣  Try cache  →  2️⃣  GPT fallback  →  3️⃣  save to cache */
async function doGenerateQuestions() {
                    // no quiz generation / no cache read
 

  try {
    const cacheId = buildQuizCacheId(
      userId,
      planId,
      subChapterId,
      quizStage,
      attemptNumber            // attempt increments ⇒ new cache doc
    );

    // NEW ➜ did we already finish this attempt earlier?
fetchQuizMeta(db, cacheId).then(meta => {
  if (meta.attemptCompleted) {
    if (meta.passed) {
      /* —— the learner PASSED last time —— */
      // just show the summary – no quiz, no revision
      setLastAttempt({
        score     : meta.scoredPercentage,
        passed    : true,
        questions : [],       // you could fetch them if you stored them
        results   : [],
      });
      setShowGradingResults(true);
      setLoading(false);
      return;                       // ⬅ stop the rest of the effect
    } else {
      /* —— the learner FAILED last time —— */
      if (typeof onQuizFail === "function") onQuizFail();   // auto-jump to Revision
      return;                       // ⬅ stop quiz generation
    }
  }

  
});

    // 1️⃣  look in Firestore
    const cachedQs = await fetchQuizCache(db, cacheId);
    if (cachedQs && cachedQs.length) {
      console.log("[Quiz] hit cache", cacheId);
      return useQuestions(cachedQs);
    }

    // 2️⃣  call GPT generator
    const result = await generateQuestions({
      userId,
      planId,
      db,
      subChapterId,
      examId,
      quizStage,
      openAiKey,
    });

    if (!result.success) throw new Error(result.error || "GPT error");
    const freshQs = result.questionsData?.questions || [];

        /* ─── NEW: nothing left to test ─── */
    if (freshQs.length === 0) {
     
      try {
        if (activityId) {
          await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/markActivityCompletion`,
            {
              userId,
              planId,
              activityId,
              completed: true,
              replicaIndex,
            }
          );
        }
        dispatch(refreshSubchapter(subChapterId));
      } catch (err) {
        console.error("auto-complete markActivityCompletion:", err);
      }

           /* 2. Stay on this component, show ‘continue’ UI */
      setStatus("");          // clear loader text
      setLoading(false);
      setNoQuestions(true);   // ← flag picked up in render()
      return;                 // nothing else to set up


    }

    // 3️⃣  persist for the rest of this attempt
    await saveQuizCache(db, cacheId, freshQs);
    console.log("[Quiz] saved new cache", cacheId);

    return useQuestions(freshQs);
  } catch (err) {
    console.error("doGenerateQuestions()", err);
    setStatus("Error: " + err.message);
  } finally {
    setLoading(false);
  }
}

/* helper: push questions into state exactly once */
function useQuestions(allQs) {
  setGeneratedQuestions(allQs);
  setUserAnswers(allQs.map(() => ""));
  /* (everything that paginates & sets pages/currentPageIndex is unchanged) */
  const newPages = [];
  for (let i = 0; i < allQs.length; i += QUESTIONS_PER_PAGE) {
    newPages.push(allQs.slice(i, i + QUESTIONS_PER_PAGE).map((_, j) => i + j));
  }
  setPages(newPages);
  setCurrentPageIndex(0);
}

    fetchQuizSubActivityTime();
  if (!stageMastered) {
    doGenerateQuestions();       // only if we still need a quiz
  } else {
    setLoading(false);           // stop the spinner
    setNoQuestions(true);        // reuse the same stub-UI path
  }    // eslint-disable-next-line
  }, [userId, subChapterId, quizStage, attemptNumber, planId, stageMastered]);

  // ============================================================
  //  4) local second timer => leftover++
  // ============================================================
 useEffect(() => {
   if (!ready) return;            // run only while quiz is visible
  const t = setInterval(() => setLocalLeftover(p => p + 1), 1000);
  return () => clearInterval(t);
}, [noQuestions]);

useEffect(() => {
  if (quizPassed) {
    setStageMastered(true);
    setNoQuestions(true);      // also stops timer & heartbeat
  }
}, [quizPassed]);              // ← runs exactly when quizPassed flips to true

  // ============================================================
  //  5) Heartbeat => lumps of 15 => increment aggregator doc
  // ============================================================
  useEffect(() => {
  if (noQuestions) return; 
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
    noQuestions,
    localLeftover,
    serverTotal,
    dispatch,
    userId,
    planId,
    subChapterId,
    quizStage,
    attemptNumber,
    activityId,
  ]);

  // displayedTime => sum lumps + leftover
  const displayedTime = serverTotal + localLeftover;

  // ============================================================
  //  6) Quiz logic: handle user answers, grading, submission
  // ============================================================

  function handleAnswerChange(qIndex, newVal) {
    const updated = [...userAnswers];
    updated[qIndex] = newVal;
    setUserAnswers(updated);
  }

  async function handleQuizSubmit() {
    if (!generatedQuestions.length) {
      alert("No questions to submit.");
      return;
    }
    setLoading(true);
    setError("");

    const overallResults = new Array(generatedQuestions.length).fill(null);
    const localItems = [];
    const openEndedItems = [];

    generatedQuestions.forEach((qObj, i) => {
      const uAns = userAnswers[i] || "";
      if (isLocallyGradableType(qObj.type)) {
        localItems.push({ qObj, userAnswer: uAns, originalIndex: i });
      } else {
                // IMPORTANT: property **must be called userAns** so the grader can see it
        openEndedItems.push({ qObj, userAns: uAns, originalIndex: i });
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
        const { success, gradingArray, error: gptErr } = await gradeOpenEndedBatchREAL({
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

     const gradedQuestions = generatedQuestions.map((qObj, idx) => ({
   ...qObj,
   userAnswer : userAnswers[idx],
   score      : overallResults[idx]?.score ?? 0,
   feedback   : overallResults[idx]?.feedback ?? "",
 }));

    // compute final numeric
    const totalScore = overallResults.reduce((acc, r) => acc + (r?.score || 0), 0);
    const qCount = overallResults.length;
    const avgFloat = qCount > 0 ? totalScore / qCount : 0;
    const percentageString = (avgFloat * 100).toFixed(2) + "%";
    setFinalPercentage(percentageString);

    // Pass threshold => 100% for your example
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
        quizSubmission: gradedQuestions,
        score: percentageString,
        totalQuestions: qCount,
        attemptNumber,
        planId,
      };
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/submitQuiz`,payload);
      console.log("Quiz submission saved on server!");
      dispatch(refreshSubchapter(subChapterId));

         /* ▶︎ tell StageManager the slice is stale so it will re-fetch
      next time we land on this stage */
   
    } catch (err) {
      console.error("Error submitting quiz:", err);
      setError("Error submitting quiz: " + err.message);
    }

     const cacheId = buildQuizCacheId(
   userId, planId, subChapterId, quizStage, attemptNumber
 );
 

  // ─── EARLY EXIT: did we already finish this attempt? ───
 (async () => {
   const meta = await fetchQuizMeta(db, cacheId);
   if (meta.attemptCompleted) {
     if (meta.passed) {
       // They passed last time → just show the summary screen
       setLastAttempt({
         score     : meta.scoredPercentage,
         passed    : true,
         questions : [],   // you can fetch/store them if you wish
         results   : [],
       });
       setShowGradingResults(true);   // shows the pass screen
     } else {
       // They failed last time → jump straight to Revision stage
       if (typeof onQuizFail === "function") onQuizFail();
     }
     setLoading(false);      // stop any spinner
     return;                 // 💥 stop the rest of this effect
   }

   // If we reach here, no completed attempt exists → make/restore quiz
 })();
 

    // D) If passed => mark aggregator doc + re-fetch plan => remain on oldIndex
    if (isPassed) {

       const cacheId = buildQuizCacheId(
   userId, planId, subChapterId, quizStage, attemptNumber);
 try {
   await setDoc(doc(db, QUIZ_CACHE_COLL, cacheId),
                { questions: [] }, { merge: true });
 } catch(e) { console.warn("Could not clear quiz cache:", e); }
      try {
        const oldIndex = currentIndex;

        // aggregator => completed: true
        const aggregatorPayload = {
          userId,
          planId,
          activityId,
          completed: true, // 100% pass => completed
        };
        if (typeof replicaIndex === "number") {
          aggregatorPayload.replicaIndex = replicaIndex;
        }
        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/markActivityCompletion`, aggregatorPayload);
        console.log("[QuizView] aggregator => completed =>", aggregatorPayload);

        // Re-fetch plan
        const backendURL = import.meta.env.VITE_BACKEND_URL;
        const fetchUrl = "/api/adaptive-plan";
        const fetchAction = await dispatch(fetchPlan({ planId, backendURL, fetchUrl }));
        if (fetchPlan.fulfilled.match(fetchAction)) {
          dispatch(setCurrentIndex(oldIndex));
        } else {
          dispatch(setCurrentIndex(oldIndex));
        }
      } catch (err) {
        console.error("Error marking aggregator or re-fetching plan =>", err);
        dispatch(setCurrentIndex(currentIndex));
      }
    }

    // E) Show grading results => user sees pass/fail screen
    setGradingResults(overallResults);

    // remember the full attempt so we can show it later
setLastAttempt({
    questions : gradedQuestions,   // 👈 now each q carries userAnswer
   results   : overallResults,
   score     : percentageString,
   passed    : isPassed,
});
setShowLastAttempt(false);          // start collapsed




    setShowGradingResults(true);
    setLoading(false);

     if (isPassed) {
   setStageMastered(true);   // <- hide quiz immediately
   setNoQuestions(true);     // (optional) stops timer / heartbeat useEffects
   setQuizFinished(true);          // ← NEW
 }
  }

  // ============================================================
  //  7) Pass/Fail flows
  // ============================================================
  async function handleQuizSuccess() {
    dispatch(invalidateQuizStage({ userId, planId, subChapterId, stage: quizStage }));
    try {
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
        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/markActivityCompletion`,payload);
        console.log("[QuizView] handleQuizSuccess => activity completed =>", payload);
      }
      dispatch(refreshSubchapter(subChapterId));
      if (onQuizComplete) {
        onQuizComplete();
      }
      dispatch(setCurrentIndex(currentIndex + 1));
    } catch (err) {
      console.error("handleQuizSuccess error:", err);
      dispatch(setCurrentIndex(currentIndex + 1));
    }
  }

  function handleTakeRevisionNow() {
    dispatch(invalidateQuizStage({ userId, planId, subChapterId, stage: quizStage }));
    if (onQuizFail) {
      onQuizFail();
    }
  }

  async function handleTakeRevisionLater() {
    dispatch(invalidateQuizStage({ userId, planId, subChapterId, stage: quizStage }));
    try {
      const oldIndex = currentIndex;
      if (activityId) {
        const defPayload = {
          userId,
          planId,
          activityId,
          completed: false,
        };
        if (typeof replicaIndex === "number") {
          defPayload.replicaIndex = replicaIndex;
        }

        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/markActivityCompletion`, defPayload);
        console.log(`Activity '${activityId}' marked as completed=false (deferred)`);
      }
      const backendURL = import.meta.env.VITE_BACKEND_URL;
      const fetchUrl = "/api/adaptive-plan";
      const fetchAction = await dispatch(fetchPlan({ planId, backendURL, fetchUrl }));
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

  // ============================================================
  //  8) Pagination & Rendering
  // ============================================================
   const hasQuestions =
   stageMastered === false &&
   !noQuestions &&
   generatedQuestions.length > 0 &&
   pages.length > 0;

// ── derived UI flags ─────────────────────────
const deciding   = stageMastered === null;             // waiting for aggregator
const generating = loading && !showGradingResults;     // cache / GPT
const grading    = loading &&  showGradingResults;     // after Submit
const ready      = !loading && !showGradingResults &&  // questions visible
                   stageMastered === false;           
 


    const isOnLastPage   = currentPageIndex === pages.length - 1;
const currentQuestions = pages[currentPageIndex] || [];

const pageLabel = `${currentPageIndex + 1} / ${pages.length}`;


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

             {/* FULL-CARD LOADER */}
     {(generating || deciding) && (
       <LoadingOverlay
         text={
           deciding
             ? "Checking prerequisites…"
             : "Generating questions…"
         }
       />
     )}

         {/* ====== All-mastered stub ====== */}
 {stageMastered && (
   <div style={styles.gradingContainer}>
     <h3>All concepts mastered 🎉</h3>
     <p>You don’t need a quiz for this stage.</p>
     <button
       style={styles.finishButton}
       onClick={handleQuizSuccess}   // same path as a 100 % pass
     >
       Continue
     </button>
   </div>
 )}

     

        {/* ---------- Top Header => "Quiz" + clock ---------- */}
       {/* HEADER — show only when questions are on screen */}
{ready && (
  <div style={{ ...styles.cardHeader, padding: "8px 16px" }}>
    {/* title – remove default <h2> margins so bar stays slim */}
    <h2 style={{ margin: 0, fontWeight: 600 }}>Quiz</h2>

    <Pill label={`Attempt #${attemptNumber}`} />
    <Pill
      label={formatTime(displayedTime)}
      icon={<AccessTimeIcon sx={{ fontSize: 16 }} />}
    />
    <Pill label={`${generatedQuestions.length} questions`} />

    {/* compact concept widget */}
    <ConceptInlineBar conceptStatuses={conceptStatuses} />
  </div>
)}

{/* FULL-SCREEN LOADERS */}
{deciding   && <LoadingOverlay text="Checking prerequisites…" />}
{generating && <LoadingOverlay text="Generating questions…"  />}
{grading    && <LoadingOverlay text="Grading quiz…"          />}

        {/* ---------- Body => quiz or grading results ---------- */}
        <div style={styles.cardBody}>

  {/* keep whatever you want to show when NOT loading */}
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
    
    {quizPassed ? (
      <p style={{ color: "lightgreen" }}>You passed!</p>
    ) : (
      <p style={{ color: "red" }}>You did not pass.</p>
    )}

    {/* ← the accordion now lives INSIDE the summary box */}
    <LastAttemptPanel
      attempt={lastAttempt}
      show={showLastAttempt}
      onToggle={() => setShowLastAttempt((p) => !p)}
    />
  </div>
)}

          
        </div>

       {/* ---------- Footer => pagination / submit ---------- */}
{!noQuestions && (
  <div style={styles.cardFooter}>
    <div style={styles.navRow /* ← now a grid */}>
      {/* col-1  ─────────────────────────── */}
      {currentPageIndex > 0 ? (
        <button style={styles.button} onClick={handlePrevPage}>
          Previous
        </button>
      ) : (
        <span />   /* empty cell keeps layout */
      )}

      {/* col-2  (always centred) ─────────*/}
      <span style={styles.pageLabel}>
        Page&nbsp;{currentPageIndex + 1}&nbsp;/&nbsp;{pages.length}
      </span>

      {/* col-3  ─────────────────────────── */}
      {!showGradingResults && hasQuestions && (
        isOnLastPage ? (
          <button style={styles.submitButton} onClick={handleQuizSubmit}>
            Submit&nbsp;Quiz
          </button>
        ) : (
          <button style={styles.button} onClick={handleNextPage}>
            Next
          </button>
        )
      )}

      {showGradingResults && quizPassed && (
        <button style={styles.finishButton} onClick={handleQuizSuccess}>
          Finish
        </button>
      )}
      {showGradingResults && !quizPassed && (
        <>
          <button style={styles.button} onClick={handleTakeRevisionNow}>
            Take&nbsp;Revision&nbsp;Now
          </button>
          <button style={styles.button} onClick={handleTakeRevisionLater}>
            Take&nbsp;Revision&nbsp;Later
          </button>
        </>
      )}
    </div>
  </div>
)}
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



// --------------------------------------------------------------------
// Collapsible MasterySummaryPanel (top-right corner)
// --------------------------------------------------------------------
function MasterySummaryPanel({
  loadingConceptData,
  masteredCount,
  inProgressCount,
  notTestedCount,
  conceptStatuses,
}) {
  const [expanded, setExpanded] = useState(false);
  const totalConcepts = masteredCount + inProgressCount + notTestedCount;
  const progressPct = totalConcepts > 0
    ? Math.round((masteredCount / totalConcepts) * 100)
    : 0;

  function toggleExpand() {
    setExpanded((prev) => !prev);
  }

  if (loadingConceptData) {
    return (
      <div style={styles.masteryPanel}>
        <p style={{ fontSize: "0.9rem", margin: 0 }}>Loading concept data...</p>
      </div>
    );
  }

  return (
    <div style={styles.masteryPanel}>
      {/* Collapsed View => progress bar + "X / Y mastered" */}
      {!expanded && (
        <div style={{ fontSize: "0.9rem" }}>
          <div style={{ marginBottom: 6 }}>
            <strong>{masteredCount}</strong> / {totalConcepts} mastered
            &nbsp;({progressPct}%)
          </div>
          <ProgressBar pct={progressPct} />
        </div>
      )}

      {/* Expanded => show concept statuses */}
      {expanded && (
        <>
          <div style={{ fontSize: "0.85rem", marginBottom: 8 }}>
            <strong>Mastered:</strong> {masteredCount} &nbsp;|&nbsp;
            <strong>In Progress:</strong> {inProgressCount} &nbsp;|&nbsp;
            <strong>Not Tested:</strong> {notTestedCount}
          </div>
          <ul style={styles.conceptList}>
            {conceptStatuses.map((obj) => {
              const { conceptName, status } = obj;
              let color = "#bbb";
              if (status === "PASS") color = "#4caf50"; // green
              else if (status === "FAIL") color = "#f44336"; // red
              return (
                <li key={conceptName} style={{ marginBottom: 4 }}>
                  <span style={{ color }}>{conceptName}</span>{" "}
                  <span style={{ color: "#999", fontSize: "0.8rem" }}>
                    ({status})
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* Expand/collapse toggle */}
      <div style={{ textAlign: "right", marginTop: 6 }}>
        <button onClick={toggleExpand} style={styles.expandBtn}>
          {expanded ? "▲" : "▼"}
        </button>
      </div>
    </div>
  );
}




// Simple horizontal progress bar
function ProgressBar({ pct }) {
  const containerStyle = {
    width: "100%",
    height: "8px",
    backgroundColor: "#444",
    borderRadius: "4px",
    overflow: "hidden",
  };
  const fillStyle = {
    width: `${pct}%`,
    height: "100%",
    backgroundColor: "#66bb6a",
  };
  return (
    <div style={containerStyle}>
      <div style={fillStyle} />
    </div>
  );
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
    position: "relative",
    width: "80%",
    maxWidth: "700px",
    backgroundColor: "#111",
    minHeight: "280px", 
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
    gap: 12            // puts space between the pills
    
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
  padding: "24px 16px 0",     // <- 24px top, 16px sides, 0 bottom
  overflowY: "auto",
},
  cardFooter: {
  /* Seamless footer – looks like part of the page */
  padding: "16px",
  borderTop: "none",          // ← removes the line
  display: "flex",
  justifyContent: "flex-end",
},
  navButtons: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",        // was 8px
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
  /* No box – just a little vertical rhythm */
  padding: "0 0 24px 0",     // space below each Q
  border: "none",
  background: "transparent",
  borderRadius: 0,
},
  gradingContainer: {
    marginTop: "1rem",
    backgroundColor: "#222",
    padding: "1rem",
    borderRadius: "4px",
  },

  // Debug overlay
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

  // Mastery panel => top-right, below top header
  masteryPanel: {
    position: "absolute",
    top: "50px", // offset from top so it doesn't overlap your debug icon
    right: "8px",
    backgroundColor: "#222",
    border: "1px solid #444",
    borderRadius: "4px",
    padding: "8px 12px",
    fontSize: "0.9rem",
    maxWidth: "220px",
    minHeight: "44px",
  },
  expandBtn: {
    backgroundColor: "#444",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "2px 6px",
    cursor: "pointer",
    fontSize: "0.8rem",
    lineHeight: 1,
  },
  conceptList: {
    margin: 0,
    paddingLeft: 16,
    maxHeight: "120px",
    overflowY: "auto",
  },
  lastAttemptWrapper: { marginBottom: "1rem" },
collapseBtn:       {
  backgroundColor: "#444",
  color: "#fff",
  border: "none",
  padding: "6px 10px",
  borderRadius: "4px",
  cursor: "pointer",
  marginBottom: "6px",
},
lastAttemptInner:  {
  backgroundColor: "#222",
  padding: "8px",
  borderRadius: "4px",
},
navRow: {
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",   // three equal tracks
  alignItems: "center",
  gap: 8
},
pageLabel: {
  justifySelf: "center",                 // centres within its column
  fontSize: 14,
  opacity: 0.85,
  userSelect: "none"
}
};

// --------------------------------------------------------------------
// A dummy GPT grader for open-ended. You'd replace with your real logic.
// --------------------------------------------------------------------
