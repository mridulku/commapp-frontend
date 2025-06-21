// ────────────────────────────────────────────────────────────────
// File: src/components/Admin/AdminPanel.jsx   • 2025-06-20 compact
// ────────────────────────────────────────────────────────────────
import React, { useState, useMemo } from "react";
import {
  Box, FormControl, InputLabel, Select, MenuItem, Typography
} from "@mui/material";

/* =============== import tool components ======================= */
/* PDF Content Extraction */
import SliceUploader from "./Support/SliceUploader";
import SliceViewer   from "./Support/SliceViewer";
/* Core Content Editing */
import BookExplorer      from "./Support/BookExplorer";
import CSVBookUploader   from "./Support/CSVBookUploader";
/* Metrics */
import MetricsDashboard  from "./Support/MetricsDashboard";
import CostDashboard     from "./Support/CostDashboard";
/* Prompt Discovery */
import { QuizPromptEditor } from "./Support/QuizPrompEditor";
import PromptPlayground     from "./Support/PromptPlayground";
/* Ongoing Experiments */
import DoubtChat       from "./Support/DoubtChat";
import BondVisualizer  from "./Support/BondVisualizer";
/* Debug / misc (optional) */
import AggregatorBootloader from "./Support/AggregatorBootloader";
import AggregatorDebugPanel from "./Support/AggregatorDebugPanel";

/* =============== category → tool map ========================= */
const GROUPS = [
  {
    label: "PDF Content Extraction",
    tools: [
      { key: "uploader", label: "Slice Uploader",   comp: SliceUploader },
      { key: "viewer",   label: "Slice Viewer",     comp: SliceViewer   },
    ],
  },
  {
    label: "Core Content Editing",
    tools: [
      { key: "explorer", label: "Book Explorer",     comp: BookExplorer    },
      { key: "csv",      label: "CSV Book Uploader", comp: CSVBookUploader },
    ],
  },
  {
    label: "Metrics",
    tools: [
      { key: "metrics", label: "Metrics Dashboard", comp: MetricsDashboard },
      { key: "cost",    label: "Cost Dashboard",    comp: CostDashboard    },
    ],
  },
  {
    label: "Prompt Discovery",
    tools: [
      { key: "quizPrompt", label: "Quiz Prompt Editor", comp: QuizPromptEditor },
      { key: "playground", label: "Prompt Playground",  comp: PromptPlayground },
    ],
  },
  {
    label: "Ongoing Experiments",
    tools: [
      { key: "doubt", label: "Doubt Chat",     comp: DoubtChat      },
      { key: "bond",  label: "Bond Visualizer",comp: BondVisualizer },
    ],
  },
  {
    label: "Debug / Misc",
    tools: [
      { key: "aggBoot",  label: "Aggregator Bootloader", comp: AggregatorBootloader },
      { key: "aggDebug", label: "Aggregator Debug Panel",comp: AggregatorDebugPanel },
    ],
  },
];

/* prettier dark-glass styling */
const selectBoxSX = { minWidth: 240 };

const labelSX = {
  color: "#bbb",
  "&.Mui-focused": { color: "#BB86FC" },
};

const selectSX = {
  color: "#fff",
  bgcolor: "rgba(255,255,255,.05)",
  ".MuiOutlinedInput-notchedOutline": { borderColor: "#555" },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#BB86FC" },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#BB86FC" },
};

const itemSX = { color: "#fff" };

const menuProps = {
  PaperProps: { sx: { bgcolor: "#1e1e1e" } },
};

/* ─────────────────────────────────────────────────────────────── */
export default function AdminPanel({ userId }) {
  /* default to first category / first tool */
  const [groupIdx, setGroupIdx] = useState(0);
  const [toolKey , setToolKey ] = useState(GROUPS[0].tools[0].key);

  /* when category changes, jump to its first tool */
  const handleGroupChange = (idx) => {
    setGroupIdx(idx);
    setToolKey(GROUPS[idx].tools[0].key);
  };

  const ActiveTool = useMemo(() => {
    const t = GROUPS[groupIdx].tools.find((x) => x.key === toolKey);
    return t ? t.comp : () => <Typography>No tool</Typography>;
  }, [groupIdx, toolKey]);

  /* --------------------------- layout -------------------------- */
  return (
    <Box
      sx={{
        height: "100%",
        p: 3,
        boxSizing: "border-box",
        color: "#fff",
        fontFamily: "Inter, sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {/* ▼ selector strip */}
      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        {/* Category dropdown */}
               {/* ▼ Category */}
        <FormControl size="small" sx={selectBoxSX}>
          <InputLabel sx={labelSX}>Category</InputLabel>
          <Select
            label="Category"
            value={groupIdx}
            onChange={(e) => handleGroupChange(e.target.value)}
            sx={selectSX}
            MenuProps={menuProps}
          >
            {GROUPS.map((g, idx) => (
              <MenuItem key={g.label} value={idx} sx={itemSX}>
                {g.label}
              </MenuItem>
            ))}
          </Select>
       </FormControl>


                {/* ▼ Tool */}
        <FormControl size="small" sx={selectBoxSX}>
          <InputLabel sx={labelSX}>Tool</InputLabel>
          <Select
            label="Tool"
            value={toolKey}
            onChange={(e) => setToolKey(e.target.value)}
            sx={selectSX}
            MenuProps={menuProps}
          >
            {GROUPS[groupIdx].tools.map((t) => (
              <MenuItem key={t.key} value={t.key} sx={itemSX}>
                {t.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* ▼ tool viewport */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          border: "1px solid #333",
          borderRadius: 2,
          p: 2,
        }}
      >
        <ActiveTool userId={userId} />
      </Box>
    </Box>
  );
}