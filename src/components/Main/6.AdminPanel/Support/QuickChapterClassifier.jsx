import React, { useState } from "react";

/**
 * QuickChapterClassifier
 * ----------------------
 * A drop-in React component that lets a learner paste or type a question,
 * sends it to OpenAI Chat Completion with a fixed system prompt listing
 * 10 example chapters, and returns the chapter index + confidence.
 *
 * 🔑  Expects the environment variable `REACT_APP_OPENAI_API_KEY` (CRA / Vite)
 *     or `NEXT_PUBLIC_OPENAI_API_KEY` (Next.js) to be defined at build time.
 *
 * ⚠️  In production, proxy calls through a secure backend so you don’t ship
 *     your secret key to the browser. This front-end call is for fast prototyping
 *     and internal demos only.
 */

const OPENAI_API_KEY =
  import.meta.env.VITE_OPENAI_API_KEY || // Vite
  process.env.REACT_APP_OPENAI_API_KEY || // CRA
  process.env.NEXT_PUBLIC_OPENAI_API_KEY; // Next.js

const SYSTEM_PROMPT = `You are an exam expert. Below is a fixed list of 10 chapters.
Return the single chapter number (1-10) that best matches the learner\'s question.
Also return a confidence score between 0 and 1.

CHAPTERS:
1. Mechanics
2. Thermodynamics
3. Waves & Sound
4. Optics
5. Electricity & Magnetism
6. Modern Physics
7. Calculus Basics
8. Algebra & Trigonometry
9. Differential Equations
10. Probability & Statistics`;

function QuickChapterClassifier() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const classify = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // fallback to gpt-3.5-turbo if unavailable
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `QUESTION: ${query}\nRespond ONLY in JSON with keys chapter (integer 1-10) and confidence (0-1).`,
            },
          ],
          temperature: 0,
          max_tokens: 50,
        }),
      });

      if (!response.ok) throw new Error(await response.text());

      const data = await response.json();
      const assistantMessage = data.choices?.[0]?.message?.content || "";

      // Attempt to parse JSON; guard against malformed output
      let parsed;
      try {
        parsed = JSON.parse(assistantMessage);
      } catch (_) {
        parsed = { raw: assistantMessage };
      }
      setResult(parsed);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4 border rounded-xl shadow">
      <h2 className="text-xl font-bold mb-3">Quick Chapter Classifier</h2>
      <textarea
        className="w-full border rounded p-2 h-32"
        placeholder="Paste your question here…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button
        onClick={classify}
        disabled={!query.trim() || loading}
        className="mt-3 px-4 py-2 rounded text-white bg-blue-600 disabled:opacity-50"
      >
        {loading ? "Classifying…" : "Classify"}
      </button>

      {error && (
        <p className="text-red-600 mt-3">Error: {error}</p>
      )}

      {result && !error && (
        <pre className="mt-4 bg-gray-100 p-3 rounded text-sm overflow-x-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default QuickChapterClassifier;
