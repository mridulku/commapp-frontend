import * as React from "react";
import {
  Box,
  Grid,
  Card,
  CardActionArea,
  Typography,
  Button,
  Stack,
  Chip,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PsychologyIcon    from "@mui/icons-material/Psychology";
import ChatBubbleIcon     from "@mui/icons-material/ChatBubble";
import ScienceIcon        from "@mui/icons-material/Science";
import FlagIcon           from "@mui/icons-material/Flag";

/* -------------------------------- Pain definitions --------------------- */
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

/* -------------------------------- All tools --------------------------- */
const allTools = {
  planner:      { title: "Auto-Gantt Planner", emoji: "📅" },
  "quick-revise": { title: "Quick Revise",      emoji: "🔄" },
  chat:         { title: "Smart Chat",         emoji: "💬" },
  "mock-to-drill": { title: "Mock-to-Drill",    emoji: "🧪" },
  sprint:       { title: "Red-Zone Sprint",    emoji: "🚩" },
};

export default function ProblemPicker({
  maxSelect    = 3,
  onFinish     = (toolIds) => console.log("Finish:", toolIds),
}) {
  const [step, setStep]           = React.useState(1);          // 1 or 2
  const [selectedPains, setPains] = React.useState([]);
  const [toolSet, setToolSet]     = React.useState(new Set()); // toggles in step 2

  /* ---------- helpers ---------- */
  function togglePain(id) {
    setPains((prev) =>
      prev.includes(id)
        ? prev.filter((p) => p !== id)
        : prev.length < maxSelect
        ? [...prev, id]
        : prev
    );
  }

  function gotoStep2() {
    /* derive tools from pains */
    const initial = new Set(selectedPains.map((pid) => {
      const pain = painList.find((p) => p.id === pid);
      return pain?.tool;
    }));
    setToolSet(initial);
    setStep(2);
  }

  function toggleTool(id) {
    setToolSet((prev) =>
      prev.has(id) ? new Set([...prev].filter((t) => t !== id))
                   : new Set(prev).add(id)
    );
  }

  /* ---------- UI ---------- */
  return (
    <Box sx={{ minHeight:"100vh", bgcolor:"#0f001f", color:"#fff", py:8, px:2 }}>
      {step === 1 && (
        <>
          <Box sx={{ maxWidth:960, mx:"auto", textAlign:"center", mb:6 }}>
            <Typography variant="h4" sx={{ fontWeight:800, mb:1 }}>
              What’s holding you back?
            </Typography>
            <Typography variant="body1" sx={{ color:"text.secondary" }}>
              Select up to {maxSelect} problems. We’ll tailor your tools.
            </Typography>
          </Box>

          <Grid container spacing={4} sx={{ maxWidth:1100, mx:"auto" }}>
            {painList.map((p) => {
              const chosen = selectedPains.includes(p.id);
              return (
                <Grid key={p.id} item xs={12} sm={6} md={4}>
                  <Card
                    sx={{
                      borderRadius:4, position:"relative",
                      boxShadow: chosen ? 8 : 3,
                      transform: chosen ? "translateY(-2px)" : "translateY(0)",
                      transition:"all .2s",
                    }}
                  >
                    <CardActionArea
                      onClick={() => togglePain(p.id)}
                      sx={{ height:"100%", display:"flex", flexDirection:"column" }}
                    >
                      <Box sx={{
                        width:"100%", height:120, background:p.bg,
                        display:"flex", alignItems:"center", justifyContent:"center"
                      }}>
                        {p.icon}
                      </Box>
                      <Box sx={{ flexGrow:1, p:2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight:700 }}>
                          {p.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color:"text.secondary", mt:0.5 }}>
                          {p.subtitle}
                        </Typography>
                      </Box>
                      {chosen && (
                        <Box sx={{
                          position:"absolute", top:8, right:8, width:20, height:20,
                          borderRadius:"50%", bgcolor:"#FFD700"
                        }}/>
                      )}
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Continue */}
          <Stack direction="row" justifyContent="center" mt={6}>
            <Button
              variant="contained" color="secondary" size="large"
              disabled={selectedPains.length === 0}
              onClick={gotoStep2}
            >
              Continue
            </Button>
          </Stack>
        </>
      )}

      {step === 2 && (
        <>
          <Box sx={{ maxWidth:960, mx:"auto", textAlign:"center", mb:6 }}>
            <Typography variant="h4" sx={{ fontWeight:800, mb:1 }}>
              Your Starter Toolkit
            </Typography>
            <Typography variant="body1" sx={{ color:"text.secondary" }}>
              We’ve pre-selected tools for your pains. Toggle any off / on.
            </Typography>
          </Box>

          <Grid container spacing={4} sx={{ maxWidth:1100, mx:"auto" }}>
            {Object.entries(allTools).map(([id, meta]) => {
              const on = toolSet.has(id);
              return (
                <Grid key={id} item xs={12} sm={6} md={4}>
                  <Card
                    sx={{
                      borderRadius:4, position:"relative",
                      boxShadow: on ? 8 : 3,
                      transform: on ? "translateY(-2px)" : "translateY(0)",
                      transition:"all .2s",
                    }}
                  >
                    <CardActionArea onClick={() => toggleTool(id)}>
                      <Box sx={{
                        width:"100%", height:110, fontSize:54,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        background:"rgba(255,255,255,0.06)"
                      }}>
                        {meta.emoji}
                      </Box>
                      <Box sx={{ p:2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight:700 }}>
                          {meta.title}
                        </Typography>
                        {selectedPains.some((pid) => {
                          const pain = painList.find((p) => p.id === pid);
                          return pain?.tool === id;
                        }) && (
                          <Chip label="Recommended" size="small" sx={{ mt:1 }} />
                        )}
                      </Box>
                      {on && (
                        <Box sx={{
                          position:"absolute", top:8, right:8, width:20, height:20,
                          borderRadius:"50%", bgcolor:"#FFD700"
                        }}/>
                      )}
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Finish */}
          <Stack direction="row" justifyContent="center" spacing={2} mt={6}>
            <Button
              variant="contained" color="secondary" size="large"
              disabled={toolSet.size === 0}
              onClick={() => onFinish([...toolSet])}
            >
              Finish Setup
            </Button>
            <Button
              variant="text" sx={{ color:"#ccc" }}
              onClick={() => onFinish([...toolSet])}
            >
              Skip
            </Button>
          </Stack>
        </>
      )}
    </Box>
  );
}