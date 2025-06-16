import * as React from "react";
import {
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Grid,
  Card,
  CardActionArea,
  Box,
  CardContent,
  Chip,
  Button,
  Stack,
  Slide,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

const stageColors = {
  Plan:   "#f87171",
  Learn:  "#3b82f6",
  Review: "#818cf8",
  Test:   "#6366f1",
  Sprint: "#ec4899",
};

/* master tool list — same IDs as dashboard */
const TOOLS = [
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

/* slide-up transition */
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function ToolSelectorModal({
  open,
  recommendedToolIds = [],           // pre-selected ON
  onFinish = (ids) => {},
  onClose = () => {},
}) {
  const [selected, setSelected] = React.useState(
    recommendedToolIds.length ? recommendedToolIds : ["planner"]
  );
  const setSel = (ids) => setSelected(ids);
  const toggle = (id) =>
    setSel(
      selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id]
    );

  /* ---------------------------------- */
  const selectedSet = new Set(selected);
  const minOne = selected.length === 0;

  return (
    <Dialog
      fullScreen
      open={open}
      TransitionComponent={Transition}
      PaperProps={{ sx: { bgcolor: "#0f001f", color: "#fff" } }}
    >
      {/* AppBar */}
      <AppBar
        position="relative"
        sx={{
          bgcolor: "rgba(15,0,31,0.9)",
          backdropFilter: "blur(6px)",
        }}
      >
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            Your Starter Toolkit
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Content */}
      <Box sx={{ p: 4, maxWidth: 1200, mx: "auto" }}>
        <Typography variant="subtitle1" sx={{ mb: 4, color: "text.secondary" }}>
          We’ve pre-selected the best tools for your study problems. Toggle any off or on.
        </Typography>

        <Grid container spacing={4}>
          {TOOLS.map((t) => (
            <Grid key={t.id} item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  borderRadius: 4,
                  position: "relative",
                  boxShadow: selectedSet.has(t.id) ? 8 : 3,
                  transform: selectedSet.has(t.id)
                    ? "translateY(-2px)"
                    : "translateY(0)",
                  transition: "all .2s",
                }}
              >
                <CardActionArea
                  onClick={() => toggle(t.id)}
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Box
                    sx={{
                      width: "100%",
                      height: 120,
                      background: t.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 54,
                    }}
                  >
                    {t.emoji}
                  </Box>

                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {t.title}
                    </Typography>

                    <Stack direction="row" spacing={0.5} flexWrap="wrap" mt={1}>
                      {t.categories.map((c) => (
                        <Chip
                          key={c}
                          label={c}
                          size="small"
                          sx={{
                            bgcolor: stageColors[c],
                            color: "#fff",
                            height: 20,
                          }}
                        />
                      ))}
                    </Stack>
                  </CardContent>

                  {/* badge */}
                  {selectedSet.has(t.id) && (
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

        {/* Finish / skip */}
        <Stack direction="row" justifyContent="center" spacing={2} mt={6}>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            disabled={minOne}
            onClick={() => onFinish(selected)}
          >
            Finish & Go to Dashboard
          </Button>
          <Button variant="text" sx={{ color: "#ccc" }} onClick={onClose}>
            Skip for now
          </Button>
        </Stack>
      </Box>
    </Dialog>
  );
}