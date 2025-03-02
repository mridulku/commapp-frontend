import React, { useState } from 'react';

/**
 * ChapterFlowView
 *
 * Props:
 *  - userId (string): The user’s ID from a parent component.
 *  - backendURL (string): The base URL for your Express backend, e.g. "http://localhost:5000"
 */
export default function ChapterFlowView({
  userId = "TestUser123", // default if not provided
  backendURL = import.meta.env.VITE_BACKEND_URL
}) {
  const [bookId, setBookId] = useState("");
  const [stageIndex, setStageIndex] = useState(0);
  const [chapters, setChapters] = useState([]);
  const [error, setError] = useState("");
  const [showResults, setShowResults] = useState(false);

  // For demonstration, we have an array of "steps" to simulate progress
  const steps = [
    "Verifying Book ID...",
    "Checking for Chapter Summaries...",
    "Fetching Chapter Details from GPT...",
    "Chapters Detected!",
  ];

  const handleFetchChapters = async () => {
    // Reset states
    setShowResults(false);
    setError("");
    setChapters([]);
    setStageIndex(0);

    if (!bookId.trim()) {
      setError("Please enter a bookId");
      return;
    }

    try {
      // 1) We simulate step-by-step "animation"
      //    We'll increment stageIndex every ~2 seconds, then do the real fetch

      // Step A) Show "Verifying Book ID..." for 2 seconds
      await waitMs(2000);
      setStageIndex(1);

      // Step B) Show "Checking for Chapter Summaries..." for 2s
      await waitMs(2000);
      setStageIndex(2);

      // Real fetch from the express endpoint
      // Notice we pass userId in the query as well
      const url = `${backendURL}/api/chapters-process?bookId=${encodeURIComponent(
        bookId
      )}&userId=${encodeURIComponent(userId)}`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();

      // Step C) Show "Fetching Chapter Details..." for 2s
      await waitMs(2000);
      setStageIndex(3);

      if (data.error) {
        setError(data.error);
        return;
      }
      // The chapters are in data.chapters
      setChapters(data.chapters || []);
      // After 1s, show the final stage
      await waitMs(1000);

      // Show final results
      setShowResults(true);
    } catch (err) {
      console.error("Fetch error =>", err);
      setError(err.message || "Failed to fetch chapters");
    }
  };

  return (
    <div style={{ margin: "1rem", padding: "1rem", border: "1px solid #ccc" }}>
      <h2>Chapter Flow Demo</h2>
      <p>User ID: {userId}</p>

      <label>
        Enter Book ID:
        <input
          style={{ marginLeft: "0.5rem" }}
          value={bookId}
          onChange={(e) => setBookId(e.target.value)}
        />
      </label>
      <button
        style={{ marginLeft: "0.5rem" }}
        onClick={handleFetchChapters}
      >
        Fetch Chapters
      </button>

      {error && (
        <p style={{ color: "red", fontWeight: "bold" }}>
          Error: {error}
        </p>
      )}

      {/* 
         STAGE PROGRESS: We show the steps array in a stylized manner 
      */}
      {stageIndex < steps.length && (
        <div style={{ marginTop: "1rem" }}>
          <p>
            <strong>Progress:</strong> {steps[stageIndex]}
          </p>
          {/* You could show a spinner or "..." here if you like */}
        </div>
      )}

      {/* Once showResults is true, we display the final chapters */}
      {showResults && (
        <div style={{ marginTop: "1rem" }}>
          <h3>Chapters Found</h3>
          {chapters.length === 0 ? (
            <p>No chapters found (empty array).</p>
          ) : (
            <ul>
              {chapters.map((ch, idx) => (
                <li key={idx}>
                  <p>
                    <strong>Title:</strong> {ch.title || "(No Title)"}
                  </p>
                  <p>
                    <strong>Start Page:</strong> {ch.startPage || "?"},{" "}
                    <strong>End Page:</strong> {ch.endPage || "?"}
                  </p>
                  <p>
                    <em>{ch.summary?.slice(0, 60)}...</em>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/** 
 * A tiny helper to wait a specified number of milliseconds (to simulate steps).
 */
function waitMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}