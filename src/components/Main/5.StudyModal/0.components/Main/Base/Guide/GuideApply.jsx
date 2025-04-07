/**
 * File: GuideRememberRevisionFlow.jsx
 * 
 * A single React component demonstrating:
 *   1) A "guide" screen for the Remember stage (like the old GuideRemember),
 *   2) Then a mini quiz with 2 questions,
 *   3) If pass => final explanation about how revision works,
 *   4) If fail => show revision content, retake just the missed Q(s) until pass,
 *   5) End with "done" screen.
 *
 * No external data – purely local states for demonstration / onboarding.
 */

import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Divider,
  Grid,
  useMediaQuery
} from "@mui/material";

import QuizIcon from "@mui/icons-material/Quiz";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

// -------------- MAIN COMPONENT --------------
export default function GuideApply() {
  // PHASES => 'guide' | 'quiz' | 'revision' | 'retake' | 'finalExplanation' | 'done'
  const [phase, setPhase] = useState("guide");

  // Hard-coded reading speed for the "guide" portion
  const approximateReadingSpeed = 200;
  const isSmallScreen = useMediaQuery("(max-width:600px)");

  // The two questions
  const initialQuestions = [
    {
      id: "Q1",
      question: "What color is the sky on a clear day?",
      type: "multipleChoice",
      options: ["Green", "Red", "Blue", "White"],
      correctIndex: 2,
    },
    {
      id: "Q2",
      question: "Which is heavier: 1kg of iron or 1kg of cotton?",
      type: "multipleChoice",
      options: ["Iron", "Cotton", "Both weigh 1kg", "Not sure"],
      correctIndex: 2,
    },
  ];

  // local quiz states
  const [questions] = useState(initialQuestions);
  const [userAnswers, setUserAnswers] = useState(Array(initialQuestions.length).fill(""));
  const [missedIndices, setMissedIndices] = useState([]);
  const [attemptNumber, setAttemptNumber] = useState(1);

  // messages
  const [passMessage, setPassMessage] = useState("");
  const [failMessage, setFailMessage] = useState("");

  // Hard-coded revision content
  const revisionHtml = `
    <h3>Revision Tips</h3>
    <p>Review the basic facts carefully:</p>
    <ul>
      <li>The sky is typically "blue" on a clear day.</li>
      <li>1kg of iron and 1kg of cotton weigh the same: 1kg!</li>
    </ul>
    <p>Once you’ve refreshed these facts, retake the quiz for the missed questions.</p>
  `;

  // =========== GUIDE SCREEN (phase="guide") ===========
  function renderGuideScreen() {
    return (
      <Box sx={styles.fullContainer}>
        <Paper elevation={3} sx={styles.guidePaper}>
          <Box sx={styles.headerRow}>
            <EmojiEventsIcon sx={{ fontSize: 36, color: "#FFD700", mr: 1 }} />
            <Typography variant="h4" sx={styles.guideTitle}>
              Nice Job on the Reading!
            </Typography>
          </Box>

          <Typography variant="body1" sx={styles.guideParagraph}>
            We estimate your reading speed is around 
            <strong> {approximateReadingSpeed} words per minute</strong>.
            This helps us plan your tasks more accurately.
          </Typography>

          <Divider sx={{ my: 2, borderColor: "#555" }} />

          <Box sx={styles.stageRow}>
            <QuizIcon sx={{ fontSize: 40, color: "#FFD700", mr: 2 }} />
            <Typography variant="h5" sx={{ color: "#fff" }}>
              The “Remember” Stage
            </Typography>
          </Box>

          <Typography variant="body2" sx={styles.introText}>
            Time to lock in the basics with a short recall quiz. 
            This ensures you don’t forget key points right after reading.
          </Typography>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" sx={styles.bulletItem}>
                • You’ll see simple questions (often MCQs).
              </Typography>
              <Typography variant="body2" sx={styles.bulletItem}>
                • If you miss any concept, we’ll mark it for revision.
              </Typography>
              <Typography variant="body2" sx={styles.bulletItem}>
                • Don’t stress! This stage is for reinforcing your memory.
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" sx={styles.bulletItem}>
                • Immediate recall helps push facts into long-term memory.
              </Typography>
              <Typography variant="body2" sx={styles.bulletItem}>
                • Over time, repeated quizzes ensure strong retention.
              </Typography>
              <Typography variant="body2" sx={styles.bulletItem}>
                • If you slip up, we’ll show revision tips and let you retry.
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2, borderColor: "#555" }} />

          <Typography variant="body2" sx={styles.guideParagraph}>
            Ready to test what you remember so far? Let’s do a quick check!
          </Typography>

          <Button
            variant="contained"
            color="primary"
            endIcon={<ArrowForwardIcon />}
            onClick={() => setPhase("quiz")}
            sx={{ mt: 2, fontWeight: "bold" }}
          >
            {isSmallScreen ? "Begin Quiz" : "Begin the Recall Quiz"}
          </Button>
        </Paper>
      </Box>
    );
  }

  // =========== QUIZ (phase="quiz") ===========
  function renderQuizScreen() {
    return (
      <div style={styles.container}>
        <div style={styles.quizBox}>
          <h2 style={{ color: "#fff" }}>
            Remember Stage (Attempt #{attemptNumber})
          </h2>
          {passMessage && <p style={{ color: "lightgreen" }}>{passMessage}</p>}
          {failMessage && <p style={{ color: "tomato" }}>{failMessage}</p>}

          {questions.map((qObj, i) => (
            <div key={qObj.id} style={styles.questionBlock}>
              <p style={{ color: "#ddd", marginBottom: 6 }}>
                Q{i + 1}: {qObj.question}
              </p>
              {renderMCQ(qObj, i)}
            </div>
          ))}

          <button style={styles.button} onClick={handleQuizSubmit}>
            Submit
          </button>
        </div>
      </div>
    );
  }

  // =========== REVISION (phase="revision") ===========
  function renderRevisionScreen() {
    return (
      <div style={styles.container}>
        <div style={styles.quizBox}>
          <h2 style={{ color: "#fff" }}>Revision Content</h2>
          {failMessage && <p style={{ color: "tomato" }}>{failMessage}</p>}
          <div
            style={styles.revisionArea}
            dangerouslySetInnerHTML={{ __html: revisionHtml }}
          />
          <button style={styles.button} onClick={handleRevisionDone}>
            Retake Missed Questions
          </button>
        </div>
      </div>
    );
  }

  // =========== RETAKE (phase="retake") ===========
  function renderRetakeScreen() {
    return (
      <div style={styles.container}>
        <div style={styles.quizBox}>
          <h2 style={{ color: "#fff" }}>
            Retake Missed Questions (Attempt #{attemptNumber})
          </h2>
          {passMessage && <p style={{ color: "lightgreen" }}>{passMessage}</p>}
          {failMessage && <p style={{ color: "tomato" }}>{failMessage}</p>}

          {missedIndices.map((qIdx) => {
            const qObj = questions[qIdx];
            return (
              <div key={qObj.id} style={styles.questionBlock}>
                <p style={{ color: "#ddd", marginBottom: 6 }}>
                  Q{qIdx + 1}: {qObj.question}
                </p>
                {renderMCQ(qObj, qIdx)}
              </div>
            );
          })}

          <button style={styles.button} onClick={handleRetakeSubmit}>
            Submit Retake
          </button>
        </div>
      </div>
    );
  }

  // =========== FINAL EXPLANATION (phase="finalExplanation") ===========
  function renderFinalExplanationScreen() {
    return (
      <div style={styles.container}>
        <div style={styles.quizBox}>
          <h2 style={{ color: "#fff" }}>Stage Complete</h2>
          {passMessage && <p style={{ color: "lightgreen" }}>{passMessage}</p>}
          {failMessage && <p style={{ color: "tomato" }}>{failMessage}</p>}
          
          <p style={{ color: "#ddd", marginTop: 16 }}>
            In a real scenario, if you had gotten anything wrong, 
            we would have repeated the 
            <strong> revision → retake → check again</strong> loop 
            until you eventually pass all questions. 
          </p>
          <p style={{ color: "#ddd", marginTop: 8 }}>
            This ensures a thorough grasp of all concepts before moving on.
          </p>

          <button style={styles.button} onClick={() => setPhase("done")}>
            Continue
          </button>
        </div>
      </div>
    );
  }

  // =========== DONE (phase="done") ===========
  function renderDoneScreen() {
    return (
      <div style={styles.container}>
        <div style={styles.quizBox}>
          <h2 style={{ color: "#fff" }}>All done!</h2>
          <p style={{ color: "#ddd" }}>
            This was a demonstration of how the “Remember” stage + revision loop 
            might work. In the real platform, questions and revision 
            content would be more elaborate or GPT-driven.
          </p>
          <button style={styles.button} onClick={() => alert("You can do anything next!")}>
            Exit Demo
          </button>
        </div>
      </div>
    );
  }

  // =========== QUIZ & RETAKE LOGIC ===========

  function handleQuizSubmit() {
    // We'll check each question vs userAnswers => pass or fail
    const newlyMissed = [];
    questions.forEach((qObj, i) => {
      const userAns = userAnswers[i];
      const correctIdx = qObj.correctIndex;
      if (parseInt(userAns, 10) !== correctIdx) {
        newlyMissed.push(i);
      }
    });

    if (newlyMissed.length === 0) {
      // user passed all questions
      setPassMessage("Congrats! You got everything correct on this attempt.");
      setFailMessage("");
      setPhase("finalExplanation");
    } else {
      // user missed something => show revision
      setMissedIndices(newlyMissed);
      setFailMessage(`You missed ${newlyMissed.length} question(s). Let's do revision!`);
      setPassMessage("");
      setPhase("revision");
    }
  }

  function handleRevisionDone() {
    setPhase("retake");
    setAttemptNumber((prev) => prev + 1);
  }

  function handleRetakeSubmit() {
    const newlyMissed = [];
    missedIndices.forEach((qIdx) => {
      const qObj = questions[qIdx];
      const userAns = userAnswers[qIdx];
      if (parseInt(userAns, 10) !== qObj.correctIndex) {
        newlyMissed.push(qIdx);
      }
    });

    if (newlyMissed.length === 0) {
      // user fixed all mistakes
      setMissedIndices([]);
      setPassMessage(`Great job! You fixed all missed questions on attempt #${attemptNumber}.`);
      setFailMessage("");
      setPhase("finalExplanation");
    } else {
      // still missed some => revision again
      setMissedIndices(newlyMissed);
      setFailMessage(`You still missed ${newlyMissed.length} question(s). Let's revise again.`);
      setPassMessage("");
      setPhase("revision");
    }
  }

  function renderMCQ(qObj, qIdx) {
    return (
      <div>
        {qObj.options.map((opt, i) => (
          <label key={i} style={{ display: "block", marginLeft: 20 }}>
            <input
              type="radio"
              name={`q_${qObj.id}`}
              value={i}
              checked={parseInt(userAnswers[qIdx], 10) === i}
              onChange={() => handleAnswerChange(qIdx, i)}
            />
            {opt}
          </label>
        ))}
      </div>
    );
  }

  function handleAnswerChange(qIdx, val) {
    const newAnswers = [...userAnswers];
    newAnswers[qIdx] = val;
    setUserAnswers(newAnswers);
  }

  // =========== RENDER SWITCH ON PHASE ===========
  switch (phase) {
    case "guide":
      return renderGuideScreen();
    case "quiz":
      return renderQuizScreen();
    case "revision":
      return renderRevisionScreen();
    case "retake":
      return renderRetakeScreen();
    case "finalExplanation":
      return renderFinalExplanationScreen();
    case "done":
      return renderDoneScreen();
    default:
      return <div style={styles.container}>Unknown phase: {phase}</div>;
  }
}

// -------------- STYLES --------------
const styles = {
  // For the "guide" portion
  fullContainer: {
    backgroundColor: "#000",
    width: "100%",
    minHeight: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxSizing: "border-box",
    padding: "1rem",
  },
  guidePaper: {
    maxWidth: "750px",
    width: "100%",
    backgroundColor: "#111",
    color: "#fff",
    borderRadius: "8px",
    padding: "24px",
    textAlign: "left",
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: 16,
  },
  guideTitle: {
    color: "#fff",
    fontWeight: "bold",
  },
  guideParagraph: {
    color: "#ccc",
    marginBottom: "1rem",
    fontSize: "0.95rem",
  },
  stageRow: {
    display: "flex",
    alignItems: "center",
    marginTop: 16,
  },
  introText: {
    marginTop: "1rem",
    color: "#bbb",
  },
  bulletItem: {
    marginBottom: "0.5rem",
    color: "#ccc",
  },

  // For the quiz portion
  container: {
    width: "100%",
    minHeight: "100%",
    backgroundColor: "#000",
    color: "#fff",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: 20,
    boxSizing: "border-box",
    fontFamily: "'Inter', sans-serif",
  },
  quizBox: {
    width: "100%",
    maxWidth: 600,
    backgroundColor: "#111",
    borderRadius: 8,
    border: "1px solid #333",
    padding: 16,
  },
  questionBlock: {
    backgroundColor: "#222",
    borderRadius: 6,
    padding: 8,
    marginBottom: 12,
  },
  revisionArea: {
    backgroundColor: "#222",
    borderRadius: 6,
    padding: 8,
    margin: "12px 0",
    color: "#ccc",
  },
  button: {
    backgroundColor: "#444",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    padding: "8px 12px",
    cursor: "pointer",
    fontWeight: "bold",
    marginTop: 8,
  },
};