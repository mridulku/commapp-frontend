import * as React from "react";
import {
  Box,
  Typography,
  Chip,
  Stack,
  FormControl,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Paper,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

/* ------------------------------------------------------------------------- */
/*  Dummy data                                                               */
/* ------------------------------------------------------------------------- */
const suggestions = [
  "Explain Newton’s first law",
  "What is photosynthesis?",
  "Summarise World War II",
  "Solve x² – 4x + 4",
];

const contentScopes = [
  "All Content",
  "Physics – Ch 1",
  "Biology – Ch 3",
  "History – WWII",
  "Math – Quadratics",
];

/* ------------------------------------------------------------------------- */
/*  Main component                                                           */
/* ------------------------------------------------------------------------- */
const SmartChatView = () => {
  const [scope, setScope] = React.useState(contentScopes[0]);
  const [input, setInput] = React.useState("");
  const [messages, setMessages] = React.useState([]);

  const handleSend = (prompt) => {
    if (!prompt.trim()) return;
    // append user message
    setMessages((prev) => [...prev, { role: "user", text: prompt }]);
    setInput("");

    // dummy assistant echo
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `Echoing: “${prompt}”` },
      ]);
    }, 400);
  };

  return (
    <Box
      sx={{
        height: "calc(100vh - 64px)", // 64px header from GenerateModal
        display: "flex",
        flexDirection: "column",
        bgcolor: "#f7f8fa",
      }}
    >
      {/* ░░ Selection & quick prompts ░░ */}
      <Box sx={{ p: 2, borderBottom: "1px solid #e0e0e0" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems="center"
        >
          {/* Content scope dropdown */}
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <Select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              variant="outlined"
            >
              {contentScopes.map((label) => (
                <MenuItem key={label} value={label}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Suggestion chips */}
          <Stack
            direction="row"
            spacing={1}
            flexWrap="wrap"
            justifyContent="flex-start"
          >
            {suggestions.map((q) => (
              <Chip
                key={q}
                label={q}
                clickable
                onClick={() => handleSend(q)}
                sx={{
                  bgcolor: "#fff",
                  border: "1px solid #e0e0e0",
                  "&:hover": { bgcolor: "#f0f0f0" },
                }}
              />
            ))}
          </Stack>
        </Stack>
      </Box>

      {/* ░░ Chat history ░░ */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          px: 2,
          py: 3,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {messages.map((m, idx) => (
          <Paper
            key={idx}
            sx={{
              p: 1.5,
              maxWidth: "80%",
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              bgcolor: m.role === "user" ? "#3b82f6" : "#e2e8f0",
              color: m.role === "user" ? "#fff" : "inherit",
              borderRadius: 3,
            }}
          >
            {m.text}
          </Paper>
        ))}
      </Box>

      {/* ░░ Input bar ░░ */}
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        sx={{
          borderTop: "1px solid #e0e0e0",
          px: 2,
          py: 1.5,
          display: "flex",
          gap: 1,
          bgcolor: "#fff",
        }}
      >
        <TextField
          placeholder="Ask a question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          fullWidth
          size="small"
          variant="outlined"
        />
        <IconButton
          color="primary"
          type="submit"
          sx={{ alignSelf: "center" }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default SmartChatView;