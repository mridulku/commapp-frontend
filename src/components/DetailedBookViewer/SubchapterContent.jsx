/********************************************
 * SubchapterContent.jsx (Simple Highlight + Single Button)
 ********************************************/
import React, { useState, useRef } from "react";

function SubchapterContent({ subChapter, onToggleDone }) {
  if (!subChapter) return null;

  /********************************************************
   * State
   ********************************************************/
  const [selectedText, setSelectedText] = useState("");
  const [highlights, setHighlights] = useState([]);
  const highlightCounter = useRef(1);

  // For controlling the Q&A input for the most recently added highlight
  // e.g. { highlightId, userQuestion: "", isOpen: true/false }
  const [activeQA, setActiveQA] = useState(null);

  /********************************************************
   * Style
   ********************************************************/
  const panelStyle = {
    backgroundColor: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(6px)",
    padding: "15px",
    borderRadius: "6px",
    marginBottom: "20px",
    position: "relative",
  };

  const sectionTitleStyle = {
    marginTop: 0,
    borderBottom: "1px solid rgba(255,255,255,0.3)",
    paddingBottom: "5px",
    marginBottom: "10px",
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
    marginTop: "10px",
  };

  const contentStyle = {
    whiteSpace: "pre-line",
    marginBottom: "15px",
  };

  const highlightLogContainerStyle = {
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: "10px",
    borderRadius: "6px",
    marginTop: "20px",
  };

  const highlightItemStyle = {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: "10px",
    borderRadius: "4px",
    marginBottom: "10px",
  };

  const highlightTitleStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  };

  const smallButtonStyle = {
    padding: "6px 12px",
    borderRadius: "4px",
    border: "none",
    background: "#FFD700",
    color: "#000",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "opacity 0.3s",
  };

  const chatBubbleUserStyle = {
    alignSelf: "flex-end",
    backgroundColor: "rgba(255,255,255,0.3)",
    padding: "8px",
    borderRadius: "6px",
    margin: "6px 0",
    whiteSpace: "pre-wrap",
  };

  const chatBubbleAssistantStyle = {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,215,0,0.3)",
    padding: "8px",
    borderRadius: "6px",
    margin: "6px 0",
    whiteSpace: "pre-wrap",
  };

  const qaInputContainerStyle = {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  };

  const qaInputStyle = {
    flex: 1,
    padding: "8px",
    borderRadius: "4px",
    border: "none",
    outline: "none",
    fontSize: "1rem",
  };

  /********************************************************
   * Handle text selection (no floating button)
   ********************************************************/
  const handleMouseUp = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim() || "";
    setSelectedText(text);
  };

  /********************************************************
   * The user clicks "Explain Selected Content"
   ********************************************************/
  const handleExplainSelected = () => {
    // Check if there's any selected text
    if (!selectedText) {
      alert("No text is selected! Please highlight text in the content first.");
      return;
    }

    // Create a highlight record
    const id = `H${highlightCounter.current}`;
    highlightCounter.current += 1;

    const newHighlight = {
      id,
      text: selectedText,
      qaLog: [],
      collapsed: false,
    };

    setHighlights((prev) => [...prev, newHighlight]);

    // Clear selection
    setSelectedText("");

    // Immediately open Q&A input
    setActiveQA({
      highlightId: id,
      userQuestion: "",
      isOpen: true,
    });
  };

  /********************************************************
   * Toggling collapse on a highlight
   ********************************************************/
  const toggleHighlightCollapse = (highlightId) => {
    setHighlights((prev) =>
      prev.map((h) =>
        h.id === highlightId ? { ...h, collapsed: !h.collapsed } : h
      )
    );
  };

  /********************************************************
   * Submitting a question for a highlight
   ********************************************************/
  const handleSubmitQuestion = (highlightId, questionText) => {
    if (!questionText.trim()) {
      alert("Please enter your question or note!");
      return;
    }

    // We add the user question + mock AI response
    const userMsg = { role: "user", content: questionText };
    const aiMsg = {
      role: "assistant",
      content: `Mocked AI response about: "${questionText}" (Replace with real call)`,
    };

    setHighlights((prev) =>
      prev.map((h) => {
        if (h.id === highlightId) {
          return {
            ...h,
            qaLog: [...h.qaLog, userMsg, aiMsg],
          };
        }
        return h;
      })
    );

    // close the active QA
    if (activeQA && activeQA.highlightId === highlightId) {
      setActiveQA(null);
    }
  };

  /********************************************************
   * Render
   ********************************************************/
  return (
    <div style={panelStyle}>
      <h2 style={sectionTitleStyle}>Content</h2>
      {subChapter.wordCount && (
        <p style={{ fontStyle: "italic" }}>
          Word Count: {subChapter.wordCount} — Estimated Time:{" "}
          {Math.ceil(subChapter.wordCount / 200)} min
        </p>
      )}

      {/* The main text, user can highlight any part */}
      <div style={contentStyle} onMouseUp={handleMouseUp}>
        {subChapter.summary}
      </div>

      {/* Single button to handle explanation of highlighted text */}
      <button style={buttonStyle} onClick={handleExplainSelected}>
        Explain Selected Content
      </button>

      {/* Mark subchapter done/incomplete */}
      <button
        style={buttonStyle}
        onClick={() => onToggleDone(subChapter)}
        onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
        onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
      >
        {subChapter.isDone ? "Mark Incomplete" : "Mark as Done"}
      </button>

      {/* The highlight logs / Q&A */}
      {highlights.length > 0 && (
        <div style={highlightLogContainerStyle}>
          <h3 style={{ marginTop: 0 }}>Highlights & Questions</h3>

          {highlights.map((h) => (
            <div key={h.id} style={highlightItemStyle}>
              <div style={highlightTitleStyle}>
                <h4 style={{ margin: 0 }}>
                  {h.id}: <em>“{h.text}”</em>
                </h4>
                <button
                  style={smallButtonStyle}
                  onClick={() => toggleHighlightCollapse(h.id)}
                >
                  {h.collapsed ? "Expand" : "Collapse"}
                </button>
              </div>

              {!h.collapsed && (
                <div>
                  {/* If this is the highlight for which we are collecting a question */}
                  {activeQA && activeQA.highlightId === h.id && activeQA.isOpen ? (
                    <div style={qaInputContainerStyle}>
                      <input
                        style={qaInputStyle}
                        type="text"
                        placeholder="Ask about your highlight..."
                        value={activeQA.userQuestion}
                        onChange={(e) =>
                          setActiveQA({
                            ...activeQA,
                            userQuestion: e.target.value,
                          })
                        }
                      />
                      <button
                        style={smallButtonStyle}
                        onClick={() =>
                          handleSubmitQuestion(h.id, activeQA.userQuestion)
                        }
                      >
                        Submit
                      </button>
                    </div>
                  ) : (
                    <div style={{ margin: "5px 0" }}>
                      <button
                        style={smallButtonStyle}
                        onClick={() =>
                          setActiveQA({
                            highlightId: h.id,
                            userQuestion: "",
                            isOpen: true,
                          })
                        }
                      >
                        Ask New Question
                      </button>
                    </div>
                  )}

                  {/* Show the Q&A chat log */}
                  {h.qaLog.length > 0 && (
                    <div style={{ marginTop: "10px" }}>
                      {h.qaLog.map((msg, i) => {
                        const isUser = msg.role === "user";
                        return (
                          <div
                            key={i}
                            style={
                              isUser ? chatBubbleUserStyle : chatBubbleAssistantStyle
                            }
                          >
                            <strong>{isUser ? "You:" : "AI:"}</strong>{" "}
                            {msg.content}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SubchapterContent;