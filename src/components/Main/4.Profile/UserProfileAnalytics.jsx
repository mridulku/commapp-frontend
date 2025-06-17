// ────────────────────────────────────────────────────────────────
// File: src/components/ProfileAnalyticsHub.jsx
// Dark-glass UI • learner-profile (v0.3.2 “all-text bright”)
// ────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import {
  Box, Grid, Card, Typography, Avatar, Stack, Chip, Divider,
  IconButton, Tooltip, Button, Tabs, Tab, Table, TableHead,
  TableRow, TableCell, TableBody, LinearProgress, Paper
} from "@mui/material";
import CalendarIcon   from "@mui/icons-material/CalendarMonth";
import RankIcon       from "@mui/icons-material/EmojiEvents";
import EmailIcon      from "@mui/icons-material/Email";
import InfoIcon       from "@mui/icons-material/InfoOutlined";
import SettingsIcon   from "@mui/icons-material/Build";
import BoltIcon       from "@mui/icons-material/FlashOn";
import MapIcon        from "@mui/icons-material/AutoStories";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import { motion }     from "framer-motion";

/* ──── design tokens ──── */
const PAGE_BG  = "radial-gradient(circle at 35% 0%, #181924 0%, #0e0f15 100%)";
const GLASS_BG = "rgba(255,255,255,.06)";
const grad     = ([a, b]) => `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;
const CardSX = {
  borderRadius: 4,
  p: 3,
  bgcolor: GLASS_BG,
  backdropFilter: "blur(6px)",
  boxShadow: "0 8px 24px rgba(0,0,0,.55)",
  color: "#f0f0f0",                   // ← universal light text
};
const MotionCard = motion(Card);
const lift = { whileHover: { y: -4, boxShadow: "0 14px 30px rgba(0,0,0,.9)" } };

/* ──── dummy profile data (wire up later) ──── */
const hero = {
  daysLeft   : 198,
  email      : "demo.user@mail.com",
  targetRank : "≤ 5 000"
};

const CHALLENGE_OPTIONS = [
  "Time management", "Concept gaps", "Low motivation",
  "Application practice", "Silly mistakes"
];

const capacity = {
  wpm        : { v: 190, spark:[155,160,170,175,180,185,190] },
  wmSpan     : { v: 5,   spark:[4,4,5,5,5,5,5] },
  recall     : { v: 67,  spark:[52,55,58,60,62,64,67] },
  logic      : { v: 3,   spark:[2,2,2,3,3,3,3] },
  motivation : { v: 15,  spark:[12,13,13,14,14,15,15] },
};
const capGrad = {
  wpm        : ["#3b82f6", "#6ee7b7"],
  wmSpan     : ["#ec4899", "#f9a8d4"],
  recall     : ["#f59e0b", "#fde68a"],
  logic      : ["#818cf8", "#d8b4fe"],
  motivation : ["#f87171", "#fca5a5"],
};

const TOOLS = [
  { id:"planner", icon:<SettingsIcon/>, name:"Study Planner",  state:"Configured", last:"Today" },
  { id:"revise",  icon:<BoltIcon/>,     name:"Quick Revise" ,  state:"2 sessions", last:"Yesterday" },
  { id:"concept", icon:<MapIcon/>,      name:"Concept Map"  ,  state:"Viewed",     last:"2 days ago" },
];

const PROFICIENCY = {
  Physics   : [ {c:"Kinematics", p:68}, {c:"Laws of Motion",p:54}, {c:"Work & Energy",p:72}],
  Chemistry : [ {c:"Organic Basics",p:45}, {c:"Ionic Equilibria",p:60}, {c:"Electrochem.",p:30}],
  Biology   : [ {c:"Cell Structure",p:80}, {c:"Physiology",p:55}, {c:"Genetics",p:50}],
};

/* ─────────────────────────────────────────────────────────────── */
export default function ProfileAnalyticsHub() {

  const [challenges, setChallenges] = useState(["Time management"]);
  const [subjectTab, setSubjectTab] = useState(0);

  const toggleChallenge = (c) =>
    setChallenges((prev)=>
      prev.includes(c) ? prev.filter(x=>x!==c) : [...prev,c]);

  const Section = ({ title, children }) => (
    <MotionCard {...lift} sx={{ ...CardSX, mt:5 }}>
      <Typography variant="h5" sx={{ fontWeight:800, mb:2 }}>{title}</Typography>
      {children}
    </MotionCard>
  );

  /* ─── render ─── */
  return (
    <Box sx={{ minHeight:"100vh", background:PAGE_BG, p:{ xs:3, md:5 }, fontFamily:"Inter, sans-serif", color:"#f0f0f0" }}>

      {/* 1 ▸ OVERVIEW ROW */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <InfoCard icon={<CalendarIcon/>} label="Days left"  value={hero.daysLeft}/>
        </Grid>
        <Grid item xs={12} md={4}>
          <InfoCard icon={<EmailIcon/>}    label="Email"      value={hero.email}/>
        </Grid>
        <Grid item xs={12} md={4}>
          <InfoCard icon={<RankIcon/>}     label="Target rank" value={hero.targetRank}/>
        </Grid>
      </Grid>

      {/* 2 ▸ MAJOR CHALLENGES */}
      <Section title="Major Challenges">
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {CHALLENGE_OPTIONS.map(c=>(
            <Chip
              key={c}
              label={c}
              clickable
              onClick={()=>toggleChallenge(c)}
              color={challenges.includes(c) ? "primary" : "default"}
              sx={{
                fontWeight:600,
                color:"#fff",                               // ← white text
                bgcolor: challenges.includes(c) ? "primary.main" : "#444"
              }}
            />
          ))}
        </Stack>
        <Typography variant="caption" sx={{ mt:1, display:"block", opacity:.75 }}>
          *Tap to add / remove hurdles you’d like the system to account for.*
        </Typography>
      </Section>

      {/* 3 ▸ CAPACITY SNAPSHOT */}
      <Section title="Capacity Snapshot">
        <Grid container spacing={2}>
          {Object.entries(capacity).map(([id,m])=>(
            <Grid item xs={12} sm={6} md={4} lg={3} key={id}>
              <MotionCard {...lift} sx={{ ...CardSX, background:grad(capGrad[id]) }}>
                <Box sx={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight:600, textTransform:"capitalize", color:"#fff" }}>
                    {id}
                  </Typography>
                  <Tooltip title={`Baseline started at ${m.spark[0]}`}>
                    <IconButton size="small" sx={{ color:"#fff" }}>
                      <InfoIcon fontSize="inherit"/>
                    </IconButton>
                  </Tooltip>
                </Box>
                <Typography variant="h4" sx={{ fontWeight:700, mt:.5, color:"#fff" }}>
                  {m.v}{id==="recall"?" %":""}
                </Typography>
                {/* tiny sparkline */}
                <Box sx={{ width:"100%", height:40, mt:1 }}>
                  <ResponsiveContainer>
                    <LineChart data={m.spark.map((v,i)=>({i,v}))}>
                      <Line dataKey="v" dot={false} stroke="#ffffffaa" strokeWidth={2}/>
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </MotionCard>
            </Grid>
          ))}
        </Grid>
      </Section>

      {/* 4 ▸ TOOL USAGE SNAPSHOT */}
      <Section title="Tool Usage">
        <Grid container spacing={2}>
          {TOOLS.map(t=>(
            <Grid item xs={12} sm={6} md={4} key={t.id}>
              <Paper variant="outlined" sx={{
                display:"flex", gap:2, alignItems:"center",
                p:2, bgcolor:"#1b1b1b", borderColor:"#333", color:"#fff" // ← white text here
              }}>
                <Avatar sx={{ bgcolor:"rgba(255,255,255,.18)" }}>{t.icon}</Avatar>
                <Box sx={{ flex:1 }}>
                  <Typography sx={{ fontWeight:600, color:"#fff" }}>{t.name}</Typography>
                  <Typography variant="caption" sx={{ opacity:.8, color:"#ccc" }}>
                    {t.state} • last {t.last}
                  </Typography>
                </Box>
                <Button size="small" variant="contained" color="secondary">OPEN</Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Section>

      {/* 5 ▸ PROFICIENCY EXPLORER */}
      <Section title="Proficiency Explorer">
        <Tabs
          value={subjectTab}
          onChange={(_,v)=>setSubjectTab(v)}
          sx={{
            ".MuiTab-root":{ color:"#bbb" },
            ".Mui-selected":{ color:"#BB86FC" }
          }}
        >
          {Object.keys(PROFICIENCY).map((sub)=><Tab key={sub} label={sub}/>)}
        </Tabs>

        <Table size="small" sx={{ mt:2 }}>
          <TableHead>
            <TableRow>
              <Th>Concept / Topic</Th>
              <Th width={200}>Proficiency</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {PROFICIENCY[Object.keys(PROFICIENCY)[subjectTab]].map(r=>(
              <TableRow key={r.c} hover>
                <Td>{r.c}</Td>
                <Td>
                  <LinearProgress
                    variant="determinate"
                    value={r.p}
                    sx={{
                      height:6,
                      borderRadius:4,
                      "& .MuiLinearProgress-bar":{ background:"#BB86FC" }
                    }}
                  />
                </Td>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

    </Box>
  );
}

/* ─── helper sub-components ─── */
const InfoCard = ({ icon, label, value }) => (
  <MotionCard {...lift} sx={{ ...CardSX, textAlign:"center" }}>
    <Avatar sx={{ bgcolor:"rgba(255,255,255,.25)", mx:"auto", mb:1 }}>{icon}</Avatar>
    <Typography variant="h5" sx={{ fontWeight:700, color:"#fff" }}>{value}</Typography>
    <Typography variant="caption" sx={{ opacity:.8, color:"#ccc" }}>{label}</Typography>
  </MotionCard>
);

const Th = (p)=><TableCell sx={{ color:"#BB86FC", fontWeight:600 }} {...p}/>;
const Td = (p)=><TableCell sx={{ color:"#fff" }} {...p}/>;