import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../../firebase"; // Adjust path as needed
import { generateRevisionContent } from "./RevisionContentGenerator"; // We'll create this
import axios from "axios";

/**
 * "ReviseComponent" that parallels "QuizComponent."
 *  - Instead of calling a local /api/generate, we do the GPT call directly in the front-end
 *  - We build a docId like "reviseExamStage" and fetch from "revisionConfigs" collection
 *  - Then generate revision content (similar to generateQuestions)
 */
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

  // This is the final object returned by GPT (parsed JSON) 
  const [revisionContent, setRevisionContent] = useState(null);

  // If you want to incorporate quiz attempts data, you can store it here:
  // (For now, we can keep it static or pass in as a prop; this is just an example.)
  const [quizAttemptsData] = useState([
    // E.g., a minimal placeholder array (in the future, pass real data):
    { attemptNumber: 1, score: "2/5", timestamp: "2025-01-01T10:00:00Z" },
    { attemptNumber: 2, score: "4/5", timestamp: "2025-01-03T14:30:00Z" },
  ]);

  // Read the OpenAI key from your .env (Vite)
  const openAiKey = import.meta.env.VITE_OPENAI_KEY || "";

  // Build docId => e.g. "reviseGeneralRemember"
  const docId = buildRevisionConfigDocId(examId, quizStage);
  console.log("ReviseComponent => docId for config:", docId);

  useEffect(() => {
    if (!subChapterId) {
      console.log("ReviseComponent: missing subChapterId => skipping generation.");
      return;
    }
    if (!openAiKey) {
      console.warn("ReviseComponent: No OpenAI key found. Generation will fail.");
      return;
    }
    fetchAndGenerateRevision();
    // eslint-disable-next-line
  }, [subChapterId, examId, quizStage, revisionNumber]);

  async function fetchAndGenerateRevision() {
    try {
      setLoading(true);
      setStatus("Fetching revision config & generating content...");
      setError("");

      // 1) Fetch the revision config doc from Firestore: revisionConfigs/<docId>
      const revConfigRef = doc(db, "revisionConfigs", docId);
      const revConfigSnap = await getDoc(revConfigRef);
      if (!revConfigSnap.exists()) {
        setStatus(`No revisionConfig doc found for '${docId}'.`);
        setLoading(false);
        return;
      }
      const configData = revConfigSnap.data(); // e.g. { instruction: "...", customFields: ... }

      // 2) Generate the revision content
      const result = await generateRevisionContent({
        db,
        subChapterId,
        openAiKey,
        revisionConfig: configData,
        quizAttempts: quizAttemptsData, // pass your quiz attempt data here
      });

      if (!result.success) {
        setError(result.error);
        setStatus("Failed to generate revision content.");
        setLoading(false);
        return;
      }

      // Store the parsed content in state
      setRevisionContent(result.revisionData);
      setStatus("Revision content generated successfully.");
    } catch (err) {
      console.error("Error generating revision content:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Called when user finishes the revision
  async function handleSubmitRevision() {
    try {
      // This can be a direct Firestore call or an API call – whichever your app uses:
      await axios.post("http://localhost:3001/api/submitRevision", {
        userId, // or read from Redux
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

  // Simple rendering example
  function renderRevisionContent() {
    if (!revisionContent) return null;

    // Suppose the GPT returns something like:
    // { title: "...", bulletPoints: [...], exampleSummary: "..." }
    // The structure is up to you; you can also define a more dynamic renderer
    return (
      <div style={styles.revisionBox}>
        {revisionContent.title && <h4>{revisionContent.title}</h4>}
        {Array.isArray(revisionContent.bulletPoints) && (
          <ul>
            {revisionContent.bulletPoints.map((pt, idx) => (
              <li key={idx}>{pt}</li>
            ))}
          </ul>
        )}
        {revisionContent.exampleSummary && (
          <p>{revisionContent.exampleSummary}</p>
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

      <button style={styles.submitBtn} onClick={handleSubmitRevision}>
        Done with Revision
      </button>
    </div>
  );
}

// Helper to build docId => "revise" + capitalizedExam + capitalizedStage
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