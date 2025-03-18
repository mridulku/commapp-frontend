// File: QuizComponent.jsx

import React, { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../../../../../firebase"; // adjust path if needed
import { generateQuestions } from "./QuizQuestionGenerator";
import { gradeQuestionsOfType } from "./QuizQuestionGrader";  
import QuizQuestionRenderer from "./QuizQuestionRenderer";
import axios from "axios";

/**
 * Updated "QuizComponent" that:
 * 1) Auto-computes docId for quizConfigs/<docId> based on examId + quizStage
 * 2) Fetches question-type counts from that doc
 * 3) Automatically generates questions
 * 4) Renders the final quiz (no manual combo UI)
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
  // If examId or quizStage are empty, default them
  const finalExamId = examId || "general";       // fallback: "general"
  const finalStage = quizStage || "remember";    // fallback: "remember"

  // We'll build a doc ID like "quizGeneralRemember"
  // Capitalize the first letter of exam + stage
  const docId = buildQuizConfigDocId(finalExamId, finalStage);

  // For debugging, we'll log the docId
  console.log("QuizComponent => docId for config:", docId);

  // We fetch questionTypes from Firestore (like before) to have the relevant docs
  const [questionTypes, setQuestionTypes] = useState([]);

  // We'll store the final questions after generation
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [subchapterSummary, setSubchapterSummary] = useState("");

  // userAnswers[i] => the user’s answer for the i-th question
  const [userAnswers, setUserAnswers] = useState([]);

  // gradingResults[i] => GPT or local grading result for the i-th question
  const [gradingResults, setGradingResults] = useState([]);
  const [showGradingResults, setShowGradingResults] = useState(false);

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // Read the OpenAI key from .env (Vite)
  const openAiKey = import.meta.env.VITE_OPENAI_KEY || "";

  // -- 1) On mount => fetch questionTypes (like before) --
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

  // -- 2) After we have questionTypes, fetch the quizConfigs doc and auto-generate --
  useEffect(() => {
    // Skip if we don't have userId or subChapterId
    if (!userId || !subChapterId) {
      console.log("QuizComponent: userId or subChapterId is empty, skipping auto-generation.");
      return;
    }
    if (!openAiKey) {
      console.warn("QuizComponent: No OpenAI key found. Generation will fail.");
    }

    // We'll do an async fetch for the doc
    async function fetchAndGenerate() {
      try {
        setLoading(true);
        setStatus("Fetching quiz config & auto-generating questions...");

        // 2a) Get the doc from quizConfigs/<docId>
        const quizConfigRef = doc(db, "quizConfigs", docId);
        const quizConfigSnap = await getDoc(quizConfigRef);

        if (!quizConfigSnap.exists()) {
          console.error(`No quizConfig doc found for '${docId}'.`);
          setStatus(`No quizConfig found for '${docId}'. Cannot generate questions.`);
          setLoading(false);
          return;
        }

        const configData = quizConfigSnap.data(); // e.g. { multipleChoice: 3, fillInBlank: 2, ... }

        // 2b) Build "selectedCombos" from configData
        // Each key is a question type => each value is the count
        // e.g. [ { typeName: "multipleChoice", count: 3 }, { typeName: "trueFalse", count: 2 } ]
        const combos = [];
        Object.keys(configData).forEach((typeName) => {
          const countVal = configData[typeName];
          if (countVal > 0) {
            combos.push({ typeName, count: countVal });
          }
        });

        if (!combos.length) {
          console.warn("QuizConfig has no non-zero question types. Nothing to generate.");
          setStatus("No non-zero question types in config. No questions to generate.");
          setLoading(false);
          return;
        }

        // 2c) Actually generate all questions for each combo
        let allQuestions = [];
        let finalSubchapterSummary = "";

        for (let combo of combos) {
          const qTypeDoc = questionTypes.find((qt) => qt.name === combo.typeName);
          if (!qTypeDoc) {
            console.warn("No questionType doc found for:", combo.typeName);
            continue;
          }

          const result = await generateQuestions({
            db,
            subChapterId,
            openAiKey,
            selectedTypeName: combo.typeName,
            questionTypeDoc: qTypeDoc,
            numberOfQuestions: combo.count,
          });

          if (!result.success) {
            console.error("Error generating for", combo.typeName, result.error);
            continue;
          }

          finalSubchapterSummary = result.subchapterSummary || finalSubchapterSummary;

          if (Array.isArray(result.questionsData?.questions)) {
            const typedQs = result.questionsData.questions.map((q) => {
              if (!q.type) q.type = combo.typeName;
              return q;
            });
            allQuestions.push(...typedQs);
          }
        }

        // 2d) Done generating => store final in state
        setSubchapterSummary(finalSubchapterSummary);
        setGeneratedQuestions(allQuestions);
        setUserAnswers(allQuestions.map(() => ""));

        setStatus(`Auto-generation complete. Total questions: ${allQuestions.length}`);
      } catch (err) {
        console.error("Error in fetchAndGenerate:", err);
        setStatus(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    fetchAndGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionTypes, userId, subChapterId, docId]); 
  // We run this effect once questionTypes are loaded + docId is known.

  // ----------------------------
  // PART 3: Render the final quiz
  // ----------------------------
  function renderQuizForm() {
    if (!generatedQuestions.length) return null;

    return (
      <div style={{ marginTop: "1rem" }}>
        <h3>Auto-Generated Multi-Type Quiz</h3>
        {generatedQuestions.map((questionObj, idx) => (
          <div key={idx} style={styles.questionContainer}>
            <QuizQuestionRenderer
              questionObj={questionObj}
              index={idx}
              userAnswer={userAnswers[idx]}
              onUserAnswerChange={(val) => handleAnswerChange(idx, val)}
            />
          </div>
        ))}

        <button style={styles.submitBtn} onClick={handleQuizSubmit}>
          Submit All
        </button>
      </div>
    );
  }

  function handleAnswerChange(index, newVal) {
    const updated = [...userAnswers];
    updated[index] = newVal;
    setUserAnswers(updated);
  }

  // ----------------------------
  // PART 4: Grading => One GPT call per question type
  // ----------------------------
  async function handleQuizSubmit() {
    if (!generatedQuestions.length) {
      alert("No questions to submit.");
      return;
    }
    if (!openAiKey) {
      alert("No OpenAI key found in environment (VITE_OPENAI_KEY).");
      return;
    }

    setLoading(true);
    setStatus("Grading in progress...");
    setGradingResults([]);
    setShowGradingResults(false);

    // 1) Group questions by type
    const typeMap = {};
    generatedQuestions.forEach((qObj, idx) => {
      const t = qObj.type || "unknownType";
      if (!typeMap[t]) typeMap[t] = [];
      typeMap[t].push({
        questionObj: qObj,
        userAnswer: userAnswers[idx],
        originalIndex: idx,
      });
    });

    // 2) We'll build an array where gradingResults[i] = { score, feedback }
    const overallResults = new Array(generatedQuestions.length).fill(null);

    // 3) For each type => call GPT
    for (let tName of Object.keys(typeMap)) {
      const group = typeMap[tName];

      const { success, gradingArray, error } = await gradeQuestionsOfType({
        openAiKey,
        subchapterSummary,
        questionType: tName,
        questionsAndAnswers: group,
      });

      if (!success) {
        console.error(`Grading error for type ${tName}:`, error);
        continue;
      }

      // Place each result in the correct index
      gradingArray.forEach((res, i) => {
        const originalIdx = group[i].originalIndex;
        overallResults[originalIdx] = res;
      });
    }

    setGradingResults(overallResults);

    // 4) Summation => "X/5"
    const totalScore = overallResults.reduce((acc, r) => acc + ((r && r.score) || 0), 0);
    const questionCount = generatedQuestions.length;
    const averageScore = questionCount > 0 ? totalScore / questionCount : 0;
    const finalScoreString = `${averageScore.toFixed(1)} / 5`;
    console.log("Final Score in X/5 format:", finalScoreString);

    // 5) Submit to server
    try {
      await axios.post("http://localhost:3001/api/submitQuiz", {
        userId,                       
        subchapterId: subChapterId,   
        quizType: quizStage,          
        quizSubmission: generatedQuestions.map((qObj, idx) => ({
          ...qObj,
          userAnswer: userAnswers[idx],
          score: overallResults[idx]?.score ?? 0,
          feedback: overallResults[idx]?.feedback ?? "",
        })),
        score: finalScoreString,                   
        totalQuestions: questionCount,
        attemptNumber,
      });
      console.log("Quiz submission saved on server!");
    } catch (err) {
      console.error("Error submitting quiz results:", err);
    }

    setLoading(false);
    setStatus("Grading complete.");
    setShowGradingResults(true);
    // Optionally call onQuizComplete or onQuizFail based on pass/fail
  }

  function renderGradingResults() {
    if (!showGradingResults || !gradingResults.length) return null;
    const totalScore = gradingResults.reduce((acc, r) => acc + ((r && r.score) || 0), 0);

    return (
      <div style={styles.gradingContainer}>
        <h3>Grading Results</h3>
        {gradingResults.map((res, i) => {
          if (!res) {
            return (
              <div key={i} style={styles.gradingResult}>
                <b>Question {i + 1}:</b>
                <p style={{ color: "red" }}>No grading result.</p>
              </div>
            );
          }
          return (
            <div key={i} style={styles.gradingResult}>
              <b>Question {i + 1}:</b>
              <p>
                Score: {res.score}
                <br />
                Feedback: {res.feedback}
              </p>
            </div>
          );
        })}
        <p>
          <b>Total Score:</b> {totalScore}
        </p>
      </div>
    );
  }

  // ----------------------------
  // PART 5: Render
  // ----------------------------
  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Auto-Fetched Quiz ({docId})</h2>
      {loading && <p style={styles.text}>Loading... {status}</p>}
      {!loading && status && <p style={{ color: "lightgreen" }}>{status}</p>}

      {renderQuizForm()}
      {renderGradingResults()}
    </div>
  );
}

// Helper to build docId => "quiz" + capitalizedExam + capitalizedStage
function buildQuizConfigDocId(exam, stage) {
  const capExam = exam.charAt(0).toUpperCase() + exam.slice(1);
  const capStage = stage.charAt(0).toUpperCase() + stage.slice(1);
  return `quiz${capExam}${capStage}`;
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
  gradingResult: {
    marginBottom: "1rem",
    border: "1px solid #555",
    padding: "0.5rem",
    borderRadius: "4px",
  },
};