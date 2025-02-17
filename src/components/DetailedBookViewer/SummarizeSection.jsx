/********************************************
 * SummarizeSection.jsx
 ********************************************/
import React, { useState } from "react";

function SummarizeSection({
  // Old simple logic:
  summaryOutput,
  customPrompt,
  setCustomPrompt,
  handleSummarizePreset,
  handleCustomPromptSubmit,
}) {
  // If you want to hide the old logic, you can remove the props above.

  /*************************************************************
   * For the advanced wizard logic:
   *************************************************************/
  const [step, setStep] = useState(1);

  // Style categories
  const [selectedDepth, setSelectedDepth] = useState([]);
  const [selectedTone, setSelectedTone] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState([]);

  // The array of generated summary objects
  // Each summary object: { id, depth, tone, format, text, expansions: [...], collapsed }
  const [summaries, setSummaries] = useState([]);

  // Chat-like log for wizard steps
  const [chatLog, setChatLog] = useState([]);
  // For generating unique summary IDs
  const [summaryCounter, setSummaryCounter] = useState(1);
  // Historical sessions
  const [history, setHistory] = useState([]);

  // Check if user toggled open the final debug logs
  const [showFinalDetails, setShowFinalDetails] = useState(false);

  /*************************************************************
   * Step-based wizard
   *************************************************************/
  const depthOptions = ["Basic", "Intermediate", "Advanced"];
  const toneOptions = ["Formal", "Friendly", "Humorous", "Academic"];
  const formatOptions = ["Bullet Points", "Outline", "Story-like", "Table"];

  const toggleSelection = (listName, option) => {
    if (listName === "depth") {
      setSelectedDepth((prev) =>
        prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
      );
    } else if (listName === "tone") {
      setSelectedTone((prev) =>
        prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
      );
    } else {
      setSelectedFormat((prev) =>
        prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
      );
    }
  };

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

    // Safeguard arrays
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
            text,
            expansions: [],
            collapsed: false,
          });
        }
      }
    }

    // If absolutely no combos, but customPrompt is present, generate just one summary
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

  // Mocked LLM summary generator
  const fakeLLMSummary = (depth, tone, format, prompt) => {
    return `Mocked Summary:\n\n- Depth: ${depth}\n- Tone: ${tone}\n- Format: ${format}\n- Custom Prompt: "${prompt}"\n\n(Replace with real AI summary here)`;
  };

  const addToChatLog = (role, content) => {
    setChatLog((prev) => [...prev, { role, content }]);
  };

  // Step 2 expansions
  const toggleCollapse = (summaryId) => {
    setSummaries((prev) =>
      prev.map((s) => (s.id === summaryId ? { ...s, collapsed: !s.collapsed } : s))
    );
  };

  const handleExpansion = (summaryId, mode, userText = "") => {
    let expansionsToAdd = [];

    if (mode === "confused") {
      const userMsg = {
        role: "user",
        text: userText.trim() || "I'm confused, but not sure how.",
      };
      const assistantMsg = {
        role: "assistant",
        text: `Simplifying explanation based on your confusion: "${userText}" (Mocked).`,
      };
      expansionsToAdd = [userMsg, assistantMsg];
    } else if (mode === "moreDetail") {
      expansionsToAdd = [
        {
          role: "assistant",
          text: "Expanding with advanced details (Mocked).",
        },
      ];
    }

    setSummaries((prev) =>
      prev.map((s) => {
        if (s.id === summaryId) {
          return { ...s, expansions: [...s.expansions, ...expansionsToAdd] };
        }
        return s;
      })
    );
  };

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
    setSummaries([]);
    // Keep or clear the customPrompt
    // setCustomPrompt("");
  };

  const getProgressPercentage = () => {
    if (step === 1) return 33;
    if (step === 2) return 66;
    if (step === 3) return 100;
    return 0;
  };

  // Basic styles
  const panelStyle = {
    backgroundColor: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(6px)",
    padding: "20px",
    borderRadius: "10px",
    marginBottom: "20px",
    color: "#fff",
    fontFamily: "'Open Sans', sans-serif",
  };

  const sectionTitleStyle = {
    marginTop: 0,
    borderBottom: "1px solid rgba(255,255,255,0.3)",
    paddingBottom: "5px",
    marginBottom: "10px",
  };

  return (
    <div style={panelStyle}>
      <h2 style={sectionTitleStyle}>Enhanced Summaries</h2>

      {/* ============== The "Simple" Summaries from your older logic ============= */}
      {/* If you still want those preset buttons and single custom prompt: */}
      <OldSimpleSummaries
        summaryOutput={summaryOutput}
        customPrompt={customPrompt}
        setCustomPrompt={setCustomPrompt}
        handleSummarizePreset={handleSummarizePreset}
        handleCustomPromptSubmit={handleCustomPromptSubmit}
      />
      {/* ----------------------------------------------------------------------- */}

      {/* ============= The new Wizard UI ============= */}
      <WizardProgressBar percentage={getProgressPercentage()} step={step} />

      {step === 1 && (
        <WizardStep1
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
        <WizardStep2
          summaries={summaries}
          toggleCollapse={toggleCollapse}
          handleExpansion={handleExpansion}
          handleFinish={handleFinish}
        />
      )}

      {step === 3 && (
        <WizardStep3
          handleStartOver={handleStartOver}
          history={history}
          chatLog={chatLog}
          showFinalDetails={showFinalDetails}
          setShowFinalDetails={setShowFinalDetails}
        />
      )}
    </div>
  );
}

