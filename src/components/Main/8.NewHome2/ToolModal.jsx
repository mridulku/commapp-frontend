import * as React from "react";
import {
  Dialog,
  Slide,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Paper,
  Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";



/* ▸ 1.  Import every implemented view
       (adjust the relative path **once** if your folder depth differs) */
import SmartChatView     from "./toolViews/SmartChatView";
import RapidFireView     from "./toolViews/RapidFireView";
import QuickReviseView   from "./toolViews/QuickReviseView";
import MiniQuizView      from "./toolViews/MiniQuizView";
import PlanWizardView    from "./toolViews/PlanWizardView";
import AutoGanttView     from "./toolViews/AutoGanttView";
import LightningQuizView from "./toolViews/LightningQuizView";
import Placeholder       from "./toolViews/__Placeholder";



// ─────────────────────────────────────────────────────────
// File: src/components/Main/8.NewHome2/ToolModal.jsx
// Full-screen modal that shows either a specialised view
// component (if registered) *or* a plain text fallback.
// ─────────────────────────────────────────────────────────




const viewMap = {
  "smart-chat"     : SmartChatView,
  rapid            : RapidFireView,
  revise           : QuickReviseView,
  quiz             : MiniQuizView,
  /* new ids go here … */
};

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function ToolModal({ open, onClose, tool }) {
  if (!tool) return null;

  const View = viewMap[tool.id];      // undefined if not registered

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
    >
      {/* ── Header bar ——————————————————————— */}
      <AppBar position="relative" sx={{ background: tool.bg, boxShadow: "none" }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {tool.emoji} {tool.title}
          </Typography>
          <IconButton edge="end" color="inherit" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* ── Body — specialised view *or* explainer — */}
      {View ? (
        <View />                             /* your rich component */
      ) : (
                <Box sx={{ p: 4 }}>
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              maxWidth: 760,
              mx: "auto",
              background: "#0e0f15",
             color: "#ececec",          // ← add this line
            }}
          >
            <Stack spacing={2}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {tool.description}
              </Typography>

              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  🔬 Concept Intelligence layer
                </Typography>
                <Typography variant="body2">{tool.conceptUse}</Typography>
              </Box>

              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  🧠 Learner Model layer
                </Typography>
                <Typography variant="body2">{tool.learnerUse}</Typography>
              </Box>

              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  💡 What the learner experiences
                </Typography>
                <Typography variant="body2">{tool.userFeel}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Box>
      )}
    </Dialog>
  );
}