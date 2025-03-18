import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../../firebase"; // adjust path if needed
import { generateQuestions } from "./QuizQuestionGenerator";
import { gradeQuestionsOfType } from "./QuizQuestionGrader";  
import QuizQuestionRenderer from "./QuizQuestionRenderer";
import axios from "axios";

/**
 * Multi-type version of QuizComponent
 * - Lets user select multiple (type, count) combos
 * - For each combo => calls generateQuestions(...) once
 * - Combines them into a single array for the quiz
 * - Grades them with one GPT call per type (aggregating the final score).
 */
export default function QuizComponent({
  userId = "",          // ensure you pass a valid string userId from parent
  examId = "general",
  quizStage = "remember",
  subChapterId = "",    // ensure you pass a valid string from parent
  attemptNumber = 1,
  onQuizComplete,
  onQuizFail,
}) {
  // ----------------------------
  // PART 1: State & Setup
  // ----------------------------
  const [questionTypes, setQuestionTypes] = useState([]);
  // We'll store an array of combos: { typeName: string, count: number }
  const [selectedCombos, setSelectedCombos] = useState([]);

  // For picking a type + count from a dropdown
  const [typeToAdd, setTypeToAdd] = useState("");
  const [countToAdd, setCountToAdd] = useState(1);

  // Internal states
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const [generatedQuestions, setGeneratedQuestions] = useState([]); // all questions from all combos
  const [subchapterSummary, setSubchapterSummary] = useState("");

  // userAnswers[i] => the user’s answer for question i
  const [userAnswers, setUserAnswers] = useState([]);
  // gradingResults[i] => { score, feedback } for question i
  const [gradingResults, setGradingResults] = useState([]);
  const [showGradingResults, setShowGradingResults] = useState(false);

  // Read the OpenAI key from .env (Vite)
  const openAiKey = import.meta.env.VITE_OPENAI_KEY || "";

  // ----------------------------
  // PART 2: Load available question types (on mount)
  // ----------------------------
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

  // ----------------------------
  // PART 3: UI for multiple combos
  // ----------------------------
  function handleAddCombo() {
    if (!typeToAdd) {
      alert("Select a question type first.");
      return;
    }
    if (!countToAdd || countToAdd < 1) {
      alert("Invalid count.");
      return;
    }
    setSelectedCombos((prev) => [
      ...prev,
      { typeName: typeToAdd, count: parseInt(countToAdd, 10) },
    ]);
    setTypeToAdd("");
    setCountToAdd(1);
  }

  function renderComboList() {
    return (
      <ul>
        {selectedCombos.map((c, i) => (
          <li key={i} style={{ marginBottom: "0.25rem" }}>
            {c.count} x {c.typeName}
          </li>
        ))}
      </ul>
    );
  }

  // ----------------------------
  // PART 4: Generate All Questions
  //    - For each combo => call generateQuestions
  //    - Combine results
  // ----------------------------
  async function handleGenerateAll() {
    if (!subChapterId) {
      alert("No subChapterId provided!");
      return;
    }
    if (!openAiKey) {
      alert("No OpenAI key found in environment (VITE_OPENAI_KEY).");
      return;
    }
    if (!selectedCombos.length) {
      alert("Please add at least one (type, count) combo.");
      return;
    }

    setLoading(true);
    setStatus("Generating multi-type questions...");
    setShowGradingResults(false);
    setGradingResults([]);

    let allQuestions = [];
    let finalSubchapterSummary = "";

    try {
      // For each combo => get Firestore doc for that type => call generateQuestions
      for (let combo of selectedCombos) {
        const qTypeDoc = questionTypes.find((qt) => qt.name === combo.typeName);
        if (!qTypeDoc) {
          console.warn("No doc found for question type:", combo.typeName);
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
          // We could continue or break
          continue;
        }

        // They should share the same subchapterSummary; store the last
        finalSubchapterSummary = result.subchapterSummary;

        if (Array.isArray(result.questionsData?.questions)) {
          // Tag each question with the type if not present
          const typedQs = result.questionsData.questions.map((q) => {
            if (!q.type) q.type = combo.typeName;
            return q;
          });
          allQuestions.push(...typedQs);
        }
      }

      setSubchapterSummary(finalSubchapterSummary);
      setGeneratedQuestions(allQuestions);
      setUserAnswers(allQuestions.map(() => "")); // Reset answers
      setStatus("All questions generated successfully!");
    } catch (err) {
      console.error("Error in handleGenerateAll:", err);
      setStatus("Error generating multi-type questions: " + err.message);
    }

    setLoading(false);
  }

  // ----------------------------
  // PART 5: Rendering the combined quiz
  // ----------------------------
  function renderQuizForm() {
    if (!generatedQuestions || !generatedQuestions.length) return null;

    return (
      <div style={{ marginTop: "1rem" }}>
        <h3>Combined Multi-Type Quiz</h3>
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
  // PART 6: Grading => One GPT call per question type
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

    // 3) For each type => call gradeQuestionsOfType
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
        continue; // or handle it
      }

      // gradingArray should match length of group
      gradingArray.forEach((res, i) => {
        const originalIdx = group[i].originalIndex;
        overallResults[originalIdx] = res; 
      });
    }

    // 4) Store these results in state so we can display them
    setGradingResults(overallResults);

    // 5) Now sum the scores => average => "X/5"
    const totalScore = overallResults.reduce((acc, r) => acc + ((r && r.score) || 0), 0);
    const questionCount = generatedQuestions.length;
    const averageScore = (questionCount > 0) ? (totalScore / questionCount) : 0;
    const finalScoreString = `${averageScore.toFixed(1)} / 5`;
    console.log("Final Score in X/5 format:", finalScoreString);

    // 6) Post final data to the server
    try {
      await axios.post("http://localhost:3001/api/submitQuiz", {
        userId,                       // a string
        subchapterId: subChapterId,   // if your server expects subchapterId
        quizType: quizStage,          // or "multiType", whichever you want
        quizSubmission: generatedQuestions.map((qObj, idx) => {
          return {
            ...qObj,
            userAnswer: userAnswers[idx],
            // store GPT results in each question if you want
            score: overallResults[idx]?.score ?? 0,
            feedback: overallResults[idx]?.feedback ?? "",
          };
        }),
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
  // PART 7: Render
  // ----------------------------
  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Quiz Component (Multi-Type Version)</h2>

      {loading && <p style={styles.text}>Loading... {status}</p>}
      {!loading && status && <p style={{ color: "lightgreen" }}>{status}</p>}

      {/* UI to add combos (type + count) */}
      <div style={styles.fieldBlock}>
        <label style={styles.label}>Select Question Type:</label>
        <select
          style={styles.input}
          value={typeToAdd}
          onChange={(e) => setTypeToAdd(e.target.value)}
        >
          <option value="">--Select--</option>
          {questionTypes.map((qt) => (
            <option key={qt.id} value={qt.name}>
              {qt.name}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.fieldBlock}>
        <label style={styles.label}>Count:</label>
        <input
          type="number"
          style={styles.input}
          value={countToAdd}
          onChange={(e) => setCountToAdd(e.target.value)}
        />
      </div>

      <button style={styles.button} onClick={handleAddCombo}>
        Add Combo
      </button>

      <div style={{ marginTop: "1rem" }}>
        <p>Current Combos:</p>
        {renderComboList()}
      </div>

      <button style={styles.button} onClick={handleGenerateAll} disabled={!selectedCombos.length}>
        Generate All Questions
      </button>

      {renderQuizForm()}
      {renderGradingResults()}
    </div>
  );
}

// ----------------------------
// Styles
// ----------------------------
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
  fieldBlock: {
    marginBottom: "0.75rem",
  },
  label: {
    display: "block",
    marginBottom: "0.25rem",
  },
  input: {
    width: "100%",
    padding: "8px",
    borderRadius: "4px",
    boxSizing: "border-box",
    marginBottom: "0.5rem",
  },
  button: {
    padding: "8px 16px",
    backgroundColor: "#444",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginRight: "0.5rem",
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
  pre: {
    whiteSpace: "pre-wrap",
    color: "#fff",
    margin: 0,
    marginTop: "0.5rem",
    backgroundColor: "#222",
    padding: "8px",
    borderRadius: "4px",
  },
};