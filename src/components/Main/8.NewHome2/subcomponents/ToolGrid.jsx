import * as React from "react";
import {
  Grid,
  Card,
  CardActionArea,
  Box,
  CardContent,
  Typography,
  Chip,
  Stack,
} from "@mui/material";
import { Link } from "react-router-dom";

const stageColors = {
  Plan: "#f87171",
  Learn: "#3b82f6",
  Review: "#818cf8",
  Test: "#6366f1",
  Sprint: "#ec4899",
};

const tools = [
  {
    id: "planner",
    emoji: "📅",
    title: "Auto-Gantt Planner",
    bg: "linear-gradient(135deg,#fca5a5 0%,#f87171 100%)",
    categories: ["Plan"],
    progress: "80 %", // mock
  },
  {
    id: "chat",
    emoji: "💬",
    title: "Smart Chat",
    bg: "linear-gradient(135deg,#6ee7b7 0%,#3b82f6 100%)",
    categories: ["Learn", "Review"],
    progress: "12 Qs",
  },
  {
    id: "rapid-fire",
    emoji: "⚡",
    title: "Rapid-Fire Drill",
    bg: "linear-gradient(135deg,#fcd34d 0%,#f97316 100%)",
    categories: ["Learn"],
    progress: "1 min",
  },
  {
    id: "quick-revise",
    emoji: "🔄",
    title: "Quick Revise",
    bg: "linear-gradient(135deg,#d8b4fe 0%,#818cf8 100%)",
    categories: ["Review"],
    progress: "10 cards",
  },
  {
    id: "mock-to-drill",
    emoji: "🧪",
    title: "Mock-to-Drill",
    bg: "linear-gradient(135deg,#a5b4fc 0%,#6366f1 100%)",
    categories: ["Test"],
    progress: "3 gaps",
  },
  {
    id: "sprint",
    emoji: "🚩",
    title: "Red-Zone Sprint",
    bg: "linear-gradient(135deg,#f9a8d4 0%,#ec4899 100%)",
    categories: ["Sprint"],
    progress: "Day 12",
  },
];

const ToolCard = ({ t }) => (
  <Card
    sx={{
      borderRadius: 4,
      boxShadow: 3,
      "&:hover": { boxShadow: 6, transform: "translateY(-2px)" },
    }}
  >
    <CardActionArea
      component={Link}
      to={`/tools/${t.id}`}
      sx={{ textDecoration: "none" }}
    >
      <Box
        sx={{
          height: 110,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 48,
          background: t.bg,
        }}
      >
        {t.emoji}
      </Box>

      <CardContent sx={{ pb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {t.title}
        </Typography>

        <Stack direction="row" spacing={0.5} flexWrap="wrap" mt={0.5}>
          {t.categories.map((c) => (
            <Chip
              key={c}
              label={c}
              size="small"
              sx={{
                bgcolor: stageColors[c],
                color: "#fff",
                fontWeight: 600,
                height: 20,
              }}
            />
          ))}
        </Stack>

        <Typography
          variant="caption"
          sx={{ display: "block", mt: 1, color: "text.secondary" }}
        >
          {t.progress}
        </Typography>
      </CardContent>
    </CardActionArea>
  </Card>
);

export default function ToolGrid() {
  return (
    <Grid container spacing={4}>
      {tools.map((t) => (
        <Grid item xs={12} sm={6} md={4} key={t.id}>
          <ToolCard t={t} />
        </Grid>
      ))}
    </Grid>
  );
}