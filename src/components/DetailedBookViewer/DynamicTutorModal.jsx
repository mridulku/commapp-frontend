/********************************************
 * DynamicTutorModal.jsx
 ********************************************/
import React, { useState, useEffect } from "react";

function DynamicTutorModal({ book, chapter, subChapter, onClose }) {
  // Chat messages
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");

  const [lessonStep, setLessonStep] = useState(1);

  useEffect(() => {
    // On mount, greet user based on the scope
    const scopeDesc = getScopeDescription();
    const greeting = {
      role: "assistant",
      content: `Hello! I'm your dynamic tutor. Let's explore the ${scopeDesc} together. 
I'll ask a few guiding questions to ensure you grasp the key ideas.`,
    };
    setMessages([greeting]);
  }, []);

  // Determine if the user is learning a whole book, a chapter, or a subchapter
  const getScopeDescription = () => {
    if (subChapter) {
      return `subchapter "${subChapter.subChapterName}" (Chapter: ${chapter?.chapterName}, Book: ${book?.bookName})`;
    } else if (chapter) {
      return `chapter "${chapter.chapterName}" (Book: ${book?.bookName})`;
    } else if (book) {
      return `entire book "${book.bookName}"`;
    }
    return "unknown scope";
  };

  // Handle sending messages
  const handleSend = () => {
    if (!userInput.trim()) return;

    // Add user message
    const userMsg = { role: "user", content: userInput };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    // Mock an AI response
    const tutorResponse = getTutorResponse(userInput, lessonStep);
    const finalMessages = [...newMessages, tutorResponse];
    setMessages(finalMessages);

    // Possibly increment lesson step
    setLessonStep((prev) => prev + 1);

    // Clear input
    setUserInput("");
  };

  // Basic mock AI/tutor response logic
  const getTutorResponse = (userText, currentStep) => {
    let content = "";
    if (currentStep === 1) {
      content = `Thanks for sharing! Let's check your understanding. What do you think is the main idea here?`;
    } else if (currentStep === 2) {
      content = `Interesting. Could you elaborate on how you'd apply it in a real situation?`;
    } else if (userText.toLowerCase().includes("i'm confused")) {
      content = `It's okay to be confused! Let's pinpoint the confusion. Which part is unclear?`;
    } else {
      content = `Great input! (Mock AI). You said: "${userText}". Here's a tip: [some dynamic advice here].`;
    }
    return { role: "assistant", content };
  };

  // Some basic styling for a modal
  const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9998,
  };

  const modalStyle = {
    backgroundColor: "#fff",
    color: "#000",
    width: "600px",
    maxHeight: "80vh",
    overflowY: "auto",
    borderRadius: "8px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
    zIndex: 9999,
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  };

  const chatAreaStyle = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "15px",
    overflowY: "auto",
  };

  const bubbleUserStyle = {
    alignSelf: "flex-end",
    backgroundColor: "#e0e0e0",
    borderRadius: "6px",
    padding: "8px 12px",
    maxWidth: "70%",
    whiteSpace: "pre-wrap",
  };

  const bubbleTutorStyle = {
    alignSelf: "flex-start",
    backgroundColor: "#FFD700",
    borderRadius: "6px",
    padding: "8px 12px",
    maxWidth: "70%",
    whiteSpace: "pre-wrap",
  };

  const inputAreaStyle = {
    display: "flex",
    gap: "10px",
  };

  const inputStyle = {
    flex: 1,
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    fontSize: "1rem",
  };

  const buttonStyle = {
    padding: "10px 16px",
    borderRadius: "4px",
    backgroundColor: "#203A43",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
  };

  const closeBtnStyle = {
    background: "none",
    border: "none",
    fontSize: "1.2rem",
    cursor: "pointer",
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={headerStyle}>
          <h3 style={{ margin: 0 }}>Dynamic Tutor</h3>
          <button style={closeBtnStyle} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={chatAreaStyle}>
          {messages.map((m, i) => {
            if (m.role === "user") {
              return (
                <div key={i} style={bubbleUserStyle}>
                  <strong>You:</strong> {m.content}
                </div>
              );
            }
            return (
              <div key={i} style={bubbleTutorStyle}>
                <strong>Tutor:</strong> {m.content}
              </div>
            );
          })}
        </div>

        <div style={inputAreaStyle}>
          <input
            style={inputStyle}
            placeholder="Type your response or question..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
          />
          <button style={buttonStyle} onClick={handleSend}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default DynamicTutorModal;