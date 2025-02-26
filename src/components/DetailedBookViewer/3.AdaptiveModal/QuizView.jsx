// QuizView.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";

// Two distinct prompts: 3 questions vs. 5 questions
const PROMPT_3_QUESTIONS = `You are a helpful assistant. Given the following text, generate 3 multiple-choice questions 
that test basic recall (Bloom's Remember/Understand). 
Return ONLY valid JSON with the structure:

{
  "questions": [
    {
      "question": "...",
      "options": [ "option text...", "..." ],
      "answer": "the correct option text..."
    },
    ...
  ]
}

Do NOT include any markdown formatting or extra commentary. 
Do NOT wrap it in backticks. 
Just return valid JSON.
`;

const PROMPT_5_QUESTIONS = `You are a helpful assistant. Given the following text, generate 5 multiple-choice questions 
that test deeper recall (Bloom's Remember/Understand). 
Return ONLY valid JSON with the structure:

{
  "questions": [
    {
      "question": "...",
      "options": [ "option text...", "..." ],
      "answer": "the correct option text..."
    },
    ...
  ]
}

Do NOT include any markdown formatting or extra commentary. 
Do NOT wrap it in backticks. 
Just return valid JSON.
`;

/**
 * QuizView
 *
 * 1) Fetches subChapter data from /api/subchapters/:subChapterId
 * 2) Checks if there's an existing quiz doc (score).
 * 3) If none or score < 3 => calls GPT using the chosen prompt (3 or 5 Q's).
 */
