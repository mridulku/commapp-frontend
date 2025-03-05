import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";

// Two distinct GPT prompts
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
 * QuizView (Redux-based)
 * -----------------------
 * 1) Reads activity.subChapterId, etc. from props.
 * 2) Reads userId from Redux (or fallback).
 * 3) Fetches subchapter data, existing quiz doc, or calls GPT to generate quiz.
 * 4) Renders multiple-choice quiz with local states: loading, questions, selectedAnswers, score, etc.
 */
export default function QuizView({ activity }) {
  // 1) Extract quiz-related info from the activity object
  const subChapterId = activity.subChapterId;
  const subChapterName = activity.subChapterName || "Untitled Subchapter";
  const level = activity.level || "basic"; // "mastery" => 5 Qs, else 3 Qs

  // 2) Suppose you store user info in Redux (auth slice or user slice).
  //    Adjust the selector path to match your store. For example:
  const userId = useSelector((state) => state.auth?.userId || "demoUser"); 

  // Alternatively, if you'd prefer a prop:
  //   function QuizView({ activity, userId, ... })
  //   - remove the useSelector line

  // 3) We can also read the base URL from Redux or an env var:
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
  // Or from a Redux store, or pass as prop

  // ---------- State Variables ----------
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subChapter, setSubChapter] = useState(null);

  const [questions, setQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [readOnly, setReadOnly] = useState(false);

  // For GPT key (if you want to store in Redux or .env)
  const apiKey = import.meta.env.VITE_OPENAI_KEY; 

  // -----------------------------------
  // Lifecycle: Fetch data & set up quiz
  // -----------------------------------
  useEffect(() => {
    if (!subChapterId || !userId) {
      console.warn("[QuizView] Missing subChapterId or userId => cannot proceed.");
      setError("Missing subChapterId or userId. Quiz cannot be loaded.");
      return;
    }

    // Reset UI states each time subChapterId changes
    setLoading(true);
    setError(null);
    setSubChapter(null);
    setQuestions([]);
    setSelectedAnswers({});
    setScore(null);
    setReadOnly(false);

    async function fetchSubchapterAndQuiz() {
      try {
        // A) Fetch subchapter details
        const subData = await fetchSubChapterDetails(subChapterId, backendURL);
        setSubChapter(subData);

        // B) Check existing quiz doc
        const existingQuiz = await fetchExistingQuiz(userId, subChapterId, backendURL);
        if (existingQuiz) {
          // If doc found
          if (existingQuiz.score === 3 || existingQuiz.score === 5) {
            // Perfect score => readOnly
            setQuestions(existingQuiz.questions || []);
            setSelectedAnswers(existingQuiz.selectedAnswers || {});
            setScore(existingQuiz.score ?? null);
            setReadOnly(true);
            setLoading(false);
            return;
          } else {
            // Score < perfect => fetch GPT again
            await fetchQuizFromGPT(subData.summary);
          }
        } else {
          // no doc => new quiz from GPT
          await fetchQuizFromGPT(subData.summary);
        }
      } catch (err) {
        console.error("[QuizView] Error =>", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchSubchapterAndQuiz();
  }, [subChapterId, userId, backendURL]);

  // -----------------------------------
  // Helper: fetch SubChapter
  // -----------------------------------
  async function fetchSubChapterDetails(subChId, baseURL) {
    const res = await axios.get(`${baseURL}/api/subchapters/${subChId}`);
    return res.data; // e.g. { subChapterName, summary, wordCount, etc. }
  }

  // -----------------------------------
  // Helper: fetch existing quiz doc
  // -----------------------------------
  async function fetchExistingQuiz(uId, sChId, baseURL) {
    const url = `${baseURL}/api/quizzes?userId=${uId}&subChapterId=${sChId}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`[fetchExistingQuiz] HTTP ${resp.status}`);
    }
    const data = await resp.json();
    if (data.success && data.data) {
      return data.data; // { userId, subChapterId, questions, score, etc. }
    } else {
      return null;
    }
  }

  // -----------------------------------
  // Helper: call GPT to generate quiz
  // -----------------------------------
  async function fetchQuizFromGPT(subChapterContent) {
    if (!apiKey) {
      setError("No OpenAI API key found!");
      return;
    }
    // Decide how many questions:
    const basePrompt = level === "mastery" ? PROMPT_5_QUESTIONS : PROMPT_3_QUESTIONS;

    try {
      setLoading(true);
      setError(null);

      const fullPrompt = `
        ${basePrompt}
        Text Content:
        ${subChapterContent || ""}
      `;
      console.log("[fetchQuizFromGPT] using prompt =>", fullPrompt.slice(0, 200), "...");

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

      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error("GPT response JSON missing 'questions' array.");
      }

      setQuestions(parsed.questions);
    } catch (err) {
      console.error("[fetchQuizFromGPT] error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // -----------------------------------
  // handleOptionChange
  // -----------------------------------
  function handleOptionChange(qIndex, optIndex) {
    if (readOnly) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  }

  // -----------------------------------
  // handleSubmit => compute score & store doc
  // -----------------------------------
  async function handleSubmit() {
    if (!questions.length) return;

    // Compute how many are correct
    let correctCount = 0;
    questions.forEach((q, idx) => {
      const userSelectionIdx = selectedAnswers[idx];
      if (userSelectionIdx != null) {
        const userOption = q.options[userSelectionIdx];
        if (userOption === q.answer) correctCount++;
      }
    });
    const finalScore = correctCount;
    setScore(finalScore);

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
    } catch (err) {
      console.error("[handleSubmit] Error storing quiz:", err);
      setError(err.message);
    }
    setReadOnly(true);
  }

  // -----------------------------------
  // Helper: store quiz doc
  // -----------------------------------
  async function saveQuizToServer({
    userId,
    subChapterId,
    subChapterName,
    questions,
    selectedAnswers,
    score,
    backendURL,
  }) {
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

  // -----------------------------------
  // Render
  // -----------------------------------
  const quizTitle = subChapter?.subChapterName || subChapterName || subChapterId;

  return (
    <div style={outerContainer}>
      {/* Header */}
      <div style={headerSection}>
        <h2 style={{ margin: 0 }}>
          Quiz for SubChapter: {quizTitle}
        </h2>
        {level && (
          <p style={{ margin: 0, fontStyle: "italic", fontSize: "0.9rem" }}>
            Level: {level}
          </p>
        )}
      </div>

      {/* Main content area */}
      <div style={quizContentArea}>
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
              <div key={qIndex} style={questionBlock}>
                <strong>
                  Q{qIndex + 1}: {q.question}
                </strong>
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

            {/* Score if we have one */}
            {score !== null && (
              <div style={{ marginTop: "1rem", fontWeight: "bold" }}>
                You scored {score} / {questions.length} correct!
              </div>
            )}

            {/* Submit button only if not readOnly & no score yet */}
            {!readOnly && score === null && (
              <button style={quizButtonStyle} onClick={handleSubmit}>
                Submit
              </button>
            )}
          </div>
        )}

        {/* If no quiz and not loading/error => "No questions" */}
        {!loading && !error && questions.length === 0 && (
          <p>No questions available.</p>
        )}
      </div>
    </div>
  );
}

// --------------------- Styles ---------------------

const outerContainer = {
  width: "100%",
  height: "100%",
  backgroundColor: "#000",
  color: "#fff",
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  padding: "20px",
};

const headerSection = {
  marginBottom: "16px",
};

const quizContentArea = {
  flex: 1,
  overflowY: "auto",
};

const questionBlock = {
  marginBottom: "1rem",
};

const quizButtonStyle = {
  padding: "8px 16px",
  borderRadius: "4px",
  border: "none",
  backgroundColor: "#444",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
  marginTop: "10px",
  fontSize: "0.9rem",
};