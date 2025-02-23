import React, { useState, useEffect, useRef } from "react";

/**
 * SpectacularAdaptiveSession
 * --------------------------
 * A full-screen cinematic overlay that demonstrates:
 *  - A multi-step “playlist” with Reading, Quiz, Break, Revision, etc.
 *  - A countdown or session timer
 *  - A side panel listing items
 *  - Rich styling and transitions
 *  - A chat corner
 *
 * PROPS:
 *  - isOpen (boolean): controls if the overlay is displayed
 *  - onClose (function): callback when user closes the session
 *  - userName (string): user name for greeting
 *  - sessionLength (number): total planned session length (minutes)
 *  - daysUntilExam (number): days until exam, shown in top bar
 */
export default function SpectacularAdaptiveSession({
  isOpen,
  onClose,
  userName = "John Doe",
  sessionLength = 45,
  daysUntilExam = 7,
}) {
  /**
   * Here’s our “playlist” (sessionItems). Each item has:
   *  - id (unique string),
   *  - label,
   *  - type (reading, quiz, break, revision, summary, completion, etc.)
   *  - estimatedTime (minutes)
   *  - extra data if needed (subChapterId, quizQuestions, etc.)
   */
  const sessionItems = [
    {
      id: "intro",
      label: "Welcome & Overview",
      type: "intro",
      estimatedTime: 3,
    },
    {
      id: "reading1",
      label: "Reading: Subchapter 1",
      type: "reading",
      estimatedTime: 10,
      text: `Lorem ipsum dolor sit amet... (placeholder for subchapter 1)`,
    },
    {
      id: "quiz1",
      label: "Quiz: Quick Check #1",
      type: "quiz",
      estimatedTime: 5,
      quizQuestions: [
        {
          question: "What is the main idea of subchapter 1?",
          options: [
            "It’s about advanced topics",
            "It’s about traveling to Mars",
            "It's purely filler text",
            "We didn’t read anything",
          ],
          correctIndex: 0,
        },
        {
          question: "How long did it take you to read subchapter 1?",
          options: ["1 minute", "5 minutes", "10 minutes", "20 minutes"],
          correctIndex: 1,
        },
      ],
    },
    {
      id: "break1",
      label: "Break Time!",
      type: "break",
      estimatedTime: 5,
    },
    {
      id: "reading2",
      label: "Reading: Subchapter 2",
      type: "reading",
      estimatedTime: 12,
      text: `Another block of reading text for subchapter 2... (placeholder)`,
    },
    {
      id: "revision1",
      label: "Revision / Flashcards",
      type: "revision",
      estimatedTime: 5,
      revisionOf: ["reading1"], // referencing the reading1 item if we wanted
    },
    {
      id: "quiz2",
      label: "Quiz: Check #2",
      type: "quiz",
      estimatedTime: 7,
      quizQuestions: [
        {
          question: "Which statement is correct about subchapter 2?",
          options: [
            "It's extremely short",
            "It’s about neural networks",
            "It references more advanced topics from subch.1",
            "No clue yet",
          ],
          correctIndex: 2,
        },
      ],
    },
    {
      id: "summary",
      label: "Session Summary",
      type: "summary",
      estimatedTime: 3,
    },
    {
      id: "done",
      label: "Completion",
      type: "completion",
      estimatedTime: 0,
    },
  ];

  // We'll track which item index is currently active
  const [currentIndex, setCurrentIndex] = useState(0);

  // For quiz answers storage if needed. We'll just store them by item ID or index.
  // Example: an object { "quiz1": [0,2], "quiz2": [1], ... }
  const [quizAnswers, setQuizAnswers] = useState({});

  // Timer: countdown from sessionLength * 60
  const [secondsLeft, setSecondsLeft] = useState(sessionLength * 60);
  const timerRef = useRef(null);

  // Chat states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: "system", text: "Hello! Need help? Just ask me here." },
  ]);
  const [newMessage, setNewMessage] = useState("");

  // On mount/when isOpen changes, start/stop the timer
  useEffect(() => {
    if (isOpen) {
      // reset
      setSecondsLeft(sessionLength * 60);

      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, sessionLength]);

  // Navigate steps
  const goNext = () => {
    if (currentIndex < sessionItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // If we're already at the last item, we can close
      handleClose();
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Handle chat send
  const handleChatSend = () => {
    if (!newMessage.trim()) return;
    setChatMessages([...chatMessages, { sender: "user", text: newMessage }]);
    setNewMessage("");
  };

  // If not open, return null
  if (!isOpen) return null;

  // Current item
  const currentItem = sessionItems[currentIndex];

  // A small helper to figure out the “percent” of steps completed
  const stepPercent = Math.round(((currentIndex + 1) / sessionItems.length) * 100);

  const handleClose = () => {
    if (onClose) onClose();
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* Top bar: Show exam info, timer, close button */}
        <div style={topBarStyle}>
          <div style={topBarLeftStyle}>
            <h3 style={{ margin: 0 }}>
              Exam in {daysUntilExam} days • Total session: {sessionLength} min
            </h3>
          </div>
          <div style={timerStyle}>
            <SessionTimer secondsLeft={secondsLeft} />
          </div>
          <div
            style={{ cursor: "pointer", fontSize: "1.5rem" }}
            onClick={handleClose}
          >
            ✕
          </div>
        </div>

        <div style={mainAreaStyle}>
          {/* Left side: playlist or steps panel */}
          <PlaylistPanel
            items={sessionItems}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
          />

          {/* Center content: the current item */}
          <StepContentWrapper currentIndex={currentIndex}>
            <StepRenderer
              item={currentItem}
              userName={userName}
              quizAnswers={quizAnswers}
              setQuizAnswers={setQuizAnswers}
              onNext={goNext}
              onPrev={goPrev}
            />
          </StepContentWrapper>
        </div>

        {/* Chat panel in corner */}
        <ChatPanel
          open={chatOpen}
          onToggle={() => setChatOpen(!chatOpen)}
          messages={chatMessages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          onSend={handleChatSend}
        />

        {/* Progress bar at the bottom or top - let's do bottom for variety */}
        <div style={bottomBarStyle}>
          <ProgressBar stepPercent={stepPercent} currentIndex={currentIndex} totalSteps={sessionItems.length} />
        </div>
      </div>
    </div>
  );
}

/* 
 * StepRenderer
 * Renders different content based on item.type
 */
function StepRenderer({ item, userName, quizAnswers, setQuizAnswers, onNext, onPrev }) {
  if (!item) return null;

  const handleQuizOption = (itemId, questionIndex, optionIndex) => {
    setQuizAnswers((prev) => {
      const existing = { ...(prev[itemId] || []) };
      existing[questionIndex] = optionIndex;
      return { ...prev, [itemId]: existing };
    });
  };

  switch (item.type) {
    case "intro":
      return (
        <IntroStep item={item} userName={userName} onNext={onNext} onPrev={onPrev} />
      );
    case "reading":
      return <ReadingStep item={item} onNext={onNext} onPrev={onPrev} />;
    case "quiz":
      return (
        <QuizStep
          item={item}
          answers={quizAnswers[item.id] || {}}
          onOptionSelect={(qIdx, optIdx) => handleQuizOption(item.id, qIdx, optIdx)}
          onNext={onNext}
          onPrev={onPrev}
        />
      );
    case "break":
      return <BreakStep item={item} onNext={onNext} onPrev={onPrev} />;
    case "revision":
      return <RevisionStep item={item} onNext={onNext} onPrev={onPrev} />;
    case "summary":
      return <SummaryStep item={item} onNext={onNext} onPrev={onPrev} />;
    case "completion":
      return <CompletionStep item={item} onClose={onNext} onPrev={onPrev} />;
    default:
      return (
        <div style={contentAreaStyle}>
          <h2>Unknown Step Type: {item.type}</h2>
          <button onClick={onPrev}>Back</button>
          <button onClick={onNext}>Next</button>
        </div>
      );
  }
}

/* ============ Step Sub-Components =========== */

function IntroStep({ item, userName, onNext, onPrev }) {
  return (
    <div style={contentInnerStyle}>
      <h1>Welcome, {userName}!</h1>
      <p>This session will guide you through reading, quizzes, breaks, and more!</p>
      <p>Get comfortable, stay focused, and let’s begin.</p>
      <p>(Estimated time: {item.estimatedTime} min)</p>
      <div style={buttonRowStyle}>
        {onPrev && (
          <button style={secondaryButtonStyle} onClick={onPrev} disabled>
            Back
          </button>
        )}
        <button style={primaryButtonStyle} onClick={onNext}>
          Start
        </button>
      </div>
    </div>
  );
}

function ReadingStep({ item, onNext, onPrev }) {
  return (
    <div style={contentInnerStyle}>
      <h2>{item.label}</h2>
      <p style={{ whiteSpace: "pre-wrap" }}>{item.text}</p>
      <p>Estimated Time: {item.estimatedTime} min</p>
      <div style={buttonRowStyle}>
        <button style={secondaryButtonStyle} onClick={onPrev}>Back</button>
        <button style={primaryButtonStyle} onClick={onNext}>Done Reading</button>
      </div>
    </div>
  );
}

function QuizStep({ item, answers, onOptionSelect, onNext, onPrev }) {
  const questions = item.quizQuestions || [];
  const handleOptionChange = (qIdx, optIdx) => {
    onOptionSelect(qIdx, optIdx);
  };

  return (
    <div style={contentInnerStyle}>
      <h2>{item.label}</h2>
      {questions.map((q, qIndex) => {
        const userAnswer = answers[qIndex] ?? null;
        return (
          <div key={qIndex} style={{ marginBottom: "15px" }}>
            <p style={{ fontWeight: "bold" }}>{q.question}</p>
            {q.options.map((opt, optIndex) => {
              const isSelected = userAnswer === optIndex;
              return (
                <label
                  key={optIndex}
                  style={{
                    display: "block",
                    padding: "5px",
                    cursor: "pointer",
                    backgroundColor: isSelected ? "rgba(255,215,0,0.2)" : "transparent",
                    borderRadius: "4px",
                    marginBottom: "4px",
                  }}
                >
                  <input
                    type="radio"
                    name={`quiz-${item.id}-q${qIndex}`}
                    checked={isSelected}
                    onChange={() => handleOptionChange(qIndex, optIndex)}
                    style={{ marginRight: "6px" }}
                  />
                  {opt}
                </label>
              );
            })}
          </div>
        );
      })}
      <p>Estimated Time: {item.estimatedTime} min</p>
      <div style={buttonRowStyle}>
        <button style={secondaryButtonStyle} onClick={onPrev}>Back</button>
        <button style={primaryButtonStyle} onClick={onNext}>Next</button>
      </div>
    </div>
  );
}

function BreakStep({ item, onNext, onPrev }) {
  return (
    <div style={contentInnerStyle}>
      <h2>Take a Break!</h2>
      <p>Grab a coffee, stretch your legs, or just relax for a few minutes.</p>
      <p>Scheduled Break: {item.estimatedTime} min</p>
      <div style={buttonRowStyle}>
        <button style={secondaryButtonStyle} onClick={onPrev}>Back</button>
        <button style={primaryButtonStyle} onClick={onNext}>Continue</button>
      </div>
    </div>
  );
}

function RevisionStep({ item, onNext, onPrev }) {
  return (
    <div style={contentInnerStyle}>
      <h2>{item.label}</h2>
      <p>Revision of: {JSON.stringify(item.revisionOf || [])}</p>
      <p>
        Here you might show flashcards, key points, or a summary of previous subchapters.
      </p>
      <p>Estimated Time: {item.estimatedTime} min</p>
      <div style={buttonRowStyle}>
        <button style={secondaryButtonStyle} onClick={onPrev}>Back</button>
        <button style={primaryButtonStyle} onClick={onNext}>Done Revising</button>
      </div>
    </div>
  );
}

function SummaryStep({ item, onNext, onPrev }) {
  return (
    <div style={contentInnerStyle}>
      <h2>Session Summary</h2>
      <p>Great job reaching the summary!</p>
      <p>
        Here you could display stats: reading done, quiz correctness, time spent, 
        or recommended next steps.
      </p>
      <p>Estimated Time: {item.estimatedTime} min</p>
      <div style={buttonRowStyle}>
        <button style={secondaryButtonStyle} onClick={onPrev}>Back</button>
        <button style={primaryButtonStyle} onClick={onNext}>Next</button>
      </div>
    </div>
  );
}

function CompletionStep({ item, onClose, onPrev }) {
  return (
    <div style={contentInnerStyle}>
      <h2>Session Complete!</h2>
      <p>Congratulations on completing this adaptive session.</p>
      <p>Keep the momentum going for your next session or final exam!</p>
      <div style={buttonRowStyle}>
        <button style={secondaryButtonStyle} onClick={onPrev}>Review Steps</button>
        <button style={primaryButtonStyle} onClick={onClose}>Done</button>
      </div>
    </div>
  );
}

/* 
 * StepContentWrapper 
 *  - Adds a nice transition effect when the currentIndex changes
 */
function StepContentWrapper({ currentIndex, children }) {
  const [displayIndex, setDisplayIndex] = useState(currentIndex);
  const [direction, setDirection] = useState("forward");

  useEffect(() => {
    if (currentIndex > displayIndex) {
      setDirection("forward");
    } else if (currentIndex < displayIndex) {
      setDirection("backward");
    }
    setDisplayIndex(currentIndex);
  }, [currentIndex, displayIndex]);

  return (
    <div
      style={{
        ...contentAreaStyle,
        transition: "transform 0.4s ease",
        transform: direction === "forward" ? "translateX(0)" : "translateX(0)",
      }}
    >
      {children}
    </div>
  );
}

/*
 * PlaylistPanel 
 *  - Shows the list of items
 *  - Highlights the current item
 */
function PlaylistPanel({ items = [] , currentIndex, setCurrentIndex }) {
  return (
    <div style={playlistPanelStyle}>
      <h2 style={{ marginBottom: "15px" }}>Session Steps</h2>
      {items.map((itm, idx) => {
        const active = idx === currentIndex;
        return (
          <div
            key={itm.id}
            style={{
              padding: "8px",
              borderRadius: "4px",
              marginBottom: "6px",
              backgroundColor: active ? "rgba(255,215,0,0.3)" : "transparent",
              cursor: "pointer",
              transition: "background-color 0.2s",
            }}
            onClick={() => setCurrentIndex(idx)}
          >
            {idx + 1}. {itm.label} — {itm.type} ({itm.estimatedTime}min)
          </div>
        );
      })}
    </div>
  );
}

/*
 * ChatPanel 
 *  - A collapsible chat area in the bottom-right 
 */
function ChatPanel({ open, onToggle, messages, newMessage, setNewMessage, onSend }) {
  return (
    <div style={{ ...chatPanelContainerStyle, height: open ? "300px" : "40px" }}>
      <div style={chatHeaderStyle} onClick={onToggle}>
        <strong>Chat</strong>
        <span style={{ marginLeft: "10px" }}>{open ? "▼" : "▲"}</span>
      </div>
      {open && (
        <div style={chatBodyStyle}>
          <div style={chatMessagesStyle}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{ textAlign: msg.sender === "user" ? "right" : "left", marginBottom: "8px" }}
              >
                <span
                  style={{
                    display: "inline-block",
                    backgroundColor: msg.sender === "user" ? "#FFD700" : "#444",
                    color: msg.sender === "user" ? "#000" : "#fff",
                    borderRadius: "4px",
                    padding: "5px 10px",
                    maxWidth: "70%",
                  }}
                >
                  {msg.text}
                </span>
              </div>
            ))}
          </div>
          <div style={chatInputContainerStyle}>
            <input
              style={chatInputStyle}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSend()}
              placeholder="Type here..."
            />
            <button style={chatSendButtonStyle} onClick={onSend}>
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/*
 * SessionTimer 
 *  - Displays countdown mm:ss
 */
function SessionTimer({ secondsLeft }) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  return (
    <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
      {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
      <span style={{ fontSize: "0.8rem", marginLeft: "6px" }}>left</span>
    </div>
  );
}

/*
 * ProgressBar 
 *  - A bottom bar showing how many steps have been completed
 */
function ProgressBar({ stepPercent, currentIndex, totalSteps }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 20px" }}>
      <div style={progressBarContainer}>
        <div style={{ ...progressBarFill, width: `${stepPercent}%` }} />
      </div>
      <div style={{ color: "#fff" }}>
        Step {currentIndex + 1} / {totalSteps} ({stepPercent}%)
      </div>
    </div>
  );
}

