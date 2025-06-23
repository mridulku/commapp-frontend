// ────────────────────────────────────────────────────────────────
//  File: src/components/HomeHub.jsx          (2025-06-19 demo build)
//  ▸ Metrics strip
//  ▸ Your Study Plans row
//  ▸ NEW  Mini-Tools carousel with category tabs
//  ▸ Profile + Concept Graph
//  ▸ GuideOnboarding / PlanPlayer dialogs
// ────────────────────────────────────────────────────────────────
import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Box, Grid, Card, Typography, Button, Avatar, Stack,
  LinearProgress, Dialog, DialogContent, IconButton, Chip, Tabs, Tab,  Tooltip 
} from "@mui/material";
import { motion } from "framer-motion";
import axios      from "axios";

/* icons */
import AccessTimeIcon   from "@mui/icons-material/AccessTime";
import FlagIcon         from "@mui/icons-material/Flag";
import TimelapseIcon    from "@mui/icons-material/Timelapse";
import WhatshotIcon     from "@mui/icons-material/Whatshot";
import MenuBookIcon     from "@mui/icons-material/AutoStories";
import BoltIcon         from "@mui/icons-material/FlashOn";
import PersonIcon       from "@mui/icons-material/Person";
import CalendarIcon     from "@mui/icons-material/CalendarMonth";
import PublicIcon       from "@mui/icons-material/Public";
import ArrowBackIos     from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIos  from "@mui/icons-material/ArrowForwardIos";

/* redux */
import { useDispatch, useSelector } from "react-redux";
import { setExamType } from "../../../store/examSlice";
import { setAuth }     from "../../../store/authSlice";

/* study-plan wizard & player */
import GuideOnboarding from "../5.StudyModal/0.components/Main/Base/Guide/GuideOnboarding";
import PlanFetcher     from "../5.StudyModal/StudyModal";

/* tools master list (used on the dedicated Tools page) */
import { toolCatalog } from "../8.NewHome2/toolCatalog";   // ⚠ adjust path


/* ─── Concept-graph mini stats ─────────────────────────────── */
const TOTAL_CONCEPTS = 3421;                // NEET-2026 grand total
const SUBJECTS = [
  { id: "phy",  name: "Physics",   count: 1240, grad: ["#818cf8", "#d8b4fe"] },
  { id: "chem", name: "Chemistry", count: 1180, grad: ["#6366f1", "#a5b4fc"] },
  { id: "bio",  name: "Biology",   count: 1001, grad: ["#3b82f6", "#6ee7b7"] },
];


/* ─── shared design tokens ───────────────────────────────────── */
const GRAD = [
  ["#f87171", "#fca5a5"], ["#ec4899", "#f9a8d4"], ["#818cf8", "#d8b4fe"],
  ["#6366f1", "#a5b4fc"], ["#3b82f6", "#6ee7b7"], ["#f59e0b", "#fde68a"],
];
const grad = ([a,b]) => `linear-gradient(135deg,${a} 0%,${b} 100%)`;
const PAGE_BG = "radial-gradient(circle at 35% 0%, #181924 0%, #0e0f15 100%)";
const GLASS   = "rgba(255,255,255,.06)";
const CardSX  = { borderRadius:4, p:3, bgcolor:GLASS,
                  backdropFilter:"blur(6px)",
                  boxShadow:"0 8px 24px rgba(0,0,0,.55)", color:"#f0f0f0" };
const MotionCard = motion(Card);
const lift = { whileHover:{ y:-4, boxShadow:"0 12px 28px rgba(0,0,0,.85)" } };

/* colour chips for categories */
const stageColors = {
  Plan:"#f87171", Learn:"#3b82f6", Diagnose:"#818cf8",
  Test:"#6366f1", Sprint:"#ec4899",
};

/* canonical tab order + emoji */
const ORDER     = ["Plan","Learn","Diagnose","Test","Sprint"];
const TAB_EMOJI = { Plan:"🗺️", Learn:"📖", Diagnose:"🔍", Test:"📝", Sprint:"⚡",
                    Recent:"🕑", All:"🔢" };

/* ═════════════════════════  Mini-Tools carousel  ═══════════════════════ */

