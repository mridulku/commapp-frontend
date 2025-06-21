/* ────────────────────────────────────────────────────────────────
   File:  src/components/GuideCarousel.jsx      2025-06-21  ✦ revamp
   “Your plan is ready” — modern, dark-theme, data-driven
───────────────────────────────────────────────────────────────── */

import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";

import {
  setCurrentIndex,          // path may vary in your project
} from "../../../../../../../store/planSlice";

import {
  Box, Paper, Grid, Typography, Button, Divider, Stack, Chip,
  IconButton, Collapse, Tooltip
} from "@mui/material";

import EventIcon            from "@mui/icons-material/Event";
import AccessTimeIcon       from "@mui/icons-material/AccessTime";
import AutoAwesomeIcon      from "@mui/icons-material/AutoAwesome";
import ExpandMoreIcon       from "@mui/icons-material/ExpandMore";
import MenuBookIcon         from "@mui/icons-material/MenuBook";
import QuizIcon             from "@mui/icons-material/Quiz";
import MoreHorizIcon        from "@mui/icons-material/MoreHoriz";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import QuizOutlinedIcon     from "@mui/icons-material/QuizOutlined";
import WbIncandescentIcon   from "@mui/icons-material/WbIncandescent";
import BuildCircleIcon      from "@mui/icons-material/BuildCircle";
import PsychologyIcon       from "@mui/icons-material/Psychology";
import ReplayIcon           from "@mui/icons-material/Replay";
import ArrowForwardIcon     from "@mui/icons-material/ArrowForward";

/* ───── visual constants ───── */
const ACCENT     = "#BB86FC";
const DARK_BG    = "#111";
const PANEL_BG   = "#1C1C1C";
const OFF_BOX    = "rgba(255,255,255,.06)";
const PREVIEW_BG = "#1F1F1F";

const EMOJI = { physics:"🔭", chemistry:"⚗️", biology:"🧬" };

/* local mock – delete in prod */
const MOCK_PLAN = {
  dailyReadingTimeUsed : 30,
  selectedChapters     : [
    {subject:"physics",  grouping:"Mechanics"},
    {subject:"chemistry",grouping:"Organic Chemistry"},
  ],
  sessions: [
    {activities:[
      {type:"READ",subChapterName:"1 · Kinematics"},
      {type:"QUIZ",subChapterName:"Kinematics",quizStage:"remember"},
      {type:"READ",subChapterName:"2 · Dynamics"},
    ]},
    {activities:[{type:"READ",subChapterName:"Thermo Intro"}]},
  ]
};
/* ─────────────────────────── */

