// src/components/DetailedBookViewer/PanelB.jsx
import React, { useState } from "react";

function PanelB() {
  // Keep track of chat messages
  const [messages, setMessages] = useState([
    { role: "system", text: "Hello! This is a dummy chat interface. Type anything below." },
  ]);

  // User’s typed input
  const [userInput, setUserInput] = useState("");

  // Add a new message (from user or system) to the chat array
  const addMessage = (role, text) => {
    setMessages((prev) => [...prev, { role, text }]);
  };

  // Handle form submission
  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = userInput.trim();
    if (!trimmed) return;

    // 1) Add user's message
    addMessage("user", trimmed);
    setUserInput("");

    // 2) Add a dummy system response
    setTimeout(() => {
      addMessage("system", "I am a dummy response!");
    }, 500);
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ marginTop: 0 }}>Dummy Chat Interface</h2>

      <div style={chatBoxStyle}>
        {messages.map((msg, idx) => {
          const isSystem = msg.role === "system";
          return (
            <div
              key={idx}
              style={{
                ...bubbleStyle,
                alignSelf: isSystem ? "flex-start" : "flex-end",
                backgroundColor: isSystem ? "rgba(255,255,255,0.2)" : "#0084FF",
              }}
            >
              {msg.text}
            </div>
          );
        })}
      </div>

      {/* Text input + Send button */}
      <form style={formStyle} onSubmit={handleSend}>
        <input
          type="text"
          style={inputStyle}
          placeholder="Type your message..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
        />
        <button type="submit" style={buttonStyle}>
          Send
        </button>
      </form>
    </div>
  );
}

/** Reuse the style objects from your existing code */
const containerStyle = {
  width: "400px",
  margin: "20px auto",
  backgroundColor: "rgba(0,0,0,0.3)",
  padding: "20px",
  borderRadius: "8px",
  color: "#fff",
  fontFamily: "sans-serif",
};

const chatBoxStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  maxHeight: "300px",
  overflowY: "auto",
  marginBottom: "10px",
  border: "1px solid rgba(255,255,255,0.3)",
  borderRadius: "6px",
  padding: "10px",
};

const bubbleStyle = {
  maxWidth: "70%",
  padding: "8px 12px",
  borderRadius: "6px",
  color: "#fff",
  margin: "4px 0",
  wordWrap: "break-word",
};

const formStyle = {
  display: "flex",
  gap: "8px",
};

const inputStyle = {
  flex: 1,
  padding: "8px",
  borderRadius: "4px",
  border: "none",
  outline: "none",
};

const buttonStyle = {
  backgroundColor: "#0084FF",
  border: "none",
  padding: "8px 16px",
  borderRadius: "4px",
  color: "#fff",
  cursor: "pointer",
};

export default PanelB;