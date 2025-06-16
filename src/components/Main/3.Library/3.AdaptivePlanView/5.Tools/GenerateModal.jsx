import * as React from "react";
import {
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Slide,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import SmartChatView from "./SmartChatView";
import RapidFireView from "./RapidFireView";
import QuickReviseView from "./QuickReviseView";
import MiniQuizView from "./MiniQuizView";

/* ------------------------------------------------------------------------- */
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

/* map tool.id → component -------------------------------------------------- */
const viewMap = {
  chat: SmartChatView,
  rapid: RapidFireView,
  revise: QuickReviseView,
  quiz: MiniQuizView,
};

/* ------------------------------------------------------------------------- */
const GenerateModal = ({ open, onClose, tool }) => {
  if (!tool) return null;

  const ViewComponent = viewMap[tool.id] ?? (() => null);

  return (
    <Dialog fullScreen open={open} onClose={onClose} TransitionComponent={Transition}>
      <AppBar
        position="relative"
        sx={{
          background: tool.bg,
          boxShadow: "none",
        }}
      >
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {tool.emoji}  {tool.title}
          </Typography>
          <IconButton edge="end" color="inherit" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <ViewComponent />
    </Dialog>
  );
};

export default GenerateModal;