/* ═════════════════════════  Mini-Tools carousel  ══════════════════════ */
/* ═════════════════════════  Mini-Tools carousel  ═════════════════════ */
function ToolsStrip({ onOpenTool }) {
  /* —— tab list —— */
  const extraCats = Array.from(
    new Set(toolCatalog.flatMap(t => t.categories)
                       .filter(c => !ORDER.includes(c)))
  ).sort();
  const tabs = [...ORDER, ...extraCats, "All"];
  const [tab, setTab] = useState(0);

  /* —— filter —— */
  const cat = tabs[tab];
  const filtered =
    cat === "All"
      ? toolCatalog
      : toolCatalog.filter(t => t.categories.includes(cat));

  /* —— rail scroll —— */
  const rail = useRef(null);
  const scrollBy = dir =>
    rail.current?.scrollBy({ left: dir * 320, behavior: "smooth" });

  /* —— helper to order stage chips —— */
  const sortCats = cats =>
    [...cats].sort((a, b) => {
      const ai = ORDER.indexOf(a);
      const bi = ORDER.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

  /* —— mini card —— */
  const ToolCardMini = ({ tool }) => {
    const cats = sortCats(tool.categories);
    const shown = cats.slice(0, 3);
    const overflow = cats.length - shown.length;

    return (
      <MotionCard
        {...lift}
        onClick={() => onOpenTool(tool)}
        sx={{
          width: 300,
          flex: "0 0 auto",
          mr: 3,
          borderRadius: 4,
          cursor: "pointer",
          bgcolor: tool.bg ? "transparent" : GLASS,
          backdropFilter: "blur(6px)",
        }}
      >
        {/* hero bar */}
        <Box
          sx={{
            height: 110,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 48,
            background: tool.bg || GLASS,
          }}
        >
          {tool.emoji}
        </Box>

        {/* body */}
        <Box sx={{ px: 2, pt: 1.5, pb: 2 }}>
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 700, color: "#fff", mb: 0.4 }}
          >
            {tool.title}
          </Typography>

          {!!tool.blurb && (
            <Typography
              variant="caption"
              sx={{
                color: "#ccc",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                minHeight: 34, // reserve 2 lines so cards equalise
              }}
            >
              {tool.blurb}
            </Typography>
          )}

          {/* stage chips */}
          <Stack direction="row" spacing={0.5} mt={0.8} flexWrap="wrap">
            {shown.map(c => (
              <Chip
                key={c}
                label={c}
                size="small"
                sx={{
                  height: 18,
                  bgcolor: stageColors[c] || "rgba(255,255,255,.12)",
                  color: "#fff",
                  fontWeight: 600,
                }}
              />
            ))}

            {overflow > 0 && (
              <Tooltip title={cats.slice(3).join(", ")}>
                <Chip
                  label={`+${overflow} more`}
                  size="small"
                  sx={{
                    height: 18,
                    bgcolor: "rgba(255,255,255,.12)",
                    color: "#fff",
                    fontWeight: 600,
                  }}
                />
              </Tooltip>
            )}
          </Stack>
        </Box>
      </MotionCard>
    );
  };

  /* —— render —— */
  return (
    <Box sx={{ mt: 2 }}>
      {/* tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          mb: 2,
          ".MuiTab-root": { textTransform: "none", fontWeight: 700, color: "#ddd" },
          ".Mui-selected": { color: "#4FC3F7" },
          ".MuiTabs-indicator": { backgroundColor: "#4FC3F7" },
        }}
      >
        {tabs.map(label => (
          <Tab
            key={label}
            label={
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {TAB_EMOJI[label] || "📌"} {label}
              </span>
            }
          />
        ))}
      </Tabs>

      {/* rail + arrows */}
      <Box sx={{ position: "relative" }}>
        {/* left */}
        <IconButton
          size="small"
          onClick={() => scrollBy(-1)}
          sx={{
            position: "absolute",
            left: -28,
            top: "50%",
            transform: "translateY(-50%)",
            bgcolor: "#0008",
            backdropFilter: "blur(6px)",
            "&:hover": { bgcolor: "#000c" },
            zIndex: 2,
          }}
        >
          <ArrowBackIos fontSize="inherit" />
        </IconButton>

        {/* rail */}
        <Box
          ref={rail}
          sx={{
            display: "flex",
            overflowX: "auto",
            pr: 1,
            pb: 1,
            scrollBehavior: "smooth",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {filtered.map(t => (
            <ToolCardMini key={t.id} tool={t} />
          ))}
        </Box>

        {/* right */}
        <IconButton
          size="small"
          onClick={() => scrollBy(1)}
          sx={{
            position: "absolute",
            right: -28,
            top: "50%",
            transform: "translateY(-50%)",
            bgcolor: "#0008",
            backdropFilter: "blur(6px)",
            "&:hover": { bgcolor: "#000c" },
            zIndex: 2,
          }}
        >
          <ArrowForwardIos fontSize="inherit" />
        </IconButton>
      </Box>
    </Box>
  );
}
/* ═════════════════════════════════════════════════════════════ */


/* ══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════ */

/*  Stats data & small helpers … (unchanged) */
const stats = [
  { icon: <AccessTimeIcon/>, label: "Time Today",     val: "0 m",   g: GRAD[0] },
  { icon: <FlagIcon/>,       label: "Today's Target", val: "0 %",   g: GRAD[1] },
  { icon: <TimelapseIcon/>,  label: "Total Studied",  val: "0 h",   g: GRAD[2] },
  { icon: <WhatshotIcon/>,   label: "Current Streak", val: "1 day", g: GRAD[3] },
];

const fmtDate = d => d?.toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"});

/* ────────────────────────────────────────────────────────────
                MAIN COMPONENT
──────────────────────────────────────────────────────────── */
export default function HomeHub({ userId, onNavigate = ()=>{} }) {


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

/* helper: jump to the MaterialsDashboard and (optionally) pre-select a plan */
const goToPlans = (planId = null) => {
  // for backward-compat leave the 1-arg signature untouched
  //        page --------v          extra payload ----v
  if (typeof onNavigate === "function") onNavigate("home", { planId });
};


  /* helper goes just above the return or with the other handlers */
const openWizard = () => {
  if (!examType) dispatch(setExamType("NEET")); // <- default for demo
  setShowOnboard(true);                         // open the dialog
};


  return (
    <Box sx={{
      minHeight:"100vh", background:PAGE_BG, color:"#f0f0f0",
      p:{ xs:3, md:5 }, fontFamily:"Inter, sans-serif"
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
              text={`Your Study Plans (${plans.length})`}
              action={plans.length > 0 ? "See All" : null}
      onAction={() => goToPlans()}        
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
                            textAlign: "center", cursor:"pointer" }}
                            onClick={() => goToPlans(p.id)} >
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

        {/* Row 2 — Study Tools  (NEW carousel) */}
        <Grid item xs={12}>
          <MotionCard {...lift} sx={CardSX}>
            <Header
              icon={<BoltIcon/>}
              text="Study Tools"
              action="See All"
              onAction={()=>onNavigate("tools")}
            />

            {/* NEW reusable strip */}
            <ToolsStrip onOpenTool={()=>onNavigate("tools")} />
          </MotionCard>
        </Grid>

        {/* Row 3 — Profile | Concept Graph  (two-column) */}
        <Grid item xs={12} md={6}>
          <MotionCard {...lift} sx={CardSX}>
            <Header icon={<PersonIcon/>} text="My Profile"
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
    <Header
      icon={<PublicIcon />}
      text="Concept Graph"
      action="View in Detail"
      onAction={() => onNavigate("conceptGraph")}
    />

    {/* ——— mini dashboard ——— */}
    <Typography
      variant="h2"
      align="center"
      sx={{ fontWeight: 800, mt: 1 }}
    >
      {TOTAL_CONCEPTS.toLocaleString()}
    </Typography>
    <Typography
      align="center"
      sx={{ opacity: 0.8, mb: 2 }}
    >
      Total Concepts&nbsp;•&nbsp;<b>NEET 2026</b>
    </Typography>

    {/* subject breakdown */}
    <Grid container spacing={1} justifyContent="center">
      {SUBJECTS.map(s => (
        <Grid item xs={4} key={s.id}>
          <MotionCard
            {...lift}
            sx={{
              ...CardSX,
              background: grad(s.grad),
              py: 1.5,
              textAlign: "center",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {s.count}
            </Typography>
            <Typography variant="caption">{s.name}</Typography>
          </MotionCard>
        </Grid>
      ))}
    </Grid>
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



