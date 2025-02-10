/********************************************
 * DoubtsSection.jsx
 ********************************************/
import React from "react";

function DoubtsSection({
  doubts,
  doubtInput,
  setDoubtInput,
  handleSendDoubt,
}) {
  const panelStyle = {
    backgroundColor: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(6px)",
    padding: "15px",
    borderRadius: "6px",
    marginBottom: "20px",
  };

  const sectionTitleStyle = {
    marginTop: 0,
    borderBottom: "1px solid rgba(255,255,255,0.3)",
    paddingBottom: "5px",
    marginBottom: "10px",
  };

  const chatContainerStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "10px",
    maxHeight: "300px",
    overflowY: "auto",
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: "10px",
    borderRadius: "6px",
  };

  const chatBubbleUserStyle = {
    alignSelf: "flex-end",
    backgroundColor: "rgba(255,255,255,0.3)",
    padding: "8px",
    borderRadius: "6px",
    marginBottom: "6px",
    maxWidth: "70%",
    whiteSpace: "pre-wrap",
  };

  const chatBubbleAssistantStyle = {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,215,0,0.3)",
    padding: "8px",
    borderRadius: "6px",
    marginBottom: "6px",
    maxWidth: "70%",
    whiteSpace: "pre-wrap",
  };

  const doubtInputContainerStyle = {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  };

  const doubtInputStyle = {
    flex: 1,
    padding: "8px",
    borderRadius: "4px",
    border: "none",
    outline: "none",
    fontSize: "1rem",
  };

  const buttonStyle = {
    padding: "10px 20px",
    borderRadius: "4px",
    border: "none",
    background: "#FFD700",
    color: "#000",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "opacity 0.3s",
  };

  return (
    <div style={panelStyle}>
      <h2 style={sectionTitleStyle}>Doubts</h2>
      <p style={{ marginTop: 0, fontStyle: "italic" }}>
        Ask questions about this subchapter content. (Mocked AI)
      </p>
      <div style={chatContainerStyle}>
        {doubts.map((msg, i) => {
          if (msg.role === "user") {
            return (
              <div key={i} style={chatBubbleUserStyle}>
                <strong>You:</strong> {msg.content}
              </div>
            );
          } else {
            return (
              <div key={i} style={chatBubbleAssistantStyle}>
                <strong>AI:</strong> {msg.content}
              </div>
            );
          }
        })}
      </div>
      <div style={doubtInputContainerStyle}>
        <input
          type="text"
          style={doubtInputStyle}
          value={doubtInput}
          onChange={(e) => setDoubtInput(e.target.value)}
          placeholder="Type your question here..."
        />
        <button style={buttonStyle} onClick={handleSendDoubt}>
          Send
        </button>
      </div>
    </div>
  );
}

export default DoubtsSection;