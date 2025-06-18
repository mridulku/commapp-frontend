// ────────────────────────────────────────────────────────────────
// File: src/components/HomeHub.jsx
// Dark-glass UI • Active-plans live + profile details fetched
// ────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from "react";
import { useSelector }  from "react-redux";
import axios            from "axios";

import {
  Box, Grid, Card, Typography, Button, Chip, Avatar, Stack,
  LinearProgress
} from "@mui/material";
import AccessTimeIcon  from "@mui/icons-material/AccessTime";
import FlagIcon        from "@mui/icons-material/Flag";
import TimelapseIcon   from "@mui/icons-material/Timelapse";
import WhatshotIcon    from "@mui/icons-material/Whatshot";
import MenuBookIcon    from "@mui/icons-material/AutoStories";
import EditIcon        from "@mui/icons-material/Edit";
import BoltIcon        from "@mui/icons-material/FlashOn";
import PublicIcon      from "@mui/icons-material/Public";
import PersonIcon      from "@mui/icons-material/Person";
import CalendarIcon    from "@mui/icons-material/CalendarMonth";
import { motion }      from "framer-motion";
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from "recharts";

/* ── colour helpers ─────────────────────────────────────────── */
const GRAD = [
  ["#f87171", "#fca5a5"], ["#ec4899", "#f9a8d4"], ["#818cf8", "#d8b4fe"],
  ["#6366f1", "#a5b4fc"], ["#3b82f6", "#6ee7b7"], ["#f59e0b", "#fde68a"],
];
const grad = ([a, b]) => `linear-gradient(135deg, ${a} 0%, ${b} 100%)`;

/* ── filler for top stats / tools (unchanged) ──────────────── */
const stats = [
  { icon:<AccessTimeIcon/>, label:"Time Today",     val:"0 m",  g:GRAD[0] },
  { icon:<FlagIcon/>      , label:"Today's Target", val:"0 %",  g:GRAD[1] },
  { icon:<TimelapseIcon/> , label:"Total Studied",  val:"0 h",  g:GRAD[2] },
  { icon:<WhatshotIcon/>  , label:"Current Streak", val:"1 day",g:GRAD[3] },
];
const tools = [
  { id:"planner", icon:<EditIcon/>,  lab:"Study Planner", sub:"Auto schedules", g:GRAD[0] },
  { id:"revise" , icon:<BoltIcon/>,  lab:"Quick Revise" , sub:"10-min flashes", g:GRAD[4] },
  { id:"concept", icon:<PublicIcon/>,lab:"Concept Map"  , sub:"Topic network" , g:GRAD[5] },
];

/* ── style snippets ─────────────────────────────────────────── */
const PAGE_BG   = "radial-gradient(circle at 35% 0%, #181924 0%, #0e0f15 100%)";
const GLASS_BG  = "rgba(255,255,255,.06)";
const CardGlassSX = {
  borderRadius:4, p:3, bgcolor:GLASS_BG,
  backdropFilter:"blur(6px)", boxShadow:"0 8px 24px rgba(0,0,0,.55)", color:"#f0f0f0",
};
const MotionCard = motion(Card);
const lift = { whileHover:{ y:-4, boxShadow:"0 12px 28px rgba(0,0,0,.8)" } };

/* ── quick helpers ──────────────────────────────────────────── */
const minsPerDay = (plan)=>60; // placeholder until you hook real field
const fmtDate = (d)=> d?.toLocaleDateString(undefined,
                { year:"numeric", month:"short", day:"numeric" });

