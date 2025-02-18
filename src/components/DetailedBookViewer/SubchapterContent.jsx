/********************************************
 * SubchapterContent.jsx
 ********************************************/
import React, { useState, useRef } from "react";
import axios from "axios";

function SubchapterContent({
  subChapter,
  userId,
  backendURL,
  onRefreshData, // function to refetch data from the parent
}) {
  if (!subChapter) return null;

  /********************************************************
   * State
   ********************************************************/
  const [selectedText, setSelectedText] = useState("");
  const [highlights, setHighlights] = useState([]);
  const highlightCounter = useRef(1);

  // For controlling the Q&A input for the most recently added highlight
  const [activeQA, setActiveQA] = useState(null);

  /********************************************************
   * Styles (same as before)
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
    marginRight: "10px",
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
   * Reading Start/Finish
   ********************************************************/
  const handleStartReading = async () => {
    try {
      await axios.post(`${backendURL}/api/complete-subchapter`, {
        userId,
        bookName: subChapter.bookName,         // or derive from subChapter if it’s stored
        chapterName: subChapter.chapterName,
        subChapterName: subChapter.subChapterName,
        startReading: true,
      });
      onRefreshData && onRefreshData(); // re-fetch updated data
    } catch (err) {
      console.error("Error starting reading:", err);
      alert("Failed to start reading.");
    }
  };

  const handleFinishReading = async () => {
    try {
      await axios.post(`${backendURL}/api/complete-subchapter`, {
        userId,
        bookName: subChapter.bookName,
        chapterName: subChapter.chapterName,
        subChapterName: subChapter.subChapterName,
        endReading: true,
      });
      onRefreshData && onRefreshData(); // re-fetch updated data
    } catch (err) {
      console.error("Error finishing reading:", err);
      alert("Failed to finish reading.");
    }
  };

  // Has user started/finished reading?
  const hasStartedReading = !!subChapter.readStartTime;
  const hasFinishedReading = !!subChapter.readEndTime;

  // Convert Firestore timestamps or date strings
  const formatTimestamp = (ts) => {
    if (!ts) return null;
    // If it's a Firestore Timestamp object:
    if (ts.seconds) {
      return new Date(ts.seconds * 1000).toLocaleString();
    }
    // If it's a string or JS date
    return new Date(ts).toLocaleString();
  };

  // Compute reading duration in minutes (if finished)
  const readingDuration = (() => {
    if (hasStartedReading && hasFinishedReading) {
      const startTimeMs = tsToMs(subChapter.readStartTime);
      const endTimeMs = tsToMs(subChapter.readEndTime);
      const diffMin = (endTimeMs - startTimeMs) / 1000 / 60;
      return Math.round(diffMin * 10) / 10; // 1 decimal place
    }
    return null;
  })();

  // Helper to convert Firestore or string timestamps to ms
  function tsToMs(ts) {
    if (!ts) return 0;
    if (ts.seconds) {
      return ts.seconds * 1000;
    }
    // If stored as string/date
    return new Date(ts).getTime();
  }

  /********************************************************
   * Handle text selection for highlights
   ********************************************************/
  const handleMouseUp = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim() || "";
    setSelectedText(text);
  };

  const handleExplainSelected = () => {
    if (!selectedText) {
      alert("No text is selected! Please highlight text in the content first.");
      return;
    }
    const id = `H${highlightCounter.current}`;
    highlightCounter.current += 1;

    const newHighlight = {
      id,
      text: selectedText,
      qaLog: [],
      collapsed: false,
    };

    setHighlights((prev) => [...prev, newHighlight]);
    setSelectedText("");

    // Immediately open Q&A input for that highlight
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
      <h2 style={sectionTitleStyle}>{subChapter.subChapterName || "Subchapter"}</h2>
      {subChapter.wordCount && (
        <p style={{ fontStyle: "italic" }}>
          Word Count: {subChapter.wordCount} — Estimated Time:{" "}
          {Math.ceil(subChapter.wordCount / 200)} min
        </p>
      )}

      {/* Reading flow buttons */}
      {!hasStartedReading && (
        <button style={buttonStyle} onClick={handleStartReading}>
          Start Reading
        </button>
      )}
      {hasStartedReading && !hasFinishedReading && (
        <button style={buttonStyle} onClick={handleFinishReading}>
          Finish Reading
        </button>
      )}

      {/* Timestamps */}
      {hasStartedReading && (
        <p>
          <strong>Started Reading:</strong>{" "}
          {formatTimestamp(subChapter.readStartTime)}
        </p>
      )}
      {hasFinishedReading && (
        <p>
          <strong>Finished Reading:</strong>{" "}
          {formatTimestamp(subChapter.readEndTime)}
        </p>
      )}
      {readingDuration && (
        <p>
          <strong>Reading Duration:</strong> {readingDuration} minutes
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

      {/* The highlight logs / Q&A */}
      {highlights.length > 0 && (
        <div style={highlightLogContainerStyle}>
          <h3 style={{ marginTop: 0 }}>Highlights &amp; Questions</h3>
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