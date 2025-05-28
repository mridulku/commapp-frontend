// PromptPlayground.jsx  (dark-friendly)
import React, { useState } from "react";
import axios from "axios";
import {
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Typography,
  IconButton,
  CircularProgress,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

/* --- common styling helpers ------------------------------------- */
const textFieldSx = {
  backgroundColor: "#1e1e1e",
  "& .MuiInputBase-input, & textarea": { color: "#e0e0e0" },
  "& .MuiInputLabel-root":            { color: "#b3b3b3" },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: "#555" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#888" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#9c27b0" },
};

/* ---------------------------------------------------------------- */
export default function PromptPlayground() {
  const [openAiKey,      setOpenAiKey]      = useState(import.meta.env.VITE_OPENAI_KEY || "");
  const [model,          setModel]          = useState("gpt-3.5-turbo");
  const [subSummary,     setSubSummary]     = useState("");
  const [systemPrompt,   setSystemPrompt]   = useState("");
  const [templatePrompt, setTemplatePrompt] = useState("");
  const [stageIntro,     setStageIntro]     = useState("");
  const [conceptName,    setConceptName]    = useState("");
  const [qType,          setQType]          = useState("multipleChoice");
  const [numQuestions,   setNumQuestions]   = useState(2);
  const [loading,        setLoading]        = useState(false);
  const [output,         setOutput]         = useState("{}");

  /* ------- helpers ---------------------------------------------- */
  function buildUserPrompt() {
    const forcedBlock = conceptName
      ? `All questions must focus on the concept “${conceptName}”.\n` +
        `Set each question's "conceptName" field to "${conceptName}".`
      : "";
    return templatePrompt
      .replace(/{{stageIntro}}/g, stageIntro)
      .replace(/{{subSummary}}/g, subSummary)
      .replace(/{{n}}/g, numQuestions)
      .replace(/{{qType}}/g, qType)
      .replace(/{{forcedBlock}}/g, forcedBlock);
  }

  async function handleGenerate() {
    if (!openAiKey) { alert("Please enter your OpenAI key."); return; }
    setLoading(true); setOutput("{}");

    try {
      const resp = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model,
          messages: [
            { role: "system", content: systemPrompt || "You are a helpful assistant." },
            { role: "user",   content: buildUserPrompt() }
          ],
          max_tokens: 1500,
          temperature: 0.7,
        },
        { headers: { Authorization: `Bearer ${openAiKey}` } }
      );
      const raw = (resp.data.choices?.[0]?.message?.content || "")
                    .replace(/```json|```/g, "").trim();
      setOutput(raw);
    } catch (err) {
      console.error(err);
      alert(err.message || "OpenAI request failed");
    } finally { setLoading(false); }
  }

  const copyOutput = () =>
    navigator.clipboard.writeText(output).then(() => alert("Copied"));

  /* ------- UI ---------------------------------------------------- */
  return (
    <Box
      sx={{
        maxWidth: 900,
        mx: "auto",
        p: 3,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        bgcolor: "#000",          // full-page black backdrop
        color:  "#e0e0e0",
      }}
    >
      <Typography variant="h5" fontWeight={600}>Prompt Playground</Typography>

      {/* key + model */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <TextField
          label="OpenAI key"
          fullWidth
          value={openAiKey}
          onChange={(e) => setOpenAiKey(e.target.value)}
          sx={textFieldSx}
        />
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel sx={{ color: "#b3b3b3" }}>Model</InputLabel>
          <Select
            value={model}
            label="Model"
            onChange={(e) => setModel(e.target.value)}
            sx={textFieldSx}
            MenuProps={{ PaperProps: { sx: { bgcolor: "#1e1e1e", color: "#e0e0e0" } } }}
          >
            <MenuItem value="gpt-3.5-turbo">gpt-3.5-turbo</MenuItem>
            <MenuItem value="gpt-4o-mini">gpt-4o-mini</MenuItem>
            <MenuItem value="gpt-4o">gpt-4o</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* prompt parts */}
      <TextField label="Sub-chapter summary" multiline minRows={3}
        value={subSummary} onChange={(e) => setSubSummary(e.target.value)} sx={textFieldSx} />
      <TextField label="System prompt" multiline minRows={2}
        value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} sx={textFieldSx} />
      <TextField label="Stage intro" multiline minRows={2}
        value={stageIntro} onChange={(e) => setStageIntro(e.target.value)} sx={textFieldSx} />
      <TextField label="Template body" multiline minRows={5}
        value={templatePrompt} onChange={(e) => setTemplatePrompt(e.target.value)} sx={textFieldSx} />

      {/* generation params */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <TextField label="Concept (optional)" value={conceptName}
          onChange={(e) => setConceptName(e.target.value)} sx={{ ...textFieldSx, flex: 1 }} />
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel sx={{ color: "#b3b3b3" }}>Question type</InputLabel>
          <Select
            value={qType} label="Question type"
            onChange={(e) => setQType(e.target.value)}
            sx={textFieldSx}
            MenuProps={{ PaperProps: { sx: { bgcolor: "#1e1e1e", color: "#e0e0e0" } } }}
          >
            <MenuItem value="multipleChoice">multipleChoice</MenuItem>
            <MenuItem value="trueFalse">trueFalse</MenuItem>
            <MenuItem value="fillInBlank">fillInBlank</MenuItem>
            <MenuItem value="shortAnswer">shortAnswer</MenuItem>
            <MenuItem value="scenario">scenario</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="# questions" type="number" inputProps={{ min: 1 }}
          value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))}
          sx={{ ...textFieldSx, width: 130 }}
        />
      </Box>

      {/* generate button */}
      <Button variant="contained" onClick={handleGenerate} disabled={loading}
        sx={{ alignSelf: "flex-start", bgcolor: "#9c27b0" }}
        startIcon={loading && <CircularProgress size={18} />}
      >
        Generate
      </Button>

      {/* output box */}
      <Box sx={{ position: "relative" }}>
        <TextField
          label="OpenAI response"
          multiline minRows={10} fullWidth
          value={output}
          InputProps={{ readOnly: true }}
          sx={textFieldSx}
        />
        <IconButton
          size="small"
          onClick={copyOutput}
          sx={{ position: "absolute", top: 10, right: 10, color: "#e0e0e0" }}
        >
          <ContentCopyIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}