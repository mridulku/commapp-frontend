import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";

// Helper to remove markdown fences (```json) from GPT's response
function stripMarkdownFences(text) {
  return text.replace(/```(json)?/gi, "").trim();
}

export default function ReviseApply({ onRevisionDone }) {
  // Grab user/subchapter from Redux (adjust selectors if needed)
  const userId = useSelector((state) => state.auth?.userId) || "demoUser";
  const { flattenedActivities, currentIndex } = useSelector((state) => state.plan);
  const currentActivity =
    flattenedActivities && currentIndex >= 0 ? flattenedActivities[currentIndex] : null;
  const subchapterId = currentActivity ? currentActivity.subChapterId : "";

  // Hard-coded prompt ID
  const promptId = "Hv1dsxLiZHVmCtXd2FRy";

  const [responseData, setResponseData] = useState(null); // { finalPrompt, result, UIconfig }
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!subchapterId || !userId) return;

    setLoading(true);
    setError("");
    setResponseData(null);

    axios
      .post("http://localhost:3001/api/generate", {
        userId,
        subchapterId,
        promptId,
      })
      .then((res) => {
        setResponseData(res.data);
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setError(err.message || "Error fetching data");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [subchapterId, userId, promptId]);

  // Early returns for states
  if (!subchapterId || !userId) {
    return <div style={styles.text}>Please ensure you have valid user and subchapter info.</div>;
  }
  if (loading) return <div style={styles.text}>Loading revision data...</div>;
  if (error) {
    return (
      <div style={styles.textError}>
        Error: {error}
      </div>
    );
  }
  if (!responseData) {
    return <div style={styles.text}>No data received yet.</div>;
  }

  // Remove code fences if present
  let rawResult = responseData.result || "";
  if (rawResult.startsWith("```")) {
    rawResult = stripMarkdownFences(rawResult);
  }

  // Attempt to parse the GPT result as JSON
  let parsedResult;
  try {
    parsedResult = JSON.parse(rawResult);
  } catch (err) {
    // Fallback: show raw text
    return (
      <div style={styles.container}>
        <h3 style={styles.heading}>Revision (Apply Stage) for SubChapter: {subchapterId}</h3>
        <p style={{ ...styles.text, color: "red" }}>
          GPT response is not valid JSON. Showing raw text:
        </p>
        <pre style={styles.pre}>{rawResult}</pre>
        <button onClick={onRevisionDone} style={styles.button}>
          Done with Revision
        </button>
      </div>
    );
  }

  // Render according to UIconfig
  const { UIconfig = {} } = responseData;
  const { fields = [] } = UIconfig;

  const renderField = (fieldConfig) => {
    const { field, label } = fieldConfig;
    // Merge style from Firestore with our default style
    const combinedStyle = { ...styles.fieldValue, ...(fieldConfig.style || {}) };

    const value = parsedResult[field] || "";
    return (
      <div key={field} style={styles.fieldBlock}>
        <strong style={styles.fieldLabel}>{label}:</strong>
        <div style={combinedStyle}>
          {Array.isArray(value)
            ? value.map((item, idx) => <div key={idx}>• {item}</div>)
            : value}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>Revision (Apply Stage) for SubChapter: {subchapterId}</h3>
      {fields.length > 0 ? (
        fields.map(renderField)
      ) : (
        // If no UIconfig fields, just show entire JSON
        <pre style={styles.pre}>{JSON.stringify(parsedResult, null, 2)}</pre>
      )}
      <button onClick={onRevisionDone} style={styles.button}>
        Done with Revision
      </button>
    </div>
  );
}

// Simple styling to blend with a dark background
const styles = {
  container: {
    backgroundColor: "transparent",
    padding: "1rem",
    color: "#fff",
    // remove borders to blend with black background
  },
  heading: {
    margin: 0,
    marginBottom: "1rem",
    fontSize: "1.2rem",
    color: "#fff",
  },
  text: {
    color: "#fff",
  },
  textError: {
    color: "red",
    padding: "1rem",
  },
  pre: {
    backgroundColor: "transparent",
    color: "#fff",
    border: "none",
    padding: 0,
    margin: "1rem 0",
    whiteSpace: "pre-wrap",
  },
  button: {
    marginTop: "1rem",
    padding: "8px 16px",
    cursor: "pointer",
    backgroundColor: "#444",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
  },
  fieldBlock: {
    marginBottom: "1rem",
  },
  fieldLabel: {
    display: "block",
    fontWeight: "bold",
    marginBottom: "0.25rem",
  },
  fieldValue: {
    // default styling for bullet items
    backgroundColor: "transparent",
    color: "#fff",
    // remove borders or padding if you prefer a truly minimal look
  },
};