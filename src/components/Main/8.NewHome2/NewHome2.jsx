// ────────────────────────────────────────────────────────────────
// File: src/components/NewHome2.jsx          (2025-06-19 demo build • v3)
// Grid of colourful “mini-tools” + End-to-End planner flow
// ────────────────────────────────────────────────────────────────
import React, { useState, useMemo, useEffect } from "react";
import {
  Box, Grid, Card, CardActionArea, CardContent, Typography,
  Chip, Stack, Tabs, Tab, Dialog, DialogContent, Tooltip     // ← added Tooltip
} from "@mui/material";
import { motion }        from "framer-motion";
import { useSelector, useDispatch } from "react-redux";

import ToolModal         from "./ToolModal";
import { toolCatalog }   from "./toolCatalog";

import GuideOnboarding   from "../5.StudyModal/0.components/Main/Base/Guide/GuideOnboarding";
import PlanFetcher       from "../5.StudyModal/StudyModal";
import { setExamType }   from "../../../store/examSlice";
import { setAuth }       from "../../../store/authSlice";


// ── NewHome2.jsx  (just after the other React imports)

// …inside the component function


/* ─── design tokens ─────────────────────────────────────────── */
const PAGE_BG  = "radial-gradient(circle at 35% 0%, #181924 0%, #0e0f15 100%)";
const GLASS_BG = "rgba(255,255,255,.07)";
const MotionCard = motion(Card);
const lift = { whileHover:{ y:-4, boxShadow:"0 14px 28px rgba(0,0,0,.9)" } };

/* pill colour per learning stage */
const stageColors = {
  Plan:"#f87171", Learn:"#3b82f6", Diagnose:"#818cf8",
  Test:"#6366f1", Sprint:"#ec4899"
};

/* canonical tab order + emoji */
const ORDER = ["Plan","Learn","Diagnose","Test","Sprint"];
const TAB_EMOJI = {
  Recent:"🕑", Plan:"🗺️", Learn:"📖", Diagnose:"🔍",
  Test:"📝",  Sprint:"⚡", All:"🔢"
};