/****************************************************************
 * -------------- OLD SIMPLE SUMMARIES SECTION ------------------
 *   (Your original "SummarizeSection" props + UI for
 *    3 preset prompts and one custom prompt.)
 ****************************************************************/
function OldSimpleSummaries({
  summaryOutput,
  customPrompt,
  setCustomPrompt,
  handleSummarizePreset,
  handleCustomPromptSubmit,
}) {
  const oldPanelStyle = {
    backgroundColor: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(6px)",
    padding: "10px",
    borderRadius: "6px",
    marginBottom: "20px",
  };

  const buttonStyle = {
    padding: "6px 12px",
    borderRadius: "4px",
    border: "none",
    background: "#FFD700",
    color: "#000",
    fontWeight: "bold",
    cursor: "pointer",
    marginRight: "10px",
    marginTop: "5px",
  };

  const textAreaStyle = {
    width: "100%",
    padding: "8px",
    borderRadius: "4px",
    border: "none",
    outline: "none",
    marginBottom: "5px",
    fontFamily: "inherit",
  };

  return (
    <div style={oldPanelStyle}>
      <h3>Quick Summaries (Old Version)</h3>
      <div>
        <button onClick={() => handleSummarizePreset("explainLike5")} style={buttonStyle}>
          Explain like I'm 5
        </button>
        <button onClick={() => handleSummarizePreset("bulletPoints")} style={buttonStyle}>
          Bullet Points
        </button>
        <button onClick={() => handleSummarizePreset("conciseSummary")} style={buttonStyle}>
          Concise Summary
        </button>
      </div>
      <div style={{ marginTop: "10px" }}>
        <label style={{ display: "block", marginBottom: "5px" }}>
          Custom Prompt (old version)
        </label>
        <textarea
          rows="2"
          style={textAreaStyle}
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
        />
        <button onClick={handleCustomPromptSubmit} style={buttonStyle}>
          Send Prompt
        </button>
      </div>
      {summaryOutput && (
        <div
          style={{
            marginTop: "10px",
            backgroundColor: "rgba(255,255,255,0.1)",
            padding: "10px",
            borderRadius: "4px",
            whiteSpace: "pre-wrap",
          }}
        >
          <strong>Summary Output:</strong>
          <p>{summaryOutput}</p>
        </div>
      )}
    </div>
  );
}

/****************************************************************
 * --------------- WIZARD PROGRESS BAR --------------------------
 ****************************************************************/
function WizardProgressBar({ percentage, step }) {
  const progressBarContainerStyle = {
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: "6px",
    overflow: "hidden",
    height: "10px",
    width: "100%",
    marginBottom: "5px",
  };

  const progressBarFillStyle = {
    width: `${percentage}%`,
    height: "100%",
    background: "#FFD700",
    transition: "width 0.3s",
  };

  return (
    <>
      <div style={progressBarContainerStyle}>
        <div style={progressBarFillStyle} />
      </div>
      <p style={{ fontStyle: "italic", marginTop: "5px" }}>
        Wizard Step {step} of 3
      </p>
    </>
  );
}

/****************************************************************
 * ----------------- STEP 1: SELECT STYLES ----------------------
 ****************************************************************/