export default function QuizView({
  subChapterId,
  level, // e.g. "mastery" => 5 Qs, else 3 Qs
  subChapterName = "Untitled Subchapter",
  userId,
  backendURL = import.meta.env.VITE_BACKEND_URL,
}) {
  // ---------- State Variables ----------
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // subchapter content we fetch from server
  const [subChapter, setSubChapter] = useState(null);

  const [questions, setQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [readOnly, setReadOnly] = useState(false);

  // API key for GPT
  const apiKey = import.meta.env.VITE_OPENAI_KEY;

  console.log("QuizView props =>", {
    subChapterId,
    level,
    userId,
    backendURL,
    apiKeyExists: !!apiKey,
  });

  // 1) On mount or when subChapterId changes, fetch subchapter data & then quiz logic
  useEffect(() => {
    if (!subChapterId || !userId) {
      console.warn("[QuizView] Missing subChapterId or userId => cannot proceed.");
      setError("Missing subChapterId or userId. Quiz cannot be loaded.");
      return;
    }

    // Reset states
    setLoading(true);
    setError(null);
    setSubChapter(null);
    setQuestions([]);
    setSelectedAnswers({});
    setScore(null);
    setReadOnly(false);

    // A) Fetch subchapter from server
    async function fetchSubchapterAndQuiz() {
      try {
        // 1) Fetch subchapter details
        const subRes = await axios.get(`${backendURL}/api/subchapters/${subChapterId}`);
        const subData = subRes.data;
        console.log("[QuizView] fetched subchapter =>", subData);
        setSubChapter(subData);

        // 2) Check existing quiz doc
        const existingQuiz = await fetchExistingQuiz(userId, subChapterId);
        console.log("[QuizView] existingQuiz =>", existingQuiz);

        if (existingQuiz) {
          // If doc found
          if (existingQuiz.score === 3 || existingQuiz.score === 5) {
            // Perfect score => readOnly mode
            console.log("[QuizView] Perfect score => read-only mode.");
            setQuestions(existingQuiz.questions || []);
            setSelectedAnswers(existingQuiz.selectedAnswers || {});
            setScore(existingQuiz.score ?? null);
            setReadOnly(true);
            setLoading(false);
            return;
          } else {
            console.log("[QuizView] found quiz doc but score < perfect => calling GPT again");
            // we want a new quiz => call GPT
            await fetchQuizFromGPT(subData.summary);
          }
        } else {
          // no doc => new quiz from GPT
          console.log("[QuizView] no quiz doc => calling GPT fresh.");
          await fetchQuizFromGPT(subData.summary);
        }
      } catch (err) {
        console.error("[QuizView] Error in fetchSubchapterAndQuiz =>", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchSubchapterAndQuiz();
  }, [subChapterId, userId, backendURL]);

  // ================ fetchExistingQuiz =================
  async function fetchExistingQuiz(userId, subChapterId) {
    const url = `${backendURL}/api/quizzes?userId=${userId}&subChapterId=${subChapterId}`;
    console.log("[fetchExistingQuiz] GET =>", url);
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`[fetchExistingQuiz] HTTP ${resp.status}`);
    }
    const data = await resp.json();
    if (data.success && data.data) {
      return data.data; // e.g. { userId, subChapterId, questions, score, ... }
    } else {
      return null;
    }
  }

  // ================ GPT fetchQuizFromGPT =================
  async function fetchQuizFromGPT(subChapterContent) {
    if (!apiKey) {
      console.error("[fetchQuizFromGPT] No OpenAI API key found!");
      setError("No OpenAI API key found!");
      return;
    }
    // Pick the correct prompt based on level
    let basePrompt;
    if (level === "mastery") {
      basePrompt = PROMPT_5_QUESTIONS;
    } else {
      basePrompt = PROMPT_3_QUESTIONS;
    }

    // If summary is empty => GPT can't do much
    if (!subChapterContent) {
      console.warn("[fetchQuizFromGPT] subChapterContent is empty => GPT might produce bland quiz.");
    }

    console.log("[fetchQuizFromGPT] using prompt =>", level === "mastery" ? "5-question" : "3-question");

    try {
      setLoading(true);
      setError(null);

      // Compose final GPT user prompt
      const fullPrompt = `
        ${basePrompt}
        Text Content:
        ${subChapterContent}
      `;
      console.log("[fetchQuizFromGPT] sending prompt to GPT:", fullPrompt.slice(0, 200), "...");

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: fullPrompt }],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        console.error("[fetchQuizFromGPT] GPT error response:", errData);
        throw new Error(errData.error?.message || "[fetchQuizFromGPT] API request failed.");
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "";
      console.log("[fetchQuizFromGPT] raw GPT reply:", reply);

      let parsed;
      try {
        parsed = JSON.parse(reply.trim());
        console.log("[fetchQuizFromGPT] parsed JSON:", parsed);
      } catch (parseErr) {
        console.warn("[fetchQuizFromGPT] Could not parse GPT response as JSON. raw:", reply);
        throw new Error("GPT response is not valid JSON.");
      }

      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        console.error("[fetchQuizFromGPT] Missing 'questions' array in GPT response.");
        throw new Error("GPT response JSON missing 'questions' array.");
      }

      setQuestions(parsed.questions);
      console.log("[fetchQuizFromGPT] success => setQuestions with length=", parsed.questions.length);
    } catch (err) {
      console.error("[fetchQuizFromGPT] error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ================ handleOptionChange =================
  function handleOptionChange(qIndex, optIndex) {
    if (readOnly) {
      console.log("[handleOptionChange] readOnly => ignoring input.");
      return;
    }
    console.log("[handleOptionChange] user selected qIndex=", qIndex, "optIndex=", optIndex);
    setSelectedAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  }

  // ================ handleSubmit => compute score & store doc =================
  async function handleSubmit() {
    if (!questions.length) {
      console.warn("[handleSubmit] no questions => cannot submit");
      return;
    }
    console.log("[handleSubmit] computing user score...");
    let correctCount = 0;

    questions.forEach((q, idx) => {
      const userSelectionIdx = selectedAnswers[idx];
      if (userSelectionIdx != null) {
        const userOption = q.options[userSelectionIdx];
        if (userOption === q.answer) correctCount++;
      }
    });

    const finalScore = correctCount;
    console.log("[handleSubmit] finalScore=", finalScore, " / ", questions.length);
    setScore(finalScore);

    // store in DB
    try {
      await saveQuizToServer({
        userId,
        subChapterId,
        subChapterName: subChapter?.subChapterName || "Unknown",
        questions,
        selectedAnswers,
        score: finalScore,
        backendURL,
      });
      console.log("[handleSubmit] quiz doc saved successfully.");
    } catch (err) {
      console.error("[handleSubmit] Error storing quiz:", err);
      setError(err.message);
    }

    setReadOnly(true);
  }

  // ================ saveQuizToServer => /api/quizzes (POST) =================
  async function saveQuizToServer({
    userId,
    subChapterId,
    subChapterName,
    questions,
    selectedAnswers,
    score,
    backendURL,
  }) {
    console.log("[saveQuizToServer] storing doc with score=", score);
    const payload = {
      userId,
      subChapterId,
      subChapterName,
      questions,
      selectedAnswers,
      score,
    };

    const resp = await fetch(`${backendURL}/api/quizzes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const errData = await resp.json();
      throw new Error(errData.error || "Failed to store quiz");
    }
  }

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // RENDER UI
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  console.log("[QuizView] render => loading=", loading, " error=", error, " questions.length=", questions.length);

  return (
    <div style={quizContainer}>
      <h2>Quiz for SubChapter: {subChapter?.subChapterName || subChapterId}</h2>
      {level && <p style={{ fontStyle: "italic" }}>Level: {level}</p>}

      {loading && <p>Loading quiz data...</p>}

      {error && (
        <p style={{ color: "red" }}>
          <strong>Error:</strong> {error}
        </p>
      )}

      {/* If we have questions */}
      {!loading && !error && questions.length > 0 && (
        <div>
          {questions.map((q, qIndex) => (
            <div key={qIndex} style={{ marginBottom: "1rem" }}>
              <strong>Q{qIndex + 1}: {q.question}</strong>
              <div style={{ marginTop: "0.5rem" }}>
                {q.options.map((opt, optIndex) => {
                  const checked = selectedAnswers[qIndex] === optIndex;
                  return (
                    <label
                      key={optIndex}
                      style={{ display: "block", marginLeft: "1rem" }}
                    >
                      <input
                        type="radio"
                        name={`q-${qIndex}`}
                        value={opt}
                        disabled={readOnly}
                        checked={checked}
                        onChange={() => handleOptionChange(qIndex, optIndex)}
                      />
                      {opt}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Show score if we have one */}
          {score !== null && (
            <div style={{ marginTop: "1rem", fontWeight: "bold" }}>
              You scored {score} / {questions.length} correct!
            </div>
          )}

          {/* If readOnly or we've already got a score, hide submit */}
          {!readOnly && score === null && (
            <button style={quizButtonStyle} onClick={handleSubmit}>
              Submit
            </button>
          )}
        </div>
      )}

      {/* If no quiz from GPT and not loading/error => "No questions" */}
      {!loading && !error && questions.length === 0 && (
        <p>No questions available.</p>
      )}
    </div>
  );
}

// ---------- Styles ----------
const quizContainer = {
  padding: "20px",
  color: "#fff",
  backgroundColor: "rgba(0, 128, 0, 0.3)", // light greenish
  borderRadius: "8px",
};

const quizButtonStyle = {
  padding: "10px 20px",
  borderRadius: "4px",
  border: "none",
  backgroundColor: "#203A43",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
  marginTop: "10px",
};