/* ---------- STYLES ---------- */

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0,0,0,0.8)",
  zIndex: 99999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const modalStyle = {
  width: "90%",
  height: "90%",
  background: "linear-gradient(to bottom right, #1e1e1e, #444)",
  borderRadius: "12px",
  display: "flex",
  flexDirection: "column",
  position: "relative",
  boxShadow: "0 0 40px rgba(0,0,0,0.8)",
  overflow: "hidden",
};

const topBarStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: "#222",
  padding: "10px 20px",
  color: "#fff",
};

const topBarLeftStyle = {
  display: "flex",
  alignItems: "center",
  gap: "15px",
};

const timerStyle = {
  fontSize: "1.2rem",
  color: "#FFD700",
};

const mainAreaStyle = {
  flex: 1,
  display: "flex",
  overflow: "hidden",
};

const playlistPanelStyle = {
  width: "250px",
  backgroundColor: "#2c2c2c",
  color: "#fff",
  padding: "20px",
  overflowY: "auto",
};

const contentAreaStyle = {
  flex: 1,
  padding: "30px",
  color: "#fff",
  overflowY: "auto",
  position: "relative",
};

const contentInnerStyle = {
  maxWidth: "650px",
  margin: "0 auto",
  backgroundColor: "rgba(255,255,255,0.05)",
  borderRadius: "8px",
  padding: "20px",
  boxShadow: "0 0 10px rgba(0,0,0,0.3)",
};

