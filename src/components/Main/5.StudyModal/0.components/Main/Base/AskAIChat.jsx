/*  AskAIChat.jsx  – GPT-powered chat widget  ✧  full replacement  ✧
    ────────────────────────────────────────────────────────────────
    • Keeps all original behaviour (context vs. selection, history, templates …)
    • Each GPT call now writes one document to `gptUsageLogs`:

        {
          userId, planId, subChapterId,
          variant          : "askAI",
          prompt           : "...",          // user's latest question
          gptReply         : "...",          // assistant answer (markdown)
          promptTokens     : 123,
          completionTokens : 456,
          totalTokens      : 579,
          createdAt        : <Timestamp>
        }

      Filter by `variant == "askAI"` to separate it from rewrite logs.
*/

import React, { useEffect, useRef, useState } from "react";
import {
  Box, Chip, CircularProgress, IconButton, Paper, TextField,
  Tooltip, Collapse
} from "@mui/material";
import SendIcon       from "@mui/icons-material/Send";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import HistoryIcon    from "@mui/icons-material/History";
import { useSelector } from "react-redux";

import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../../../firebase";   // ← adjust if path differs

/* ─────── configuration ─────── */
const SYS_PROMPT = `You are a helpful subject-matter tutor.
Ground every answer in the provided context when it exists.
If the question is unrelated, politely say so. Reply in markdown.`;

const TEMPLATES = [
  "Summarise this in two sentences.",
  "Explain like I'm 12.",
  "Give me a real-world analogy.",
  "List 3 key take-aways.",
  "Write 2 practice questions."
];

const MODEL        = "gpt-3.5-turbo";
const TEMP         = 0.4;
const USAGE_COLL   = "aiChatUsage";

const snippet = (t = "") => (t.length <= 70 ? t : `${t.slice(0, 30)} … ${t.slice(-30)}`);

/* ─────── tiny Firestore logger ─────── */
async function logChatUsage({
  userId = "anon",
  planId = "none",
  subChapterId = "unknown",
  prompt,
  reply,
  usage = {},
}) {
  try {
    await setDoc(
      doc(db, USAGE_COLL, crypto.randomUUID()),
      {
        userId,
        planId,
        subChapterId,
        variant          : "askAI",
        prompt,
        gptReply         : reply,
        promptTokens     : usage.prompt_tokens     ?? 0,
        completionTokens : usage.completion_tokens ?? 0,
        totalTokens      : usage.total_tokens      ?? 0,
        createdAt        : serverTimestamp(),
      },
      { merge: false }
    );
  } catch (err) {
    console.error("[AskAIChat] logChatUsage failed:", err);
  }
}

/* ─────── OpenAI helper ─────── */
async function chatWithGPT(messages, { userId, planId, subChapterId }) {
  const apiKey = import.meta.env.VITE_OPENAI_KEY;
  if (!apiKey) throw new Error("OPENAI key missing");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method : "POST",
    headers: {
      "Content-Type" : "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model       : MODEL,
      temperature : TEMP,
      messages,
    }),
  });

  if (!res.ok) throw new Error(await res.text());
  const data   = await res.json();
  const reply  = data.choices?.[0]?.message?.content?.trim() || "No answer";
  const usage  = data.usage ?? {};

  /* fire-and-forget log */
  logChatUsage({
    userId, planId, subChapterId,
    prompt: messages.at(-1)?.content ?? "",
    reply,
    usage,
  });

  return reply;
}

