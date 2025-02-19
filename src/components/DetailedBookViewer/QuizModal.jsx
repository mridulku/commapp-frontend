import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";

const BLOOMS_REMEMBER_UNDERSTAND_PROMPT = `You are a helpful assistant. Given the following text, generate 3 multiple-choice questions 
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

function QuizModal({
  isOpen,
  onClose,
  userId,
  subChapterId,        // We'll need these to check if a quiz doc exists
  subChapterName,
  subChapterContent,
  backendURL
}) {
  if (!isOpen) return null;

  const portalRoot = document.getElementById("portal-root");
  if (!portalRoot) return null;

  const apiKey = import.meta.env.VITE_OPENAI_KEY;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // For the quiz data:
  const [questions, setQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [score, setScore] = useState(null);

  // Whether the quiz is read-only (already taken) or new
  const [readOnly, setReadOnly] = useState(false);

  // On open, we do 2 steps:
  // 1) check if a quiz doc for userId + subChapterId already exists
  // 2) if not found => generate from GPT
  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    setError(null);
    setQuestions([]);
    setSelectedAnswers({});
    setScore(null);
    setReadOnly(false);

    // 1) Try to fetch existing quiz from /api/quizzes
    if (!userId || !subChapterId) {
      setError("Missing userId or subChapterId");
      setLoading(false);
      return;
    }

    fetchExistingQuiz(userId, subChapterId)
      .then((existingQuiz) => {
        if (existingQuiz) {
          // Found an existing quiz => show read-only
          setQuestions(existingQuiz.questions || []);
          setSelectedAnswers(existingQuiz.selectedAnswers || {});
          setScore(existingQuiz.score ?? null);
          setReadOnly(true); // This indicates user already took the quiz
          setLoading(false);
        } else {
          // No existing quiz => call GPT to generate new
          fetchQuizFromGPT();
        }
      })
      .catch((err) => {
        console.error("Error in fetchExistingQuiz:", err);
        setError(err.message);
        setLoading(false);
      });
    // eslint-disable-next-line
  }, [isOpen]);

  // Step 1: fetch existing quiz doc if it exists
  const fetchExistingQuiz = async (userId, subChapterId) => {
    try {
      const url = `${backendURL}/api/quizzes?userId=${userId}&subChapterId=${subChapterId}`;
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("Failed to check existing quiz");
      
      const data = await resp.json();
      if (data.success && data.data) {
        // doc found
        return data.data; // Return the doc data => { userId, subChapterId, questions, ...}
      } else {
        // no quiz found or success=false
        return null;
      }
    } catch (error) {
      throw error;
    }
  };

  // Step 2: fetch new quiz from GPT if none existed
  const fetchQuizFromGPT = async () => {
    if (!apiKey) {
      setError("No OpenAI API key found in environment!");
      setLoading(false);
      return;
    }
    try {
      const fullPrompt = `
        ${BLOOMS_REMEMBER_UNDERSTAND_PROMPT}
        Text Content:
        ${subChapterContent}
      `;
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: fullPrompt }],
          temperature: 0.7
        })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "API request failed");
      }
      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || "";

      let parsed;
      try {
        parsed = JSON.parse(reply.trim());
      } catch (parseErr) {
        console.warn("Could not parse GPT response. Raw reply:", reply);
        throw new Error("GPT response is not valid JSON.");
      }

      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error("GPT response JSON missing 'questions' array.");
      }
      setQuestions(parsed.questions);
    } catch (err) {
      console.error("Error fetching quiz from GPT:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // user picks an answer
  const handleOptionChange = (qIndex, optIndex) => {
    if (readOnly) return; // do nothing if read-only
    setSelectedAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
  };

  // user clicks Submit => compute score => store doc
  const handleSubmit = async () => {
    if (!questions.length) return;
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

    // store in DB
    try {
      await saveQuizToServer({
        userId,
        subChapterId,
        subChapterName,
        questions,
        selectedAnswers,
        score: finalScore,
        backendURL
      });
    } catch (err) {
      console.error("Error storing quiz:", err);
      setError(err.message);
    }

    // set read-only after submission
    setReadOnly(true);
  };

  // store doc
  const saveQuizToServer = async ({
    userId,
    subChapterId,
    subChapterName,
    questions,
    selectedAnswers,
    score,
    backendURL
  }) => {
    const payload = {
      userId,
      subChapterId,
      subChapterName,
      questions,
      selectedAnswers,
      score
    };

    const resp = await fetch(`${backendURL}/api/quizzes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) {
      const errData = await resp.json();
      throw new Error(errData.error || "Failed to store quiz");
    }
  };

  // styles
  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const modalContentStyle = {
    backgroundColor: "#fff",
    color: "#000",
    borderRadius: "6px",
    padding: "20px",
    width: "600px",
    maxWidth: "90%",
    maxHeight: "80vh",
    overflowY: "auto",
    position: "relative",
  };

  const closeModalButtonStyle = {
    position: "absolute",
    top: "10px",
    right: "10px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "1.2rem",
    fontWeight: "bold",
  };

  const primaryButtonStyle = {
    padding: "10px 20px",
    borderRadius: "4px",
    border: "none",
    backgroundColor: "#203A43",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
    marginTop: "10px",
  };

  return ReactDOM.createPortal(
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <button style={closeModalButtonStyle} onClick={onClose}>
          &times;
        </button>
        
        <h3>Quiz for: {subChapterName}</h3>

        {loading && <p>Loading...</p>}
        {error && <p style={{ color: "red" }}><strong>Error: </strong>{error}</p>}

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
                          disabled={readOnly} // disable if read-only
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

            {/* If read-only or we have a score, hide submit */}
            {!readOnly && score === null && (
              <button style={primaryButtonStyle} onClick={handleSubmit}>
                Submit
              </button>
            )}
          </div>
        )}

        {/* If we have no quiz from GPT and not loading/error */}
        {!loading && !error && questions.length === 0 && (
          <p>No questions available.</p>
        )}

        <button
          style={{ ...primaryButtonStyle, backgroundColor: "#555", marginLeft: "1rem" }}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>,
    portalRoot
  );
}

export default QuizModal;