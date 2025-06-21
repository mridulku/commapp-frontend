// ────────────────────────────────────────────────────────────────
// File: src/components/ProfileAnalyticsHub.jsx   (v0.5.0)
// Dark-glass UI • learner-profile – full feature set
// ────────────────────────────────────────────────────────────────
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box, Grid, Card, Typography, Avatar, Stack, Chip, Divider, IconButton,
  Tooltip, Button, Tabs, Tab, Table, TableHead, TableRow, TableCell,
  TableBody, LinearProgress, Paper, Dialog, DialogTitle, DialogContent,
  DialogActions
} from "@mui/material";
import CalendarIcon   from "@mui/icons-material/CalendarMonth";
import RankIcon       from "@mui/icons-material/EmojiEvents";
import EmailIcon      from "@mui/icons-material/Email";
import InfoIcon       from "@mui/icons-material/InfoOutlined";
import LibraryBooks   from "@mui/icons-material/LibraryBooks";
import FlashOnIcon    from "@mui/icons-material/FlashOn";
import MapIcon        from "@mui/icons-material/AutoStories";
import HistoryIcon    from "@mui/icons-material/History";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AddIcon        from "@mui/icons-material/AddCircleOutline";
import { ResponsiveContainer, LineChart, Line } from "recharts";
import { motion }     from "framer-motion";

/* ─── firebase helpers ─── */
import { auth, db } from "../../../firebase";          // adjust if needed
import {
  doc, getDoc, setDoc, updateDoc, serverTimestamp
} from "firebase/firestore";

/* ─── design tokens ─── */
const PAGE_BG  = "radial-gradient(circle at 35% 0%, #181924 0%, #0e0f15 100%)";
const GLASS_BG = "rgba(255,255,255,.06)";
const grad     = ([a,b]) => `linear-gradient(135deg,${a} 0%,${b} 100%)`;
const CardSX = {
  borderRadius:4, p:3, bgcolor:GLASS_BG,
  backdropFilter:"blur(6px)", boxShadow:"0 8px 24px rgba(0,0,0,.55)",
  color:"#f0f0f0",
};
const MotionCard = motion(Card);
const lift={ whileHover:{ y:-4, boxShadow:"0 14px 30px rgba(0,0,0,.9)" } };

/* ─── static demo filler ─── */
const CHALLENGE_OPTIONS = [
  "Time management","Concept gaps","Low motivation",
  "Application practice","Silly mistakes"
];

const capacity = {
  wpm        : { v:190, spark:[155,160,170,175,180,185,190] },
  wmSpan     : { v:5,   spark:[4,4,5,5,5,5,5] },
  recall     : { v:67,  spark:[52,55,58,60,62,64,67] },
  logic      : { v:3,   spark:[2,2,2,3,3,3,3] },
  motivation : { v:15,  spark:[12,13,13,14,14,15,15] },
};
const capGrad = {
  wpm:["#3b82f6","#6ee7b7"], wmSpan:["#ec4899","#f9a8d4"],
  recall:["#f59e0b","#fde68a"], logic:["#818cf8","#d8b4fe"],
  motivation:["#f87171","#fca5a5"],
};

const TOOLS = [
  {id:"planner", icon:<LibraryBooks/>, name:"Study Planner", state:"Configured", last:"Today"},
  {id:"revise",  icon:<FlashOnIcon/>,  name:"Quick Revise",  state:"2 sessions",last:"Yesterday"},
  {id:"concept", icon:<MapIcon/>,      name:"Concept Map",   state:"Viewed",    last:"2 days ago"},
];



