// ────────────────────────────────────────────────────────────────
// File: src/components/ConceptGraphHome.jsx   (v5 – sub-page comps)
// ────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import {
  Box, Grid, Card, Typography, Avatar, Stack, Chip, LinearProgress,
  Dialog, DialogTitle, DialogContent, IconButton, Icon
} from "@mui/material";
import LibraryBooksIcon  from "@mui/icons-material/LibraryBooks";
import EditIcon          from "@mui/icons-material/Edit";
import EventNoteIcon     from "@mui/icons-material/EventNote";
import ArrowForwardIos   from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIos      from "@mui/icons-material/ArrowBackIos";
import { motion }        from "framer-motion";

import CoreTextbooksPage     from "./CoreTextbooksPage.jsx";
import PastPapersPage        from "./PastPapersPage";
import OfficialSyllabusPage  from "./OfficialSyllabusPage";

/* ═══════════ 1. Dummy data (unchanged) ═══════════ */
const TOTAL_CONCEPTS = 3421;
const SUBJECTS = [
  { id:"phy",  name:"Physics",   count:1240, grad:["#818cf8","#d8b4fe"] },
  { id:"chem", name:"Chemistry", count:1180, grad:["#6366f1","#a5b4fc"] },
  { id:"bio",  name:"Biology",   count:1001, grad:["#3b82f6","#6ee7b7"] },
];

const CORE_BOOKS = {
  phy:["NCERT Class 11 Pt 1","NCERT Class 11 Pt 2",
       "NCERT Class 12 Pt 1","NCERT Class 12 Pt 2"],
  chem:["NCERT Class 11 Pt 1","NCERT Class 11 Pt 2",
        "NCERT Class 12 Pt 1","NCERT Class 12 Pt 2"],
  bio:["NCERT Class 11","NCERT Class 12"],
};

const PAST_PAPER_YEARS = [...Array(15)].map((_,i)=>2024-i);

const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const DEPTH=["Basic","Intermediate","Advanced"];
const CONCEPTS=[...Array(30)].map((_,i)=>({
  subject: SUBJECTS[i%3].name,
  chapter:["Optics","Mechanics","Thermo","Organic","Botany"][i%5],
  subChap:["Refraction","Reflection","Dynamics","Isomerism","Plant Cell"][i%5],
  name:`Concept ${i+1}`,
  weight:rnd(2,10), depth:DEPTH[i%3], papers:rnd(0,12)
}));

/* ═══════════ 2. Styling tokens ═══════════ */
const PAGE_BG  ="radial-gradient(circle at 35% 0%, #181924 0%, #0e0f15 100%)";
const GLASS_BG ="rgba(255,255,255,.06)";
const MotionCard = motion(Card);
const lift={ whileHover:{ y:-4, boxShadow:"0 14px 30px rgba(0,0,0,.8)" } };
const grad=([a,b])=>`linear-gradient(135deg,${a} 0%,${b} 100%)`;
const cardBase = {
  borderRadius:4, p:3, bgcolor:GLASS_BG,
  backdropFilter:"blur(6px)", boxShadow:"0 8px 24px rgba(0,0,0,.55)", color:"#f0f0f0"
};
const chipStyle=(bg="rgba(255,255,255,.12)")=>({
  bgcolor:bg, color:"#fff", fontWeight:600, height:20
});
const headerAvatar={ width:30, height:30, bgcolor:"rgba(255,255,255,.15)" };

