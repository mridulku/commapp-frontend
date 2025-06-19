// ─────────────────────────────────────────────────────────
// File: src/components/SyllabusHome.jsx    (row layout – v4)
// ─────────────────────────────────────────────────────────
import React, { useState } from "react";
import {
  Box, Tabs, Tab, Accordion, AccordionSummary,
  AccordionDetails, Typography, Chip, Stack
} from "@mui/material";
import ScienceIcon      from "@mui/icons-material/Science";
import CategoryIcon     from "@mui/icons-material/Category";
import BiotechIcon      from "@mui/icons-material/Biotech";
import ExpandMore       from "@mui/icons-material/ExpandMore";
import { motion }       from "framer-motion";

/* ── demo data (swap with your parsed PDF) ────────────────── */
const syllabus = {
  Physics: [
    { unit:"Physics & Measurement",
      topics:["Units & dimensions","Significant figures","Dimensional analysis"] },
    { unit:"Kinematics",
      topics:["Graphs of motion","Projectile motion","Relative velocity"] },
    { unit:"Laws of Motion",
      topics:["Newton’s laws","Friction","Circular dynamics"] },
  ],
  Chemistry: [
    { unit:"Basic Concepts",   topics:["Mole concept","Stoichiometry","Limiting reagent"] },
    { unit:"Atomic Structure", topics:["Bohr model","Quantum numbers","de Broglie relation"] }
  ],
  Biology: [
    { unit:"Diversity in Life", topics:["Viruses","Plant taxonomy","Animal taxonomy"] },
    { unit:"Cell Structure",    topics:["Prokaryotic","Eukaryotic","Cell organelles"] }
  ]
};
/* ─────────────────────────────────────────────────────────── */
const PAGE_BG ="radial-gradient(circle at 35% 0%, #181924 0%, #0e0f15 100%)";
const GLASS   ="rgba(255,255,255,.08)";
const chipSX  ={ bgcolor:"rgba(255,255,255,.15)", color:"#fff", fontWeight:600 };
const MotionAccordion = motion(Accordion);

/* ─── Small glassy card for each topic ───────────────────── */
const colours = [
  ["#a78bfa","#818cf8"],
  ["#fca5a5","#f87171"],
  ["#6ee7b7","#3b82f6"],
  ["#f9a8d4","#ec4899"],
  ["#fdba74","#fb923c"]
];
const grad = ([a,b])=>`linear-gradient(135deg,${a} 0%,${b} 100%)`;

function TopicCard({ label, idx }) {
  const pal = colours[idx % colours.length];      // rotate palette
  return (
    <motion.div
      whileHover={{ y:-3, boxShadow:"0 6px 12px rgba(0,0,0,.8)" }}
      style={{
        padding:"10px 16px",
        borderRadius:12,
        background:grad(pal),
        color:"#fff",
        fontWeight:600,
        fontSize:14,
        cursor:"pointer",
        userSelect:"none",
        backdropFilter:"blur(4px)",
        minWidth:140,
        textAlign:"center"
      }}
    >
      {label}
    </motion.div>
  );
}


export default function OfficialSyllabusPage() {
  const subjects = Object.keys(syllabus);
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{
      minHeight:"100vh",
      background:PAGE_BG,
      p:{ xs:3, md:5 },
      fontFamily:"Inter, sans-serif"
    }}>

      <Typography variant="h4" sx={{ fontWeight:800, mb:4 }}>
        NEET&nbsp;2025 · Official&nbsp;Syllabus
      </Typography>

      {/* SUBJECT TABS */}
      <Tabs
        value={tab}
        onChange={(_,v)=>setTab(v)}
        textColor="inherit"
        indicatorColor="secondary"
        sx={{
          mb:3,
          ".MuiTab-root":  { textTransform:"none", fontWeight:600, color:"#bbb" },
          ".Mui-selected": { color:"#BB86FC" }
        }}
      >
        <Tab icon={<ScienceIcon/>}  iconPosition="start" label="Physics"   />
        <Tab icon={<CategoryIcon/>} iconPosition="start" label="Chemistry" />
        <Tab icon={<BiotechIcon/>}  iconPosition="start" label="Biology"   />
      </Tabs>

      {/* UNIT ROWS */}
      <Stack spacing={2}>
        {syllabus[subjects[tab]].map((u,i)=>(
          <UnitRow key={i} idx={i+1} data={u}/>
        ))}
      </Stack>
    </Box>
  );
}

/* ─── One full-width accordion row ────────────────────────── */
/* ─── One full-width accordion row ───────────────────────── */
function UnitRow({ idx, data }) {
  return (
    <MotionAccordion
      {...{ whileHover:{ y:-2, boxShadow:"0 8px 20px rgba(0,0,0,.7)" } }}
      sx={{
        width:"100%",
        bgcolor:GLASS,
        borderRadius:4,
        backdropFilter:"blur(6px)",
        "&:before":{ display:"none" },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMore sx={{ color:"#B39DDB" }}/>}>
        <Typography sx={{ fontWeight:700, color:"#fff" }}>
          {idx}. {data.unit}
        </Typography>
      </AccordionSummary>

      {/* NEW – pretty topic cards */}
      <AccordionDetails>
        <Stack
          direction="row"
          spacing={2}
          flexWrap="wrap"
          useFlexGap
        >
          {data.topics.map((t,i)=>(
            <TopicCard key={t} label={t} idx={i}/>
          ))}
        </Stack>
      </AccordionDetails>
    </MotionAccordion>
  );
}