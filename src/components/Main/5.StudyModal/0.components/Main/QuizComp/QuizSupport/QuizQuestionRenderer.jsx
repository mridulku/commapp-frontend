// QuizQuestionRenderer.jsx
// ------------------------
// Renders one quiz question.  Supports MCQ, TF, fill-in-blank,
// short-answer, scenario, ranking, plus:
//   • 💡 hint toggle (questionObj.hint)
//   • 🎙️ voice input (Web Speech API) for short-answer / scenario
// All props and existing behaviour are preserved.

import React from "react";

import {
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Tooltip,
  Chip
} from "@mui/material";

import MicIcon          from "@mui/icons-material/Mic";
import StopIcon         from "@mui/icons-material/Stop";
import LightbulbIcon    from "@mui/icons-material/LightbulbOutlined";

/* ----------------------------- styles -------------------------------- */
const styles = {
  container      : { marginBottom: "1rem" },
  questionPrompt : { margin: "0.5rem 0", fontWeight: "bold" },
  conceptLabel   : {
    fontStyle: "italic",
    fontSize : "0.9rem",
    color    : "#aaa",
    margin   : "0.5rem 0",
  },
  optionLabel    : { display: "block", marginLeft: "1.5rem" },
  input          : {
    width: "100%", padding: "8px", borderRadius: "4px", boxSizing: "border-box",
  },
  textarea : {
    width          : "100%",
    minHeight      : 100,
    padding        : "10px 14px",
    color          : "#e0f7fa",
    background     : "rgba(255,255,255,0.05)",
    border         : "1px solid rgba(255,255,255,0.12)",
    borderRadius   : 8,
    backdropFilter : "blur(3px)",
    boxShadow      : "inset 0 1px 3px rgba(0,0,0,0.4)",
    fontSize       : 15,
    lineHeight     : 1.45,
    resize         : "vertical",
    boxSizing      : "border-box",
    transition     : "border-color 120ms, box-shadow 120ms",
    paddingRight: 44,   // roomy for the 32px button + margin
  paddingBottom: 32,
  },
  scenarioBox: {
    backgroundColor: "#444",
    padding: "8px",
    borderRadius: "4px",
    marginBottom: "0.5rem",
  },
};

/* -------------------------- helper blocks ----------------------------- */
function HintBlock({ hint }) {
  if (!hint) return null;
  return (
    <div
      style={{
        marginTop: 8,
        padding: "8px 12px",
        background: "#263238",
        color: "#ffeb3b",
        borderRadius: 4,
        fontSize: 14,
        whiteSpace: "pre-wrap",
      }}
    >
      {hint}
    </div>
  );
}

