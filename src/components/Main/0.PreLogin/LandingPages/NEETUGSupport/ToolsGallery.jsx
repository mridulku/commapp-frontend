import * as React from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Stack,
} from "@mui/material";
import { Link } from "react-router-dom";   // ⬅️ new

const stageColors = {
  Plan:   "#f87171",
  Learn:  "#3b82f6",
  Review: "#818cf8",
  Test:   "#6366f1",
  Sprint: "#ec4899",
};

/* ----------------------------------------------------------------- */
/*  Tool data  (slugs now match ToolPage registry)                   */
/* ----------------------------------------------------------------- */
const tools = [
  {
    id: "planner",
    emoji: "📅",
    title: "Auto-Gantt Planner",
    bg: "linear-gradient(135deg,#fca5a5 0%,#f87171 100%)",
    categories: ["Plan"],
  },
  {
    id: "chat",
    emoji: "💬",
    title: "Smart Chat",
    bg: "linear-gradient(135deg,#6ee7b7 0%,#3b82f6 100%)",
    categories: ["Learn", "Review"],
  },
  {
    id: "rapid-fire",
    emoji: "⚡",
    title: "Rapid-Fire Drill",
    bg: "linear-gradient(135deg,#fcd34d 0%,#f97316 100%)",
    categories: ["Learn"],
  },
  {
    id: "quick-revise",
    emoji: "🔄",
    title: "Quick Revise",
    bg: "linear-gradient(135deg,#d8b4fe 0%,#818cf8 100%)",
    categories: ["Review"],
  },
  {
    id: "mock-to-drill",
    emoji: "🧪",
    title: "Mock-to-Drill",
    bg: "linear-gradient(135deg,#a5b4fc 0%,#6366f1 100%)",
    categories: ["Test"],
  },
  {
    id: "sprint",
    emoji: "🚩",
    title: "Red-Zone Sprint",
    bg: "linear-gradient(135deg,#f9a8d4 0%,#ec4899 100%)",
    categories: ["Sprint"],
  },
];

/* ----------------------------------------------------------------- */
const ToolCard = ({ t }) => (
  <Card
    sx={{
      borderRadius: 4,
      boxShadow: 3,
      "&:hover": { boxShadow: 6, transform: "translateY(-2px)" },
    }}
  >
    {/* Link turns the whole card into a router navigation */}
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
      </CardContent>
    </CardActionArea>
  </Card>
);

/* ----------------------------------------------------------------- */
export default function ToolsGallery() {
  return (
    <Box sx={{ py: 10, bgcolor: "#0f001f" }}>
      <Container>
        <Typography
          variant="h4"
          sx={{ textAlign: "center", mb: 2, fontWeight: 700 }}
        >
          Where Each Tool Fits in Your Journey
        </Typography>

        <Typography
          variant="subtitle1"
          sx={{ textAlign: "center", mb: 6, color: "text.secondary" }}
        >
          Here’s how our tools attack each hurdle:
        </Typography>

        <Grid container spacing={4}>
          {tools.map((t) => (
            <Grid key={t.id} item xs={12} sm={6} md={4}>
              <ToolCard t={t} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}