import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";

function stripMarkdownFences(text) {
  return text.replace(/```(json)?/gi, "").trim();
}

export default function ReviseAnalyze({ onRevisionDone }) {
  const userId = useSelector((state) => state.auth?.userId) || "demoUser";
  const { flattenedActivities, currentIndex } = useSelector((state) => state.plan);
  const currentActivity =
    flattenedActivities && currentIndex >= 0
      ? flattenedActivities[currentIndex]
      : null;
  const subchapterId = currentActivity ? currentActivity.subChapterId : "";

  // We'll define revisionType as "analyze" (or "apply", etc.)
  const revisionType = "analyze";
  // We'll store revisionNumber once we fetch existing revisions
  const [revisionNumber, setRevisionNumber] = useState(null);

  // States for GPT data
  const [responseData, setResponseData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 1) On mount, fetch existing revisions to find the highest revisionNumber
  useEffect(() => {
    if (!userId || !subchapterId) return;

    (async () => {
      try {
        // 1) fetch existing revisions
        const revRes = await axios.get("http://localhost:3001/api/getRevisions", {
          params: {
            userId,
            subchapterId,
            revisionType,
          },
        });

        const revisions = revRes.data.revisions || [];
        // if we have existing revisions, let's say the highest is revisions[0].revisionNumber
        // because we orderBy desc in the backend
        let nextRevNum = 1;
        if (revisions.length > 0) {
          nextRevNum = revisions[0].revisionNumber + 1;
        }
        setRevisionNumber(nextRevNum);
      } catch (err) {
        console.error("Error fetching revisions:", err);
      }
    })();
  }, [userId, subchapterId]);

  // 2) Fetch GPT “revise” content
  useEffect(() => {
    if (!subchapterId || !userId) return;

    setLoading(true);
    setError("");
    setResponseData(null);

    axios
      .post("http://localhost:3001/api/generate", {
        userId,
        subchapterId,
        promptKey: "revise", // or "reviseAnalyze"
      })
      .then((res) => {
        setResponseData(res.data);
      })
      .catch((err) => {
        console.error("Error fetching revision data:", err);
        setError(err.message || "Error fetching data");
      })
      .finally(() => setLoading(false));
  }, [subchapterId, userId]);

  if (!subchapterId || !userId) {
    return <div style={styles.text}>Please ensure valid user/subchapter.</div>;
  }
  if (loading) return <div style={styles.text}>Loading revision data...</div>;
  if (error) return <div style={styles.textError}>Error: {error}</div>;
  if (!responseData) return <div style={styles.text}>No data yet.</div>;
  if (revisionNumber === null) {
    return <div style={styles.text}>Calculating next revision number...</div>;
  }

  let rawResult = responseData.result || "";
  if (rawResult.startsWith("```")) {
    rawResult = stripMarkdownFences(rawResult);
  }

  let parsedResult;
  try {
    parsedResult = JSON.parse(rawResult);
  } catch (err) {
    return (
      <div style={styles.container}>
        <h3 style={styles.heading}>
          Revision (Analyze Stage) for {subchapterId}
        </h3>
        <p style={{ ...styles.text, color: "red" }}>
          GPT response is not valid JSON. Showing raw text:
        </p>
        <pre style={styles.pre}>{rawResult}</pre>
        <button onClick={handleRevisionDone} style={styles.button}>
          Done with Revision
        </button>
      </div>
    );
  }

  const { UIconfig = {} } = responseData;
  const { fields = [] } = UIconfig;

  // Called when user finishes revision
  async function handleRevisionDone() {
    try {
      await axios.post("http://localhost:3001/api/submitRevision", {
        userId,
        subchapterId,
        revisionType,
        revisionNumber,
      });
      if (onRevisionDone) onRevisionDone();
    } catch (err) {
      console.error("Error submitting revision record:", err);
      alert("Failed to record revision.");
    }
  }

  function renderField(fieldConfig) {
    const { field, label, style } = fieldConfig;
    const combinedStyle = { ...styles.fieldValue, ...(style || {}) };

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
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.heading}>
        Revision (Analyze Stage) for SubChapter: {subchapterId}
      </h3>
      <p style={styles.text}>
        (This will be revision #{revisionNumber})
      </p>
      {fields.length > 0 ? (
        fields.map(renderField)
      ) : (
        <pre style={styles.pre}>{JSON.stringify(parsedResult, null, 2)}</pre>
      )}

      <button onClick={handleRevisionDone} style={styles.button}>
        Done with Revision
      </button>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: "transparent",
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
    backgroundColor: "transparent",
    color: "#fff",
  },
};