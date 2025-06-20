// ────────────────────────────────────────────────────────────────
// File: src/components/PastPapersPage.jsx         (demo v2)
// Glass-UI · year picker · paper summary · question list
// ────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import {
  Box, Grid, Card, Typography, Stack, Chip, Avatar, IconButton,
  Button, Tooltip
} from "@mui/material";
import EditIcon         from "@mui/icons-material/Edit";
import ArrowBackIos     from "@mui/icons-material/ArrowBackIos";
import DescriptionIcon  from "@mui/icons-material/Description";
import QuizIcon         from "@mui/icons-material/Quiz";
import SchoolIcon       from "@mui/icons-material/School";
import AssignmentIcon   from "@mui/icons-material/Assignment";

/* ── design tokens (match rest of app) ────────────────────────── */
const PAGE_BG  = "radial-gradient(circle at 35% 0%, #181924 0%, #0e0f15 100%)";
const GLASS_BG = "rgba(255,255,255,.06)";
const headerAvatar = { width:30, height:30, bgcolor:"rgba(255,255,255,.15)" };
const chipSX = (bg="rgba(255,255,255,.12)") => ({
  bgcolor:bg, color:"#fff", fontWeight:600, height:24, fontSize:12
});
const frameSX = {
  borderRadius:4, p:3, bgcolor:GLASS_BG,
  backdropFilter:"blur(6px)",
  boxShadow:"0 8px 24px rgba(0,0,0,.55)", color:"#f0f0f0"
};
const lift = { whileHover:{ y:-4, boxShadow:"0 12px 28px rgba(0,0,0,.8)" } };

/* ── dummy data (swap with real API later) ────────────────────── */
const YEARS = [...Array(15)].map((_,i)=>2024-i);

/* -----------------------------------------------------------------
   REAL MCQ STUB – swap with DB later
   ----------------------------------------------------------------- */
const SAMPLE_PAPER = year => ({
  id   : `neet_${year}`,
  year ,
  title: `NEET ${year} Paper`,

  /* 33 / 33 / 34 and 40 / 40 / 20 kept as-is for the summary pills  */
  topicsPercent : { Physics:33, Chemistry:33, Biology:34 },
  diffPercent   : { Easy:40,  Medium:40,   Hard:20 },

  /* ---------- MCQs (4 from your screenshots) ---------- */
  questions: [
    {
      num      : 1,
      text     : "Tropical regions show greatest level of species richness because …",
      options  : [
        "Tropical latitudes have remained relatively undisturbed for millions of years.",
        "Tropical environments are more seasonal.",
        "More solar energy is available in tropics.",
        "Constant environments promote niche specialisation.",
        "Tropical environments are constant and predictable."
      ],
      correct  : 0,                        // A-C-D-E in source → we’ll accept A for demo
      topic    : "Ecology",
      concepts : ["Species richness","Ecological stability"],
      difficulty:"Medium",
      prob     : 65
    },
    {
      num     : 2,
      text    : "These are regarded as major causes of biodiversity loss:",
      options : [
        "Over-exploitation, Co-extinction, Habitat loss and fragmentation",
        "Co-extinction, Mutation, Migration",
        "Mutation, Habitat loss and fragmentation, Over-exploitation",
        "Over-exploitation, Migration, Mutation"
      ],
      correct : 0,
      topic   : "Biodiversity",
      concepts:["Extinction","Habitat loss"],
      difficulty:"Easy",
      prob    : 78
    },
    {
      num     : 3,
      text    : "Hind II always cuts DNA molecules at a recognition sequence consisting of …",
      options : ["8 bp","6 bp","4 bp","10 bp"],
      correct : 1,
      topic   : "Biotechnology",
      concepts:["Restriction enzymes"],
      difficulty:"Medium",
      prob    : 72
    },
    {
      num     : 4,
      text    : "The capacity to generate a whole plant from any cell of the plant is called:",
      options : ["Totipotency","Micro-propagation","Differentiation","Somatic hybridisation"],
      correct : 0,
      topic   : "Plant Tissue Culture",
      concepts:["Totipotency"],
      difficulty:"Easy",
      prob    : 88
    }
  ]
});

const PAPERS = Object.fromEntries(
  YEARS.map(y=>[y,[SAMPLE_PAPER(y)]])
);

