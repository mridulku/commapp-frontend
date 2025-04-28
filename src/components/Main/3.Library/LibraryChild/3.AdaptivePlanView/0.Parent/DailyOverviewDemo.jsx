/* ────────────────────────────────────────────────────────────────
   File:  src/components/3.AdaptivePlanView/0.Parent/DailyOverviewDemo.jsx
   v5 –   numbered sub-chapters, fixed white text, unified icons,
          stage-specific colour + icon, concepts & time lines
          (2025-04-28)
───────────────────────────────────────────────────────────────── */
import React, { useMemo } from "react";
import {
  Box, Typography, LinearProgress,
  Accordion, AccordionSummary, AccordionDetails, Tooltip
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

/* ─── constant iconography (same glyph everywhere) ────────────── */
const ICON_BOOK    = "📚";   // always for Subject / Book
const ICON_UNIT    = "📂";   // unit / domain level
const ICON_CHAPTER = "📄";   // chapter number line

const STAGE_META = {
  Read    : { color:"#BB86FC", icon:"📖" },
  Remember: { color:"#80DEEA", icon:"🧠" },
  Apply   : { color:"#AED581", icon:"🔧" },
  Analyse : { color:"#F48FB1", icon:"🔬" },
};

/* ─── tiny deterministic helpers so dummy data is stable ─────── */
const rand = seed => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};
const pick = (arr, seed) => arr[Math.floor(rand(seed) * arr.length)];

/* dummy names (place-holders only) */
const UNITS     = ["Mechanics","Electrostatics","Optics",
                   "Thermodynamics","Organic"];
const CHAPTERS  = ["Kinematics","Work & Energy","Circuits",
                   "Cell Biology","Alkanes"];
const SUBCHAPS  = ["Vectors","Graphs","Forces","Field lines",
                   "Reflection","Entropy","Isomers"];

/* build a single dummy “day” object */
function buildDay(seed, label){
  const tasks=[];
  for(let i=0;i<12;i++){
    const s = seed*100 + i;

    /* pick stage first so we can colour the card */
    const stage     = Object.keys(STAGE_META)[i % 4];
    const stageMeta = STAGE_META[stage];

    /* generate consistent numbering */
    const chapIdx = (i % CHAPTERS.length) + 1;         // 1-based
    const subIdx  = ((i*3) % SUBCHAPS.length) + 1;     // 1-based

    const chapterName    = `${chapIdx}. ${CHAPTERS[chapIdx-1]}`;
    const subchapterName = `${chapIdx}.${subIdx} ${SUBCHAPS[subIdx-1]}`;

    const conceptsTotal  = 4 + (i % 3);                // 4-6 concepts
    const conceptsDone   = Math.min(conceptsTotal,
                                    Math.floor(rand(s+5)*conceptsTotal));

    tasks.push({
      id        : `D${seed}-${i}`,
      stage,
      stageMeta,
      subject   : { name:"Physics", icon:ICON_BOOK },  // single book icon
      unit      : { name:pick(UNITS,   s+2), icon:ICON_UNIT },
      chapter   : { name:chapterName,    icon:ICON_CHAPTER },
      subchap   : subchapterName,
      pct       : Math.round(conceptsDone / conceptsTotal * 100),
      mins      : 5 + (i % 5)*5,                       // 5-25 min
      done      : conceptsDone,
      total     : conceptsTotal,
    });
  }
  return { label, tasks };
}

const DAYS_DATA = [
  buildDay(1,"Yesterday"),
  buildDay(2,"Today"),
  buildDay(3,"Tomorrow"),
];

/* ────────────────────────────────────────────────────────────────
   MAIN EXPORT –  simply render three accordions
───────────────────────────────────────────────────────────────── */
export default function DailyOverviewDemo(){
  const days = useMemo(()=>DAYS_DATA,[]);   // compute once only

  return (
    <Box sx={{ color:"#fff" }}>
      {days.map(day=>(
        <Accordion
          key={day.label}
          defaultExpanded={day.label==="Today"}
          sx={{
            bgcolor:"#1a1a1a",
            border:"1px solid #444",
            mb:2,
            "&:before":{ display:"none" }
          }}
        >
          {/* ---------- Accordion Summary ---------- */}
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color:"#fff" }}/>}
            sx={{ color:"#fff" }}
          >
            <Typography sx={{ fontWeight:700, mr:1 }}>{day.label}</Typography>
            <Typography sx={{ opacity:.7, fontSize:13 }}>
              {day.tasks.length} tasks
            </Typography>
          </AccordionSummary>

          {/* ---------- Accordion Body (Card Masonry) ---------- */}
          <AccordionDetails>
            <Box
              sx={{
                display:"grid",
                gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",
                gap:1.5,
              }}
            >
              {day.tasks.map(t=>(
                <Box
                  key={t.id}
                  sx={{
                    display:"flex",
                    flexDirection:"column",
                    height:200,
                    p:1.2,
                    bgcolor:"#000",
                    border:`2px solid ${t.stageMeta.color}`,
                    borderRadius:2,
                    transition:"transform .15s",
                    "&:hover":{ transform:"translateY(-3px)" }
                  }}
                >
                  {/* sub-chapter header */}
                  <Tooltip title={t.subchap}>
                    <Typography
                      sx={{
                        fontWeight:700,
                        color:t.stageMeta.color,
                        fontSize:".88rem",
                        whiteSpace:"nowrap",
                        overflow:"hidden",
                        textOverflow:"ellipsis",
                        mb:.6,
                      }}
                    >
                      {t.subchap}
                    </Typography>
                  </Tooltip>

                  {/* Stage row (icon + label) */}
                  <MetaStage
                    icon={t.stageMeta.icon}
                    label={t.stage}
                    color={t.stageMeta.color}
                  />

                  {/* Subject / Unit / Chapter rows */}
                  <MetaLine icon={t.subject.icon} label={t.subject.name}/>
                  <MetaLine icon={t.unit.icon}    label={t.unit.name}/>
                  <MetaLine icon={t.chapter.icon} label={t.chapter.name}/>

                  {/* Spacer pushes progress section to bottom */}
                  <Box sx={{ flex:1 }}/>

                  {/* Progress & concepts */}
                  <LinearProgress
                    variant="determinate"
                    value={t.pct}
                    sx={{
                      height:6,
                      borderRadius:2,
                      bgcolor:"#333",
                      "& .MuiLinearProgress-bar":{ bgcolor:t.stageMeta.color }
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize:11,
                      mt:.4,
                      display:"flex",
                      justifyContent:"space-between",
                      color:"#fff"
                    }}
                  >
                    <span>{t.pct}% · {t.done}/{t.total}</span>
                    <span>⏱ {t.mins} m</span>
                  </Typography>
                </Box>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}

/* ─── tiny sub-components for cleaner JSX ─────────────────────── */
function MetaLine({ icon, label }){
  return (
    <Box sx={{ display:"flex", alignItems:"center", mb:.3 }}>
      <Box sx={{ width:18, textAlign:"center", mr:.6 }}>{icon}</Box>
      <Typography sx={{ fontSize:12, color:"#fff" }}>{label}</Typography>
    </Box>
  );
}

function MetaStage({ icon,label,color }){
  return (
    <Box sx={{ display:"flex", alignItems:"center", mb:.5 }}>
      <Box sx={{ width:18, textAlign:"center", mr:.6 }}>{icon}</Box>
      <Typography sx={{ fontSize:12, fontWeight:700, color }}>{label}</Typography>
    </Box>
  );
}