/**********************************************************************
 * File: AdminQuizEditors.jsx
 *
 * Tiny Firestore editors for:
 *   1. /quizPrompts/<examId_stage>          (QuizPromptEditor)
 *   2. /quizConfigs /quiz<Exam><Stage>      (QuizConfigEditor)
 *
 * Dependencies: React 18+, Firebase v9, @mui/material, @mui/icons-material
 *********************************************************************/

import React, { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "../../../../firebase";

/* ---------- MUI ---------- */
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Paper,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/SaveRounded";
import RefreshIcon from "@mui/icons-material/RefreshRounded";

/* ================================================================ */
/*  A very small “firestore doc” hook                               */
/* ================================================================ */
function useDoc(path, auto = true) {
  const [data, setData]     = useState(null);
  const [loading, setLoad]  = useState(auto);
  const [error, setError]   = useState("");

  const ref = doc(db, path);

  const reload = async () => {
    setLoad(true);
    setError("");
    try {
      const snap = await getDoc(ref);
      setData(snap.exists() ? snap.data() : {});
    } catch (e) {
      setError(e.message);
    } finally {
      setLoad(false);
    }
  };

  const save = async newData => {
    setLoad(true);
    setError("");
    try {
      await setDoc(ref, newData, { merge: true });
      setData(newData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoad(false);
    }
  };

  useEffect(() => { if (auto) reload(); }, [path]);

  return { data, setData, loading, error, reload, save };
}

/* ============================================================== */
/*  QuizPromptEditor                                              */
/* ============================================================== */
export function QuizPromptEditor() {
  /* ——— pick which prompt to edit ——— */
  const [examId,   setExam]   = useState("general");
  const [stage,    setStage]  = useState("remember");
  const docPath = `quizPrompts/${examId}_${stage}`;

  const { data, setData, loading, error, reload, save } = useDoc(docPath);

  /* list of stages/exams for quick demo — replace with your own list */
  const exams  = ["general", "jee", "neet"];
  const stages = ["remember", "understand", "apply", "analyze"];

  const handleChange = (field) => (e) =>
    setData(prev => ({ ...prev, [field]: e.target.value }));

  const handleSave = () => save(data);

  return (
    <Paper sx={{ p: 3, maxWidth: 960, mx: "auto" }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Quiz Prompt Editor</Typography>

      {/* selector row */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          select
          label="Exam"
          value={examId}
          onChange={(e) => setExam(e.target.value)}
          sx={{ minWidth: 140 }}
        >
          {exams.map((ex) => (
            <MenuItem key={ex} value={ex}>{ex}</MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Stage"
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          {stages.map((st) => (
            <MenuItem key={st} value={st}>{st}</MenuItem>
          ))}
        </TextField>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={reload}
          sx={{ ml: "auto" }}
        >
          Reload
        </Button>
      </Box>

      {loading && <CircularProgress />}

      {!loading && data && (
        <>
          <TextField
            fullWidth
            label="System prompt"
            value={data.system || ""}
            onChange={handleChange("system")}
            multiline
            minRows={3}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Template (use {{placeholders}})"
            value={data.template || ""}
            onChange={handleChange("template")}
            multiline
            minRows={6}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Stage intro (optional)"
            value={data.stageIntro || ""}
            onChange={handleChange("stageIntro")}
            sx={{ mb: 4 }}
          />

          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
          >
            Save
          </Button>
        </>
      )}

      <Snackbar open={!!error}>
        <Alert severity="error" onClose={() => {}}>
          {error}
        </Alert>
      </Snackbar>
    </Paper>
  );
}

/* ============================================================== */
/*  QuizConfigEditor (counts only)                                */
/* ============================================================== */
export function QuizConfigEditor() {
  const [examId, setExam]  = useState("general");
  const [stage,  setStage] = useState("remember");

  const cfgId   = `quiz${capitalize(examId)}${capitalize(stage)}`;
  const docPath = `quizConfigs/${cfgId}`;

  const { data, setData, loading, error, reload, save } = useDoc(docPath);

  /* recognise every key that *isn’t* stagePrompt as a q-type count */
  const questionTypes = data
    ? Object.keys(data).filter(k => k !== "stagePrompt")
    : [];

  /* add a new blank q-type line */
  const addRow = () =>
    setData(prev => ({ ...prev, "newType": 1 }));

  const handleField = key => val =>
    setData(prev => ({ ...prev, [key]: val }));

  const handleSave = () => save(data);

  return (
    <Paper sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Quiz Config Editor</Typography>

      {/* selector */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          select label="Exam" value={examId}
          onChange={e => setExam(e.target.value)}
          sx={{ minWidth: 140 }}
        >
          {["general", "jee", "neet"].map(ex =>
            <MenuItem key={ex} value={ex}>{ex}</MenuItem>)}
        </TextField>

        <TextField
          select label="Stage" value={stage}
          onChange={e => setStage(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          {["remember","understand","apply","analyze"].map(st =>
            <MenuItem key={st} value={st}>{st}</MenuItem>)}
        </TextField>

        <Button variant="outlined" onClick={reload} sx={{ ml: "auto" }}>
          Reload
        </Button>
      </Box>

      {loading && <CircularProgress />}

      {!loading && data && (
        <>
          <TextField
            fullWidth
            label="(Legacy) stagePrompt"
            value={data.stagePrompt || ""}
            onChange={e =>
              setData(prev => ({ ...prev, stagePrompt: e.target.value }))
            }
            sx={{ mb: 3 }}
            multiline
            minRows={3}
          />

          {/* counts */}
          <Typography sx={{ fontWeight: 600, mb: 1 }}>Question counts:</Typography>

          {questionTypes.map(qt => (
            <Box key={qt} sx={{ display: "flex", gap: 2, mb: 1 }}>
              <TextField
                sx={{ flex: 1 }}
                label="Type"
                value={qt}
                onChange={e => {
                  const val = e.target.value;
                  setData(prev => {
                    const { [qt]: count, ...rest } = prev;
                    return { ...rest, [val]: count };
                  });
                }}
              />
              <TextField
                label="#"
                type="number"
                value={data[qt]}
                onChange={e => handleField(qt)(parseInt(e.target.value, 10))}
                sx={{ width: 120 }}
              />
            </Box>
          ))}

          <Button onClick={addRow} sx={{ mb: 3 }}>
            + Add Row
          </Button>

          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
          >
            Save
          </Button>
        </>
      )}

      <Snackbar open={!!error}>
        <Alert severity="error">{error}</Alert>
      </Snackbar>
    </Paper>
  );
}

/* util */
function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}