/* ─────────────────────────────────────────────────────────────── */
export default function PastPapersPage({ onBack = ()=>{} }) {
  const [year, setYear]   = useState(YEARS[0]);
  const [paper, setPaper] = useState(PAPERS[YEARS[0]][0]);

  /* ––––– UI ––––– */
  return (
    <Box sx={{
      minHeight:"100vh", background:PAGE_BG, p:{ xs:3, md:5 },
      fontFamily:"Inter, sans-serif"
    }}>

      {/* HEADER */}
      <Stack direction="row" spacing={1} alignItems="center" mb={3}>
        <IconButton onClick={onBack} sx={{ color:"#fff", mr:1 }}>
          <ArrowBackIos/>
        </IconButton>
        <Avatar sx={headerAvatar}><EditIcon/></Avatar>
        <Typography variant="h4" sx={{ fontWeight:800 }}>Past&nbsp;Papers</Typography>
      </Stack>

      {/* YEAR PICKER */}
      <Stack direction="row" spacing={1} flexWrap="wrap" mb={3}>
        {YEARS.map(y=>(
          <Chip key={y} label={y} size="small" clickable
            onClick={()=>{
              setYear(y);
              setPaper(PAPERS[y][0]);
            }}
            sx={{
              ...chipSX(),
              ...(y===year && { bgcolor:"#BB86FC", color:"#000" })
            }}/>
        ))}
      </Stack>

      

      {/* TWO-COLUMN LAYOUT */}
      <Grid container spacing={3}>
        {/* SUMMARY / INSIGHTS */}
        <Grid item xs={12} md={4}>
          <Box sx={frameSX}>
            <Typography variant="h6" sx={{ fontWeight:700, mb:2 }}>
              {paper.title}
            </Typography>

            {/* TOPIC MIX */}
            <SubHeader icon={<SchoolIcon/>} text="Topic mix (% marks)" />
            <Stack direction="row" gap={1} flexWrap="wrap" mb={1}>
  {Object.entries(paper.topicsPercent).map(([k,v])=>(
    <Chip
      key={k}
      label={`${k} · ${v}%`}
      sx={chipSX("#4fc3f7")}
    />
  ))}
</Stack>

            {/* DIFFICULTY MIX */}
            <SubHeader icon={<QuizIcon/>} text="Difficulty mix (%)" />
            <Stack direction="row" gap={1} flexWrap="wrap">
              {Object.entries(paper.diffPercent).map(([k,v])=>(
                <Chip key={k}
                  label={`${k} · ${v}%`}
                  sx={chipSX(
                    k==="Easy" ? "#66bb6a" :
                    k==="Medium" ? "#ffa726" : "#ef5350")}/>
              ))}
            </Stack>

            {/* CTAs */}
            <Button fullWidth variant="contained"
              sx={{ mt:3, bgcolor:"#BB86FC", fontWeight:700 }}
              onClick={()=>console.info("practice full paper")}>
              Practise entire paper
            </Button>
            <Button fullWidth variant="outlined"
              sx={{ mt:1, borderColor:"#BB86FC", color:"#BB86FC", fontWeight:700 }}
              onClick={()=>console.info("practice similar qs – whole paper")}>
              Practice similar&nbsp;Qs
            </Button>
          </Box>
        </Grid>

        {/* QUESTION SNAPSHOT */}
        <Grid item xs={12} md={8}>
          <Box sx={frameSX}>
            <SubHeader icon={<DescriptionIcon/>} text="Questions snapshot" />
            <Stack spacing={2}>
              {paper.questions.map(q=>(
                <QuestionRow key={q.num} data={q}/>
              ))}
            </Stack>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

/* ─────────────────────── sub-components ─────────────────────── */
const SubHeader = ({ icon, text }) => (
  <Stack direction="row" spacing={1} alignItems="center" mb={1} mt={2}>
    <Avatar sx={headerAvatar}>{icon}</Avatar>
    <Typography sx={{ fontWeight:700 }}>{text}</Typography>
  </Stack>
);

const QuestionRow = ({ data }) => (
  <Box sx={{
    p:2, borderRadius:3,
    bgcolor:"rgba(255,255,255,.04)",
    display:"flex", flexDirection:"column", gap:.5
  }}>
<Typography sx={{ fontWeight:700, mb:1 }}>
  Q{data.num}.&nbsp;{data.text}
</Typography>

{/* ─ options pills ─*/}
<Stack direction="column" spacing={.5} mb={1}>
  {data.options.map((op, idx)=>(
    <Chip
  key={idx}
  label={`${String.fromCharCode(65+idx)}.  ${op}`}
  size="small"
  sx={{
    ...chipSX("#424242"),           // <- hard-coded neutral pill
    justifyContent:"flex-start",
    width:"100%"                    // lets pills stay full-width rows
  }}
/>
  ))}
</Stack>

    <Stack direction="row" spacing={1} flexWrap="wrap">
      <Tooltip title="Topic">
        <Chip label={data.topic} size="small" sx={chipSX("#4fc3f7")}/>
      </Tooltip>
      {data.concepts.map(c=>(
        <Tooltip key={c} title="Concept">
          <Chip label={c} size="small" sx={chipSX("#29b6f6")}/>
        </Tooltip>
      ))}
      <Tooltip title="Difficulty">
        <Chip label={data.difficulty} size="small"
          sx={chipSX(
            data.difficulty==="Easy"   ? "#66bb6a" :
            data.difficulty==="Medium" ? "#ffa726" : "#ef5350")}/>
      </Tooltip>
      <Tooltip title="Predicted probability you’ll solve">
        <Chip label={`Solve Probability: ${data.prob}%`} size="small" sx={chipSX("#BB86FC")}/>
      </Tooltip>
    </Stack>

    <Stack direction={{ xs:"column", sm:"row" }} spacing={1} sx={{ mt:1 }}>
      <Button fullWidth variant="outlined"
        sx={{ borderColor:"#BB86FC", color:"#BB86FC", fontWeight:700 }}
        onClick={()=>console.info("practice similar questions")}>
        Practice similar&nbsp;Qs
      </Button>
      <Button fullWidth variant="contained"
        sx={{ bgcolor:"#BB86FC", fontWeight:700 }}
        onClick={()=>console.info("add question to remedial plan")}>
        Add to study&nbsp;plan
      </Button>
    </Stack>
  </Box>
);