const buttonRowStyle = {
  marginTop: "20px",
  display: "flex",
  gap: "10px",
};

const primaryButtonStyle = {
  backgroundColor: "#FFD700",
  color: "#000",
  border: "none",
  borderRadius: "6px",
  padding: "10px 20px",
  fontWeight: "bold",
  cursor: "pointer",
};

const secondaryButtonStyle = {
  backgroundColor: "#666",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  padding: "10px 20px",
  cursor: "pointer",
};

const bottomBarStyle = {
  backgroundColor: "#222",
};

const progressBarContainer = {
  width: "250px",
  height: "10px",
  backgroundColor: "rgba(255,255,255,0.2)",
  borderRadius: "5px",
  overflow: "hidden",
};

const progressBarFill = {
  height: "100%",
  backgroundColor: "#FFD700",
  transition: "width 0.4s",
};

/* Chat styles */
const chatPanelContainerStyle = {
  position: "absolute",
  bottom: "20px",
  right: "20px",
  width: "300px",
  backgroundColor: "#1f1f1f",
  border: "1px solid #444",
  borderRadius: "8px",
  color: "#fff",
  overflow: "hidden",
  transition: "height 0.3s",
  display: "flex",
  flexDirection: "column",
};

const chatHeaderStyle = {
  padding: "8px 12px",
  backgroundColor: "#333",
  cursor: "pointer",
};

const chatBodyStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const chatMessagesStyle = {
  flex: 1,
  padding: "8px 12px",
  overflowY: "auto",
};

const chatInputContainerStyle = {
  display: "flex",
  borderTop: "1px solid #444",
};

const chatInputStyle = {
  flex: 1,
  padding: "8px",
  border: "none",
  outline: "none",
  backgroundColor: "#2a2a2a",
  color: "#fff",
};

const chatSendButtonStyle = {
  backgroundColor: "#FFD700",
  color: "#000",
  border: "none",
  outline: "none",
  padding: "8px 16px",
  cursor: "pointer",
};