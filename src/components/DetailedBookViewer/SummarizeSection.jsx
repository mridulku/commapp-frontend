/********************************************
 * SummarizeSection.jsx (Enhanced + "Why Confused?" Input)
 ********************************************/

import React, { useState, useEffect } from "react";

function SummarizeSection() {
  /*************************************************************
   * STATE
   *************************************************************/
  const [step, setStep] = useState(1);

  // Style categories
  const [selectedDepth, setSelectedDepth] = useState([]);
  const [selectedTone, setSelectedTone] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState([]);

  // Custom prompt input
  const [customPrompt, setCustomPrompt] = useState("");

  // The array of generated summary objects
  // Each summary object: { id, depth, tone, format, text, expansions: [...], collapsed }
  const [summaries, setSummaries] = useState([]);

  // A chat-like log for overall events
  const [chatLog, setChatLog] = useState([]);

  // Store historical sets of summaries after user hits "Finish"
  const [history, setHistory] = useState([]);

  // For generating unique summary IDs
  const [summaryCounter, setSummaryCounter] = useState(1);

  /*************************************************************
   * STYLE CATEGORIES
   *************************************************************/
  const depthOptions = ["Basic", "Intermediate", "Advanced"];
  const toneOptions = ["Formal", "Friendly", "Humorous", "Academic"];
  const formatOptions = ["Bullet Points", "Outline", "Story-like", "Table"];

  /*************************************************************
   * Step 1: Toggle selections
   *************************************************************/
  const toggleSelection = (listName, option) => {
    let setterFunc, currentArr;
    if (listName === "depth") {
      setterFunc = setSelectedDepth;
      currentArr = selectedDepth;
    } else if (listName === "tone") {
      setterFunc = setSelectedTone;
      currentArr = selectedTone;
    } else {
      setterFunc = setSelectedFormat;
      currentArr = selectedFormat;
    }

    if (currentArr.includes(option)) {
      setterFunc(currentArr.filter((o) => o !== option));
    } else {
      setterFunc([...currentArr, option]);
    }
  };

  /*************************************************************
   * Step 2: Generate Summaries
   *************************************************************/
  const handleGenerateSummaries = () => {
    if (
      selectedDepth.length === 0 &&
      selectedTone.length === 0 &&
      selectedFormat.length === 0 &&
      !customPrompt.trim()
    ) {
      alert("Please select at least one style option or enter a custom prompt.");
      return;
    }

    // If no selections in a category, we treat it as ["(no X)"] so we still generate at least 1
    const safeDepth = selectedDepth.length ? selectedDepth : ["(no depth)"];
    const safeTone = selectedTone.length ? selectedTone : ["(no tone)"];
    const safeFormat = selectedFormat.length ? selectedFormat : ["(no format)"];

    const newSummaries = [];
    for (let d of safeDepth) {
      for (let t of safeTone) {
        for (let f of safeFormat) {
          const summaryId = `S${summaryCounter}`;
          setSummaryCounter((c) => c + 1);

          const text = fakeLLMSummary(d, t, f, customPrompt);
          newSummaries.push({
            id: summaryId,
            depth: d,
            tone: t,
            format: f,
            text: text,
            expansions: [], // expansions array for user & assistant messages
            collapsed: false,
          });
        }
      }
    }

    // If absolutely no combos, but customPrompt is present, just do one universal summary
    if (newSummaries.length === 0 && customPrompt.trim()) {
      const summaryId = `S${summaryCounter}`;
      setSummaryCounter((c) => c + 1);

      const text = fakeLLMSummary("", "", "", customPrompt);
      newSummaries.push({
        id: summaryId,
        depth: "(custom only)",
        tone: "(custom only)",
        format: "(custom only)",
        text,
        expansions: [],
        collapsed: false,
      });
    }

    setSummaries(newSummaries);
    addToChatLog(
      "system",
      `Generated ${newSummaries.length} summary/ies based on your selections.`
    );
    setStep(2);
  };

  /*************************************************************
   * Mock LLM Summaries
   *************************************************************/
  const fakeLLMSummary = (depth, tone, format, prompt) => {
    return `Mocked Summary:\n\n- Depth: ${depth}\n- Tone: ${tone}\n- Format: ${format}\n- Custom Prompt: "${prompt}"\n\n(Replace with real AI summary here)`;
  };

  /*************************************************************
   * Collapsing a summary panel
   *************************************************************/
  const toggleCollapse = (summaryId) => {
    setSummaries((prev) =>
      prev.map((s) =>
        s.id === summaryId ? { ...s, collapsed: !s.collapsed } : s
      )
    );
  };

  /*************************************************************
   * Expansions
   * "I’m Confused" => ask user for confusion text => new expansions
   * "More Detail" => generate advanced detail
   *************************************************************/
  const handleExpansion = (summaryId, mode, userConfusionText = "") => {
    let expansionsToAdd = [];

    if (mode === "confused") {
      // "user" message
      const userMsg = {
        role: "user",
        text:
          userConfusionText.trim() ||
          "I'm not sure what's confusing me, but I am stuck.",
      };
      // "assistant" message
      const assistantMsg = {
        role: "assistant",
        text:
          "Re-explaining in simpler terms... (Mocked). " +
          "We have this hint from your confusion: '" +
          userConfusionText +
          "'.",
      };
      expansionsToAdd = [userMsg, assistantMsg];
      addToChatLog(
        "assistant",
        `(Summary ${summaryId}) Provided a new simpler explanation.`
      );
    } else if (mode === "moreDetail") {
      const detailMsg = {
        role: "assistant",
        text:
          "Expanding with advanced details, references, examples... (Mocked).",
      };
      expansionsToAdd = [detailMsg];
      addToChatLog(
        "assistant",
        `(Summary ${summaryId}) Provided a more detailed explanation.`
      );
    }

    setSummaries((prev) =>
      prev.map((s) => {
        if (s.id === summaryId) {
          return {
            ...s,
            expansions: [...s.expansions, ...expansionsToAdd],
          };
        }
        return s;
      })
    );
  };

  /*************************************************************
   * Chat Log - store an overall timeline
   *************************************************************/
  const addToChatLog = (role, content) => {
    setChatLog((prev) => [...prev, { role, content }]);
  };

  /*************************************************************
   * Step 3: Done / Storing in history
   *************************************************************/
  const handleFinish = () => {
    if (summaries.length > 0) {
      setHistory((prev) => [...prev, summaries]);
    }
    addToChatLog("system", "Summaries saved to history. Wizard is complete.");
    setStep(3);
  };

  const handleStartOver = () => {
    setStep(1);
    setSelectedDepth([]);
    setSelectedTone([]);
    setSelectedFormat([]);
    setCustomPrompt("");
    setSummaries([]);
  };

  /*************************************************************
   * PROGRESS BAR
   *************************************************************/
  const getProgressPercentage = () => {
    if (step === 1) return 33;
    if (step === 2) return 66;
    if (step === 3) return 100;
    return 0;
  };

  /*************************************************************
   * RENDER
   *************************************************************/
  return (
    <div style={panelStyle}>
      <h2 style={sectionTitleStyle}>Enhanced Summaries</h2>

      {/* STEP INDICATOR / PROGRESS BAR */}
      <div style={progressBarContainerStyle}>
        <div style={progressBarFillStyle(getProgressPercentage())} />
      </div>
      <p style={{ fontStyle: "italic", marginTop: "5px" }}>
        Step {step} of 3
      </p>

      {step === 1 && (
        <StepOneSelectStyles
          depthOptions={depthOptions}
          toneOptions={toneOptions}
          formatOptions={formatOptions}
          selectedDepth={selectedDepth}
          selectedTone={selectedTone}
          selectedFormat={selectedFormat}
          toggleSelection={toggleSelection}
          customPrompt={customPrompt}
          setCustomPrompt={setCustomPrompt}
          handleGenerateSummaries={handleGenerateSummaries}
        />
      )}

      {step === 2 && (
        <StepTwoShowSummaries
          summaries={summaries}
          toggleCollapse={toggleCollapse}
          handleExpansion={handleExpansion}
          handleFinish={handleFinish}
        />
      )}

      {step === 3 && (
        <StepThreeDone
          handleStartOver={handleStartOver}
          history={history}
          chatLog={chatLog}
        />
      )}
    </div>
  );
}

