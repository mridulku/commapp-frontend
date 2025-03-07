import React, { useState, useEffect } from "react";
import axios from "axios";

/**
 * 1) We expect GPT to return JSON like:
 * {
 *   "weakConcepts": [
 *     { "id": "concept1", "title": "X", "summary": "..." }
 *   ],
 *   "explanation": "...some string...",
 *   "keyPoints": [
 *     "point A", "point B"
 *   ]
 * }
 */

/**
 * A dynamic revision component for "Apply" stage.
 * It:
 * - Fetches subchapter data (summary, etc.)
 * - Fetches user activities from user__activities__demo
 * - Sends them + a custom prompt to GPT
 * - Renders "weakConcepts", "explanation", and "keyPoints" from GPT
 */
export default function ReviseApply({ subChapterId, onRevisionDone }) {
  // ---------- 1) States ----------
  const [activities, setActivities] = useState(null);
  const [fetchError, setFetchError] = useState("");
  const [showOverlay, setShowOverlay] = useState(false);

  // Subchapter content
  const [subChapter, setSubChapter] = useState(null);
  const [subChError, setSubChError] = useState("");

  // GPT-based revision results
  const [weakConcepts, setWeakConcepts] = useState([]);
  const [explanation, setExplanation] = useState("");
  const [keyPoints, setKeyPoints] = useState([]); // array of strings
  const [revisionError, setRevisionError] = useState("");
  const [loadingRevision, setLoadingRevision] = useState(false);

  // For toggling checkboxes on keyPoints
  // We'll store them as an array of { text, remembered }
  const [checkedKeyPoints, setCheckedKeyPoints] = useState([]);

  // For the GPT call, we might need an API key from env
  const apiKey = import.meta.env.VITE_OPENAI_KEY;  // or handle differently

  // ---------- 2) On mount => fetch subchapter + activities ----------
  useEffect(() => {
    if (!subChapterId) return;

    // fetch subchap doc
    fetchSubchapterDetails(subChapterId)
      .then((data) => {
        setSubChapter(data);
        setSubChError("");
      })
      .catch((err) => {
        console.error("Error fetching subchapter:", err);
        setSubChError(err.message || "Error subchapter");
      });

    // fetch activities
    fetchActivities(subChapterId)
      .then((acts) => {
        setActivities(acts);
        setFetchError("");
      })
      .catch((err) => {
        console.error("Error fetching user activities:", err);
        setFetchError(err.message || "Error activities");
      });
  }, [subChapterId]);

  // ---------- 3) Once we have subChapter + activities => call GPT ----------
  useEffect(() => {
    if (!subChapter || !activities) return;
    // If either has an error, skip
    if (subChError || fetchError) return;

    // We'll do a new function that calls GPT
    (async () => {
      try {
        setLoadingRevision(true);
        setRevisionError("");

        const result = await fetchRevisionFromGPT({
          subChapter,
          activities,
          apiKey,
        });

        // parse result => { weakConcepts, explanation, keyPoints }
        // We'll store them in local states
        if (result.weakConcepts && Array.isArray(result.weakConcepts)) {
          setWeakConcepts(result.weakConcepts);
        }
        if (typeof result.explanation === "string") {
          setExplanation(result.explanation);
        }
        if (Array.isArray(result.keyPoints)) {
          setKeyPoints(result.keyPoints);
          // Also build the "checkedKeyPoints" array
          setCheckedKeyPoints(
            result.keyPoints.map((text, idx) => ({
              id: `kp${idx}`,
              text,
              remembered: false,
            }))
          );
        }
      } catch (err) {
        console.error("fetchRevisionFromGPT => error:", err);
        setRevisionError(err.message || "GPT error");
      } finally {
        setLoadingRevision(false);
      }
    })();
  }, [subChapter, activities, subChError, fetchError, apiKey]);

  // ---------- 4) Handler => Toggle remembered checkbox ----------
  function toggleRemembered(kpId) {
    setCheckedKeyPoints((prev) =>
      prev.map((kp) =>
        kp.id === kpId ? { ...kp, remembered: !kp.remembered } : kp
      )
    );
  }

  return (
    <div style={styles.container}>
      {/* HEADING ROW => title + eye icon */}
      <div style={styles.headingRow}>
        <h3 style={styles.heading}>
          Revision (Apply Stage) for SubChapter: {subChapterId}
        </h3>

        {/* Eye Icon => on hover, show raw JSON data (the activities) */}
        <div
          style={styles.eyeIconContainer}
          onMouseEnter={() => setShowOverlay(true)}
          onMouseLeave={() => setShowOverlay(false)}
        >
          <div style={styles.eyeIcon}>👁</div>
          {showOverlay && (
            <div style={styles.overlay}>
              <h4 style={{ margin: "0 0 8px 0" }}>Activities Data</h4>
              {fetchError ? (
                <p style={{ color: "red" }}>{fetchError}</p>
              ) : activities ? (
                <pre style={styles.overlayPre}>
                  {JSON.stringify(activities, null, 2)}
                </pre>
              ) : (
                <p>Loading...</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* If subchapter or activity had errors */}
      {subChError && <p style={styles.error}>Subchapter Error: {subChError}</p>}
      {fetchError && <p style={styles.error}>Activity Error: {fetchError}</p>}

      <p style={styles.desc}>
        This revision is <strong>dynamically generated</strong> from GPT,
        based on your sub-chapter content & activity logs.
      </p>

      {/* Loading GPT */}
      {loadingRevision && <p style={styles.info}>Loading AI-based revision content...</p>}
      {revisionError && <p style={styles.error}>GPT Error: {revisionError}</p>}

      {/* Once GPT is done => show the final content */}
      {!loadingRevision && !revisionError && (
        <>
          {/* WEAK CONCEPTS */}
          <div style={styles.block}>
            <h4 style={styles.blockTitle}>1) Weak Concepts Identified</h4>
            {weakConcepts.length === 0 ? (
              <p style={styles.subtext}>No major weaknesses found (GPT returned none).</p>
            ) : (
              weakConcepts.map((wc, i) => (
                <div key={wc.id || `wc_${i}`} style={styles.conceptItem}>
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
          </div>

          {/* KEY POINTS TO REMEMBER */}
          <div style={styles.block}>
            <h4 style={styles.blockTitle}>3) Key Points to Remember</h4>
            {checkedKeyPoints.map((kp) => (
              <label key={kp.id} style={styles.keyPointItem}>
                <input
                  type="checkbox"
                  checked={kp.remembered}
                  onChange={() => toggleRemembered(kp.id)}
                />
                <span style={{ marginLeft: "0.5rem" }}>{kp.text}</span>
              </label>
            ))}
            <p style={styles.subtext}>
              (Check off each point once you feel confident you remember it!)
            </p>
          </div>
        </>
      )}

      <button style={styles.btn} onClick={onRevisionDone}>
        Done with Revision
      </button>
    </div>
  );
}

/* ============== HELPER FUNCTIONS ============== */

// A) fetch subchapter
async function fetchSubchapterDetails(subChapterId) {
  const url = `http://localhost:3001/api/subchapters/${subChapterId}`; 
  // or adapt based on your environment/proxy
  const resp = await fetch(url);
  if (!resp.ok) {
    const errData = await resp.json();
    throw new Error(errData.error || "Error fetching subchapter");
  }
  return await resp.json();
}

// B) fetch user activities
async function fetchActivities(subChapterId) {
  const url = `http://localhost:3001/api/userActivities?subChapterId=${subChapterId}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const errData = await resp.json();
    throw new Error(errData.error || "Error fetching activities");
  }
  const data = await resp.json();
  return data.activities || [];
}

// C) call GPT to generate revision content
async function fetchRevisionFromGPT({ subChapter, activities, apiKey }) {
  if (!apiKey) {
    throw new Error("No OpenAI API key found");
  }

  // Build a message string from subChapter + activities
  const subChSummary = subChapter.summary || "No summary available";
  // Convert activities to a short text snippet
  const actSnippet = JSON.stringify(activities, null, 2);

  // Example: We'll just do a single message. We ask GPT:
  const userPrompt = `
You are a helpful tutor. The user is in the "apply" stage for sub-chapter: ${subChapter.name || "(no name)"}. 
The sub-chapter content is:
"${subChSummary}"

The user's recent activity logs are (JSON):
${actSnippet}

From this, produce valid JSON with the structure:
{
  "weakConcepts": [
    {
      "id": "concept1",
      "title": "Short Title",
      "summary": "A short explanation"
    },
    ...
  ],
  "explanation": "string of text",
  "keyPoints": [
    "Bullet point #1",
    "Bullet point #2"
  ]
}

Do NOT include any extra commentary. Do NOT wrap in backticks or markdown. Just valid JSON.
`;

  // Call GPT
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: userPrompt }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error?.message || "GPT request failed");
  }

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content || "";

  let parsed;
  try {
    parsed = JSON.parse(reply.trim());
  } catch (parseErr) {
    throw new Error("GPT response is not valid JSON.");
  }

  return parsed;
}

/* ============== STYLES ============== */
const styles = {
  container: {
    border: "1px solid #666",
    padding: "1rem",
    marginBottom: "1rem",
    borderRadius: "4px",
    backgroundColor: "#1E1E1E",
  },
  headingRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "0.5rem",
  },
  heading: {
    margin: 0,
    fontSize: "1.1rem",
    color: "#fff",
  },
  eyeIconContainer: {
    position: "relative",
    display: "inline-block",
  },
  eyeIcon: {
    width: "24px",
    height: "24px",
    backgroundColor: "#333",
    borderRadius: "50%",
    color: "#fff",
    fontSize: "0.9rem",
    border: "1px solid #666",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  overlay: {
    position: "absolute",
    top: "28px",
    right: 0,
    width: "260px",
    backgroundColor: "#222",
    border: "1px solid #555",
    borderRadius: "4px",
    padding: "8px",
    zIndex: 9999,
  },
  overlayPre: {
    maxHeight: "150px",
    overflowY: "auto",
    backgroundColor: "#333",
    padding: "6px",
    borderRadius: "4px",
    color: "#fff",
    fontSize: "0.8rem",
  },
  desc: {
    margin: "0 0 1.2rem 0",
    fontSize: "0.9rem",
    color: "#ccc",
  },
  info: {
    color: "#bbb",
    fontSize: "0.9rem",
    marginBottom: "0.5rem",
  },
  error: {
    color: "red",
    margin: "0.5rem 0",
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
    whiteSpace: "pre-line",
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