function WizardStep1({
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
  const sectionStyle = { marginBottom: "15px" };
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
  const textAreaStyle = {
    width: "100%",
    padding: "8px",
    borderRadius: "4px",
    border: "none",
    outline: "none",
    marginTop: "5px",
    fontFamily: "inherit",
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

  return (
    <div>
      <p>
        Select one or more style options <strong>OR</strong> enter a custom prompt
        to shape how the summary is generated.
      </p>

      {/* Depth */}
      <div style={sectionStyle}>
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
      <div style={sectionStyle}>
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
      <div style={sectionStyle}>
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

      {/* Custom Prompt */}
      <div style={sectionStyle}>
        <h3 style={subTitleStyle}>Custom Prompt (Optional)</h3>
        <textarea
          rows={2}
          style={textAreaStyle}
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
        />
      </div>

      <button style={buttonStyle} onClick={handleGenerateSummaries}>
        Generate Summaries
      </button>
    </div>
  );
}

/****************************************************************
 * ----------------- STEP 2: SHOW SUMMARIES ---------------------
 ****************************************************************/
function WizardStep2({ summaries, toggleCollapse, handleExpansion, handleFinish }) {
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

  return (
    <>
      {summaries.length === 0 && (
        <p>No summaries generated. (Shouldn’t happen unless everything was empty.)</p>
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
          Finish &amp; Save to History
        </button>
      )}
    </>
  );
}

function SummaryPanel({ summary, toggleCollapse, handleExpansion }) {
  const [showConfusionInput, setShowConfusionInput] = useState(false);
  const [confusionText, setConfusionText] = useState("");

  const panelStyle = {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: "8px",
    padding: "15px",
    marginBottom: "15px",
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
    marginRight: "10px",
  };
  const summaryOutputStyle = {
    whiteSpace: "pre-line",
    marginTop: "10px",
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: "10px",
    borderRadius: "4px",
  };

  const handleToggleCollapse = () => {
    toggleCollapse(summary.id);
  };

  const handleConfusedClick = () => {
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
    <div style={panelStyle}>
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
          <div style={summaryOutputStyle}>{summary.text}</div>
          <div style={{ marginTop: "10px" }}>
            <button style={smallButtonStyle} onClick={handleConfusedClick}>
              {showConfusionInput ? "Cancel" : "I'm Confused"}
            </button>
            <button style={smallButtonStyle} onClick={handleMoreDetail}>
              More Detail
            </button>
          </div>

          {showConfusionInput && (
            <div
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                padding: "10px",
                borderRadius: "4px",
                marginTop: "10px",
              }}
            >
              <label style={{ marginBottom: "5px", display: "block" }}>
                Please describe what confuses you:
              </label>
              <textarea
                rows={2}
                style={{
                  borderRadius: "4px",
                  padding: "8px",
                  border: "none",
                  fontSize: "1rem",
                  fontFamily: "inherit",
                  outline: "none",
                  width: "100%",
                  marginBottom: "5px",
                }}
                value={confusionText}
                onChange={(e) => setConfusionText(e.target.value)}
              />
              <button style={smallButtonStyle} onClick={submitConfusion}>
                Submit Confusion
              </button>
            </div>
          )}

          {summary.expansions.length > 0 &&
            summary.expansions.map((exp, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  padding: "10px",
                  borderRadius: "4px",
                  marginTop: "10px",
                }}
              >
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

/****************************************************************
 * ----------------- STEP 3: FINISH / HISTORY -------------------
 ****************************************************************/
function WizardStep3({
  handleStartOver,
  history,
  chatLog,
  showFinalDetails,
  setShowFinalDetails,
}) {
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

  return (
    <div>
      <p>All done! Your generated summaries have been saved to “history.”</p>
      <button style={buttonStyle} onClick={handleStartOver}>
        Start Over
      </button>
      <button style={buttonStyle} onClick={() => setShowFinalDetails(!showFinalDetails)}>
        {showFinalDetails ? "Hide Final Details" : "Show Final Details"}
      </button>

      {showFinalDetails && (
        <div
          style={{
            backgroundColor: "rgba(0,0,0,0.2)",
            padding: "10px",
            borderRadius: "6px",
            marginTop: "10px",
          }}
        >
          <h3>History of Summaries</h3>
          {history.length === 0 ? (
            <p style={{ fontStyle: "italic" }}>No previous sessions found.</p>
          ) : (
            history.map((session, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  padding: "10px",
                  borderRadius: "4px",
                  marginBottom: "10px",
                }}
              >
                <p style={{ margin: "4px 0" }}>
                  <strong>Session #{idx + 1}</strong> — {session.length} summaries
                </p>
                {session.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      whiteSpace: "pre-line",
                      marginTop: "10px",
                      backgroundColor: "rgba(255,255,255,0.1)",
                      padding: "10px",
                      borderRadius: "4px",
                    }}
                  >
                    <p style={{ margin: "0 0 6px" }}>
                      <strong>{s.id}</strong> ({s.depth}, {s.tone}, {s.format})
                    </p>
                    {s.text}
                    {/* expansions if needed */}
                  </div>
                ))}
              </div>
            ))
          )}

          <h3>Chat Log (Debug)</h3>
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

export default SummarizeSection;