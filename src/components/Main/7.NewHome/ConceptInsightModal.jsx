// ────────────────────────────────────────────────────────────────
// File: src/components/ConceptInsightModal.jsx   (v3 – full-width)
// ────────────────────────────────────────────────────────────────
import React from "react";
import {
  Dialog, DialogTitle, DialogContent, IconButton, Typography,
  Box, Stack, Chip, Avatar, Divider, Button
} from "@mui/material";
import CloseIcon           from "@mui/icons-material/Close";
import QueryStatsIcon      from "@mui/icons-material/QueryStats";
import TrendingUpIcon      from "@mui/icons-material/TrendingUp";
import LeaderboardIcon     from "@mui/icons-material/Leaderboard";
import QuizIcon            from "@mui/icons-material/Quiz";
import HistoryEduIcon      from "@mui/icons-material/HistoryEdu";
import PsychologyAltIcon   from "@mui/icons-material/PsychologyAlt";

/* ─── stub data – swap with real queries ─────────────────────── */
const SUMMARY = {
  yearsAsked : 12,
  avgMarks   : 3.1,
  diff       : "Medium",         // Low | Medium | High
};

const YEAR_ROWS = [
  { y:24, marks:4,  qs:2, diff:"Advanced"     },
  { y:23, marks:3,  qs:1, diff:"Intermediate" },
  { y:22, marks:5,  qs:2, diff:"Advanced"     },
  { y:21, marks:2,  qs:1, diff:"Basic"        },
];

const PROFICIENCY = {
  confidence : "High",           // Low | Medium | High
  quizzesDone: 8,
  mastery    : 78,               // %
};

/* ─── helpers ────────────────────────────────────────────────── */
const pill = (lab,bg="#444")=>(
  <Chip
    label={lab}
    size="small"
    sx={{
      bgcolor:bg,
      color:"#fff",
      fontWeight:600,
      height:24,
      px:1.5
    }}
  />
);

const AvatarLite = ({ icon }) => (
  <Avatar
    sx={{
      width:32, height:32,
      bgcolor:"rgba(255,255,255,.12)",
      color:"#fff",
      fontSize:18
    }}
  >
    {icon}
  </Avatar>
);

/* ─── main component ────────────────────────────────────────── */
export default function ConceptInsightModal({ open, data={}, onClose,
                                              onStartQuiz = ()=>{} }) {
  if (!open) return null;

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx:{ bgcolor:"#0f0f15", color:"#fff", borderRadius:3 }
      }}
    >
      {/* HEADER */}
       <DialogTitle sx={{ pr:7 }}>
   {data.name ?? data.label}
        <IconButton onClick={onClose}
          sx={{ position:"absolute", right:12, top:12, color:"#fff" }}>
          <CloseIcon/>
        </IconButton>
        <Typography variant="subtitle2" sx={{ mt:.5, opacity:.75 }}>
          {data.subject} • {data.unit} • {data.topic}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt:2, pb:4 }}>

        {/* 1️⃣ SUMMARY  */}
        <Section title="Summary" icon={<QueryStatsIcon/>}>
          <StatRow icon={<TrendingUpIcon/>}
                   label="Appears in"
                   value={`${SUMMARY.yearsAsked} / 15 papers`} />
          <StatRow icon={<LeaderboardIcon/>}
                   label="Average marks / year"
                   value={SUMMARY.avgMarks.toFixed(1)} />
          <StatRow icon={<PsychologyAltIcon/>}
                   label="General difficulty"
                   value={pill(SUMMARY.diff,
                     SUMMARY.diff==="Low"    ? "#66bb6a" :
                     SUMMARY.diff==="Medium" ? "#ffa726" : "#ef5350")} />
          <Button fullWidth variant="contained"
                  sx={{ mt:2, bgcolor:"#BB86FC", fontWeight:700 }}
                  onClick={()=>console.info("open generic practice flow")}>
            Practice&nbsp;Topic-wise&nbsp;Questions
          </Button>
        </Section>

        {/* 2️⃣ YEAR-WISE BREAKDOWN  */}
        <Section title="Past-paper snapshot" icon={<HistoryEduIcon/>}>
          <Stack spacing={1}>
            {YEAR_ROWS.map(r=>(
              <Stack key={r.y} direction="row" spacing={1} alignItems="center">
                <Typography sx={{ width:50 }}>{20}{r.y}</Typography>
                {pill(`${r.marks} marks`,"#4fc3f7")}
                {pill(`${r.qs} Qs`,"#29b6f6")}
                {pill(r.diff,
                  r.diff==="Basic"        ? "#66bb6a" :
                  r.diff==="Intermediate" ? "#ffa726" : "#ef5350")}
              </Stack>
            ))}
          </Stack>
          <Button fullWidth variant="outlined"
                  sx={{ mt:2, borderColor:"#BB86FC", color:"#BB86FC",
                        fontWeight:700 }}
                  onClick={()=>console.info("open prev-year practice flow")}>
            Practice&nbsp;Similar&nbsp;Prev-Year&nbsp;Qs
          </Button>
        </Section>

        {/* 3️⃣ YOUR PROFICIENCY  */}
        <Section title="Your proficiency" icon={<QuizIcon/>}>
          <StatRow icon={<QuizIcon/>}
                   label="Confidence"
                   value={pill(PROFICIENCY.confidence,
                     PROFICIENCY.confidence==="Low"    ? "#ef5350" :
                     PROFICIENCY.confidence==="Medium" ? "#ffa726" : "#66bb6a")} />

          <StatRow icon={<LeaderboardIcon/>}
                   label="Quizzes taken"
                   value={`${PROFICIENCY.quizzesDone}`} />

          <StatRow icon={<TrendingUpIcon/>}
                   label="Mastery level"
                   value={
                     <Box sx={{ display:"flex", alignItems:"center", gap:1 }}>
                       <Box sx={{
                         width:120, height:8, borderRadius:4,
                         bgcolor:"rgba(255,255,255,.15)",
                         overflow:"hidden"
                       }}>
                         <Box sx={{
                           width:`${PROFICIENCY.mastery}%`,
                           height:"100%",
                           bgcolor:"#BB86FC"
                         }}/>
                       </Box>
                       <Typography>{PROFICIENCY.mastery}%</Typography>
                     </Box>
                   }/>

          <Stack direction={{ xs:"column", sm:"row" }} spacing={1} sx={{ mt:2 }}>
            <Button fullWidth variant="contained"
                    sx={{ bgcolor:"#BB86FC", fontWeight:700 }}
                    onClick={onStartQuiz}>
              Quick&nbsp;5-Q&nbsp;Quiz
            </Button>
            <Button fullWidth variant="outlined"
                    sx={{ borderColor:"#BB86FC", color:"#BB86FC",
                          fontWeight:700 }}
                    onClick={()=>console.info("open remedial flow")}>
              Cover&nbsp;Remaining&nbsp;Gaps
            </Button>
          </Stack>
        </Section>

      </DialogContent>
    </Dialog>
  );
}

/* ─── tiny helpers ──────────────────────────────────────────── */
const Section = ({ title, icon, children }) => (
  <Box sx={{ mt:4 }}>
    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
      <AvatarLite icon={icon}/>
      <Typography sx={{ fontWeight:700 }}>{title}</Typography>
    </Stack>
    <Divider sx={{ mb:2, bgcolor:"#333" }}/>
    {children}
  </Box>
);

const StatRow = ({ icon, label, value }) => (
  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb:1 }}>
    <AvatarLite icon={icon}/>
    <Typography sx={{ flex:1 }}>{label}</Typography>
    {value}
  </Stack>
);