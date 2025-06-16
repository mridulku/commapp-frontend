import * as React from "react";
import {
  Box,
  Grid,
  Card,
  CardActionArea,
  Typography,
  Button,
  Stack,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PsychologyIcon from "@mui/icons-material/Psychology";
import ChatBubbleIcon from "@mui/icons-material/ChatBubble";
import ScienceIcon from "@mui/icons-material/Science";
import FlagIcon from "@mui/icons-material/Flag";

const painList = [
  {
    id: "no_schedule",
    title: "No Study Schedule",
    subtitle: "I keep cramming at the last minute.",
    icon: <CalendarMonthIcon sx={{ fontSize: 48 }} />,
    bg: "linear-gradient(135deg,#fca5a5 0%,#f87171 100%)",
    tool: "planner",
  },
  {
    id: "forget_fast",
    title: "Forget Fast",
    subtitle: "Concepts slip away in days.",
    icon: <PsychologyIcon sx={{ fontSize: 48 }} />,
    bg: "linear-gradient(135deg,#d8b4fe 0%,#818cf8 100%)",
    tool: "quick-revise",
  },
  {
    id: "need_answers",
    title: "Need Quick Answers",
    subtitle: "Stuck with no teacher around.",
    icon: <ChatBubbleIcon sx={{ fontSize: 48 }} />,
    bg: "linear-gradient(135deg,#6ee7b7 0%,#3b82f6 100%)",
    tool: "chat",
  },
  {
    id: "gaps_after_mocks",
    title: "Can’t Fix Mock Gaps",
    subtitle: "Repeat the same mistakes.",
    icon: <ScienceIcon sx={{ fontSize: 48 }} />,
    bg: "linear-gradient(135deg,#a5b4fc 0%,#6366f1 100%)",
    tool: "mock-to-drill",
  },
  {
    id: "panic_sprint",
    title: "Exam Panic",
    subtitle: "Which high-weight topics first?",
    icon: <FlagIcon sx={{ fontSize: 48 }} />,
    bg: "linear-gradient(135deg,#f9a8d4 0%,#ec4899 100%)",
    tool: "sprint",
  },
];

export default function ProblemPicker({
  maxSelect = 3,
  onContinue = (selectedIds) => console.log("Picked:", selectedIds),
}) {
  const [selected, setSelected] = React.useState([]);

  function toggle(id) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((p) => p !== id)
        : prev.length < maxSelect
        ? [...prev, id]
        : prev
    );
  }

  const selectedSet = new Set(selected);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#0f001f",
        color: "#fff",
        py: 8,
        px: 2,
      }}
    >
      <Box sx={{ maxWidth: 960, mx: "auto", textAlign: "center", mb: 6 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          What’s holding you back?
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          Select up to {maxSelect} problems. We’ll tailor your tools.
        </Typography>
      </Box>

      <Grid container spacing={4} sx={{ maxWidth: 1100, mx: "auto" }}>
        {painList.map((p) => (
          <Grid key={p.id} item xs={12} sm={6} md={4}>
            <Card
              sx={{
                borderRadius: 4,
                position: "relative",
                boxShadow: selectedSet.has(p.id) ? 8 : 3,
                transform: selectedSet.has(p.id)
                  ? "translateY(-2px)"
                  : "translateY(0)",
                transition: "all .2s",
              }}
            >
              <CardActionArea
                onClick={() => toggle(p.id)}
                sx={{ height: "100%", display: "flex", flexDirection: "column" }}
              >
                <Box
                  sx={{
                    width: "100%",
                    height: 120,
                    background: p.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {p.icon}
                </Box>

                <Box sx={{ flexGrow: 1, p: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {p.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "text.secondary", mt: 0.5 }}
                  >
                    {p.subtitle}
                  </Typography>
                </Box>

                {selectedSet.has(p.id) && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      bgcolor: "#FFD700",
                    }}
                  />
                )}
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Continue button */}
      <Stack direction="row" justifyContent="center" mt={6}>
        <Button
          variant="contained"
          color="secondary"
          size="large"
          disabled={selected.length === 0}
          onClick={() => onContinue(selected)}
        >
          Continue
        </Button>
      </Stack>
    </Box>
  );
}