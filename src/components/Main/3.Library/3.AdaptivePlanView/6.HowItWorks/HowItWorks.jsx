// ─────────────────────────────────────────────────────────────
// File:  src/components/HowItWorks.jsx          (v3 – staged chips)
// ----------------------------------------------------------------
import React from "react";
import {
  Box, Grid, Paper, Typography, Chip, useMediaQuery
} from "@mui/material";
import { motion } from "framer-motion";

/* icons */
import InsightsIcon        from "@mui/icons-material/Insights";
import AutoStoriesIcon     from "@mui/icons-material/AutoStories";
import LoopIcon            from "@mui/icons-material/Loop";
import MilitaryTechIcon    from "@mui/icons-material/MilitaryTech";
import BoltIcon            from "@mui/icons-material/Bolt";

/* colours */
const BG = "#0d0d0d";
const PANEL_BG = "#1D1D1D";
const TINT = ["#03A9F4", "#4CAF50", "#FFD54F", "#FF7043", "#AB47BC"];

/* animation */
const fadeUp = {
  hidden:{ opacity:0, y:50 },
  show:(i)=>({ opacity:1, y:0, transition:{ delay:i*0.15, duration:.55, ease:"easeOut" }})
};

/* ------------- reusable card ---------------- */
function StageCard({ idx, Icon, title, subtitle, bullets, chip }) {
  return (
    <motion.div variants={fadeUp} custom={idx} initial="hidden" whileInView="show" viewport={{ once:true }}>
      <Paper
        elevation={4}
        sx={{
          bgcolor:PANEL_BG, color:"#fff", border:`1px solid ${TINT[idx]}55`,
          borderRadius:3, p:3, height:"100%", display:"flex", flexDirection:"column", gap:1.5
        }}
      >
        {/* chip + icon/title */}
        <Box sx={{ display:"flex", alignItems:"center", gap:1, flexWrap:"wrap" }}>
          <Chip
            label={chip}
            size="small"
            sx={{
              bgcolor:TINT[idx], color:"#000", fontWeight:600,
              "& .MuiChip-label":{ px:1.2, lineHeight:1.1 }
            }}
          />
          <Icon sx={{ fontSize:32, color:TINT[idx] }} />
          <Typography variant="h6" sx={{ fontWeight:700 }}>{title}</Typography>
        </Box>

        <Typography variant="body2" sx={{ color:"#bbb", mb:1 }}>{subtitle}</Typography>

        {/* bullets */}
        <Box sx={{ mt:"auto", display:"flex", flexDirection:"column", gap:.75 }}>
          {bullets.map((txt,i)=>(
            <Typography key={i} variant="caption" sx={{ display:"flex", alignItems:"baseline", lineHeight:1.45 }}>
              <span style={{ color:TINT[idx], marginRight:6 }}>•</span>{txt}
            </Typography>
          ))}
        </Box>
      </Paper>
    </motion.div>
  );
}

/* ------------- main component ---------------- */
export default function HowItWorks() {
  const small = useMediaQuery("(max-width:600px)");

  const CARDS = [
    /* row-1 */
    {
      chip:"Stage 0", Icon:InsightsIcon, tint:0,
      title:"Kick-off diagnostics",
      subtitle:"Snapshot of your current grasp",
      bullets:[
        "10-min curated quiz",
        "Identifies strong vs weak zones",
        "Plan adapts instantly"
      ]
    },
    /* row-2 */
    {
      chip:"Stage 1", Icon:AutoStoriesIcon, tint:1,
      title:"Deep dive",
      subtitle:"Master each sub-chapter in 5 passes",
      bullets:[
        "Read ▸ Remember ▸ Understand",
        "Apply ▸ Analyse problems",
        "Instant feedback"
      ]
    },
    {
      chip:"Stage 2", Icon:LoopIcon, tint:2,
      title:"Smart spacing",
      subtitle:"Forget-proof scheduling",
      bullets:[
        "Timeline shifts when you miss tasks",
        "Weak concepts resurface sooner",
        "Strong ones appear later"
      ]
    },
    {
      chip:"Stage 3", Icon:MilitaryTechIcon, tint:3,
      title:"Exam rehearsal",
      subtitle:"Full-length mocks & analytics",
      bullets:[
        "Timed, realistic papers",
        "Live ranking vs cohort",
        "Personalised last-mile plan"
      ]
    },
    /* row-3 */
    {
      chip:"Toolbox", Icon:BoltIcon, tint:4,
      title:"Micro-tools",
      subtitle:"AI helpers on demand",
      bullets:[
        "Instant doubt-clearing chat",
        "One-click formula sheets",
        "Auto flash-card generator"
      ]
    }
  ];

  return (
    <Box sx={{ width:"100%", bgcolor:BG, color:"#fff", py:{xs:6,md:10}, px:{xs:2,sm:4} }}>
      {/* header */}
      <Box sx={{ textAlign:"center", maxWidth:900, mx:"auto", mb:6 }}>
        <Typography variant={small?"h4":"h3"} sx={{ fontWeight:800, lineHeight:1.15, mb:1 }}>
          How&nbsp;it&nbsp;works
        </Typography>
        <Typography variant="body1" sx={{ color:"#aaa" }}>
          Four progressive stages guide you from diagnostics to exam-day mastery,<br/>
          with an AI toolbox always at your side.
        </Typography>
      </Box>

      {/* grid with 1–3–1 layout */}
      <Grid container spacing={4} sx={{ maxWidth:1200, mx:"auto" }}>
        {/* row 1 */}
        <Grid item xs={12}>
          <StageCard idx={0} {...CARDS[0]} />
        </Grid>

        {/* row 2 (3 cards) */}
        {CARDS.slice(1,4).map((c,i)=>(
          <Grid item xs={12} sm={4} key={c.title}>
            <StageCard idx={i+1} {...c} />
          </Grid>
        ))}

        {/* row 3 */}
        <Grid item xs={12}>
          <StageCard idx={4} {...CARDS[4]} />
        </Grid>
      </Grid>
    </Box>
  );
}