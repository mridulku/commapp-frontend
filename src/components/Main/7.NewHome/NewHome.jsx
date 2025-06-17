// ────────────────────────────────────────────────────────────────
// File: src/components/ConceptGraphHome.jsx
// Dark glass UI • hierarchical explorer • single-file demo
// ────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import {
  Box, Grid, Card, Typography, Avatar, Stack, Chip, Accordion,
  AccordionSummary, AccordionDetails, LinearProgress, Table,
  TableHead, TableRow, TableCell, TableBody, Dialog, DialogTitle,
  DialogContent, IconButton, Tooltip, Link, Button
} from "@mui/material";
import ExpandMoreIcon  from "@mui/icons-material/ExpandMore";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import EditIcon        from "@mui/icons-material/Edit";
import EventNoteIcon   from "@mui/icons-material/EventNote";
import SchoolIcon      from "@mui/icons-material/School";
import CloseIcon       from "@mui/icons-material/Close";
import { motion }      from "framer-motion";

/* ───────────────────────────────────────────────────────────────
   1.  Dummy data (swap with real queries later)
   ───────────────────────────────────────────────────────────── */
const TOTAL_CONCEPTS = 3421;
const SUBJECTS = [
  { id:"phy",  name:"Physics",   count:1240, grad:["#818cf8","#d8b4fe"] },
  { id:"chem", name:"Chemistry", count:1180, grad:["#6366f1","#a5b4fc"] },
  { id:"bio",  name:"Biology",   count:1001, grad:["#3b82f6","#6ee7b7"] },
];

const CORE_BOOKS = {
  phy:["H.C. Verma Vol-1","H.C. Verma Vol-2","Cengage Mechanics","DC Pandey Series"],
  chem:["O.P. Tandon Organic","JD Lee Inorganic","P. Bahadur Physical"],
  bio:["Trueman’s Biology Vol-1","Trueman’s Biology Vol-2","NCERT Class 11","NCERT Class 12"],
};

const PAST_PAPER_YEARS = [...Array(15)].map((_,i)=>2024-i);   // 2010–2024

const CONCEPTS = [...Array(30)].map((_,i)=>({
  name:`Concept #${i+1}`,
  subject: SUBJECTS[i%3].name,
  weight: Math.round(Math.random()*8+2),          // 2–10 %
  depth: ["Basic","Intermediate","Advanced"][i%3],
  papers: Math.round(Math.random()*12),
  inGuide: Math.random()>0.3,
}));

/* ───────────────────────────────────────────────────────────────
   2.  Style helpers
   ───────────────────────────────────────────────────────────── */
const PAGE_BG      ="radial-gradient(circle at 35% 0%, #181924 0%, #0e0f15 100%)";
const GLASS_BG     ="rgba(255,255,255,.06)";
const CardSX = {
  borderRadius:4, p:3, bgcolor:GLASS_BG,
  backdropFilter:"blur(6px)", boxShadow:"0 8px 24px rgba(0,0,0,.55)", color:"#f0f0f0",
};
const MotionCard=motion(Card);
const lift={ whileHover:{ y:-4, boxShadow:"0 14px 30px rgba(0,0,0,.8)" }};
const grad=([a,b])=>`linear-gradient(135deg,${a} 0%,${b} 100%)`;

/* ───────────────────────────────────────────────────────────────
   3.  Component
   ───────────────────────────────────────────────────────────── */
