// ─────────────────────────────────────────────────────────
// File: src/components/SyllabusHome.jsx     (full page v5)
// Beautiful, fully-wired syllabus explorer
// ─────────────────────────────────────────────────────────
import React, { useState } from "react";
import {
  Box, Tabs, Tab, Accordion, AccordionSummary,
  AccordionDetails, Typography, Chip, Stack,
  IconButton, Avatar          // 👈 NEW
} from "@mui/material";
import ArrowBackIos from "@mui/icons-material/ArrowBackIos";   // 👈 NEW

import ScienceIcon   from "@mui/icons-material/Science";
import CategoryIcon  from "@mui/icons-material/Category";
import BiotechIcon   from "@mui/icons-material/Biotech";
import ExpandMore    from "@mui/icons-material/ExpandMore";
import { motion }    from "framer-motion";

import ConceptInsightModal from "./ConceptInsightModal";

import PlanExplainerPanel from "../3.Library/3.AdaptivePlanView/AdaptPGComponent/AdaptPG2/ExplainerStrips/OfficialSyllabusExplainerStrip";

/* ═════════════════════════ Demo data  ══════════════════════ */
/* Swap with your parsed PDF payload when ready */
const syllabus = {
  Physics: [
    {
      unit: "Physics & Measurement",
      topics: [
        "Units & dimensions",
        "Significant figures",
        "Dimensional analysis",
      ],
    },
    {
      unit: "Kinematics",
      topics: [
        "Graphs of motion",
        "Projectile motion",
        "Relative velocity",
      ],
    },
    {
      unit: "Laws of Motion",
      topics: [
        "Newton’s laws",
        "Friction",
        "Circular dynamics",
      ],
    },
  ],
  Chemistry: [
    {
      unit: "Basic Concepts of Chemistry",
      topics: [
        "Mole concept",
        "Stoichiometry",
        "Limiting reagent",
      ],
    },
    {
      unit: "Atomic Structure",
      topics: [
        "Bohr model",
        "Quantum numbers",
        "de-Broglie relation",
      ],
    },
  ],
  Biology: [
    {
      unit: "Diversity in Living World",
      topics: [
        "Viruses",
        "Plant taxonomy",
        "Animal taxonomy",
      ],
    },
    {
      unit: "Cell: Structure & Function",
      topics: [
        "Prokaryotic cell",
        "Eukaryotic cell",
        "Cell organelles",
      ],
    },
  ],
};

/* ═════════════════════════ Style helpers ═══════════════════ */
const PAGE_BG   = "radial-gradient(circle at 35% 0%, #181924 0%, #0e0f15 100%)";
const GLASS     = "rgba(255,255,255,.08)";
const colours   = [
  ["#a78bfa", "#818cf8"],
  ["#fca5a5", "#f87171"],
  ["#6ee7b7", "#3b82f6"],
  ["#f9a8d4", "#ec4899"],
  ["#fdba74", "#fb923c"],
];
const grad = ([a, b]) => `linear-gradient(135deg,${a} 0%,${b} 100%)`;
const MotionAccordion = motion(Accordion);

/* ═════════════════════════ Topic pill → colourful card ═════ */
function TopicCard({ label, idx, onClick }) {
  const pal = colours[idx % colours.length];
  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: "0 6px 12px rgba(0,0,0,.8)" }}
      onClick={onClick}
      style={{
        padding: "10px 16px",
        borderRadius: 12,
        background: grad(pal),
        color: "#fff",
        fontWeight: 600,
        fontSize: 14,
        cursor: "pointer",
        userSelect: "none",
        minWidth: 140,
        textAlign: "center",
      }}
    >
      {label}
    </motion.div>
  );
}

/* ═════════════════════════ One full-width accordion row ════ */
function UnitRow({ idx, unitData, subject, onSelectTopic }) {
  return (
    <MotionAccordion
      whileHover={{ y: -2, boxShadow: "0 8px 20px rgba(0,0,0,.7)" }}
      sx={{
        width: "100%",
        bgcolor: GLASS,
        borderRadius: 4,
        backdropFilter: "blur(6px)",
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMore sx={{ color: "#B39DDB" }} />}>
        <Typography sx={{ fontWeight: 700, color: "#fff" }}>
          {idx}. {unitData.unit}
        </Typography>
      </AccordionSummary>

      <AccordionDetails>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          {unitData.topics.map((topic, i) => (
            <TopicCard
              key={topic}
              label={topic}
              idx={i}
              onClick={() =>
                onSelectTopic({
                  subject,
                  unit: unitData.unit,
                  topic,
                })
              }
            />
          ))}
        </Stack>
      </AccordionDetails>
    </MotionAccordion>
  );
}

/* ═════════════════════════ Main page component ═════════════ */
export default function OfficialSyllabusPage({ onBack = () => {} }) {
  const subjects = Object.keys(syllabus);
  const [tab, setTab] = useState(0);
  const [activeTopic, setActiveTopic] = useState(null);

  const currentSubject = subjects[tab];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: PAGE_BG,
        p: { xs: 3, md: 5 },
        fontFamily: "Inter, sans-serif",
      }}
    >
      

            {/* ── HEADER ───────────────────────────────────── */}
      <Stack direction="row" spacing={1} alignItems="center" mb={3}>
        <IconButton onClick={onBack} sx={{ color: "#fff" }}>
          <ArrowBackIos />
        </IconButton>
        <Avatar
         sx={{
            width: 30,
            height: 30,
            bgcolor: "rgba(255,255,255,.15)",
            mr: 1,
          }}
        >
          📚
        </Avatar>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Official&nbsp;Syllabus
        </Typography>
      </Stack>

      {/* collapsible explainer */}
      <PlanExplainerPanel sx={{ mb: 3 }} />

      {/* ── SUBJECT TABS ─────────────────────────────── */}

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        textColor="inherit"
        indicatorColor="secondary"
        sx={{
          mb: 3,
          ".MuiTab-root": {
            textTransform: "none",
            fontWeight: 600,
            color: "#bbb",
          },
          ".Mui-selected": { color: "#BB86FC" },
        }}
      >
        <Tab icon={<ScienceIcon />} iconPosition="start" label="Physics" />
        <Tab icon={<CategoryIcon />} iconPosition="start" label="Chemistry" />
        <Tab icon={<BiotechIcon />} iconPosition="start" label="Biology" />
      </Tabs>


      
 

      {/* UNITS */}
      <Stack spacing={2}>
        {syllabus[currentSubject].map((unit, i) => (
          <UnitRow
            key={unit.unit}
            idx={i + 1}
            unitData={unit}
            subject={currentSubject}
            onSelectTopic={setActiveTopic}
          />
        ))}
      </Stack>

      {/* INSIGHT MODAL */}
      <ConceptInsightModal
  open={!!activeTopic}
  data={activeTopic}
  onClose={()=>setActiveTopic(null)}
  onStartQuiz={()=>{
    // route to your existing quiz flow → hand it the `activeTopic`
    console.log("Launch quiz for", activeTopic.label);
  }}
/>
    </Box>
  );
}