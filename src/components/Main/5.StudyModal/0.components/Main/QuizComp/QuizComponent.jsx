/**
 * File: QuizComponent.jsx
 * Description: 
 *  - Renders a single quiz attempt for a given user/subchapter/stage.
 *  - Auto-fetches question config & calls generateQuestions from QuizQuestionGenerator.
 *  - Renders questions of multiple types.
 *  - Locally grades "easy" question types (MCQ, T/F, fillInBlank).
 *  - Sends "openEnded" types to GPT for 0..1 scoring.
 *  - Submits the final attempt to your backend (now including planId).
 *  - Shows per-question feedback & final score, then waits for user to click "Proceed" to finalize.
 */

import React, { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../../../../../firebase"; // adjust path if needed
import axios from "axios";
import QuizQuestionRenderer from "./QuizSupport/QuizQuestionRenderer"; // Renders each question
import { generateQuestions } from "./QuizSupport/QuizQuestionGenerator"; // Our updated generator
import { useSelector } from "react-redux"; // <-- import from react-redux

export default function QuizComponent({
  userId = "",
  examId = "general",
  quizStage = "remember",
  subChapterId = "",
  attemptNumber = 1,
  onQuizComplete,
  onQuizFail,
}) {
  // 1) Retrieve planId from Redux so we can pass it in the final submission
  const planId = useSelector((state) => state.plan.planDoc?.id);

  // Basic states
  const [questionTypes, setQuestionTypes] = useState([]); 
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [gradingResults, setGradingResults] = useState([]);
  const [showGradingResults, setShowGradingResults] = useState(false);

  const [subchapterSummary, setSubchapterSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const [quizPassed, setQuizPassed] = useState(false); // store pass/fail state
  const [finalPercentage, setFinalPercentage] = useState(""); // for display

  // Read the OpenAI key from .env (Vite)
  const openAiKey = import.meta.env.VITE_OPENAI_KEY || "";

  // ==============================
  // 1) Fetch "questionTypes" if needed
  // ==============================
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

  // ==============================
  // 2) Generate questions after we have questionTypes, userId, subChapterId, etc.
  // ==============================
  useEffect(() => {
    if (!userId || !subChapterId) {
      console.log("QuizComponent: userId or subChapterId is empty => skipping generation.");
      return;
    }
    if (!openAiKey) {
      console.warn("QuizComponent: No OpenAI key found. GPT calls may fail or skip.");
    }

    async function doGenerate() {
      try {
        setLoading(true);
        setStatus("Generating questions...");

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

        // Optionally fetch subchapter summary if not returned by the generator
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

        // Final step: store everything in state
        setGeneratedQuestions(allQs);
        setUserAnswers(allQs.map(() => "")); // blank answers initially
        setSubchapterSummary(summary);
        setStatus(`Successfully generated ${allQs.length} questions.`);
      } catch (err) {
        console.error("Error in doGenerate:", err);
        setStatus("Error: " + err.message);
      } finally {
        setLoading(false);
      }
    }

    doGenerate();
  }, [questionTypes, userId, subChapterId, quizStage, examId, openAiKey]);

  // ==============================
  // The main quiz rendering
  // ==============================
  function renderQuizForm() {
    if (!generatedQuestions.length) return null;

    return (
      <div style={{ marginTop: "1rem" }}>
        <h3>Quiz</h3>
        {generatedQuestions.map((questionObj, idx) => {
          // If we've graded, get this question's results
          const result = gradingResults[idx] || null;

          return (
            <div key={idx} style={styles.questionContainer}>
              <QuizQuestionRenderer
                questionObj={questionObj}
                index={idx}
                userAnswer={userAnswers[idx]}
                onUserAnswerChange={(val) => handleAnswerChange(idx, val)}

                // If showGradingResults, also pass feedback + score 
                score={showGradingResults && result ? result.score : null}
                feedback={showGradingResults && result ? result.feedback : null}
              />
            </div>
          );
        })}

        {/* Button to submit for grading */}
        {!showGradingResults && (
          <button style={styles.submitBtn} onClick={handleQuizSubmit}>
            Submit All
          </button>
        )}
      </div>
    );
  }

  // Update userAnswers array as user types/selects
  function handleAnswerChange(index, newVal) {
    const updated = [...userAnswers];
    updated[index] = newVal;
    setUserAnswers(updated);
  }

  // ==============================
  // 4) handleQuizSubmit => grade, store results, do NOT call parent callbacks yet
  // ==============================
  async function handleQuizSubmit() {
    if (!generatedQuestions.length) {
      alert("No questions to submit.");
      return;
    }
    setLoading(true);
    setStatus("Grading quiz...");

    // We'll accumulate results in an array parallel to generatedQuestions
    const overallResults = new Array(generatedQuestions.length).fill(null);

    // Separate local vs. GPT-based
    const localItems = [];
    const openEndedItems = [];

    generatedQuestions.forEach((qObj, idx) => {
      const userAns = userAnswers[idx] || "";
      if (isLocallyGradableType(qObj.type)) {
        localItems.push({ qObj, userAns, originalIndex: idx });
      } else {
        openEndedItems.push({ qObj, userAns, originalIndex: idx });
      }
    });

    // 1) Local grading
    localItems.forEach((item) => {
      const { qObj, userAns, originalIndex } = item;
      const { score, feedback } = localGradeQuestion(qObj, userAns);
      overallResults[originalIndex] = { score, feedback };
    });

    // 2) GPT grading
    if (openEndedItems.length > 0 && openAiKey) {
      const { success, gradingArray, error } = await gradeOpenEndedBatch({
        openAiKey,
        subchapterSummary,
        items: openEndedItems,
      });
      if (!success) {
        console.error("GPT grading error:", error);
        // Fill 0 for these items if GPT fails
        openEndedItems.forEach((itm) => {
          overallResults[itm.originalIndex] = {
            score: 0,
            feedback: "GPT grading error: " + error,
          };
        });
      } else {
        // Merge GPT results
        gradingArray.forEach((res, i) => {
          const origIdx = openEndedItems[i].originalIndex;
          overallResults[origIdx] = res;
        });
      }
    } else if (openEndedItems.length > 0 && !openAiKey) {
      // no key => can't GPT-grade
      openEndedItems.forEach((itm) => {
        overallResults[itm.originalIndex] = {
          score: 0,
          feedback: "No GPT key; cannot grade open-ended question.",
        };
      });
    }

    // 3) Compute final numeric score => store as percentage
    const totalScore = overallResults.reduce((acc, r) => acc + (r?.score || 0), 0);
    const qCount = overallResults.length;
    const avgFloat = qCount > 0 ? totalScore / qCount : 0; // e.g. 0.72
    const percentageString = (avgFloat * 100).toFixed(2) + "%";

    // 4) Submit results to server, now including planId from Redux
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
        planId,  // <-- pass planId to /api/submitQuiz
      };

      console.log("[QuizComponent] handleQuizSubmit => final payload:", payload);
      await axios.post("http://localhost:3001/api/submitQuiz", payload);

      console.log("Quiz submission saved on server!");
    } catch (err) {
      console.error("Error submitting quiz:", err);
    }

    // 5) Store in local state so we can show user
    setGradingResults(overallResults);
    setShowGradingResults(true);
    setLoading(false);
    setStatus("Grading complete.");

    // 6) Decide pass/fail but do NOT call parent's callback yet
    const passThreshold = 0.6; // or use quizStage-based threshold if you want
    const isPassed = avgFloat >= passThreshold;
    setQuizPassed(isPassed);
    setFinalPercentage(percentageString);
  }

  // ==============================
  // 5) The "Proceed" button => now we call onQuizComplete/onQuizFail
  // ==============================
  function handleProceed() {
    if (quizPassed && onQuizComplete) {
      onQuizComplete();
    } else if (!quizPassed && onQuizFail) {
      onQuizFail();
    }
  }

  // ==============================
  // 6) Optionally: render a summary panel for final feedback
  // ==============================
  function renderGradingResults() {
    if (!showGradingResults || !gradingResults.length) return null;

    return (
      <div style={styles.gradingContainer}>
        <h3>Overall Summary</h3>
        <p>Your final score: <b>{finalPercentage}</b></p>
        {quizPassed ? (
          <p style={{ color: "lightgreen" }}>You passed!</p>
        ) : (
          <p style={{ color: "red" }}>You did not pass.</p>
        )}
        
        {/* A "Finish" or "Proceed" button to let the user move on */}
        <button style={styles.finishBtn} onClick={handleProceed}>
          {quizPassed ? "Finish" : "Ok, Proceed"}
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>
        Quiz Component ({examId} / {quizStage})
      </h2>

      {loading && <p style={styles.text}>Loading... {status}</p>}
      {!loading && status && <p style={{ color: "lightgreen" }}>{status}</p>}

      {/* Render the quiz form (questions) */}
      {renderQuizForm()}

      {/* Render the final summary (or big feedback panel) */}
      {renderGradingResults()}
    </div>
  );
}

// ====== Helper to determine which types are locally gradable
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

// ====== Local grading logic
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
        feedback = `Incorrect. The correct option was: ${correctOpt}`;
      }
      break;
    }
    case "trueFalse": {
      if (userAnswer === qObj.correctValue) {
        score = 1.0;
        feedback = "Correct (True/False).";
      } else {
        score = 0.0;
        feedback = `Incorrect. The correct answer was "${qObj.correctValue}".`;
      }
      break;
    }
    case "fillInBlank": {
      const correct = (userAnswer || "").trim().toLowerCase() === 
                      (qObj.answerKey || "").trim().toLowerCase();
      score = correct ? 1.0 : 0.0;
      feedback = correct
        ? "Correct fill-in!"
        : `Incorrect. Expected: "${qObj.answerKey}".`;
      break;
    }
    case "ranking":
      // If you have a correct order in qObj.correctOrder, compare with userAnswer
      // For now, not implemented => 0.0
      score = 0.0;
      feedback = "Ranking not implemented yet.";
      break;
    default:
      // Not recognized => no local grading
      score = 0.0;
      feedback = "Unrecognized question type for local grading.";
  }

  return { score, feedback };
}

