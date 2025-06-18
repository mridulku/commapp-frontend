// ────────────────────────────────────────────────────────────────
// File: src/components/NewHome2.jsx
// Dark-glass UI • colourful gradient cards • tabs • modal
// ────────────────────────────────────────────────────────────────
import React, { useState } from "react";
import {
  Box, Grid, Card, CardActionArea, CardContent, Avatar,
  Typography, Chip, Stack, Tabs, Tab, Dialog, DialogTitle,
  DialogContent, IconButton
} from "@mui/material";

import ToolModal from "./ToolModal";

import CloseIcon        from "@mui/icons-material/Close";
import { motion }       from "framer-motion";
import { toolCatalog }  from "./toolCatalog";

/* ─── design tokens ─────────────────────────────────────────── */
const PAGE_BG  = "radial-gradient(circle at 35% 0%, #181924 0%, #0e0f15 100%)";
const GLASS_BG = "rgba(255,255,255,.07)";         // fallback for cards w/o bg
const MotionCard = motion(Card);
const lift = { whileHover:{ y:-4, boxShadow:"0 14px 28px rgba(0,0,0,.9)" } };

/* coloured “pill” background per learning stage */
const stageColors = {
  Plan   : "#f87171",
  Learn  : "#3b82f6",
  Review : "#818cf8",
  Test   : "#6366f1",
  Sprint : "#ec4899",
};

/* derive unique category list once ---------------------------------------- */
const uniqueCats = Array.from(
  new Set(toolCatalog.flatMap((t) => t.categories))
).sort((a, b) => a.localeCompare(b));

/* ─── main component ────────────────────────────────────────── */
export default function NewHome2({ recentlyUsedIds=[] }) {
  const [tab,  setTab]  = useState(0);
  const [open, setOpen] = useState(null);            // selected tool object

  /* pick “recent” (or first four) */
  const recent = recentlyUsedIds.length
    ? toolCatalog.filter(t => recentlyUsedIds.includes(t.id)).slice(0,4)
    : toolCatalog.slice(0,4);

  /* tab-filtered grid */
  const curCat = tab === 0 ? "All" : uniqueCats[tab - 1];
  const filtered = curCat==="All"
      ? toolCatalog
      : toolCatalog.filter(t => t.categories.includes(curCat));

  return (
    <Box sx={{
      minHeight:"100vh", background:PAGE_BG, color:"#fff",
      p:{ xs:3, md:5 }, fontFamily:"Inter, sans-serif"
    }}>

      {/* ── recently used ───────────────────────────── */}
      <Typography variant="h5" sx={{ fontWeight:800, mb:2 }}>
        Recently used
      </Typography>
      <Grid container spacing={2} sx={{ mb:5 }}>
        {recent.map(t=>(
          <Grid item xs={12} sm={6} md={3} key={t.id}>
            <ToolCard tool={t} onOpen={()=>setOpen(t)} />
          </Grid>
        ))}
      </Grid>

      {/* ── all tools & tabs ────────────────────────── */}
      <Typography variant="h5" sx={{ fontWeight:800, mb:2 }}>
        All tools
      </Typography>

      <Tabs value={tab} onChange={(_,v)=>setTab(v)}
        variant="scrollable" scrollButtons allowScrollButtonsMobile
        sx={{
          mb:3,
          ".MuiTab-root":{ color:"#bbb" },
          ".Mui-selected":{ color:"#BB86FC" }
        }}>
        <Tab label="All" />
        {uniqueCats.map(c=><Tab key={c} label={c} />)}
      </Tabs>

      <Grid container spacing={4}>
        {filtered.map(t=>(
          <Grid item xs={12} sm={6} md={4} lg={3} key={t.id}>
            <ToolCard tool={t} onOpen={()=>setOpen(t)} />
          </Grid>
        ))}
      </Grid>

            {/* full-screen modal shared by all pages */}
      <ToolModal open={!!open} onClose={()=>setOpen(null)} tool={open} />
    </Box>
  );
}

/* ─── single colourful card ───────────────────────────────── */
function ToolCard({ tool, onOpen }) {
  return (
    <MotionCard {...lift}
      sx={{
        borderRadius:4,
        bgcolor: tool.bg ? "transparent" : GLASS_BG,   // fallback
        backdropFilter:"blur(6px)",
        boxShadow:"0 8px 24px rgba(0,0,0,.55)",
      }}>
      <CardActionArea onClick={onOpen} sx={{ borderRadius:4, overflow:"hidden" }}>

        {/* hero bar with gradient + emoji */}
        <Box sx={{
          height:110, display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:48, background: tool.bg || GLASS_BG
        }}>
          {tool.emoji}
        </Box>

        <CardContent sx={{ pb:2 }}>
          {/* tool name – force white */}
          <Typography variant="subtitle1" sx={{ fontWeight:700, color:"#fff" }}>
            {tool.title}
          </Typography>

          {/* stage chips */}
          <Stack direction="row" spacing={0.5} flexWrap="wrap" mt={0.5}>
            {tool.categories.map(c=>(
              <Chip key={c} label={c} size="small"
                sx={{
                  bgcolor: stageColors[c] || "rgba(255,255,255,.12)",
                  color:"#fff", fontWeight:600, height:20
                }}/>
            ))}
          </Stack>
        </CardContent>
      </CardActionArea>
    </MotionCard>
  );
}