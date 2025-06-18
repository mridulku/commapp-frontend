// ────────────────────────────────────────────────────────────────
// File: src/components/HomeHub.jsx        (v6 – proper row spacing)
// ────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import {
  Box, Grid, Card, Typography, Button, Avatar, Stack,
  LinearProgress, Dialog, DialogContent
} from "@mui/material";

import { useDispatch } from "react-redux";
import { setExamType } from "../../../store/examSlice";   // ⚠️ adjust path
import { setAuth }     from "../../../store/authSlice";   /* NEW */


import AccessTimeIcon from "@mui/icons-material/AccessTime";
import FlagIcon       from "@mui/icons-material/Flag";
import TimelapseIcon  from "@mui/icons-material/Timelapse";
import WhatshotIcon   from "@mui/icons-material/Whatshot";
import MenuBookIcon   from "@mui/icons-material/AutoStories";
import EditIcon       from "@mui/icons-material/Edit";
import BoltIcon       from "@mui/icons-material/FlashOn";
import PublicIcon     from "@mui/icons-material/Public";
import PersonIcon     from "@mui/icons-material/Person";
import CalendarIcon   from "@mui/icons-material/CalendarMonth";
import { motion }     from "framer-motion";

/* ⚠  adjust these two import paths for your project */
import GuideOnboarding from "../5.StudyModal/0.components/Main/Base/Guide/GuideOnboarding"; // ⚠
import PlanFetcher     from "../5.StudyModal/StudyModal";                                    // ⚠

/* ─────────────────── palette / helpers ─────────────────── */
const GRAD = [
  ["#f87171", "#fca5a5"], ["#ec4899", "#f9a8d4"], ["#818cf8", "#d8b4fe"],
  ["#6366f1", "#a5b4fc"], ["#3b82f6", "#6ee7b7"], ["#f59e0b", "#fde68a"],
];
const grad = ([a, b]) => `linear-gradient(135deg,${a} 0%,${b} 100%)`;

const PAGE_BG = "radial-gradient(circle at 35% 0%, #181924 0%, #0e0f15 100%)";
const GLASS   = "rgba(255,255,255,.06)";
const CardSX  = {
  borderRadius: 4, p: 3, bgcolor: GLASS,
  backdropFilter: "blur(6px)",
  boxShadow: "0 8px 24px rgba(0,0,0,.55)",
  color: "#f0f0f0",
};
const MotionCard = motion(Card);
const lift = { whileHover: { y: -4, boxShadow: "0 12px 28px rgba(0,0,0,.85)" } };

const stats = [
  { icon: <AccessTimeIcon/>, label: "Time Today",     val: "0 m",   g: GRAD[0] },
  { icon: <FlagIcon/>,       label: "Today's Target", val: "0 %",   g: GRAD[1] },
  { icon: <TimelapseIcon/>,  label: "Total Studied",  val: "0 h",   g: GRAD[2] },
  { icon: <WhatshotIcon/>,   label: "Current Streak", val: "1 day", g: GRAD[3] },
];
const tools = [
  { id: "planner", icon: <EditIcon/>,  lab: "Study Planner", sub: "Auto schedules", g: GRAD[0] },
  { id: "revise",  icon: <BoltIcon/>,  lab: "Quick Revise",  sub: "10-min flashes", g: GRAD[4] },
  { id: "concept", icon: <PublicIcon/>,lab: "Concept Map",   sub: "Topic network",  g: GRAD[5] },
  { id: "dummy",   icon: <BoltIcon/>,  lab: "Extra Slot",    sub: "Coming soon",    g: GRAD[2] },
];
const fmtDate = d =>
  d?.toLocaleDateString(undefined,{ year:"numeric", month:"short", day:"numeric" });

