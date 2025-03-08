// PromptManager.jsx
import React, { useState } from "react";

// Adjust BASE_URL to match where your Express server actually runs
// e.g. "http://localhost:3001", "https://api.mydomain.com", etc.
const BASE_URL = "http://localhost:3001"; 

export default function PromptManager() {
  /************************************************
   * State for "GET Prompt"
   ************************************************/
  const [getKey, setGetKey] = useState("");
  const [fetchedPrompt, setFetchedPrompt] = useState(null);
  const [fetchError, setFetchError] = useState("");

  /************************************************
   * State for "POST Prompt"
   ************************************************/
  const [newKey, setNewKey] = useState("");
  const [newText, setNewText] = useState("");
  const [postMessage, setPostMessage] = useState("");

  /**
   * Handle GET prompt by key
   */
  async function handleGetPrompt() {
    if (!getKey) {
      setFetchError("Please enter a promptKey first.");
      return;
    }
    setFetchError("");
    setFetchedPrompt(null);

    try {
      // e.g.: "http://localhost:3001/api/getPrompt?promptKey=..."
      const url = `${BASE_URL}/api/getPrompt?promptKey=${encodeURIComponent(getKey)}`;

      const res = await fetch(url);
      if (!res.ok) {
        // If server returns 404 or 400, we parse the error JSON
        let errMsg = "Error fetching prompt";
        try {
          const errData = await res.json();
          errMsg = errData.error || errMsg;
        } catch {
          // If the response isn't valid JSON, keep the fallback
        }
        setFetchError(errMsg);
        return;
      }

      // Parse the success JSON
      const data = await res.json();
      if (data.prompt) {
        setFetchedPrompt(data.prompt);
      } else if (data.error) {
        setFetchError(data.error);
      } else {
        setFetchError("No prompt found for that key.");
      }
    } catch (err) {
      console.error("GET prompt error:", err);
      setFetchError("Network/Server error fetching prompt");
    }
  }

  /**
   * Handle POST create prompt
   */
  async function handleCreatePrompt() {
    if (!newKey || !newText) {
      setPostMessage("Please fill out both fields (promptKey and promptText).");
      return;
    }
    setPostMessage("");

    try {
      // e.g.: "http://localhost:3001/api/createPrompt"
      const url = `${BASE_URL}/api/createPrompt`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptKey: newKey,
          promptText: newText,
        }),
      });

      if (!res.ok) {
        // read error JSON
        let errMsg = "Error creating prompt";
        try {
          const errData = await res.json();
          errMsg = errData.error || errMsg;
        } catch {
          // if not JSON, keep fallback
        }
        setPostMessage(errMsg);
        return;
      }

      // parse success JSON
      const data = await res.json();
      // e.g. { docId, message: "Prompt created successfully" }
      setPostMessage(`Success: ${data.message}, docId = ${data.docId}`);

      // Optionally clear fields
      setNewKey("");
      setNewText("");
    } catch (err) {
      console.error("POST prompt error:", err);
      setPostMessage("Network/Server error creating prompt");
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Prompt Manager</h2>

      {/* SECTION A: GET PROMPT */}
      <div style={styles.block}>
        <h3>Get Prompt by Key</h3>
        <input
          style={styles.input}
          type="text"
          placeholder="Enter Prompt Key"
          value={getKey}
          onChange={(e) => setGetKey(e.target.value)}
        />
        <button style={styles.btn} onClick={handleGetPrompt}>
          Fetch Prompt
        </button>

        {fetchError && <p style={styles.error}>{fetchError}</p>}

        {fetchedPrompt && (
          <div style={styles.resultBox}>
            <strong>Prompt Text:</strong>
            <p>{fetchedPrompt.promptText}</p>
            <p style={{ fontSize: "0.8rem", color: "#999" }}>
              (docId: {fetchedPrompt.docId})
            </p>
          </div>
        )}
      </div>

      {/* SECTION B: CREATE PROMPT */}
      <div style={styles.block}>
        <h3>Create New Prompt</h3>
        <input
          style={styles.input}
          type="text"
          placeholder="Prompt Key"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
        />
        <textarea
          style={styles.textarea}
          rows={3}
          placeholder="Prompt Text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
        />
        <button style={styles.btn} onClick={handleCreatePrompt}>
          Create Prompt
        </button>

        {postMessage && <p style={styles.status}>{postMessage}</p>}
      </div>
    </div>
  );
}

/** Basic styling */
const styles = {
  container: {
    maxWidth: "600px",
    margin: "20px auto",
    padding: "16px",
    backgroundColor: "#222",
    color: "#fff",
    borderRadius: "8px",
    fontFamily: "sans-serif",
  },
  heading: {
    marginBottom: "1rem",
  },
  block: {
    border: "1px solid #444",
    borderRadius: "4px",
    padding: "12px",
    marginBottom: "1rem",
  },
  input: {
    width: "100%",
    marginBottom: "0.5rem",
    padding: "0.5rem",
    border: "1px solid #555",
    borderRadius: "4px",
    fontSize: "1rem",
    backgroundColor: "#333",
    color: "#fff",
  },
  textarea: {
    width: "100%",
    marginBottom: "0.5rem",
    padding: "0.5rem",
    border: "1px solid #555",
    borderRadius: "4px",
    fontSize: "1rem",
    backgroundColor: "#333",
    color: "#fff",
  },
  btn: {
    backgroundColor: "#444",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: "0.9rem",
  },
  error: {
    color: "red",
    marginTop: "0.5rem",
  },
  resultBox: {
    marginTop: "0.5rem",
    backgroundColor: "#333",
    padding: "0.5rem",
    borderRadius: "4px",
  },
  status: {
    marginTop: "0.5rem",
    color: "#ccc",
  },
};