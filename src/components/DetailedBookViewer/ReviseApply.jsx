// ReviseApply.jsx
import React, { useState } from "react";

/**
 * A more robust revision component for the "Apply" stage:
 * - Simulates showing user-specific weaknesses or mistakes
 * - Provides curated or AI-summarized content
 * - Offers a small interactive check-off system for "Remember Key Points"
 * - Retains the existing "Done with Revision" callback
 */
export default function ReviseApply({ subChapterId, onRevisionDone }) {
  // Example “weak concepts” from your DB or AI analysis (dummy data)
  // E.g., system found the user struggled with concept #2 and #4, so we highlight them.
  const [weakConcepts] = useState([
    {
      id: "concept2",
      title: "Applying X to Real Cases",
      summary:
        "You missed questions about how to apply concept X in real-world scenarios. This typically requires you to map the theoretical definition onto a specific example or use-case.",
    },
    {
      id: "concept4",
      title: "Cause-Effect Chains",
      summary:
        "You seemed unsure about connecting cause and effect when applying these ideas. Focus on the underlying logic: if condition A, then outcome B, and how you can manipulate variables.",
    },
  ]);

  // Example “Key Points to Remember”: user can check them off as “remembered”
  const [keyPoints, setKeyPoints] = useState([
    {
      id: "kp1",
      text: "Definition of concept X and 2 real-world examples",
      remembered: false,
    },
    {
      id: "kp2",
      text: "The formula for deriving Y from X in step-by-step manner",
      remembered: false,
    },
  ]);

  function toggleRemembered(kpId) {
    setKeyPoints((prev) =>
      prev.map((kp) =>
        kp.id === kpId ? { ...kp, remembered: !kp.remembered } : kp
      )
    );
  }

  // Example AI Explanation Summaries (just placeholders)
  const [explanation, setExplanation] = useState(
    `Based on your quiz attempts, here's an AI-tailored summary:
1) Try re-reading the fundamental definition of "Apply".
2) Link the theoretical definitions to a real scenario step by step. 
3) Focus on cause-effect logic to ensure your reasoning is consistent.`
  );

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>Revision (Apply Stage) for SubChapter: {subChapterId}</h3>

      <p style={styles.desc}>
        Here is a <strong>personalized revision</strong> based on your 
        quiz attempts and the concepts you're struggling with.
      </p>

      {/* WEAK CONCEPTS */}
      <div style={styles.block}>
        <h4 style={styles.blockTitle}>1) Weak Concepts Identified</h4>
        {weakConcepts.length === 0 ? (
          <p style={styles.subtext}>No major weaknesses found.</p>
        ) : (
          weakConcepts.map((wc) => (
            <div key={wc.id} style={styles.conceptItem}>
              <strong>{wc.title}</strong>
              <p style={styles.summary}>{wc.summary}</p>
            </div>
          ))
        )}
      </div>

      {/* AI EXPLANATION / SUMMARY */}
      <div style={styles.block}>
        <h4 style={styles.blockTitle}>2) AI Explanation / Summary</h4>
        <p style={styles.aiSummary}>{explanation}</p>
        {/* If you want to show a "Regenerate Explanation" or "View More" button, you could add it here */}
      </div>

      {/* KEY POINTS TO REMEMBER */}
      <div style={styles.block}>
        <h4 style={styles.blockTitle}>3) Key Points to Remember</h4>
        {keyPoints.map((kp) => (
          <label key={kp.id} style={styles.keyPointItem}>
            <input
              type="checkbox"
              checked={kp.remembered}
              onChange={() => toggleRemembered(kp.id)}
            />
            <span style={{ marginLeft: "0.5rem" }}>
              {kp.text}
            </span>
          </label>
        ))}
        <p style={styles.subtext}>
          (Check off each point once you feel confident you remember it!)
        </p>
      </div>

      {/* BOTTOM BUTTON */}
      <button style={styles.btn} onClick={onRevisionDone}>
        Done with Revision
      </button>
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
    fontSize: "1.1rem",
    color: "#fff",
  },
  desc: {
    margin: "0 0 1.2rem 0",
    fontSize: "0.9rem",
    color: "#ccc",
  },
  block: {
    backgroundColor: "#2A2A2A",
    padding: "0.8rem",
    borderRadius: "4px",
    marginBottom: "1rem",
  },
  blockTitle: {
    margin: "0 0 0.5rem 0",
    fontSize: "1rem",
    color: "#fff",
    borderBottom: "1px solid #444",
    paddingBottom: "4px",
    fontWeight: "bold",
  },
  conceptItem: {
    marginBottom: "0.8rem",
    color: "#ccc",
  },
  summary: {
    fontSize: "0.85rem",
    margin: "0.3rem 0 0.5rem 0",
  },
  aiSummary: {
    fontSize: "0.85rem",
    lineHeight: 1.4,
    color: "#ccc",
    whiteSpace: "pre-line", // so newlines are respected
    margin: "0.5rem 0",
  },
  keyPointItem: {
    display: "block",
    marginBottom: "0.5rem",
    fontSize: "0.85rem",
    color: "#ccc",
    cursor: "pointer",
  },
  subtext: {
    margin: 0,
    fontSize: "0.8rem",
    color: "#999",
  },
  btn: {
    backgroundColor: "#444",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: "0.85rem",
  },
};