/* ═══════════ 3. Main component ═══════════ */
export default function ConceptGraphHome(){
  const [openConcept,setOpenConcept]=useState(null);
  const [section,setSection]       =useState(null);   // null | "textbooks" | "papers" | "syllabus"

  /* --------- render sub-pages (delegated to child components) --------- */
  const renderSection = () => {
    switch(section){
      case "textbooks":
        return <CoreTextbooksPage onBack={()=>setSection(null)}/>;
      case "papers":
        return <PastPapersPage onBack={()=>setSection(null)}/>;
      case "syllabus":
        return <OfficialSyllabusPage onBack={()=>setSection(null)}/>;
      default:
        return null;
    }
  };

  /* --------- main dashboard --------- */
  return(
    <Box sx={{ minHeight:"100vh", background:PAGE_BG, p:{xs:3,md:5}, fontFamily:"Inter, sans-serif" }}>

      {/* show sub-page if selected */}
      {section ? renderSection() : (
        <>
          {/* HEADER counts */}
          <MotionCard {...lift} sx={{ ...cardBase, textAlign:"center", mb:4 }}>
            <Typography variant="h2" sx={{ fontWeight:800 }}>
              {TOTAL_CONCEPTS.toLocaleString()}
            </Typography>
            <Typography sx={{ opacity:.8, mb:2 }}>Total Concepts • <b>NEET 2026</b></Typography>

            <Grid container spacing={2} justifyContent="center">
              {SUBJECTS.map(s=>(
                <Grid item xs={12} sm={4} key={s.id}>
                  <MotionCard {...lift}
                    sx={{ ...cardBase, background:grad(s.grad), py:2 }}>
                    <Typography variant="h5" sx={{ fontWeight:700 }}>{s.count}</Typography>
                    <Typography variant="caption">{s.name}</Typography>
                  </MotionCard>
                </Grid>
              ))}
            </Grid>
          </MotionCard>

          {/* SOURCE rows */}
          <Grid container spacing={2} sx={{ mb:3 }}>
            <SourceRow
              icon={<LibraryBooksIcon/>}
              label="Core Textbooks"
              onClick={()=>setSection("textbooks")}
            />
            <SourceRow
              icon={<EditIcon/>}
              label="Past Papers"
              onClick={()=>setSection("papers")}
            />
            <SourceRow
              icon={<EventNoteIcon/>}
              label="Official Syllabus"
              onClick={()=>setSection("syllabus")}
            />
          </Grid>

          {/* explanation cards */}
          <ExplanationAccordion/>

          {/* CONCEPT GRID */}
          <MotionCard {...lift} sx={{ ...cardBase, mt:5 }}>
            <Header icon={<LibraryBooksIcon/>} text="Explore Concepts (sample 30)"/>
            <Grid container spacing={4}>
              {CONCEPTS.map(c=>(
                <Grid item xs={12} sm={6} md={4} lg={3} key={c.name}>
                  <MotionCard {...lift}
                    sx={{ ...cardBase, cursor:"pointer", minHeight:220 }}
                    onClick={()=>setOpenConcept(c)}>
                    {/* breadcrumb */}
                    <Typography sx={{ fontWeight:700 }}>{c.subject}</Typography>
                    <Typography variant="body2">{c.chapter}</Typography>
                    <Typography variant="body2" sx={{ mb:1 }}>{c.subChap}</Typography>
                    <Typography variant="subtitle2" sx={{ mb:1, mt:-.5 }}>
                      {c.name}
                    </Typography>

                    {/* weight bar */}
                    <LinearProgress variant="determinate" value={c.weight*10}
                      sx={{ height:6, borderRadius:3, mb:.5,
                        "& .MuiLinearProgress-bar":{ background:"#B39DDB"} }}/>
                    <Typography variant="caption">{c.weight}/10 weight</Typography>

                    {/* meta chips */}
                    <Stack direction="row" spacing={.5} sx={{ mt:1, alignItems:"center" }}>
                      <Chip label={c.depth} size="small" sx={chipStyle("#4fc3f7")}/>
                      <Chip label={`${c.papers} hits`} size="small" sx={chipStyle("#ffa726")}/>
                    </Stack>
                  </MotionCard>
                </Grid>
              ))}
            </Grid>
          </MotionCard>
        </>
      )}

      {/* Concept detail dialog */}
      <Dialog open={!!openConcept} onClose={()=>setOpenConcept(null)} maxWidth="sm" fullWidth>
        {openConcept && (
          <>
            <DialogTitle sx={{ bgcolor:"#1a1a1a", color:"#fff" }}>
              {openConcept.name}
              <IconButton onClick={()=>setOpenConcept(null)}
                sx={{ position:"absolute", right:8, top:8, color:"#fff" }}>
                ✕
              </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ bgcolor:"#121212", color:"#eee" }}>
              {["Subject","Chapter","Sub-chapter","Weight","Depth","Past paper hits"]
                .map((k,i)=>(
                  <Typography key={i} variant="body2" sx={{ mb:.5 }}>
                    <b>{k}:</b>{" "}
                    {k==="Subject"      ? openConcept.subject :
                     k==="Chapter"      ? openConcept.chapter :
                     k==="Sub-chapter"  ? openConcept.subChap :
                     k==="Weight"       ? `${openConcept.weight}/10` :
                     k==="Depth"        ? openConcept.depth :
                     openConcept.papers}
                  </Typography>
                ))}
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}

/* ═══════════ helper components (shared styles) ═══════════ */
const Header = ({icon,text})=>(
  <Stack direction="row" spacing={1} alignItems="center" mb={2}>
    <Avatar sx={headerAvatar}>{icon}</Avatar>
    <Typography variant="h5" sx={{ fontWeight:800 }}>{text}</Typography>
  </Stack>
);

const SourceRow = ({ icon, label, onClick }) => (
  <Grid item xs={12} md={4}>
    <MotionCard {...lift}
      onClick={onClick}
      sx={{ ...cardBase, display:"flex", alignItems:"center",
            justifyContent:"space-between", cursor:"pointer" }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Avatar sx={headerAvatar}>{icon}</Avatar>
        <Typography sx={{ fontWeight:600 }}>{label}</Typography>
      </Stack>
      <ArrowForwardIos sx={{ fontSize:14, opacity:.8 }}/>
    </MotionCard>
  </Grid>
);

/* --- Explanation accordion (unchanged) ------------------ */
const EXPLAIN_CARDS=[
  { emoji:"📚", title:"Textbooks → Graph", grad:["#f87171","#fca5a5"],
    blurb:"Every NCERT page is parsed into a three-level concept graph."},
  { emoji:"📝", title:"Past-Paper Heat-map", grad:["#6366f1","#a5b4fc"],
    blurb:"15 years of NEET papers light up the concepts they really test."},
  { emoji:"📜", title:"Syllabus Boost",       grad:["#3b82f6","#6ee7b7"],
    blurb:"Anything the NMC names gets an automatic priority bump."},
  { emoji:"🎯", title:"Your Activity Loop",   grad:["#ec4899","#f9a8d4"],
    blurb:"Quizzes & mocks keep the map focused on *your* weak spots."},
];
const ExplanationAccordion = () => (
  <MotionCard {...lift} component="div" sx={{ ...cardBase, mt:3 }}>
    <Header icon={<LibraryBooksIcon/>} text="How this map powers your study plan"/>
    <Box sx={{ display:"flex", overflowX:"auto", pb:1,
               "&::-webkit-scrollbar":{ display:"none" } }}>
      {EXPLAIN_CARDS.map(c=>(
        <MotionCard key={c.title} {...lift}
          sx={{ ...cardBase, flex:"0 0 240px", mr:2, background:grad(c.grad) }}>
          <Box sx={{ fontSize:46, textAlign:"center", mb:1 }}>{c.emoji}</Box>
          <Typography variant="subtitle1" sx={{ fontWeight:700, mb:.5 }}>
            {c.title}
          </Typography>
          <Typography variant="body2" sx={{ opacity:.9 }}>{c.blurb}</Typography>
        </MotionCard>
      ))}
    </Box>
  </MotionCard>
);



/* little reusable back header */
const BackHeader = ({ icon, title, onBack }) => (
  <Stack direction="row" spacing={1} alignItems="center" mb={2}>
    <IconButton onClick={onBack} sx={{ color:"#fff", mr:1 }}><ArrowBackIos/></IconButton>
    <Avatar sx={headerAvatar}>{icon}</Avatar>
    <Typography variant="h5" sx={{ fontWeight:800 }}>{title}</Typography>
  </Stack>
);