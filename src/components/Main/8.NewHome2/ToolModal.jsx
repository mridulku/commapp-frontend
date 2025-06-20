// ─────────────────────────────────────────────────────────
// File: src/components/Main/8.NewHome2/ToolModal.jsx
// (drop-in replacement)
// ─────────────────────────────────────────────────────────
import * as React from "react";
import {
  Dialog, Slide, AppBar, Toolbar, IconButton, Typography,
  Box, Stack, Chip, Grid, Paper
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

/* — your specialised views (unchanged) — */
import SmartChatView     from "./toolViews/SmartChatView";
import RapidFireView     from "./toolViews/RapidFireView";
import QuickReviseView   from "./toolViews/QuickReviseView";
import MiniQuizView      from "./toolViews/MiniQuizView";
import PlanWizardView    from "./toolViews/PlanWizardView";
import AutoGanttView     from "./toolViews/AutoGanttView";
import LightningQuizView from "./toolViews/LightningQuizView";

/* colour per learning stage — keep in sync with NewHome2 */
const stageColors = {
  Plan:"#f87171", Learn:"#3b82f6", Diagnose:"#818cf8",
  Test:"#6366f1", Sprint:"#ec4899", Reinforce:"#10b981"
};

/* map ids ➜ specialised react views (unchanged) */
const viewMap = {
  "e2e_planner": PlanWizardView,
  
};

const Transition = React.forwardRef((props, ref) =>
  <Slide direction="up" ref={ref} {...props} />
);

export default function ToolModal({ open, onClose, tool }) {
  if (!tool) return null;
  const View = viewMap[tool.id];

  return (

    <Dialog fullScreen open={open} onClose={onClose}
            TransitionComponent={Transition}>

      {/* 🔸 No more AppBar – we add a floating X instead */}
      <IconButton onClick={onClose}
                  sx={{
                    position:"fixed", zIndex:10, top:{xs:12, md:20},
                    right:{xs:12, md:24}, bgcolor:"rgba(0,0,0,.55)",
                    "&:hover":{ bgcolor:"rgba(0,0,0,.75)" },
                    color:"#fff"
                  }}>
        <CloseIcon/>
      </IconButton>

      {/* BODY */}
      {View ? <View/> : <FallbackExplainer tool={tool}/> }
    </Dialog>
  ); }
/* ───────────────────────── fallback view ────────────────────── */
function FallbackExplainer({ tool }) {
  return (
    <Box sx={{ px:{xs:2,md:6}, pt:6, pb:10, background:"#000", minHeight:"100%" }}>
      {/* HERO + Coming soon + blurb + chips */}
      <Box sx={{
        position:"relative", mb:6, borderRadius:2, overflow:"hidden",
        background:"linear-gradient(135deg,#ef4444 0%,#f87171 50%,#fb923c 100%)",
        p:{xs:3,md:5}
      }}>
        <Stack spacing={2}>
          <Typography variant="h3" sx={{ fontWeight:800 }}>
            {tool.emoji} {tool.title}
          </Typography>

          <Typography variant="subtitle1" sx={{ maxWidth:700 }}>
            {tool.description ?? tool.blurb}
          </Typography>

          <Stack direction="row" spacing={1}>
            {tool.categories?.slice(0,6).map(c=>(
              <Chip key={c} label={c} size="small"
                    sx={{
                      bgcolor:stageColors[c]??"rgba(255,255,255,.15)",
                      color:"#fff", fontWeight:600, height:22
                    }}/>
            ))}
          </Stack>
        </Stack>

        <Chip label="Coming Soon"
              sx={{
                position:"absolute", top:16, right:16,
                bgcolor:"#fff", color:"#000", fontWeight:700
              }}/>
      </Box>

      {/* THREE EXPLAINER CARDS */}
      <Grid container spacing={3}>
        <ExplainerCard
          icon="🔬"
          title="Concept-Intelligence layer"
          text={tool.conceptUse ||
                "Pulls prerequisite chains, weights & hot-zones."}
        />
        <ExplainerCard
          icon="🧠"
          title="Learner-Model layer"
          text={tool.learnerUse ||
                "Reads your vector & writes progress back."}
        />
        <ExplainerCard
          icon="💡"
          title="What you’ll feel"
          text={tool.userFeel ||
                "Feels like a mentor handing you exactly what’s next."}
        />
      </Grid>
    </Box>
  );
}

/* mini card */
function ExplainerCard({ icon, title, text }) {
  return (
    <Grid item xs={12} md={4}>
      <Paper elevation={0} sx={{
        p:3, height:"100%", bgcolor:"#0e0f15", color:"#ececec",
        border:"1px solid rgba(255,255,255,.12)", borderRadius:3
      }}>
        <Stack spacing={1}>
          <Typography variant="h3">{icon}</Typography>
          <Typography variant="subtitle1" sx={{ fontWeight:700 }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ opacity:.9 }}>{text}</Typography>
        </Stack>
      </Paper>
    </Grid>
  );
}