export default function SuccessPlanCreation({
  planDoc = MOCK_PLAN,
  planId,
  onClose = ()=>{},
  onStart = ()=>{},
}) {
  /* ───── data extraction ───── */
  const {
    dailyReadingTimeUsed = 30,
    selectedChapters     = [],
    sessions             = [],
  } = planDoc;

  const totalDays = sessions.length;

  /* group subject → chips */
  const subjGrp = useMemo(()=>{
    const o={}; selectedChapters.forEach(c=>{
      (o[c.subject] ??= new Set()).add(c.grouping);
    }); return o;
  },[selectedChapters]);

  /* ───── redux handles ───── */
  const dispatch   = useDispatch();
  const userId     = useSelector(s=>s.auth?.userId);
  const curIndex   = useSelector(s=>s.plan?.currentIndex);

  /* accordion state */
  const [openPrev,setOpenPrev] = useState(false);

  /* CTA */
  async function handleBegin() {
    /* fire-and-forget progress ping */
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/markActivityCompletion`,
        { userId, planId, activityId:"GUIDE_CAROUSEL", completionStatus:"complete" }
      );
    } catch(e){ console.warn("markActivityCompletion failed → ignoring"); }

    /* jump to next activity */
    dispatch(setCurrentIndex(curIndex + 1));
    onStart(planId);
    onClose();
  }

  /* mini Bloom card */
  const StageCard = ({icon,title,tagline,tint})=>(
    <Grid item xs={6} sm={4} md={2.4}>
      <Box sx={{
        display:"flex",flexDirection:"column",alignItems:"center",
        bgcolor:PANEL_BG,p:2,borderRadius:2,height:"100%",
        border:`1px solid ${tint}55`
      }}>
        {React.cloneElement(icon,{sx:{fontSize:36,color:tint,mb:.5}})}
        <Typography sx={{fontWeight:600,color:"#fff"}}>{title}</Typography>
        <Typography variant="caption" sx={{color:"#aaa",mt:.5,lineHeight:1.2}}>
          {tagline}
        </Typography>
      </Box>
    </Grid>
  );

  /* ─────────── render ─────────── */
  return (
    <Box sx={{
      width:"100%",minHeight:"100%",bgcolor:DARK_BG,
      p:{xs:2,sm:4},display:"flex",justifyContent:"center",alignItems:"center"
    }}>
      <Paper elevation={4} sx={{
        maxWidth:880,width:"100%",bgcolor:"#000",color:"#fff",
        borderRadius:3,p:{xs:3,sm:5}
      }}>

        {/* headline */}
        <Typography variant="h3" sx={{fontWeight:700,mb:1}}>
          Your plan is ready — let’s get started!
        </Typography>
        <Typography variant="body1" sx={{color:"#ccc",mb:3}}>
          Complete a few quick tasks every day. The plan adapts automatically if
          you miss a day or want to go faster.
        </Typography>

        {/* summary cards */}
        <Grid container spacing={2} mb={3}>
          {[ {icon:<EventIcon/>,       big:`${totalDays} day${totalDays!==1?"s":""}`, sub:"total duration"},
             {icon:<AccessTimeIcon/>,  big:`${dailyReadingTimeUsed} min`,             sub:"per day"},
             {icon:<AutoAwesomeIcon/>, big:"Adaptive",                               sub:"auto-adjusts"}]
            .map(({icon,big,sub},i)=>(
            <Grid item xs={4} md={3} key={i}>
              <Paper elevation={0} sx={{
                bgcolor:PANEL_BG,p:2,borderRadius:2,textAlign:"center",
                border:`1px solid ${ACCENT}55`
              }}>
                {React.cloneElement(icon,{sx:{color:ACCENT,fontSize:28,mb:.5}})}
                <Typography sx={{fontWeight:700,color:"#fff"}}>{big}</Typography>
                <Typography variant="caption" sx={{color:"#bbb"}}>{sub}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        

        {/* Day-1 preview accordion */}
        <Paper elevation={0} sx={{
          bgcolor:OFF_BOX,borderRadius:2,mb:3,overflow:"hidden",
          border:`1px solid ${ACCENT}22`
        }}>
<Box
  onClick={()=>setOpenPrev(o=>!o)}
  sx={{
    bgcolor:"#1E1A2A",                 // subtle lift from pure black
    display:"flex",alignItems:"center",justifyContent:"space-between",
    p:1.6, pl:2,                       // a touch more breathing room
    cursor:"pointer",
    borderLeft:4, borderColor:ACCENT,  // accent strip
    "&:hover":{ bgcolor:"#2A2440" }    // hover glow
  }}
>
            <Typography sx={{ fontWeight: 600, color: 'white' }}>
  Day&nbsp;1&nbsp;at&nbsp;a&nbsp;glance
</Typography>
            <IconButton size="small" sx={{color:"#fff"}}>
              <ExpandMoreIcon
                sx={{color:ACCENT,   transition:".2s",transform:openPrev?"rotate(180deg)":"none"}}/>
            </IconButton>
          </Box>

          <Collapse in={openPrev} timeout="auto" unmountOnExit>
            <Box sx={{p:2}}>
              {(sessions[0]?.activities||[]).slice(0,3).map((a,i)=>(
                <Stack key={i} direction="row" spacing={1} alignItems="center" mb={.8}>
                  <Chip
                    icon={a.type==="READ"
                      ? <MenuBookOutlinedIcon sx={{fontSize:16,color:"#000"}}/>
                      : <QuizOutlinedIcon sx={{fontSize:16,color:"#000"}}/>}
                    label={a.type==="READ"?"Read":"Quiz"}
                    size="small"
                    sx={{
                      bgcolor:ACCENT,
                      "& .MuiChip-label":{fontWeight:600,color:"#000"}
                    }}/>
                  <Typography variant="caption" sx={{color:"#ccc"}}>
                    {a.subChapterName}
                  </Typography>
                </Stack>
              ))}
              {sessions[0]?.activities.length>3 && (
                <Chip size="small"
                  icon={<MoreHorizIcon sx={{fontSize:16,color:"#fff"}}/>}
                  label={`+ ${sessions[0].activities.length-3} more`}
                  sx={{bgcolor:"#444","& .MuiChip-label":{color:"#fff"}}}/>
              )}
            </Box>
          </Collapse>
        </Paper>

        {/* Bloom ladder */}
        <Typography sx={{fontWeight:600,mb:1}}>The 5 stages you’ll master:</Typography>
        <Grid container spacing={2}>
          <StageCard icon={<MenuBookIcon/>}       title="Reading"   tagline="Fast skim"          tint="#FFD54F"/>
          <StageCard icon={<QuizIcon/>}           title="Remember"  tagline="1 Q / concept"      tint="#03A9F4"/>
          <StageCard icon={<WbIncandescentIcon/>} title="Understand"tagline="Why & how"          tint="#4CAF50"/>
          <StageCard icon={<BuildCircleIcon/>}    title="Apply"     tagline="Use in context"     tint="#FF7043"/>
          <StageCard icon={<PsychologyIcon/>}     title="Analyze"   tagline="Novel problems"     tint="#AB47BC"/>
        </Grid>

        {/* retry loop */}
        <Divider sx={{my:3,bgcolor:"#333"}}/>
        <Box sx={{display:"flex",alignItems:"center",gap:1,mb:1}}>
          <ReplayIcon sx={{color:ACCENT}}/>
          <Typography variant="h6" sx={{fontWeight:600}}>
            The <em>retry loop</em>
          </Typography>
        </Box>
        <Typography variant="body2" sx={{color:"#ccc"}}>
          Miss any concept in a quiz stage? We drop you into a short, focused
          revision, then retest only those concepts — repeating until
          <strong> every concept sticks</strong>. No wasted time on what you
          already know.
        </Typography>

        {/* CTA bottom-right */}
        <Box sx={{display:"flex",justifyContent:"flex-end",mt:4}}>
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon/>}
            sx={{bgcolor:ACCENT,fontWeight:700,px:4,"&:hover":{bgcolor:"#A57BF7"}}}
            onClick={handleBegin}
          >
            Jump into Day&nbsp;1
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}