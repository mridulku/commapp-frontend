// QuizApply.jsx
import React, { useState } from "react";

/**
 * This component is a more "comprehensive" quiz example for the "Apply" stage.
 * 
 * It includes:
 *  - MCQ questions,
 *  - Explanation / short-answer questions,
 *  - Reflection prompts.
 * 
 * You can integrate real GPT logic or form handling as needed.
 */
export default function QuizUnderstand({ subChapterId, onQuizComplete, onQuizFail }) {
  // Example local states for user inputs:
  const [mcqAnswers, setMcqAnswers] = useState({});
  const [explanationAnswers, setExplanationAnswers] = useState({});
  const [reflectionAnswers, setReflectionAnswers] = useState({});

  // 1) Handle user selecting MCQ options
  function handleMcqChange(questionId, optionIndex) {
    setMcqAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  }

  // 2) Handle user typing in short "explanation" answers
  function handleExplanationChange(questionId, text) {
    setExplanationAnswers((prev) => ({
      ...prev,
      [questionId]: text,
    }));
  }

  // 3) Reflection prompts
  function handleReflectionChange(promptId, text) {
    setReflectionAnswers((prev) => ({
      ...prev,
      [promptId]: text,
    }));
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>Quiz (Apply Stage) for SubChapter: {subChapterId}</h3>

      <p style={styles.desc}>
        Below is a <strong>mixed demo</strong> of how multiple question types might appear.
      </p>

      {/******************************************************************
       * SECTION A: MCQ-STYLE QUESTIONS
       *****************************************************************/}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Section A: MCQ Questions</h4>

        {/* MCQ Question #1 */}
        <div style={styles.questionBlock}>
          <p style={styles.questionText}>
            <strong>Q1 (MCQ)</strong>: Which of the following is an example of an "apply"-level learning task?
          </p>
          <div style={styles.optionsArea}>
            {[
              "Reading and memorizing definitions",
              "Selecting the correct definition from multiple choices",
              "Using a concept in a real-world scenario",
              "Reflecting on personal learning goals",
            ].map((opt, idx) => {
              const checked = mcqAnswers["q1"] === idx;
              return (
                <label key={idx} style={styles.optionLabel}>
                  <input
                    type="radio"
                    name="q1"
                    checked={checked}
                    onChange={() => handleMcqChange("q1", idx)}
                  />
                  {opt}
                </label>
              );
            })}
          </div>
        </div>

        {/* MCQ Question #2 */}
        <div style={styles.questionBlock}>
          <p style={styles.questionText}>
            <strong>Q2 (MCQ)</strong>: Which color is often used to indicate success messages in this app?
          </p>
          <div style={styles.optionsArea}>
            {["Red", "Lightgreen", "Blue", "Yellow"].map((opt, idx) => {
              const checked = mcqAnswers["q2"] === idx;
              return (
                <label key={idx} style={styles.optionLabel}>
                  <input
                    type="radio"
                    name="q2"
                    checked={checked}
                    onChange={() => handleMcqChange("q2", idx)}
                  />
                  {opt}
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/******************************************************************
       * SECTION B: EXPLANATION / SHORT ANSWER
       *****************************************************************/}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Section B: Short Explanations</h4>
        
        {/* Explanation #1 */}
        <div style={styles.questionBlock}>
          <p style={styles.questionText}>
            <strong>Q3 (Explanation)</strong>: In a few sentences, 
            <em>explain</em> why "apply" stage tasks might be more challenging than 
            "remember" stage tasks.
          </p>
          <textarea
            style={styles.textArea}
            rows={3}
            placeholder="Type your explanation here..."
            value={explanationAnswers["q3"] || ""}
            onChange={(e) => handleExplanationChange("q3", e.target.value)}
          />
        </div>

        {/* Explanation #2 */}
        <div style={styles.questionBlock}>
          <p style={styles.questionText}>
            <strong>Q4 (Explanation)</strong>: Summarize how you might create 
            a scenario-based question for an 'apply' level quiz.
          </p>
          <textarea
            style={styles.textArea}
            rows={3}
            placeholder="Briefly describe your approach..."
            value={explanationAnswers["q4"] || ""}
            onChange={(e) => handleExplanationChange("q4", e.target.value)}
          />
        </div>
      </div>

      {/******************************************************************
       * SECTION C: REFLECTION PROMPTS
       *****************************************************************/}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Section C: Reflection Prompts</h4>

        {/* Reflection #1 */}
        <div style={styles.questionBlock}>
          <p style={styles.questionText}>
            <strong>Q5 (Reflection)</strong>: What aspect of 'apply'-level 
            questions do you find most challenging?
          </p>
          <textarea
            style={styles.textArea}
            rows={3}
            placeholder="Reflect on your personal challenge..."
            value={reflectionAnswers["r1"] || ""}
            onChange={(e) => handleReflectionChange("r1", e.target.value)}
          />
        </div>

        {/* Reflection #2 */}
        <div style={styles.questionBlock}>
          <p style={styles.questionText}>
            <strong>Q6 (Reflection)</strong>: Suggest one real-world scenario 
            where you can practice applying a concept from this sub-chapter.
          </p>
          <textarea
            style={styles.textArea}
            rows={3}
            placeholder="Share a real-world scenario..."
            value={reflectionAnswers["r2"] || ""}
            onChange={(e) => handleReflectionChange("r2", e.target.value)}
          />
        </div>
      </div>

      {/******************************************************************
       * BOTTOM CONTROLS
       *****************************************************************/}
      <div style={styles.buttonRow}>
        <button style={styles.btn} onClick={onQuizComplete}>
          Pass Quiz
        </button>
        <button style={styles.btn} onClick={onQuizFail}>
          Fail Quiz
        </button>
      </div>
    </div>
  );
}

/** STYLES */
const styles = {
  container: {
    border: "1px solid #666",
    padding: "1rem",
    marginBottom: "1rem",
    borderRadius: "4px",
    backgroundColor: "#1E1E1E",
  },
  heading: {
    margin: "0 0 0.5rem 0",
  },
  desc: {
    margin: "0 0 1rem 0",
    fontSize: "0.9rem",
    color: "#ccc",
  },
  section: {
    marginBottom: "1rem",
    backgroundColor: "#2A2A2A",
    padding: "0.8rem",
    borderRadius: "4px",
  },
  sectionTitle: {
    margin: "0 0 0.5rem 0",
    fontSize: "1rem",
    color: "#fff",
    fontWeight: "bold",
    borderBottom: "1px solid #444",
    paddingBottom: "4px",
  },
  questionBlock: {
    marginBottom: "0.8rem",
  },
  questionText: {
    margin: 0,
    fontSize: "0.9rem",
    color: "#f2f2f2",
  },
  optionsArea: {
    marginTop: "0.5rem",
    marginLeft: "1rem",
  },
  optionLabel: {
    display: "block",
    marginBottom: "0.4rem",
    cursor: "pointer",
    fontSize: "0.85rem",
    color: "#ccc",
  },
  textArea: {
    width: "100%",
    marginTop: "0.5rem",
    fontFamily: "inherit",
    fontSize: "0.85rem",
    backgroundColor: "#333",
    color: "#fff",
    border: "1px solid #555",
    borderRadius: "4px",
    padding: "6px",
  },
  buttonRow: {
    marginTop: "1.2rem",
    display: "flex",
    gap: "8px",
  },
  btn: {
    backgroundColor: "#444",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "6px 12px",
    cursor: "pointer",
    fontSize: "0.85rem",
  },
};