/* ─────────────────────────────────────────────────────────── */
export default function NewHome2({ userId="", recentlyUsedIds=[] }) {

  /* ---------- redux bootstrapping for the planner flow ---------- */
  const dispatch  = useDispatch();
  const examType  = useSelector(s => s.exam.examType);

  useEffect(() => {
  // make sure the page always starts at the top when this screen mounts
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
}, []);

  useEffect(()=>{ if (userId) dispatch(setAuth({ userId })); }, [userId,dispatch]);
  const ensureExamType = () => { if (!examType) dispatch(setExamType("NEET")); };

  /* ---------- derive categories & recent ---------- */
  const recent = useMemo(
    () => (recentlyUsedIds.length
           ? toolCatalog.filter(t=>recentlyUsedIds.includes(t.id)).slice(0,4)
           : []),
    [recentlyUsedIds]
  );
  const extraCats = Array.from(
    new Set(toolCatalog.flatMap(t=>t.categories).filter(c=>!ORDER.includes(c)))
  ).sort((a,b)=>a.localeCompare(b));

  const categories = [...(recent.length?["Recent"]:[]), ...ORDER, ...extraCats, "All"];

  /* ---------- local UI state ---------- */
  const [tab,        setTab]        = useState(0);
  const [dlg,        setDlg]        = useState(null);  // generic tool modal
  const [showOnboard,setShowOnboard]= useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [playerPlan, setPlayerPlan] = useState(null);

  /* ---------- click helper ---------- */
  const handleCardClick = (tool) => {
    if (tool.id === "e2e_planner") {  // launch the planner flow
      ensureExamType();
      setShowOnboard(true);
    } else {
      setDlg(tool);
    }
  };
  const handlePlanCreated = (newId) => {
    if (!newId) { setShowOnboard(false); return; }
    setPlayerPlan(newId);
    setShowPlayer(true);
    setShowOnboard(false);
  };

  /* ---------- filter list for the active tab ---------- */
  const curCat   = categories[tab];
  const filtered =
        curCat==="All"    ? toolCatalog :
        curCat==="Recent" ? recent      :
        toolCatalog.filter(t=>t.categories.includes(curCat));

  /* ─────────────────────────────────── render ─────────────────────────────────── */
  return (
    <Box sx={{
      minHeight:"100vh", background:PAGE_BG, color:"#fff",
      p:{ xs:3, md:5 }, fontFamily:"Inter, sans-serif"
    }}>

      <Typography variant="h4" sx={{ fontWeight:800, mb:2 }}>
        Mini&nbsp;Tools
      </Typography>

      {/* tab strip */}
      <Tabs
        value={tab}
        onChange={(_,v)=>setTab(v)}
        variant="scrollable"
        scrollButtons
        allowScrollButtonsMobile
        sx={{
          mb:3,
          ".MuiTab-root":  { color:"#bbb", fontWeight:600, textTransform:"none" },
          ".Mui-selected": { color:"#BB86FC" }
        }}
      >
        {categories.map(lbl=>(
          <Tab key={lbl}
               label={<span style={{display:"flex",alignItems:"center",gap:6}}>
                        {TAB_EMOJI[lbl]||"📌"} {lbl}
                      </span>}
               wrapped={false}/>
        ))}
      </Tabs>

      {/* grid */}
      <Grid container spacing={4}>
        {filtered.map(t=>(
          <Grid item xs={12} sm={6} md={4} lg={3} key={t.id}>
            <ToolCard tool={t} onOpen={()=>handleCardClick(t)} />
          </Grid>
        ))}
      </Grid>

      {/* dialogs */}
      <ToolModal      open={!!dlg} onClose={()=>setDlg(null)} tool={dlg}/>
      <Dialog fullScreen open={showOnboard} onClose={()=>setShowOnboard(false)}>
        <DialogContent sx={{ p:0, bgcolor:"#000" }}>
          {showOnboard && (
            <GuideOnboarding showCloseBtn
                             onClose={()=>setShowOnboard(false)}
                             onPlanCreated={handlePlanCreated}/>
          )}
        </DialogContent>
      </Dialog>
      <Dialog fullScreen open={showPlayer} onClose={()=>setShowPlayer(false)}>
        <DialogContent sx={{ p:0, bgcolor:"#000" }}>
          {showPlayer && playerPlan && (
            <PlanFetcher planId={playerPlan} userId={userId}
                         initialActivityContext={null}
                         onClose={()=>setShowPlayer(false)}/>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

/* ───────────────────────── mini card ───────────────────────── */
function ToolCard({ tool, onOpen }) {
  /* show at most 2 coloured chips, then a “+ n more” grey chip  */
  const MAX_COLOURED = 2;
  const shown   = tool.categories.slice(0, MAX_COLOURED);
  const hidden  = tool.categories.slice(MAX_COLOURED);
  const extraN  = hidden.length;

 
  const isPlanner = tool.id === "e2e_planner";

  return (
    <MotionCard {...lift}
      sx={{ position:"relative",                /* ⬅️ allow absolute-pos pill   */
            borderRadius:4,
            bgcolor:tool.bg ? "transparent" : GLASS_BG,
            backdropFilter:"blur(6px)",
            boxShadow:"0 8px 24px rgba(0,0,0,.55)" }}>

      {/* ▸ COMING-SOON PILL  ─────────────── */}
      {!isPlanner && (
        <Chip
          label="Coming soon"
          size="small"
          sx={{
            position:"absolute",
            top:8,
            right:8,
            bgcolor:"#ffc107",
            color:"#000",
            fontWeight:700,
            height:18,
            fontSize:10,
                        px:0.8,
            zIndex:10,          // ⬅️ sits above CardActionArea
            pointerEvents:"none"// ⬅️ keeps underlying click behaviour
          }}
        />
      )}

      <CardActionArea onClick={onOpen} sx={{ borderRadius:4, overflow:"hidden" }}>

        {/* hero */}
        <Box sx={{
          height:110, display:"flex", alignItems:"center",
          justifyContent:"center", fontSize:48,
          background:tool.bg||GLASS_BG }}>
          {tool.emoji}
        </Box>

        <CardContent sx={{ pb:2 }}>
          <Typography variant="subtitle1"
                      sx={{ fontWeight:700, color:"#fff" }}>
            {tool.title}
          </Typography>

          {tool.blurb && (
            <Typography variant="caption"
                        sx={{ color:"#ccc", display:"block", mt:.3 }}>
              {tool.blurb}
            </Typography>
          )}

          {/* chips */}
          <Box sx={{ display:"flex", flexWrap:"wrap", gap:.5, mt:.75 }}>
            {shown.map(c=>(
              <Chip key={c} label={c} size="small"
                    sx={{ bgcolor:stageColors[c]||"rgba(255,255,255,.12)",
                          color:"#fff", fontWeight:600, height:20 }}/>
            ))}

            {extraN>0 && (
              <Tooltip title={hidden.join(", ")}>
                <Chip label={`+${extraN} more`} size="small"
                      sx={{ bgcolor:"rgba(255,255,255,.15)",
                            color:"#fff", fontWeight:600, height:20 }}/>
              </Tooltip>
            )}
          </Box>
        </CardContent>
      </CardActionArea>
    </MotionCard>
  );
}