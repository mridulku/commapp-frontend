// File: components/Main/5.StudyModal/0.components/Main/QuizComp/QuizView.jsx

import React, { useEffect, useState, useRef } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../../../../../firebase"; // Adjust path if needed
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";

import { fetchQuizTime, incrementQuizTime } from "../../../../../../store/quizTimeSlice";
import { setCurrentIndex } from "../../../../../../store/planSlice";

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
 * A "card-based" quiz that:
 *   - Shows a top bar "Quiz" + a timer
 *   - Paginates questions in sets of (e.g.) 3 per page
 *   - Submits them all at once on the final page
 *   - Then displays pass/fail and "Finish" or "Ok" button
 *   - 15-second lumps time tracking in background
 */
export default function QuizComponent({
  userId = "",
  examId = "general",
  quizStage = "remember",
  subChapterId = "",
  attemptNumber = 1,
  onQuizComplete,
  onQuizFail,
}) {
  const planId = useSelector((state) => state.plan.planDoc?.id);
  const dispatch = useDispatch();
  const [showDebug, setShowDebug] = useState(false);


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
  const [pages, setPages] = useState([]); // array of question-index arrays
  const QUESTIONS_PER_PAGE = 3; // or 2, 5, etc.

  // For environment-based OpenAI key
  const openAiKey = import.meta.env.VITE_OPENAI_KEY || "";

  // ===================================================
  // 1) On mount => fetch questionTypes
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

    return () => {
      // lumps only => skip partial leftover if < 15
    };
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
  }, [lastSnapMs, localLeftover, serverTotal, dispatch, userId, planId, subChapterId, quizStage, attemptNumber]);

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
    const passThreshold = 0.6; 
    const isPassed = avgFloat >= passThreshold;
    setQuizPassed(isPassed);

    // C) Submit to your server
    try {
      const payload = {
        userId,
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

    setGradingResults(overallResults);
    setShowGradingResults(true);
    setLoading(false);
    setStatus("Grading complete.");
  }

  function handleProceed() {
    if (quizPassed && onQuizComplete) {
      onQuizComplete();
    } else if (!quizPassed && onQuizFail) {
      onQuizFail();
    }
  }

  // ===================================================
  // PAGINATION RENDER
  // ===================================================
  // pages[] is an array of question-index arrays => e.g. pages[0] = [0,1,2], pages[1] = [3,4,5], etc.
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

  // ===================================================
  // RENDER
  // ===================================================
  // If we have grading results, we show them. Otherwise we show the quiz form.
  const hasQuestions = generatedQuestions.length > 0 && pages.length > 0;

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

        {/* Body => show instructions, questions, or grading results */}
        <div style={styles.cardBody}>

          {loading && <p style={{ color: "#fff" }}>Loading... {status}</p>}
          {!loading && status && !error && <p style={{ color: "lightgreen" }}>{status}</p>}
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
              <p>Your final score: <b>{finalPercentage}</b></p>
              {quizPassed ? (
                <p style={{ color: "lightgreen" }}>You passed!</p>
              ) : (
                <p style={{ color: "red" }}>You did not pass.</p>
              )}
            </div>
          )}

        </div>

        {/* Footer => pagination or "Submit" or "Finish" */}
        <div style={styles.cardFooter}>
          <div style={styles.navButtons}>
            {/* If not graded yet => show pagination + last page => Submit */}
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

            {/* If showGradingResults => a Finish or OK button */}
            {showGradingResults && (
              <button style={styles.finishButton} onClick={handleProceed}>
                {quizPassed ? "Finish" : "Ok"}
              </button>
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
        const correctOpt = Array.isArray(qObj.options) && qObj.options[correctIndex];
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
      const correct = (userAnswer || "").trim().toLowerCase() ===
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

/**
 * gradeOpenEndedBatch => calls GPT to grade open-ended Qs in batch
 */
async function gradeOpenEndedBatch({ openAiKey, subchapterSummary, items }) {
  if (!openAiKey) {
    return { success: false, gradingArray: [], error: "No OpenAI key" };
  }
  if (!items || !items.length) {
    return { success: true, gradingArray: [], error: "" };
  }

  let questionList = "";
  items.forEach((item, idx) => {
    const { qObj, userAnswer } = item;
    questionList += `
Q#${idx + 1}:
Question: ${qObj.question}
Expected Answer: ${qObj.expectedAnswer || qObj.answerGuidance || "(none)"}
User's Answer: ${userAnswer}
`;
  });

  const userPrompt = `
You are a strict grading assistant.
Context (subchapter summary): "${subchapterSummary}"

For each question, we have an "Expected Answer" and "User's Answer."
Rate correctness 0.0 to 1.0 (float), then provide 1-2 sentences of feedback.

Return valid JSON in this exact format:
{
  "results": [
    {"score": 0.0, "feedback": "..."},
    {"score": 1.0, "feedback": "..."}
  ]
}
No extra commentary—only that JSON.

${questionList}
`.trim();

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a grading assistant. Return JSON only." },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1200,
        temperature: 0.0,
      },
      {
        headers: {
          Authorization: `Bearer ${openAiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const raw = response.data.choices[0].message.content.trim();
    let parsed;
    try {
      const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (err) {
      return {
        success: false,
        gradingArray: [],
        error: "Error parsing JSON from GPT: " + err.message,
      };
    }

    if (!parsed.results || !Array.isArray(parsed.results)) {
      return {
        success: false,
        gradingArray: [],
        error: "No 'results' array in GPT response.",
      };
    }

    const gradingArray = parsed.results.map((r) => ({
      score: r.score ?? 0.0,
      feedback: r.feedback || "",
    }));

    return { success: true, gradingArray, error: "" };
  } catch (err) {
    return {
      success: false,
      gradingArray: [],
      error: "GPT call failed: " + err.message,
    };
  }
}

// ============== Styles (mirrors Reading/Revise) ==============
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