/* ─── profile → plan explainer cards ─── */
const PROFILE_EXPLAIN_CARDS = [
  {emoji:"🧭", title:"Personalised Planner",
   grad:["#6366f1","#a5b4fc"],
   blurb:"Your goals, pace and daily minutes generate an auto-Gantt that writes each day’s tasks."},
  {emoji:"🎯", title:"Adaptive Difficulty",
   grad:["#3b82f6","#6ee7b7"],
   blurb:"Every attempt re-tunes question level so you stay in your ideal challenge zone."},
  {emoji:"⏳", title:"Spaced Recall",
   grad:["#f59e0b","#fde68a"],
   blurb:"Concepts resurface on day 2, 7, 30 based on *your* memory curve."},
  {emoji:"🔍", title:"Mock-Drill Loop",
   grad:["#ec4899","#f9a8d4"],
   blurb:"Missed mock topics drop into a drill queue until they’re mastered."},
];


const labelMap = {
  wpm:"Reading pace",
  wmSpan:"Mental workspace",
  recall:"Recall accuracy",
  logic:"Reasoning score",
  motivation:"Motivation index"
};

const tipMap = {
  wpm:"Words you can read per minute in science text.\n\nWhy it matters: sets how many pages fit in a study block.",
  wmSpan:"Items you can juggle in short-term memory.\n\nWhy it matters: low span triggers extra scaffolds on problems.",
  recall:"Percent of flash cards nailed on the first attempt.\n\nWhy it matters: drives spaced-recall timing.",
  logic:"0-5 accuracy on puzzle & mixed-concept tasks.\n\nWhy it matters: higher score unlocks harder questions sooner.",
  motivation:"0-20 blend of grit, mood and streak streak.\n\nWhy it matters: lowers daily load on low-grit days."
};

