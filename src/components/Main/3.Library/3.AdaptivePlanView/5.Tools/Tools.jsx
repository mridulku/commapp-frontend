import * as React from "react";
import {
  Box,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Typography,
} from "@mui/material";
import GenerateModal from "./GenerateModal"; // ⬅️ same folder

/* ------------------------------------------------------------------------- */
/*  Tool data                                                                */
/* ------------------------------------------------------------------------- */
const studyTools = [
  {
    id: "chat",
    title: "Smart Chat",
    emoji: "💬",
    description: "Ask anything about the topic – get instant clarifications.",
    bg: "linear-gradient(135deg,#6ee7b7 0%,#3b82f6 100%)",
  },
  {
    id: "rapid",
    title: "Rapid Fire",
    emoji: "⚡️",
    description: "Blazing-fast drill of key facts & formulas.",
    bg: "linear-gradient(135deg,#fcd34d 0%,#f97316 100%)",
  },
  {
    id: "revise",
    title: "Quick Revise",
    emoji: "🔄",
    description: "Swipe through concise revision cards in minutes.",
    bg: "linear-gradient(135deg,#d8b4fe 0%,#818cf8 100%)",
  },
  {
    id: "quiz",
    title: "Mini Quiz",
    emoji: "❓",
    description: "Five-question quiz to gauge your readiness.",
    bg: "linear-gradient(135deg,#fda4af 0%,#fb7185 100%)",
  },
];

/* ------------------------------------------------------------------------- */
/*  Card used in the grid                                                    */
/* ------------------------------------------------------------------------- */
const ToolCard = ({ tool, onClick }) => (
  <Card
    sx={{
      borderRadius: 4,
      boxShadow: 3,
      transition: "transform .2s ease, box-shadow .2s ease",
      "&:hover": { transform: "translateY(-4px)", boxShadow: 6 },
    }}
  >
    <CardActionArea sx={{ height: "100%" }} onClick={() => onClick(tool)}>
      <Box
        sx={{
          height: 120,
          background: tool.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 56,
        }}
      >
        {tool.emoji}
      </Box>

      <CardContent>
        <Typography variant="h6" component="h3" gutterBottom>
          {tool.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {tool.description}
        </Typography>
      </CardContent>
    </CardActionArea>
  </Card>
);

/* ------------------------------------------------------------------------- */
/*  Main export                                                              */
/* ------------------------------------------------------------------------- */
const Tools = () => {
  const [open, setOpen] = React.useState(false);
  const [selectedTool, setSelectedTool] = React.useState(null);

  const handleOpen = (tool) => {
    setSelectedTool(tool);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedTool(null);
  };

  return (
    <>
      {/* Card grid */}
      <Box sx={{ maxWidth: 1000, mx: "auto", px: 2, py: 4 }}>
        <Typography variant="h4" fontWeight={700} mb={3}>
          Study Tools
        </Typography>

        <Grid container spacing={3}>
          {studyTools.map((tool) => (
            <Grid item xs={12} sm={6} md={3} key={tool.id}>
              <ToolCard tool={tool} onClick={handleOpen} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Full-screen modal */}
      <GenerateModal open={open} onClose={handleClose} tool={selectedTool} />
    </>
  );
};

export default Tools;