/* =================================================================== */
export default function AskAIChat({
  contextText,
  selection,
  mode,
  onModeChange,
  subChapterId: metaSubChapterId = "unknown",   // passed from parent
}) {
  /* meta for logging */
  const userId = useSelector((s) => s.auth?.userId || "anon");
  const planId = useSelector((s) => s.plan?.planDoc?.id || "none");
  const subChapterId = metaSubChapterId;

  /* ------------- conversation state ------------- */
  const makeStarter = (ctx) => ([
    { role: "system",    content: SYS_PROMPT },
    { role: "assistant", content: `Context:\n${ctx}` },
  ]);

  const [thread, setThread]    = useState(makeStarter(contextText));
  const [input, setInput]      = useState("");
  const [busy, setBusy]        = useState(false);
  const [error, setError]      = useState("");

  /* session history (localStorage) */
  const [history, setHistory]  = useState(
    () => JSON.parse(localStorage.getItem("aiHistory") || "[]")
  );
  const [showHist, setShowHist] = useState(false);

  /* auto-scroll */
  const endRef = useRef(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [thread, busy]);

  /* reset when page / selection changes */
  useEffect(() => {
    setThread(makeStarter(contextText));
    setInput("");
    setError("");
  }, [contextText]);

  /* ------------- send a prompt ------------- */
  async function send(msg) {
    const q = msg.trim();
    if (!q) return;

    const next = [...thread, { role: "user", content: q }];
    setThread(next);
    setInput("");
    setBusy(true);
    setError("");

    /* limit history to last 10 turns to stay under token limits */
    const MAX_TURNS = 10;
    const safeNext  = next.slice(-1 - MAX_TURNS * 2);  // user+assistant per turn

    try {
      const answer = await chatWithGPT(safeNext, { userId, planId, subChapterId });
      setThread([...next, { role: "assistant", content: answer }]);
    } catch (e) {
      console.error(e);
      setError("⚠️ GPT request failed");
    } finally {
      setBusy(false);
    }
  }

  /* template chips */
  const replacement = mode === "selection" ? "this passage" : "this page";
  const useTemplate = (tpl) => send(tpl.replace("this", replacement));

  /* ---------- history helpers ---------- */
  const saveToHistory = () => {
    const firstUser = thread.find((m) => m.role === "user");
    if (!firstUser) return;
    const rec  = { ts: Date.now(), title: firstUser.content.slice(0, 60), thread };
    const next = [rec, ...history].slice(0, 20);
    setHistory(next);
    localStorage.setItem("aiHistory", JSON.stringify(next));
  };

  const newChat  = () => { saveToHistory(); setThread(makeStarter(contextText)); setShowHist(false); };
  const loadChat = (rec) => { setThread(rec.thread); setShowHist(false); setError(""); };

  const firstTurn = thread.length <= 2; // only system+context so far

  /* ------------------------- UI ------------------------- */
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* top bar */}
      <Box sx={{ mb: 1, display: "flex", gap: 1 }}>
        <Tooltip title="History">
          <IconButton size="small" onClick={() => setShowHist((o) => !o)}
                      sx={{ bgcolor: "#272727", color: "#FFD700" }}>
            <HistoryIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="New chat">
          <IconButton size="small" onClick={newChat}
                      sx={{ bgcolor: "#272727", color: "#FFD700" }}>
            <RestartAltIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* inline history */}
      <Collapse in={showHist} unmountOnExit
                sx={{ mb: 1, maxHeight: 140, overflowY: "auto" }}>
        {history.length === 0 ? (
          <Box sx={{ p: 1, fontSize: 13, opacity: 0.6 }}>
            <strong>No saved chats yet</strong><br />
            Start a conversation, hit “New chat”, and it will appear here.
          </Box>
        ) : (
          history.map((h) => (
            <Paper key={h.ts} variant="outlined" onClick={() => loadChat(h)}
                   sx={{ p: 1, mb: 1, bgcolor: "#1d1d1d", cursor: "pointer",
                         "&:hover": { bgcolor: "#272727" } }}>
              <Box sx={{ fontSize: 12, opacity: 0.65 }}>
                {new Date(h.ts).toLocaleString()}
              </Box>
              <Box sx={{ fontSize: 13 }}>{h.title}</Box>
            </Paper>
          ))
        )}
      </Collapse>

      {/* message list (skip system+context) */}
      <Box sx={{ flex: 1, overflowY: "auto", pr: 1, mb: 1 }}>
        {thread.slice(2).map((m, i) => (
          <Paper key={i} elevation={0}
                 sx={{
                   p: 1.2, mb: 0.8, maxWidth: "80%",
                   alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                   bgcolor : m.role === "user" ? "primary.main" : "#1e1e1e",
                   color   : m.role === "user" ? "#fff" : "#ddd",
                   borderRadius: 2,
                   borderTopRightRadius: m.role === "user" ? 0 : 2,
                   borderTopLeftRadius : m.role === "user" ? 2 : 0,
                   whiteSpace: "pre-wrap", fontSize: 14,
                 }}>
            {m.content}
          </Paper>
        ))}
        {busy && (
          <CircularProgress size={20}
                            sx={{ display: "block", mx: "auto", my: 1, color: "primary.light" }} />
        )}
        {error && (
          <Box sx={{ color: "#f66", fontSize: 13, textAlign: "center", my: 1 }}>
            {error}
          </Box>
        )}
        <div ref={endRef} />
      </Box>

      {/* preset templates */}
      {firstTurn && (
        <Box sx={{ mb: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
          {TEMPLATES.map((tpl) => (
            <Chip key={tpl} size="small"
                  label={tpl.replace("this", replacement)}
                  sx={{ bgcolor: "#2a2a2a", color: "primary.light", "&:hover": { bgcolor: "#333" } }}
                  onClick={() => useTemplate(tpl)} disabled={busy} />
          ))}
        </Box>
      )}

      {/* composer */}
      <Box component="form"
           onSubmit={(e) => { e.preventDefault(); send(input); }}
           sx={{ display: "flex", gap: 1 }}>
        <TextField fullWidth size="small" placeholder="Type your question…"
                   value={input} onChange={(e) => setInput(e.target.value)}
                   disabled={busy}
                   sx={{
                     "& .MuiInputBase-root": { bgcolor: "#222", color: "#fff" },
                     "& fieldset": { borderColor: "#444" },
                   }} />
        <IconButton type="submit" disabled={!input.trim() || busy}
                    sx={{
                      bgcolor: "primary.main", color: "#fff",
                      "&:hover": { bgcolor: "primary.dark" },
                    }}>
          <SendIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* context pills (only before first send) */}
      {firstTurn && (
        <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <span style={{ fontSize: 13, opacity: 0.7 }}>Include:</span>
          <Chip label="Whole passage" size="small"
                onClick={() => onModeChange("page")}
                disabled={mode === "page"}
                sx={{
                  bgcolor: mode === "page" ? "primary.main" : "#272727",
                  color  : mode === "page" ? "#fff" : "#bbb",
                }} />
          <Chip label={selection ? `Selected – ${snippet(selection)}` : "Selected text"}
                size="small"
                onClick={() => selection && onModeChange("selection")}
                disabled={!selection || mode === "selection"}
                sx={{
                  bgcolor: mode === "selection" ? "primary.main" : "#272727",
                  color  : !selection ? "#555" : mode === "selection" ? "#fff" : "#bbb",
                }} />
        </Box>
      )}
    </Box>
  );
}