import * as React from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BoltIcon from "@mui/icons-material/Bolt";

const StatChip = ({ icon, label, value }) => (
  <Paper
    elevation={3}
    sx={{
      px: 3,
      py: 1.5,
      display: "flex",
      alignItems: "center",
      gap: 1.5,
      bgcolor: "rgba(255,255,255,0.05)",
      borderRadius: 3,
      backdropFilter: "blur(6px)",
    }}
  >
    {icon}
   <Typography variant="subtitle2" sx={{ opacity: 0.8, color:"#fff" }}>
      {label}
    </Typography>
    <Typography variant="h6" sx={{ fontWeight: 700, color:"#fff" }}>
      {value}
    </Typography>
  </Paper>
);

export default function HomeTicker() {
  /* mocked data – replace with hooks later */
  const streak = 7;
  const tasksDone = 3;
  const tasksTotal = 5;
  const xpToday = 120;

  return (
    <Box
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 1200,
        p: 2,
        bgcolor: "rgba(15,0,31,0.8)",
        borderBottom: "1px solid #24133c",
        backdropFilter: "blur(8px)",
      }}
    >
      <Stack direction="row" spacing={2} justifyContent="center">
        <StatChip
          icon={<EmojiEventsIcon sx={{ color: "#FFD700" }} />}
          label="Streak"
          value={streak}
        />
        <StatChip
          icon={<AccessTimeIcon sx={{ color: "#6ee7b7" }} />}
          label="Tasks"
          value={`${tasksDone}/${tasksTotal}`}
        />
        <StatChip
          icon={<BoltIcon sx={{ color: "#fcd34d" }} />}
          label="XP"
          value={`+${xpToday}`}
        />
      </Stack>
    </Box>
  );
}