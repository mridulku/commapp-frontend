import React, { useState, useRef } from "react";

/**
 * A complete chat interface with:
 * - User input at the bottom
 * - Chat bubbles for user and system messages
 * - A typing animation for system responses
 * 
 * Updated to better match a page's existing theme:
 * - No fixed width or centered margin
 * - No forced background gradient
 * - Inherits parent text colors by default
 */

export default function FullChatInterface() {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingText, setTypingText] = useState("");

  // A ref to cancel intervals if component unmounts (cleanup).
  const typingIntervalRef = useRef(null);

  async function handleSendMessage(event) {
    event.preventDefault();
    const trimmedInput = userInput.trim();
    if (!trimmedInput) return;

    // 1) Add the user's message
    const newUserMessage = { role: "user", text: trimmedInput };
    setMessages((prev) => [...prev, newUserMessage]);
    setUserInput("");

    // 2) Simulate AI response
    await simulateAIResponse(trimmedInput);
  }

  async function simulateAIResponse(userMessage) {
    const dummyResponse = generateDummyResponse(userMessage);

    // Artificial delay
    setIsTyping(true);
    setTypingText("");
    await sleep(500);

    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    let charIndex = 0;
    typingIntervalRef.current = setInterval(() => {
      charIndex++;
      setTypingText(dummyResponse.slice(0, charIndex));

      if (charIndex === dummyResponse.length) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;

        setMessages((prev) => [
          ...prev,
          { role: "system", text: dummyResponse },
        ]);

        setIsTyping(false);
        setTypingText("");
      }
    }, 40); // typing speed
  }

  function generateDummyResponse(userText) {
    return `I hear you said: "${userText}". This is a dummy AI response.`;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  return (
    <div style={outerContainerStyle}>
      {/* Optional heading; will inherit page text color */}
      <h2>Full Chat Interface</h2>

      {/* Chat Bubbles Container */}
      <div style={chatContainerStyle}>
        {messages.map((msg, index) => {
          const isSystem = msg.role === "system";
          return (
            <div
              key={index}
              style={{
                ...bubbleStyle,
                alignSelf: isSystem ? "flex-start" : "flex-end",
                backgroundColor: isSystem
                  ? "rgba(255, 255, 255, 0.2)"
                  : "#0084FF",
              }}
            >
              {msg.text}
            </div>
          );
        })}

        {/* Show the "typing" bubble if AI is typing */}
        {isTyping && (
          <div
            style={{
              ...bubbleStyle,
              alignSelf: "flex-start",
              backgroundColor: "rgba(255, 255, 255, 0.2)",
            }}
          >
            {typingText}
          </div>
        )}
      </div>

      {/* User Input Form */}
      <form style={formStyle} onSubmit={handleSendMessage}>
        <input
          style={inputStyle}
          type="text"
          placeholder="Type your message..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
        />
        <button style={buttonStyle} type="submit">
          Send
        </button>
      </form>
    </div>
  );
}

/* --- STYLES --- */

// Now it simply takes up available space and inherits background.
const outerContainerStyle = {
  padding: "10px",
  borderRadius: "8px",
  // Remove forced background and width
  // background: "transparent",
  // width: "400px",
  // margin: "40px auto",
  // Let the parent's styling and theme come through
  fontFamily: "sans-serif", // Remove if you'd rather inherit the page's font.
};

// Chat area scrolls if content grows too tall
const chatContainerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  maxHeight: "400px",
  overflowY: "auto",
  padding: "10px 0",
  marginBottom: "10px",
};

// Basic bubble styling, color is set dynamically for system/user
const bubbleStyle = {
  maxWidth: "70%",
  padding: "8px 12px",
  borderRadius: "8px",
  color: "#fff",            // Keep white text for clarity on dark/colored backgrounds
  animation: "fadeIn 0.3s ease-in",
  WebkitAnimation: "fadeIn 0.3s ease-in",
  margin: "4px 0",
  whiteSpace: "pre-wrap",
};

// Input form layout
const formStyle = {
  display: "flex",
  gap: "8px",
};

// Text field styling
const inputStyle = {
  flex: 1,
  padding: "8px",
  borderRadius: "4px",
  border: "none",
  outline: "none",
};

// Send button styling
const buttonStyle = {
  backgroundColor: "#0084FF",
  border: "none",
  padding: "8px 12px",
  borderRadius: "4px",
  color: "#fff",
  cursor: "pointer",
};

// Optional fadeIn keyframes
const fadeInKeyframes = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
`;