export default function ConceptGraphHome() {
  /* detail-dialog state */
  const [openConcept,setOpenConcept]=useState(null);

  return (
    <Box sx={{ minHeight:"100vh", background:PAGE_BG, p:{xs:3,md:5}, fontFamily:"Inter, sans-serif" }}>

      {/* ▸ HEADER  – totals & subjects */}
      <MotionCard {...lift} sx={{ ...CardSX, textAlign:"center", mb:4 }}>
        <Typography variant="h2" sx={{ fontWeight:800, lineHeight:1 }}>
          {TOTAL_CONCEPTS.toLocaleString()}
        </Typography>
        <Typography sx={{ opacity:.8, mb:2 }}>Total Concepts for <b>NEET 2025</b></Typography>

        <Grid container spacing={2} justifyContent="center">
          {SUBJECTS.map(s=>(
            <Grid item xs={12} sm={4} key={s.id}>
              <MotionCard {...lift} sx={{
                ...CardSX, background:grad(s.grad), py:2, textAlign:"center"
              }}>
                <Typography variant="h5" sx={{ fontWeight:700 }}>{s.count}</Typography>
                <Typography variant="caption">{s.name}</Typography>
              </MotionCard>
            </Grid>
          ))}
        </Grid>
      </MotionCard>

      {/* ▸ SOURCES  */}
      <Grid container spacing={3}>
        {/* Core textbooks */}
        <Grid item xs={12} md={4}>
          <SourceAccordion
            title="Core Textbooks"
            icon={<LibraryBooksIcon/>}
            content={SUBJECTS.map(sub=>(
              <SubjectBooks key={sub.id} subj={sub.name} books={CORE_BOOKS[sub.id]}/>
            ))}
          />
        </Grid>

        {/* Past papers */}
        <Grid item xs={12} md={4}>
          <SourceAccordion
            title="Past Papers"
            icon={<EditIcon/>}
            content={
              <Stack spacing={1}>
                {PAST_PAPER_YEARS.map(y=>(
                  <Chip key={y} label={y} size="small"
                    sx={{ bgcolor:"rgba(255,255,255,.12)", color:"#fff", fontWeight:600 }}/>
                ))}
              </Stack>
            }
          />
        </Grid>

        {/* Official syllabus */}
        <Grid item xs={12} md={4}>
          <SourceAccordion
            title="Official Syllabus"
            icon={<EventNoteIcon/>}
            content={
              <Typography>
                PDF issued by NTA •&nbsp;
                <Link href="#" underline="hover" color="primary.light">Download</Link>
              </Typography>
            }
          />
        </Grid>
      </Grid>

      {/* ▸ METHODOLOGY  */}
      <MotionCard {...lift} sx={{ ...CardSX, mt:5 }}>
        <Header icon={<SchoolIcon/>} text="How we rank each concept" />
        <Stack spacing={1} sx={{ pl:1 }}>
          <MethodPoint num="1" text="Parse every core textbook to extract chapter → sub-chapter → term graph."/>
          <MethodPoint num="2" text="Cross-reference terms against 15 years of past NEET papers (weight by marks)."/>
          <MethodPoint num="3" text="Boost concepts explicitly called out in the NMC syllabus PDF."/>
          <MethodPoint num="4" text="Normalise weights per subject, then rescale 0–10 for easy interpretation."/>
        </Stack>
      </MotionCard>

      {/* ▸ CONCEPT EXPLORER  */}
      <MotionCard {...lift} sx={{ ...CardSX, mt:5 }}>
        <Header icon={<LibraryBooksIcon/>} text="Explore Concepts (sample 30)" />
        <Table size="small" sx={{ mt:1 }}>
          <TableHead>
            <TableRow>
              <Th>Concept</Th><Th>Subject</Th><Th>Weight (0-10)</Th>
              <Th>Depth</Th><Th>Papers Hit</Th><Th>In Syllabus?</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {CONCEPTS.map(c=>(
              <TableRow key={c.name} hover
                sx={{ cursor:"pointer" }} onClick={()=>setOpenConcept(c)}>
                <Td>{c.name}</Td>
                <Td>{c.subject}</Td>
                <Td>
                  <LinearProgress variant="determinate" value={c.weight*10}
                    sx={{ width:80, height:6, borderRadius:4,
                      "& .MuiLinearProgress-bar":{ background:"#B39DDB"} }}/>
                </Td>
                <Td>{c.depth}</Td>
                <Td>{c.papers}</Td>
                <Td>
                  <Chip label={c.inGuide?"Yes":"No"}
                    size="small" color={c.inGuide?"success":"default"}/>
                </Td>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </MotionCard>

      {/* ▸ DETAIL DIALOG  */}
      <Dialog open={!!openConcept} onClose={()=>setOpenConcept(null)} maxWidth="sm" fullWidth>
        {openConcept && (
          <>
            <DialogTitle sx={{ bgcolor:"#1a1a1a", color:"#fff" }}>
              {openConcept.name}
              <IconButton onClick={()=>setOpenConcept(null)} sx={{ position:"absolute", right:8, top:8, color:"#fff" }}>
                <CloseIcon/>
              </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ bgcolor:"#121212", color:"#eee" }}>
              <Typography><b>Subject:</b> {openConcept.subject}</Typography>
              <Typography><b>Weight:</b> {openConcept.weight}/10</Typography>
              <Typography><b>Depth:</b> {openConcept.depth}</Typography>
              <Typography><b>Past Paper Occurrences:</b> {openConcept.papers}</Typography>
              <Typography><b>In Official Syllabus:</b> {openConcept.inGuide?"Yes":"No"}</Typography>

              <Box sx={{ mt:2 }}>
                <Typography variant="subtitle2" gutterBottom>Why it matters</Typography>
                <Typography variant="body2">
                  • Appears in {openConcept.papers} past papers.<br/>
                  • Covered in {openConcept.subject} core texts.<br/>
                  • {openConcept.inGuide ? "Explicitly required by NEET syllabus." : "Not named in syllabus but inferred via past questions."}
                </Typography>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}

/* ───────────────────────── helpers ────────────────────────── */
const Header = ({icon,text})=>(
  <Stack direction="row" spacing={1} alignItems="center" mb={2}>
    <Avatar sx={{ width:30, height:30, bgcolor:"rgba(255,255,255,.15)" }}>{icon}</Avatar>
    <Typography variant="h5" sx={{ fontWeight:800 }}>{text}</Typography>
  </Stack>
);

const SourceAccordion = ({ title, icon, content }) => (
  <Accordion defaultExpanded sx={{ bgcolor:GLASS_BG, borderRadius:4,
    "&:before":{display:"none"}, backdropFilter:"blur(6px)" }}>
    <AccordionSummary expandIcon={<ExpandMoreIcon sx={{color:"#B39DDB"}}/>}>
            <Stack direction="row" spacing={1} alignItems="center">
        <Avatar
          sx={{
            width: 28,
            height: 28,
            bgcolor: "rgba(255,255,255,.15)",
            color: "#fff"          // ← icon goes white
          }}
        >
          {icon}
        </Avatar>
        <Typography
          sx={{
            fontWeight: 600,
            color: "#fff"          // ← title text goes white
          }}
        >
          {title}
        </Typography>
      </Stack>
    </AccordionSummary>
    <AccordionDetails>{content}</AccordionDetails>
  </Accordion>
);

const SubjectBooks = ({subj,books=[]})=>(
  <Box sx={{ mb:2 }}>
        <Typography
      sx={{
        fontWeight: 600,
        mb: .5,
        color: "#fff"        // ← make Physics / Chemistry / Biology white
      }}
    >
      {subj}
    </Typography>
    <Stack spacing={.5}>
      {books.map(b=><Chip key={b} label={b} size="small" sx={{
        bgcolor:"rgba(255,255,255,.12)", color:"#fff", fontWeight:600 }}/>
      )}
    </Stack>
  </Box>
);

const MethodPoint = ({ num, text }) => (
  <Stack direction="row" spacing={1} alignItems="flex-start">
    <Chip label={num} size="small" color="primary" sx={{ fontWeight:700 }}/>
    <Typography variant="body2">{text}</Typography>
  </Stack>
);

const Th = (p)=><TableCell sx={{ color:"#B39DDB", fontWeight:600 }} {...p}/>;
const Td = (p)=><TableCell sx={{ color:"#fff" }} {...p}/>;