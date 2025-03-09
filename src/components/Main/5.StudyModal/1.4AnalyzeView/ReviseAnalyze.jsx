import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import LoadingSpinner from "./LoadingSpinner";


function stripMarkdownFences(text) {
  return text.replace(/```(json)?/gi, "").trim();
}

/**
 * ReviseAnalyze
 * -------------
 * Expects:
 *   subChapterId   (string)
 *   revisionNumber (number)
 *   onRevisionDone (function)
 *
 * Only fetches GPT data for "reviseAnalyze" or "revise" promptKey, then on "Done",
 * calls /api/submitRevision with { userId, subchapterId, revisionType="analyze", revisionNumber }.
 */

export default function ReviseAnalyze({
  subChapterId,
  revisionNumber,
  onRevisionDone,
}) {
  const userId = useSelector((state) => state.auth?.userId) ;
  const revisionType = "analyze";

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [responseData, setResponseData] = useState(null);

  // Fetch GPT for revision
  useEffect(() => {
    if (!subChapterId) return;
    fetchRevisionGPT();
  }, [subChapterId, revisionNumber]);

  async function fetchRevisionGPT() {
    try {
      setLoading(true);
      setError("");
      setResponseData(null);

      const res = await axios.post("http://localhost:3001/api/generate", {
        userId,
        subchapterId: subChapterId,
        promptKey: "revise", // or "reviseAnalyze"
      });
      setResponseData(res.data);
    } catch (err) {
      console.error("Error fetching revision GPT:", err);
      setError(err.message || "Error fetching revision GPT");
    } finally {
      setLoading(false);
    }
  }

  if (!subChapterId) {
    return <div style={styles.text}>No subChapterId.</div>;
  }
  if (loading) {
      return <LoadingSpinner message="Building your revision..." />;
    }
  if (error) {
    return <div style={styles.textError}>Error: {error}</div>;
  }
  if (!responseData) {
    return <div style={styles.text}>No data loaded yet.</div>;
  }

  // parse GPT JSON
  let raw = responseData.result || "";
  if (raw.startsWith("```")) {
    raw = stripMarkdownFences(raw);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return (
      <div style={styles.container}>
        <h3 style={styles.heading}>Revision (Analyze)</h3>
        <p style={{ ...styles.text, color: "red" }}>
          GPT response is not valid JSON. Check console for details.
        </p>
        <button onClick={handleDone} style={styles.button}>
          Done with Revision
        </button>
      </div>
    );
  }

  const { UIconfig = {} } = responseData;
  const { fields = [] } = UIconfig;

  async function handleDone() {
    try {
      await axios.post("http://localhost:3001/api/submitRevision", {
        userId,
        subchapterId: subChapterId,
        revisionType,
        revisionNumber,
      });
      onRevisionDone?.();
    } catch (err) {
      console.error("Error saving revision doc:", err);
      alert("Failed to record revision!");
    }
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>
        Revision (Analyze) – Attempt #{revisionNumber}
      </h3>
      {fields.length > 0 ? (
        fields.map((fieldConfig, idx) => renderField(parsed, fieldConfig, idx))
      ) : (
        <pre style={styles.pre}>{JSON.stringify(parsed, null, 2)}</pre>
      )}

      <button onClick={handleDone} style={styles.button}>
        Done with Revision
      </button>
    </div>
  );
}

function renderField(parsed, fieldConfig, key) {
  const { field, label, style } = fieldConfig;
  const value = parsed[field] || "";
  return (
    <div key={key} style={styles.fieldBlock}>
      <strong style={styles.fieldLabel}>{label}:</strong>
      <div style={{ ...styles.fieldValue, ...(style || {}) }}>
        {Array.isArray(value)
          ? value.map((item, idx) => <div key={idx}>• {item}</div>)
          : value}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "1rem",
    color: "#fff",
  },
  heading: {
    margin: 0,
    marginBottom: "1rem",
    fontSize: "1.2rem",
  },
  text: {
    color: "#fff",
  },
  textError: {
    color: "red",
    padding: "1rem",
  },
  button: {
    marginTop: "1rem",
    padding: "8px 16px",
    backgroundColor: "#444",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  pre: {
    backgroundColor: "transparent",
    color: "#fff",
    whiteSpace: "pre-wrap",
    border: "none",
    margin: "1rem 0",
  },
  fieldBlock: {
    marginBottom: "1rem",
  },
  fieldLabel: {
    fontWeight: "bold",
    marginBottom: "0.25rem",
  },
  fieldValue: {
    color: "#fff",
  },
};