// ====== GPT-based grading for openEnded items
async function gradeOpenEndedBatch({ openAiKey, subchapterSummary, items }) {
  if (!openAiKey) {
    return { success: false, gradingArray: [], error: "No OpenAI key" };
  }
  if (!items || !items.length) {
    return { success: true, gradingArray: [], error: "" };
  }

  let questionList = "";
  items.forEach((item, idx) => {
    const { qObj, userAns } = item;
    questionList += `
Q#${idx + 1}:
Question: ${qObj.question}
Expected Answer: ${qObj.expectedAnswer || qObj.answerGuidance || "(none)"}
User's Answer: ${userAns}
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

// Styles
const styles = {
  container: {
    padding: "1rem",
    color: "#fff",
    maxWidth: "600px",
    margin: "0 auto",
  },
  heading: {
    marginBottom: "1rem",
  },
  text: {
    color: "#fff",
  },
  questionContainer: {
    backgroundColor: "#333",
    padding: "8px",
    borderRadius: "4px",
    marginBottom: "1rem",
  },
  submitBtn: {
    padding: "8px 16px",
    backgroundColor: "purple",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  gradingContainer: {
    marginTop: "1rem",
    backgroundColor: "#222",
    padding: "1rem",
    borderRadius: "4px",
  },
  finishBtn: {
    padding: "8px 16px",
    backgroundColor: "dodgerblue",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginTop: "0.5rem",
  },
};