/* ── MAIN COMPONENT ─────────────────────────────────────────── */
export default function HomeHub({ userId, onNavigate = ()=>{} }) {

  /* 1 ▸ examType is global redux – always current */
  const examType = useSelector(state => state.exam.examType);

  /* 2 ▸ fetch user doc once for e-mail + joined date */
  const [profile,setProfile] = useState({ email:"demo@user.com", joined:null });
  useEffect(() => {
    if (!userId) return;
    (async ()=>{
      try{
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/user`,
          { params:{ userId }}
        );
        if(res.data?.success && res.data.user){
          const { username, createdAt } = res.data.user;
          setProfile({
            email:  username || "no-email",
            joined: createdAt? new Date(createdAt): null,
          });
        }
      }catch(e){ console.error("HomeHub /api/user",e);}
    })();
  },[userId]);

  /* 3 ▸ active plans – already live-fetched */
  const [plans,setPlans]   = useState([]);   // full list
  const [loading,setLoad]  = useState(false);
  useEffect(()=>{
    if(!userId) return;
    (async()=>{
      setLoad(true);
      try{
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/adaptive-plans`,
          { params:{ userId }}
        );
        setPlans(res.data?.plans||[]);
      }catch(e){ console.error("HomeHub plans",e);}
      finally{ setLoad(false);}
    })();
  },[userId]);
  const shownPlans = plans.slice(0,4);
  const planGrad   = (i)=>grad(GRAD[(i+2)%GRAD.length]);

  /* ─────────────────────────── render */
  return (
    <Box sx={{
      minHeight:"100vh", background:PAGE_BG,
      p:{ xs:3, md:5 }, fontFamily:"Inter, sans-serif", color:"#f0f0f0"
    }}>

      {/* ▸ TOP STATS */}
      <Grid container spacing={2}>
        {stats.map((s,i)=>(
          <Grid key={i} item xs={6} md={3}>
            <MotionCard {...lift}
              sx={{ ...CardGlassSX, background:grad(s.g),
                    display:"flex", alignItems:"center", gap:2 }}>
              <Avatar sx={{ bgcolor:"rgba(255,255,255,.25)",
                            width:48, height:48 }}>{s.icon}</Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight:700 }}>{s.val}</Typography>
                <Typography variant="caption">{s.label}</Typography>
              </Box>
            </MotionCard>
          </Grid>
        ))}
      </Grid>

      {/* ▸ MAIN GRID */}
      <Grid container spacing={3} sx={{ mt:4 }}>

        {/* ① ACTIVE PLANS */}
        <Grid item xs={12} lg={6}>
          <MotionCard {...lift} sx={CardGlassSX}>
            <Header icon={<MenuBookIcon/>} text={`Active Plans (${plans.length})`}
                    action="See All" onAction={()=>onNavigate("home")} />
            {loading && <Typography variant="body2">Loading plans…</Typography>}
            {!loading && plans.length===0 &&
              <Typography variant="body2" sx={{ opacity:.8 }}>No plans yet.</Typography>}
            <Grid container spacing={2}>
              {shownPlans.map((p,i)=>(
                <Grid key={p.id} item xs={12} sm={6} xl={4}>
                  <MotionCard {...lift}
                    sx={{ ...CardGlassSX, background:planGrad(i), textAlign:"center" }}>
                    <Avatar sx={{ bgcolor:"rgba(255,255,255,.20)",
                                  width:56, height:56, mx:"auto" }}>
                      <MenuBookIcon/>
                    </Avatar>
                    <Typography sx={{ fontWeight:700, mt:1 }}>
                      {p.planName || `Study Plan ${i+1}`}
                    </Typography>
                    <Typography variant="caption">
                      ⏰ {minsPerDay(p)} min/day
                    </Typography>
                    <LinearProgress variant="determinate" value={0}
                      sx={{ mt:2, height:5, borderRadius:3,
                           "& .MuiLinearProgress-bar":{ background:"#fff" }}}/>
                    <Typography variant="caption">0 %</Typography>
                    <Stack direction="row" spacing={1} justifyContent="center"
                           mt={1} flexWrap="wrap">
                      {["Physics","Chemistry","Biology"].map(tag=>(
                        <Chip key={tag} label={tag} size="small"
                              sx={{ bgcolor:"rgba(255,255,255,.20)", color:"#fff" }}/>
                      ))}
                    </Stack>
                  </MotionCard>
                </Grid>
              ))}
            </Grid>
          </MotionCard>
        </Grid>

        {/* ② TOOLS – unchanged */}
        <Grid item xs={12} lg={6}>
          <MotionCard {...lift} sx={CardGlassSX}>
            <Header icon={<BoltIcon/>} text="Tools"
                    action="See All" onAction={()=>onNavigate("tools")} />
            <Stack spacing={2}>
              {tools.map(t=>(
                <MotionCard key={t.id} {...lift}
                  sx={{ ...CardGlassSX, background:grad(t.g),
                        display:"flex", alignItems:"center", gap:2 }}>
                  <Avatar sx={{ bgcolor:"rgba(255,255,255,.20)",
                                width:56, height:56 }}>{t.icon}</Avatar>
                  <Box sx={{ flex:1 }}>
                    <Typography sx={{ fontWeight:700 }}>{t.lab}</Typography>
                    <Typography variant="caption">{t.sub}</Typography>
                  </Box>
                  <Button size="small" variant="contained"
                          sx={{ bgcolor:"rgba(255,255,255,.9)", color:"#000",
                                fontWeight:700 }}>OPEN</Button>
                </MotionCard>
              ))}
            </Stack>
          </MotionCard>
        </Grid>

        {/* ③ PROFILE – now live */}
        <Grid item xs={12} lg={6}>
          <MotionCard {...lift} sx={CardGlassSX}>
            <Header icon={<PersonIcon/>} text="Profile"
                    action="See All Details" onAction={()=>onNavigate("profile")} />
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ width:80, height:80, fontSize:32,
                            bgcolor:grad(GRAD[5]), color:"#fff" }}>
                {profile.email[0]?.toUpperCase() || "U"}
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight:600 }}>{profile.email}</Typography>
                {profile.joined &&
                  <Typography variant="caption" sx={{ display:"flex",
                    alignItems:"center", mt:.5 }}>
                    <CalendarIcon sx={{ fontSize:14, mr:.5 }}/>
                    Joined · {fmtDate(profile.joined)}
                  </Typography>}
                {examType &&
                  <Typography variant="caption">Exam — {examType}</Typography>}
              </Box>
            </Stack>
            {/* mini stats – still placeholder */}
            <Grid container spacing={2} sx={{ mt:3 }}>
              <Grid item xs={6}>
                <MiniStat title="Hours Studied"  value="0 h"   grad={grad(GRAD[3])}/>
              </Grid>
              <Grid item xs={6}>
                <MiniStat title="Current Streak" value="1 day" grad={grad(GRAD[1])}/>
              </Grid>
            </Grid>
          </MotionCard>
        </Grid>

        {/* ④ CONCEPT GRAPH – unchanged */}
        <Grid item xs={12} lg={6}>
          <MotionCard {...lift} sx={CardGlassSX}>
            <Header icon={<PublicIcon/>} text="Concept Graph"
                    action="View in Detail" onAction={()=>onNavigate("conceptGraph")} />
            <Avatar sx={{ width:96, height:96, mx:"auto", my:2,
                          bgcolor:"rgba(255,255,255,.15)" }}>
              <PublicIcon sx={{ fontSize:60 }}/>
            </Avatar>
            <Typography align="center" variant="body2">
              Visualise how topics connect.<br/>Coming soon – beta preview.
            </Typography>
          </MotionCard>
        </Grid>
      </Grid>
    </Box>
  );
}

/* ── tiny helpers ───────────────────────────────────────────── */
function Header({ icon, text, action, onAction }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Avatar sx={{ width:30, height:30, bgcolor:"rgba(255,255,255,.15)" }}>
          {icon}
        </Avatar>
        <Typography variant="h5" sx={{ fontWeight:800 }}>{text}</Typography>
      </Stack>
      {action && (
        <Button size="small" variant="outlined"
          sx={{ borderColor:"rgba(255,255,255,.4)", color:"#fff",
                textTransform:"none", fontWeight:600,
                "&:hover":{ borderColor:"#fff" } }}
          onClick={onAction}>{action}</Button>
      )}
    </Stack>
  );
}
function MiniStat({ title, value, grad }) {
  return (
    <Box sx={{ p:2, borderRadius:3, background:grad, color:"#fff",
               textAlign:"center", lineHeight:1.1 }}>
      <Typography variant="h6" sx={{ fontWeight:700 }}>{value}</Typography>
      <Typography variant="caption">{title}</Typography>
    </Box>
  );
}