import React, { useState, useEffect } from "react";
import axios from "axios";

/**
 * A simplified ReviseApply component:
 * - Accepts `subChapterId` as a prop.
 * - On mount (or on subChapterId change), calls the Express route: POST /api/revision
 * - Displays whatever JSON is returned.
 * - Has a "Done with Revision" button that calls `onRevisionDone` (if provided).
 */
export default function ReviseApply({ subChapterId, onRevisionDone }) {
  const [revisionData, setRevisionData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!subChapterId) return;

    setLoading(true);
    setError("");
    setRevisionData(null);

    // Make a POST request to our new Express endpoint
    axios
      .post("http://localhost:3001/revision", { subChapterId })
      .then((response) => {
        setRevisionData(response.data);
      })
      .catch((err) => {
        console.error("Error fetching revision data:", err);
        setError(err.message || "Error fetching revision data");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [subChapterId]);

  if (!subChapterId) {
    return <div>Please provide a valid subChapterId.</div>;
  }

  if (loading) {
    return <div>Loading revision data...</div>;
  }

  if (error) {
    return (
      <div style={{ color: "red" }}>
        <strong>Error:</strong> {error}
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid #666", padding: "1rem", borderRadius: "4px" }}>
      <h3>Revision (Apply Stage) for SubChapter: {subChapterId}</h3>

      <p>
        Below is the raw JSON response returned by our new Express route. We will
        refine and style this later.
      </p>

      {revisionData ? (
        <pre
          style={{
            backgroundColor: "#f0f0f0",
            padding: "1rem",
            borderRadius: "4px",
            maxHeight: "300px",
            overflowY: "auto",
          }}
        >
          {JSON.stringify(revisionData, null, 2)}
        </pre>
      ) : (
        <p>No data received yet.</p>
      )}

      <button onClick={onRevisionDone} style={{ marginTop: "1rem" }}>
        Done with Revision
      </button>
    </div>
  );
}