/********************************************
 * Step 1: SELECT STYLE COMPONENT
 ********************************************/
function StepOneSelectStyles({
  depthOptions,
  toneOptions,
  formatOptions,
  selectedDepth,
  selectedTone,
  selectedFormat,
  toggleSelection,
  customPrompt,
  setCustomPrompt,
  handleGenerateSummaries,
}) {
  return (
    <>
      <p>
        Select one or more style options <strong>OR</strong> enter a custom
        prompt to shape how the summary is generated.
      </p>
      {/* Depth */}
      <div style={subSectionStyle}>
        <h3 style={subTitleStyle}>Depth</h3>
        <div style={checkboxContainerStyle}>
          {depthOptions.map((opt) => (
            <label key={opt} style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={selectedDepth.includes(opt)}
                onChange={() => toggleSelection("depth", opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      </div>

      {/* Tone */}
      <div style={subSectionStyle}>
        <h3 style={subTitleStyle}>Tone</h3>
        <div style={checkboxContainerStyle}>
          {toneOptions.map((opt) => (
            <label key={opt} style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={selectedTone.includes(opt)}
                onChange={() => toggleSelection("tone", opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      </div>

      {/* Format */}
      <div style={subSectionStyle}>
        <h3 style={subTitleStyle}>Format</h3>
        <div style={checkboxContainerStyle}>
          {formatOptions.map((opt) => (
            <label key={opt} style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={selectedFormat.includes(opt)}
                onChange={() => toggleSelection("format", opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      </div>

      <div style={subSectionStyle}>
        <h3 style={subTitleStyle}>Custom Prompt (Optional)</h3>
        <textarea
          rows={2}
          placeholder="Enter any custom instruction here..."
          style={customPromptStyle}
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
        />
      </div>

      <button style={buttonStyle} onClick={handleGenerateSummaries}>
        Generate Summaries
      </button>
    </>
  );
}

/********************************************
 * Step 2: SHOW SUMMARIES
 ********************************************/
function StepTwoShowSummaries({
  summaries,
  toggleCollapse,
  handleExpansion,
  handleFinish,
}) {
  return (
    <>
      {summaries.length === 0 && (
        <p>No summaries generated. (This shouldn’t happen unless something’s empty.)</p>
      )}
      {summaries.map((s) => (
        <SummaryPanel
          key={s.id}
          summary={s}
          toggleCollapse={toggleCollapse}
          handleExpansion={handleExpansion}
        />
      ))}

      {summaries.length > 0 && (
        <button style={buttonStyle} onClick={handleFinish}>
          Finish & Save to History
        </button>
      )}
    </>
  );
}

/********************************************
 * Summary Panel (Collapsible + expansions)
 ********************************************/

function SummaryPanel({ summary, toggleCollapse, handleExpansion }) {
  // Local state for "why are you confused" text
  const [showConfusionInput, setShowConfusionInput] = useState(false);
  const [confusionText, setConfusionText] = useState("");

  const handleToggleCollapse = () => {
    toggleCollapse(summary.id);
  };

  const handleConfusedClick = () => {
    // show a text area to let user type confusion
    setShowConfusionInput(!showConfusionInput);
  };

  const submitConfusion = () => {
    handleExpansion(summary.id, "confused", confusionText);
    setConfusionText("");
    setShowConfusionInput(false);
  };

  const handleMoreDetail = () => {
    handleExpansion(summary.id, "moreDetail");
  };

  return (
    <div style={panelInsideStyle}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h3 style={{ margin: 0 }}>
          Summary {summary.id}{" "}
          <span style={{ fontSize: "0.85rem", fontStyle: "italic" }}>
            ({summary.depth}, {summary.tone}, {summary.format})
          </span>
        </h3>
        <button style={smallButtonStyle} onClick={handleToggleCollapse}>
          {summary.collapsed ? "Expand" : "Collapse"}
        </button>
      </div>

      {!summary.collapsed && (
        <div style={{ marginTop: "10px" }}>
          {/* Main summary text */}
          <div style={summaryOutputStyle}>{summary.text}</div>

          {/* Buttons: I'm confused or More detail */}
          <div style={followUpContainerStyle}>
            <button style={smallButtonStyle} onClick={handleConfusedClick}>
              {showConfusionInput ? "Cancel" : "I'm Confused"}
            </button>
            <button style={smallButtonStyle} onClick={handleMoreDetail}>
              More Detail
            </button>
          </div>

          {/* If user clicked "I'm Confused," show text area */}
          {showConfusionInput && (
            <div style={confusionBoxStyle}>
              <label style={{ marginBottom: "5px" }}>
                Please describe what confuses you:
              </label>
              <textarea
                rows={2}
                style={confusionTextAreaStyle}
                value={confusionText}
                onChange={(e) => setConfusionText(e.target.value)}
              />
              <button style={smallButtonStyle} onClick={submitConfusion}>
                Submit Confusion
              </button>
            </div>
          )}

          {/* expansions (chat-like) */}
          {summary.expansions.map((exp, idx) => (
            <div style={expansionBoxStyle} key={idx}>
              {exp.role === "user" ? (
                <>
                  <strong>You (Confusion):</strong>
                  <p style={{ margin: 0 }}>{exp.text}</p>
                </>
              ) : (
                <>
                  <strong>Assistant:</strong>
                  <p style={{ margin: 0 }}>{exp.text}</p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/********************************************
 * Step 3: DONE
 ********************************************/
function StepThreeDone({ handleStartOver, history, chatLog }) {
  return (
    <>
      <p>All done! Your generated summaries have been saved to history.</p>
      <button style={buttonStyle} onClick={handleStartOver}>
        Start Over
      </button>

      {/* Show the final history & chat log collapsible */}
      <HistoryAndChatPanel history={history} chatLog={chatLog} />
    </>
  );
}

/********************************************
 * History and Chat Panel
 ********************************************/
function HistoryAndChatPanel({ history, chatLog }) {
  const [showHistory, setShowHistory] = useState(false);
  const [showChatLog, setShowChatLog] = useState(false);

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>Final Info</h3>
      <div style={followUpContainerStyle}>
        <button style={smallButtonStyle} onClick={() => setShowHistory(!showHistory)}>
          {showHistory ? "Hide History" : "View History"}
        </button>
        <button style={smallButtonStyle} onClick={() => setShowChatLog(!showChatLog)}>
          {showChatLog ? "Hide Chat Log" : "View Chat Log"}
        </button>
      </div>

      {showHistory && (
        <div style={historyBoxStyle}>
          <h4>Past Summary Sessions</h4>
          {history.length === 0 ? (
            <p style={{ fontStyle: "italic" }}>No previous sessions found.</p>
          ) : (
            history.map((session, idx) => (
              <div key={idx} style={sessionBoxStyle}>
                <p style={{ margin: "4px 0" }}>
                  <strong>Session #{idx + 1}</strong> — {session.length} summary/summaries
                </p>
                {session.map((s) => (
                  <div key={s.id} style={summaryOutputStyle}>
                    <p style={{ margin: "0 0 6px" }}>
                      <strong>{s.id}</strong> ({s.depth}, {s.tone}, {s.format})
                    </p>
                    {s.text}
                    {/* expansions? If you want to store expansions in history, you'd show them too */}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {showChatLog && (
        <div style={historyBoxStyle}>
          <h4>Chat Log (Debug)</h4>
          {chatLog.length === 0 ? (
            <p style={{ fontStyle: "italic" }}>No log entries.</p>
          ) : (
            chatLog.map((entry, i) => (
              <div key={i} style={{ marginBottom: "8px" }}>
                <strong>{entry.role}:</strong> {entry.content}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/********************************************
 * Reusable Styles
 ********************************************/
const panelStyle = {
  backgroundColor: "rgba(255,255,255,0.1)",
  backdropFilter: "blur(6px)",
  padding: "20px",
  borderRadius: "10px",
  marginBottom: "20px",
  color: "#fff",
  fontFamily: "'Open Sans', sans-serif",
};

const panelInsideStyle = {
  backgroundColor: "rgba(0,0,0,0.2)",
  borderRadius: "8px",
  padding: "15px",
  marginBottom: "15px",
};

const sectionTitleStyle = {
  marginTop: 0,
  borderBottom: "1px solid rgba(255,255,255,0.3)",
  paddingBottom: "5px",
  marginBottom: "10px",
};

const progressBarContainerStyle = {
  backgroundColor: "rgba(255,255,255,0.3)",
  borderRadius: "6px",
  overflow: "hidden",
  height: "10px",
  width: "100%",
};

const progressBarFillStyle = (pct) => ({
  width: `${pct}%`,
  height: "100%",
  background: "#FFD700",
  transition: "width 0.3s",
});

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

const subSectionStyle = {
  marginBottom: "15px",
};

const subTitleStyle = {
  margin: 0,
  marginBottom: "5px",
  fontSize: "1.1rem",
  borderBottom: "1px solid rgba(255,255,255,0.2)",
  paddingBottom: "3px",
};

const checkboxContainerStyle = {
  display: "flex",
  gap: "15px",
  flexWrap: "wrap",
};

const checkboxLabelStyle = {
  cursor: "pointer",
};

const customPromptStyle = {
  borderRadius: "4px",
  padding: "8px",
  border: "none",
  fontSize: "1rem",
  fontFamily: "inherit",
  outline: "none",
  width: "100%",
};

const summaryOutputStyle = {
  whiteSpace: "pre-line",
  marginTop: "10px",
  backgroundColor: "rgba(255,255,255,0.1)",
  padding: "10px",
  borderRadius: "4px",
};

const followUpContainerStyle = {
  display: "flex",
  gap: "10px",
  marginTop: "10px",
  flexWrap: "wrap",
};

const confusionBoxStyle = {
  backgroundColor: "rgba(255,255,255,0.2)",
  padding: "10px",
  borderRadius: "4px",
  marginTop: "10px",
  display: "flex",
  flexDirection: "column",
  gap: "5px",
};

const confusionTextAreaStyle = {
  borderRadius: "4px",
  padding: "8px",
  border: "none",
  fontSize: "1rem",
  fontFamily: "inherit",
  outline: "none",
  width: "100%",
};

const expansionBoxStyle = {
  backgroundColor: "rgba(255,255,255,0.2)",
  padding: "10px",
  borderRadius: "4px",
  marginTop: "10px",
};

const historyBoxStyle = {
  backgroundColor: "rgba(0,0,0,0.2)",
  padding: "10px",
  borderRadius: "6px",
  marginTop: "10px",
};

const sessionBoxStyle = {
  backgroundColor: "rgba(255,255,255,0.1)",
  padding: "10px",
  borderRadius: "4px",
  marginBottom: "10px",
};

export default SummarizeSection;