/* --------------------------- component ------------------------------- */
export default function QuizQuestionRenderer({
  index,
  questionObj,
  userAnswer,
  onUserAnswerChange,
  readOnly = false,
}) {
  /* -------- graceful fallback -------- */
  if (!questionObj)
    return <div style={styles.container}>No question data.</div>;

  const qType        = questionObj.type          || "unknownType";
  const questionText = questionObj.question      || `Question ${index + 1}`;
  const conceptName  = questionObj.conceptName   || "";

  /* -------- UI state hooks -------- */
  const [showHint,  setShowHint]  = React.useState(false);
  const [recording, setRecording] = React.useState(false);
  const recognitionRef            = React.useRef(null);

  const answerRef = React.useRef(userAnswer || "");

/* keep ref in sync with text edits */
React.useEffect(() => {
  answerRef.current = userAnswer || "";
}, [userAnswer]);

  /* -------- voice-record toggle -------- */
  const toggleRecord = React.useCallback(() => {
    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
      return;
    }

    if (
      !("webkitSpeechRecognition" in window ||
        "SpeechRecognition"      in window)
    ) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const SpeechRec =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SpeechRec();
    rec.lang            = "en-US";
    rec.interimResults  = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
  const transcript = e.results[0][0].transcript.trim();
  const prev = answerRef.current.trim();
  const combined = prev ? `${prev} ${transcript}` : transcript;
  onUserAnswerChange(combined);
};
    rec.onerror = (e) => console.error("Speech error", e);
    rec.onend   = () => setRecording(false);

    recognitionRef.current = rec;
    rec.start();
    setRecording(true);
  }, [recording, onUserAnswerChange]);

  /* -------- render -------- */
  return (
    <div style={styles.container}>
      {/* prompt row */}
      <p style={styles.questionPrompt}>
        Q{index + 1}: {questionText}
        {questionObj.hint && (
          <Tooltip title="Show hint">
            <IconButton
              size="small"
              onClick={() => setShowHint((v) => !v)}
              sx={{ color: showHint ? "#ffeb3b" : "#aaa", ml: 0.5 }}
            >
              <LightbulbIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </p>

      {/* concept chip */}
      {conceptName && (
        <Chip
          label={conceptName}
          size="small"
          sx={{
            bgcolor: "#263238",
            color: "#80cbc4",
            fontStyle: "normal",
            mb: 0.5,
          }}
        />
      )}

      {/* read-only text for non-MCQ answers in review panels */}
      {readOnly &&
        (!questionObj.options || questionObj.options.length === 0) && (
          <p
            style={{
              fontStyle: "italic",
              color: "#ccc",
              margin: "8px 0",
            }}
          >
            <b>Your answer:</b>{" "}
            {userAnswer?.trim() ? userAnswer : "(blank)"}
          </p>
        )}

      {/* the main answer control */}
      {renderByType(
        qType,
        questionObj,
        userAnswer,
        onUserAnswerChange,
        readOnly,
        recording,
        toggleRecord
      )}

      {/* optional hint */}
      {showHint && <HintBlock hint={questionObj.hint} />}
    </div>
  );
}

/* ------------------- render switch-board ----------------------------- */
function renderByType(
  qType,
  qObj,
  userAnswer,
  onUserAnswerChange,
  readOnly,
  recording,
  toggleRecord
) {
  switch (qType) {
    case "multipleChoice":
      return renderMultipleChoice(
        qObj,
        userAnswer,
        onUserAnswerChange,
        readOnly
      );
    case "trueFalse":
      return renderTrueFalse(
        qObj,
        userAnswer,
        onUserAnswerChange,
        readOnly
      );
    case "fillInBlank":
      return renderFillInBlank(
        qObj,
        userAnswer,
        onUserAnswerChange,
        readOnly
      );
    case "shortAnswer":
    case "compareContrast":
      return renderShortAnswer(
        qObj,
        userAnswer,
        onUserAnswerChange,
        readOnly,
        recording,
        toggleRecord
      );
    case "scenario":
      return renderScenario(
        qObj,
        userAnswer,
        onUserAnswerChange,
        readOnly,
        recording,
        toggleRecord
      );
    case "ranking":
      return renderRanking(
        qObj,
        userAnswer,
        onUserAnswerChange,
        readOnly
      );
    default:
      return (
        <p style={{ color: "red" }}>
          Unknown question type: <b>{qType}</b>
        </p>
      );
  }
}

/* ------------------- type-specific renderers ------------------------- */
function renderMultipleChoice(
  qObj,
  userAnswer,
  onUserAnswerChange,
  readOnly
) {
  return (
    <ToggleButtonGroup
      orientation="vertical"
      exclusive
      value={parseInt(userAnswer, 10)}
      onChange={(_, v) => v !== null && onUserAnswerChange(String(v))}
      sx={{ width: "100%" }}
    >
      {qObj.options.map((opt, i) => (
        <ToggleButton
          key={i}
          value={i}
          disabled={readOnly}
          sx={{
            width: "100%",
            justifyContent: "flex-start",
            textTransform: "none",
            whiteSpace: "normal",
            lineHeight: 1.4,
            borderRadius: 1,
            my: 0.5,
            px: 2,
            bgcolor: "#263238",
            color: "#cfd8dc",
            "&.Mui-selected": {
              bgcolor: "#512da8",
              color: "#fff",
              "&:hover": { bgcolor: "#4527a0" },
            },
            "&:hover": { bgcolor: "#37474f" },
          }}
        >
          {opt}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

function renderTrueFalse(
  qObj,
  userAnswer,
  onUserAnswerChange,
  readOnly
) {
  return (
    <div>
      {["true", "false"].map((val) => (
        <label key={val} style={styles.optionLabel}>
          <input
            disabled={readOnly}
            type="radio"
            name={`tf-${qObj.question}`}
            value={val}
            checked={userAnswer === val}
            onChange={() => onUserAnswerChange(val)}
          />
          {val.charAt(0).toUpperCase() + val.slice(1)}
        </label>
      ))}
    </div>
  );
}

function renderFillInBlank(
  qObj,
  userAnswer,
  onUserAnswerChange,
  readOnly
) {
  return (
    <div>
      <p>{qObj.blankPhrase || "Fill in the blank:"}</p>
      <input
        disabled={readOnly}
        type="text"
        style={styles.input}
        value={userAnswer}
        onChange={(e) => onUserAnswerChange(e.target.value)}
      />
    </div>
  );
}

function renderShortAnswer(
  qObj,
  userAnswer,
  onUserAnswerChange,
  readOnly,
  recording,
  toggleRecord
) {
  const [focused, setFocused] = React.useState(false);
  const focusStyle = focused
    ? {
        borderColor: "#7c4dff",
        boxShadow:
          "inset 0 1px 3px rgba(0,0,0,0.4), 0 0 6px 1px rgba(124,77,255,0.5)",
      }
    : {};

  return (
    <div style={{ position: "relative" }}>
      <textarea
        disabled={readOnly}
        style={{ ...styles.textarea, ...focusStyle }}
        value={userAnswer}
        onChange={(e) => onUserAnswerChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Enter your response…"
      />

      {!readOnly && (
        <IconButton
          onClick={toggleRecord}
          title={recording ? "Stop recording" : "Speak your answer"}
          sx={{
            position: "absolute",
            bottom: 6,
            right: 6,
            bgcolor: "rgba(0,0,0,0.35)",
            "&:hover": { bgcolor: "rgba(0,0,0,0.55)" },
            color: recording ? "#e53935" : "#fff",
            backdropFilter: "blur(2px)",
            p: 0.5,
          }}
          size="small"
        >
          {recording ? <StopIcon fontSize="small" /> : <MicIcon fontSize="small" />}
        </IconButton>
      )}
    </div>
  );
}

function renderScenario(
  qObj,
  userAnswer,
  onUserAnswerChange,
  readOnly,
  recording,
  toggleRecord
) {
  return (
    <div>
      {qObj.scenarioText && (
        <blockquote style={styles.scenarioBox}>
          {qObj.scenarioText}
        </blockquote>
      )}
      <textarea
        disabled={readOnly}
        style={styles.textarea}
        value={userAnswer}
        onChange={(e) => onUserAnswerChange(e.target.value)}
        placeholder="Describe how you'd handle it..."
      />
      {!readOnly && (
        <IconButton
          size="small"
          onClick={toggleRecord}
          sx={{
            ml: 1,
            color: recording ? "#e53935" : "#ccc",
            mt: 0.5,
          }}
          title={recording ? "Stop recording" : "Speak your answer"}
        >
          {recording ? <StopIcon /> : <MicIcon />}
        </IconButton>
      )}
    </div>
  );
}

function renderRanking(
  qObj,
  userAnswer,
  onUserAnswerChange,
  readOnly
) {
  return (
    <div>
      <p>(Ranking question not fully implemented.)</p>
      <input
        disabled={readOnly}
        type="text"
        style={styles.input}
        value={userAnswer}
        onChange={(e) => onUserAnswerChange(e.target.value)}
        placeholder='e.g. "1,2,3" for your order'
      />
    </div>
  );
}