const CapacityCard = ({ id, data }) => (
  <MotionCard {...lift} sx={{
    ...CardSX, width:240, background:grad(capGrad[id])
  }}>
    <Box sx={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <Typography variant="subtitle2" sx={{fontWeight:600}}>
        {labelMap[id]}
      </Typography>
      <Tooltip title={tipMap[id]} arrow>
        <IconButton size="small" sx={{color:"#fff"}}><InfoIcon fontSize="inherit"/></IconButton>
      </Tooltip>
    </Box>

    <Typography variant="h4" sx={{fontWeight:700, mt:.5}}>
      {data.v}{id==="recall"?" %":""}
    </Typography>

    <Box sx={{width:"100%",height:40,mt:1}}>
      <ResponsiveContainer>
        <LineChart data={data.spark.map((v,i)=>({i,v}))}>
          <Line dataKey="v" dot={false} stroke="#ffffffaa" strokeWidth={2}/>
        </LineChart>
      </ResponsiveContainer>
    </Box>
  </MotionCard>
);


/* ─────────────────────────────────────────────────────────────── */
export default function ProfileAnalyticsHub(){

  /* ─── auth state ─── */
  const [user, setUser]           = useState(null);
  const [authLoading,setAuthLoading]=useState(true);
  const [email,setEmail]          = useState("—");

  /* profile fields */
  const [targetRank,setTargetRank]=useState(null);
  const [challenges,setChallenges]=useState([]);

  /* UI state */
  const [rankDlg,setRankDlg]      = useState(false);
  const [subjectTab,setSubjectTab]= useState(0);

  const navigate = useNavigate();

  /* === load / watch user document === */
  useEffect(()=>{
    const unsub = auth.onAuthStateChanged(async (u)=>{
      if(!u){ setUser(null); setAuthLoading(false); return; }

      setUser(u); setEmail(u.email || "—");

      const ref  = doc(db,"learnerPersonas",u.uid);
      const snap = await getDoc(ref);

      if(snap.exists()){
        const d=snap.data();
        setTargetRank(d.targetRank||null);
        setChallenges(Array.isArray(d.majorChallenges)?d.majorChallenges:[]);
      } else {
        await setDoc(ref,{createdAt:serverTimestamp()},{merge:true});
      }
      setAuthLoading(false);
    });
    return ()=>unsub();
  },[]);

  useEffect(()=>{
    if(!authLoading && user===null) navigate("/");
  },[authLoading,user,navigate]);

  const personaRef = useCallback(()=>doc(db,"learnerPersonas",user.uid),[user]);
  const persistField = async (k,v)=>{
    if(!user) return;
    await updateDoc(personaRef(),{[k]:v,updatedAt:serverTimestamp()});
  };

  /* handlers */
  const toggleChallenge = async(c)=>{
    const next = challenges.includes(c)
      ? challenges.filter(x=>x!==c)
      : [...challenges,c];
    setChallenges(next);
    await persistField("majorChallenges",next);
  };
  const handleRankSelect = async(r)=>{
    setTargetRank(r); setRankDlg(false);
    await persistField("targetRank",r);
  };

  /* ─── reusable section wrapper ─── */
  const Section = ({title,children})=>(
    <MotionCard {...lift} sx={{...CardSX, mt:5}}>
      <Typography variant="h5" sx={{fontWeight:800,mb:2}}>{title}</Typography>
      {children}
    </MotionCard>
  );

  /* ─── render ─── */
  return(
    <Box sx={{
      minHeight:"100vh", background:PAGE_BG,
      p:{xs:3,md:5}, fontFamily:"Inter, sans-serif"
    }}>

      {/* top page title */}
<MotionCard {...lift}
  sx={{
    ...CardSX,
    mb:4,
    px:{xs:2, md:4},
    py:2,
    display:"inline-block",
    background:"transparent",          /* just to reuse glassy border / shadow */
    boxShadow:"none"                   /* kill inner shadow so it looks like plain text */
}}>
  <Typography variant="h3" sx={{ fontWeight:800 }}>
    🧑‍💻 User Profile
  </Typography>
</MotionCard>

      {/* ¹  OVERVIEW CARDS */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <InfoCard
            icon={<CalendarIcon/>}
            label="for NEET"
            value="10 months left"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <InfoCard icon={<EmailIcon/>} label="Email" value={email}/>
        </Grid>
        <Grid item xs={12} md={4}>
          <InfoCard
            icon={targetRank?<RankIcon/>:<AddIcon/>}
            label="Target rank"
            value={targetRank??"Add target rank"}
            onClick={()=>setRankDlg(true)}
            clickable
            empty={!targetRank}
            sx={!targetRank?{border:"1px dashed #BB86FC"}:{}}
          />
        </Grid>
      </Grid>

      {/* ²  PROFILE EXPLAINER */}
      <ProfileExplainer/>

      {/* ³  MAJOR CHALLENGES */}

      <Section title="Major Challenges">
          <Typography variant="caption" sx={{ mt:1, display:"block", opacity:.75 }}>
          *Tap to add / remove hurdles you’d like the system to account for.*
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {CHALLENGE_OPTIONS.map(c=>(
            <Chip
              key={c} label={c} clickable onClick={()=>toggleChallenge(c)}
              color={challenges.includes(c)?"primary":"default"}
              sx={{
                fontWeight:600,
                color:"#fff",
                bgcolor:challenges.includes(c)?"primary.main":"#444"
              }}
            />
          ))}
        </Stack>
      

        {challenges.length===0 && (
          <Typography variant="body2" sx={{
            mt:2, bgcolor:"#333", p:1.5, borderRadius:2,
            textAlign:"center", opacity:.8
          }}>
            You haven’t selected any challenges yet. Tap the chips so we can tailor your plan.
          </Typography>
        )}

        
      </Section>

      {/* ⁴  CAPACITY SNAPSHOT */}
  {/* ⁴  CAPACITY SNAPSHOT */}
  <Section title="Capacity Snapshot">
    <Typography variant="body2" sx={{ opacity:.8, mb:2 }}>
      These five cards track the skills that power your learning engine. They
      start from a short onboarding diagnostic and shift automatically after
      every quiz, mock or timed reading—so you can watch them climb.
    </Typography>
  <Box sx={{
    overflowX:"auto", p:1,
    "&::-webkit-scrollbar":{ display:"none" }
  }}>
    <Stack direction="row" spacing={2}>
      {Object.entries(capacity).map(([id,m])=>(
        <CapacityCard key={id} id={id} data={m}/>
      ))}
    </Stack>
  </Box>
</Section>



      {/* ⁶  RECENT CONCEPT ACTIVITY */}
      <Section title="Recent Concept Activity">
  <Placeholder
    icon="📈"
    text="As you quiz or read, the concepts you touched will appear here."
  />
</Section>

      {/* ⁷  TOOL HISTORY */}
      <Section title="Tool History">
  <Placeholder
    icon="🕒"
    text="Each planner session, mock or quick-revise run will show up here."
  />
</Section>

      {/* ⁸  PROFICIENCY EXPLORER */}
     <Section title="Proficiency Explorer">
  <Placeholder
    icon="🧪"
    text="Once you attempt questions, we’ll plot your topic-wise mastery here."
  />
</Section>

      {/* ─── Target Rank dialog ─── */}
      <Dialog open={rankDlg} onClose={()=>setRankDlg(false)}>
        <DialogTitle>Select target rank</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{mt:1}}>
            {["Under 100","Under 1 000","Under 10 000"].map(r=>(
              <Button key={r}
                variant={r===targetRank?"contained":"outlined"}
                onClick={()=>handleRankSelect(r)}
              >{r}</Button>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setRankDlg(false)}>Close</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

/* ─── sub-components ─── */
const InfoCard = ({
  icon,label,value,onClick,clickable=false,empty=false, sx={}
})=>(
  <MotionCard {...lift}
    onClick={clickable?onClick:undefined}
    sx={{
      ...CardSX, textAlign:"center",
      cursor:clickable?"pointer":"default",
      opacity:empty?0.65:1,
      ...sx
    }}>
    <Avatar sx={{bgcolor:"rgba(255,255,255,.25)",mx:"auto",mb:1}}>{icon}</Avatar>
    <Typography variant="h5" sx={{fontWeight:700}}>{value}</Typography>
    <Typography variant="caption" sx={{opacity:.8}}>{label}</Typography>
  </MotionCard>
);

const Th = (p)=><TableCell sx={{color:"#BB86FC",fontWeight:600}} {...p}/>;
const Td = (p)=><TableCell sx={{color:"#fff"}} {...p}/>;

const ProfileExplainer = () => (
  <MotionCard {...lift} sx={{...CardSX, mt:3}}>
    <Stack direction="row" spacing={1} alignItems="center" mb={2}>
      <Avatar sx={{width:30,height:30,bgcolor:"rgba(255,255,255,.15)"}}>📈</Avatar>
      <Typography variant="h5" sx={{fontWeight:800}}>
        How your profile powers your study plan
      </Typography>
    </Stack>
    <Box sx={{display:"flex", overflowX:"auto", pb:1,
              "&::-webkit-scrollbar":{display:"none"}}}>
      {PROFILE_EXPLAIN_CARDS.map(c=>(
        <MotionCard key={c.title} {...lift}
          sx={{...CardSX, flex:"0 0 240px", mr:2,
              background:`linear-gradient(135deg,${c.grad[0]} 0%,${c.grad[1]} 100%)`}}>
          <Box sx={{fontSize:46,textAlign:"center",mb:1}}>{c.emoji}</Box>
          <Typography variant="subtitle1" sx={{fontWeight:700,mb:.5}}>
            {c.title}
          </Typography>
          <Typography variant="body2" sx={{opacity:.9}}>{c.blurb}</Typography>
        </MotionCard>
      ))}
    </Box>
  </MotionCard>
);


/* ─── simple empty-state card ─── */
const Placeholder = ({ icon="ℹ️", text }) => (
  <Box sx={{
    display:"flex", flexDirection:"column", alignItems:"center",
    justifyContent:"center", height:160, opacity:.7
  }}>
    <Box sx={{ fontSize:42 }}>{icon}</Box>
    <Typography variant="body2" align="center" sx={{ mt:1, maxWidth:240 }}>
      {text}
    </Typography>
  </Box>
);