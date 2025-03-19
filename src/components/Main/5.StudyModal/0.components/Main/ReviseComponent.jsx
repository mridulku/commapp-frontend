/**
 * File: ReviseComponent.jsx
 * Description:
 *   - A React component for displaying revision content for a particular stage & attempt.
 *   - It automatically fetches the relevant revision config doc, calls the revision generator,
 *     and displays the returned concept-based revision from GPT.
 *   - On "Done with Revision", it stores a revision attempt in your backend.
 */

import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../../firebase"; // Adjust as needed
import { generateRevisionContent } from "./RevisionContentGenerator"; // The logic below
import axios from "axios";

export default function ReviseComponent({
  userId,
  examId = "general",
  quizStage = "remember",
  subChapterId = "",
  revisionNumber = 1,
  onRevisionDone,
}) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  // The JSON-based content we receive from GPT
  const [revisionContent, setRevisionContent] = useState(null);

  // The doc ID for "revisionConfigs", e.g. "reviseGeneralRemember"
  const docId = buildRevisionConfigDocId(examId, quizStage);

  // We'll read the OpenAI API key from environment (Vite style)
  const openAiKey = import.meta.env.VITE_OPENAI_KEY || "";

  useEffect(() => {
    if (!userId || !subChapterId) {
      console.log("ReviseComponent: missing userId or subChapterId => skipping generation.");
      return;
    }
    if (!openAiKey) {
      console.warn("ReviseComponent: No OpenAI key found. GPT calls may fail.");
      return;
    }
    // Trigger the fetch/creation of revision content
    fetchAndGenerateRevision();
    // eslint-disable-next-line
  }, [userId, subChapterId, examId, quizStage, revisionNumber]);

  async function fetchAndGenerateRevision() {
    try {
      setLoading(true);
      setStatus("Fetching revision config & generating content...");
      setError("");

      // 1) Fetch the revision config doc from "revisionConfigs" collection
      const revConfigRef = doc(db, "revisionConfigs", docId);
      const revConfigSnap = await getDoc(revConfigRef);
      if (!revConfigSnap.exists()) {
        setStatus(`No revisionConfig doc found for '${docId}'.`);
        setLoading(false);
        return;
      }
      const configData = revConfigSnap.data(); // e.g. { instructions: "...", ... }

      // 2) Let "generateRevisionContent" do all the heavy lifting:
      //    - It fetches the user's latest quiz attempt
      //    - Finds which concepts they failed
      //    - Builds a GPT prompt focusing on those concepts
      //    - Returns concept-by-concept revision data in JSON
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
        setError(result.error);
        setLoading(false);
        return;
      }

      setRevisionContent(result.revisionData);
      setStatus("Revision content generated successfully.");
    } catch (err) {
      console.error("ReviseComponent: Error generating revision content:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Handle user finishing the revision.
   * We'll record the attempt (via a /submitRevision call) and invoke onRevisionDone if any.
   */
  async function handleSubmitRevision() {
    try {
      await axios.post("http://localhost:3001/api/submitRevision", {
        userId,
        subchapterId: subChapterId,
        revisionType: quizStage,
        revisionNumber,
      });
      console.log("Revision attempt recorded on server!");
    } catch (err) {
      console.error("Error submitting revision attempt:", err);
      alert("Failed to record revision attempt.");
      return;
    }
    // Fire callback if provided
    onRevisionDone?.();
  }

  /**
   * Renders the revision content in a concept-by-concept manner, as returned by GPT:
   * 
   * We expect a structure like:
   * {
   *   "title": "Short Title",
   *   "concepts": [
   *     {
   *       "conceptName": "Newton's First Law",
   *       "notes": ["Point 1", "Point 2"]
   *     },
   *     {
   *       "conceptName": "Newton's Second Law",
   *       "notes": ["..."]
   *     }
   *   ]
   * }
   */
  function renderRevisionContent() {
    if (!revisionContent) return null;

    const { title, concepts } = revisionContent;

    return (
      <div style={styles.revisionBox}>
        {title && <h4>{title}</h4>}

        {Array.isArray(concepts) && concepts.length > 0 && (
          <div>
            {concepts.map((cObj, idx) => (
              <div key={idx} style={{ marginBottom: "1rem" }}>
                <h5 style={{ margin: "0.5rem 0" }}>{cObj.conceptName}</h5>
                {Array.isArray(cObj.notes) && (
                  <ul>
                    {cObj.notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>
        Revision ({quizStage}) – Attempt #{revisionNumber}
      </h2>

      {loading && <p>Loading... {status}</p>}
      {!loading && status && <p style={{ color: "lightgreen" }}>{status}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {renderRevisionContent()}

      {/* A button to finalize revision */}
      <button style={styles.submitBtn} onClick={handleSubmitRevision}>
        Done with Revision
      </button>
    </div>
  );
}

// Helper to build docId => "reviseExamStage", e.g. "reviseGeneralRemember"
function buildRevisionConfigDocId(exam, stage) {
  const capExam = exam.charAt(0).toUpperCase() + exam.slice(1);
  const capStage = stage.charAt(0).toUpperCase() + stage.slice(1);
  return `revise${capExam}${capStage}`;
}

const styles = {
  container: {
    padding: "1rem",
    color: "#fff",
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: "#222",
    borderRadius: "4px",
  },
  heading: {
    marginBottom: "1rem",
  },
  revisionBox: {
    backgroundColor: "#333",
    padding: "8px",
    borderRadius: "4px",
    marginTop: "1rem",
  },
  submitBtn: {
    marginTop: "1rem",
    padding: "8px 16px",
    backgroundColor: "teal",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
};