/* ─────────────────────────────────────────────────────────── */
export default function HomeHub({ userId, onNavigate = () => {} }) {
  const examType = useSelector(s => s.exam.examType);

  /* profile -------------------------------------------------- */
  const [profile, setProfile] = useState({ email: "demo@user.com", joined: null });
  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/user`,
          { params: { userId } }
        );
        if (data?.success && data.user) {
          setProfile({
            email:  data.user.username || "no-email",
            joined: data.user.createdAt ? new Date(data.user.createdAt) : null,
          });
        }
      } catch (err) { console.error("/api/user", err); }
    })();
  }, [userId]);


  const dispatch = useDispatch();

useEffect(() => {
  if (!userId) return;
  (async () => {
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/user`,
        { params: { userId } }
      );

      if (data?.success && data.user) {
        setProfile({
          email : data.user.username || "no-email",
          joined: data.user.createdAt ? new Date(data.user.createdAt) : null,
        });

         dispatch(setAuth({ userId })); 

        /* NEW — hydrate examType once */
        if (!examType && data.user.examType) {
          dispatch(setExamType(data.user.examType));
        }
      }
    } catch (err) {
      console.error("/api/user", err);
    }
  })();
}, [userId, examType, dispatch]);

  /* plans ----------------------------------------------------- */
  const [plans,   setPlans] = useState([]);
  const [loading, setLoad ] = useState(false);
  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoad(true);
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/adaptive-plans`,
          { params: { userId } }
        );
        setPlans(data?.plans || []);
      } catch (err) { console.error("/api/adaptive-plans", err); }
      finally       { setLoad(false); }
    })();
  }, [userId]);

  /* onboarding / player dialogs ------------------------------ */
  const [showOnboard, setShowOnboard] = useState(false);
  const [showPlayer , setShowPlayer ] = useState(false);
  const [playerPlan , setPlayerPlan ] = useState(null);

  /* ◼︎ fallback exam so GuideOnboarding’s guard passes  */
const ensureExamType = () => {
  if (!examType) dispatch(setExamType("NEET"));
};

// ─── HomeHub.jsx ───────────────────────────────────────────────
// put this inside your component, replacing the old handler
const handlePlanCreated = (newId) => {
  console.log("[HomeHub] handlePlanCreated got", newId);

  /* 1 ─ guard: wizard was closed without making a plan */
  if (!newId) {
    setShowOnboard(false);
    return;
  }

  /* 2 ─ add to local list only if it isn’t there already */
  setPlans(prev =>
    prev.some(p => p.id === newId)
      ? prev
      : [...prev, { id: newId, planName: "New Plan" }]
  );

  /* 3 ─ launch the player straight away */
  setPlayerPlan(newId);
  setShowPlayer(true);
  setShowOnboard(false);
};

  /* helper goes just above the return or with the other handlers */
const openWizard = () => {
  if (!examType) dispatch(setExamType("NEET")); // <- default for demo
  setShowOnboard(true);                         // open the dialog
};

  /* ─────────────────────────── render */
  return (
    <Box sx={{
      minHeight: "100vh", background: PAGE_BG,
      p: { xs: 3, md: 5 }, fontFamily: "Inter, sans-serif", color: "#f0f0f0"
    }}>

      {/* ── metrics strip ─────────────────────── */}
      <Grid container spacing={2}>
        {stats.map((s, i) => (
          <Grid key={i} item xs={6} md={3}>
            <MotionCard {...lift}
              sx={{ ...CardSX, background: grad(s.g),
                    display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: "rgba(255,255,255,.25)", width: 48, height: 48 }}>
                {s.icon}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{s.val}</Typography>
                <Typography variant="caption">{s.label}</Typography>
              </Box>
            </MotionCard>
          </Grid>
        ))}
      </Grid>

      {/* ───────── MAIN BODY (all rows are inside ONE container) ───────── */}
      <Grid container spacing={3} sx={{ mt: 4 }}>

        {/* Row 1 — Active Plans  (full-width) */}
        <Grid item xs={12}>
          <MotionCard {...lift} sx={CardSX}>
            <Header
              icon={<MenuBookIcon/>}
              text={`Active Plans (${plans.length})`}
              action={plans.length > 0 ? "See All" : null}
              onAction={() => onNavigate("home")}
            />

            {loading && <Typography variant="body2">Loading plans…</Typography>}

            {/* 0-plan hero */}
            {!loading && plans.length === 0 && (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <Avatar sx={{ width: 72, height: 72, mx: "auto",
                               bgcolor: "rgba(255,255,255,.12)" }}>
                  <MenuBookIcon sx={{ fontSize: 40 }}/>
                </Avatar>
                <Typography variant="h6" sx={{ mt: 2, fontWeight: 700 }}>
                  Let’s kick-off your study journey
                </Typography>
                <Typography variant="body2" sx={{ mb: 3, opacity: .8 }}>
                  Build a personalised, day-by-day roadmap in under 3 minutes.
                </Typography>
                <Button
                  size="large" variant="contained" sx={{ fontWeight: 700 }}
                  onClick={openWizard} 
                >
                  Start End-to-End Planner
                </Button>
              </Box>
            )}

            {/* mini-cards when plans exist */}
            {!loading && plans.length > 0 && (
              <Grid container spacing={2}>
                {plans.slice(0, 4).map((p, i) => (
                  <Grid key={p.id} item xs={12} sm={6} md={3}>
                    <MotionCard {...lift}
                      sx={{ ...CardSX, background: grad(GRAD[(i + 2) % GRAD.length]),
                            textAlign: "center" }}>
                      <Avatar sx={{ bgcolor: "rgba(255,255,255,.20)",
                                    width: 56, height: 56, mx: "auto" }}>
                        <MenuBookIcon/>
                      </Avatar>
                      <Typography sx={{ fontWeight: 700, mt: 1 }}>
                        {p.planName || `Plan ${i+1}`}
                      </Typography>
                      <Typography variant="caption">⏰ 60 min/day</Typography>
                      <LinearProgress variant="determinate" value={0}
                        sx={{ mt: 2, height: 5, borderRadius: 3,
                             "& .MuiLinearProgress-bar": { background: "#fff" } }}/>
                    </MotionCard>
                  </Grid>
                ))}
              </Grid>
            )}
          </MotionCard>
        </Grid>

        {/* Row 2 — Recommended Tools  (full-width) */}
        <Grid item xs={12}>
          <MotionCard {...lift} sx={CardSX}>
            <Header
              icon={<BoltIcon/>}
              text="Recommended Tools"
              action="See All"
              onAction={() => onNavigate("tools")}
            />

            <Grid container spacing={2}>
              {tools.map(t => (
                <Grid key={t.id} item xs={12} sm={6} md={3}>
                  <MotionCard {...lift}
                    sx={{ ...CardSX, background: grad(t.g),
                          height: 140, display: "flex", flexDirection: "column",
                          justifyContent: "center", px: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{
                        bgcolor: "rgba(255,255,255,.20)", width: 48, height: 48
                      }}>
                        {t.icon}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography sx={{ fontWeight: 700 }}>{t.lab}</Typography>
                        <Typography variant="caption">{t.sub}</Typography>
                      </Box>
                      <Button
                        size="small" variant="contained"
                        sx={{ bgcolor: "#fff", color: "#000", fontWeight: 700 }}
                      >
                        OPEN
                      </Button>
                    </Stack>
                  </MotionCard>
                </Grid>
              ))}
            </Grid>
          </MotionCard>
        </Grid>

        {/* Row 3 — Profile | Concept Graph  (two-column) */}
        <Grid item xs={12} md={6}>
          <MotionCard {...lift} sx={CardSX}>
            <Header icon={<PersonIcon/>} text="Profile"
                    action="See All Details" onAction={() => onNavigate("profile")} />
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{
                width: 80, height: 80, fontSize: 32,
                bgcolor: grad(GRAD[5]), color: "#fff"
              }}>
                {profile.email[0]?.toUpperCase() || "U"}
              </Avatar>
              <Box>
                <Typography sx={{ fontWeight: 600 }}>{profile.email}</Typography>
                {profile.joined && (
                  <Typography variant="caption" sx={{ display: "flex",
                    alignItems: "center", mt: .5 }}>
                    <CalendarIcon sx={{ fontSize: 14, mr: .5 }}/>
                    Joined · {fmtDate(profile.joined)}
                  </Typography>
                )}
                {examType && <Typography variant="caption">Exam — {examType}</Typography>}
              </Box>
            </Stack>
            <Grid container spacing={2} sx={{ mt: 3 }}>
              <Grid item xs={6}>
                <MiniStat title="Hours Studied"  value="0 h"   grad={grad(GRAD[3])}/>
              </Grid>
              <Grid item xs={6}>
                <MiniStat title="Current Streak" value="1 day" grad={grad(GRAD[1])}/>
              </Grid>
            </Grid>
          </MotionCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <MotionCard {...lift} sx={CardSX}>
            <Header icon={<PublicIcon/>} text="Concept Graph"
                    action="View in Detail" onAction={() => onNavigate("conceptGraph")} />
            <Avatar sx={{
              width: 96, height: 96, mx: "auto", my: 2,
              bgcolor: "rgba(255,255,255,.15)"
            }}>
              <PublicIcon sx={{ fontSize: 60 }}/>
            </Avatar>
            <Typography align="center" variant="body2">
              Visualise how topics connect.<br/>Coming soon – beta preview.
            </Typography>
          </MotionCard>
        </Grid>

      </Grid> {/* ← closes MAIN BODY container */}

      {/* ── Onboarding wizard ── */}
      <Dialog fullScreen open={showOnboard} onClose={() => setShowOnboard(false)}>
        <DialogContent sx={{ p: 0, bgcolor: "#000" }}>
          {showOnboard && (
            <GuideOnboarding
              showCloseBtn
              onClose={() => setShowOnboard(false)}
              onPlanCreated={handlePlanCreated}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Plan-Player ── */}
      <Dialog fullScreen open={showPlayer} onClose={() => setShowPlayer(false)}>
        <DialogContent sx={{ p: 0, bgcolor: "#000" }}>
          {showPlayer && playerPlan && (
            <PlanFetcher
              planId={playerPlan}
              userId={userId}
              initialActivityContext={null}
              onClose={() => setShowPlayer(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

/* ───── small helpers ───── */
function Header({ icon, text, action, onAction }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Avatar sx={{ width: 30, height: 30, bgcolor: "rgba(255,255,255,.15)" }}>
          {icon}
        </Avatar>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>{text}</Typography>
      </Stack>
      {action && (
        <Button size="small" variant="outlined"
          sx={{
            borderColor: "rgba(255,255,255,.4)", color: "#fff",
            textTransform: "none", fontWeight: 600,
            "&:hover": { borderColor: "#fff" }
          }}
          onClick={onAction}
        >
          {action}
        </Button>
      )}
    </Stack>
  );
}
function MiniStat({ title, value, grad: g }) {
  return (
    <Box sx={{ p: 2, borderRadius: 3, background: g, color: "#fff",
               textAlign: "center", lineHeight: 1.1 }}>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>{value}</Typography>
      <Typography variant="caption">{title}</Typography>
    </Box>
  );
}