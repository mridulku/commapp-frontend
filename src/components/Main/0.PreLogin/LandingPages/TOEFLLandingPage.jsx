// src/components/LandingPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ---- Material UI Imports ----
import {
  createTheme,
  ThemeProvider,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  Paper,
  IconButton,
  Drawer,
  Stack,
  Dialog
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

// Icons for feature/step sections
import EmojiObjectsIcon from "@mui/icons-material/EmojiObjects";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import AutoAwesomeMotionIcon from "@mui/icons-material/AutoAwesomeMotion";
import PsychologyIcon from "@mui/icons-material/Psychology";
import TimelineIcon from "@mui/icons-material/Timeline";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import TableViewIcon from "@mui/icons-material/TableView";
import DescriptionIcon from "@mui/icons-material/Description";

// Import your PanelAdaptiveProcess (if you have it)
import PanelAdaptiveProcess from "../2.PanelAdaptiveProcess";
// Import the sign-in component
import AuthSignIn from "../1.AuthSignIn";

/** ------------------------------------------------------------------
 * 1) CREATE THE DARK + PURPLE THEME
 * ------------------------------------------------------------------ */
const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#B39DDB", // Purple accent
    },
    secondary: {
      main: "#FFD700", // Gold accent
    },
    background: {
      default: "#0F0F0F",
      paper: "#1F1F1F"
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#b3b3b3"
    }
  },
  typography: {
    fontFamily: ["Inter", "Roboto", "Arial", "sans-serif"].join(",")
  }
});

/** ------------------------------------------------------------------
 * 2) NAVBAR (AppBar)
 * ------------------------------------------------------------------ */
function LandingAppBar({ onOpenSignIn }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const toggleDrawer = () => setDrawerOpen(!drawerOpen);

  return (
    <AppBar position="sticky" sx={{ bgcolor: "transparent", boxShadow: "none" }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* LOGO or Brand */}
        <Typography
          variant="h6"
          sx={{ fontWeight: "bold", color: "primary.main", cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          talk-ai.co | TOEFL Mastery
        </Typography>

        {/* Large screens: sign in button */}
        <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2 }}>
          <Button
            variant="outlined"
            color="primary"
            sx={{ borderColor: "primary.main" }}
            onClick={onOpenSignIn} // open modal
          >
            Sign In
          </Button>
        </Box>

        {/* Small screen menu icon */}
        <IconButton
          onClick={toggleDrawer}
          sx={{ display: { xs: "block", md: "none" }, color: "primary.main" }}
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>

      {/* Mobile Drawer */}
      <Drawer anchor="top" open={drawerOpen} onClose={toggleDrawer}>
        <Box sx={{ p: 2, bgcolor: "background.default" }}>
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <IconButton onClick={toggleDrawer} sx={{ color: "primary.main" }}>
              <CloseRoundedIcon />
            </IconButton>
          </Box>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Divider sx={{ my: 1 }} />
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                toggleDrawer();
                onOpenSignIn(); // open modal
              }}
            >
              Sign In
            </Button>
          </Stack>
        </Box>
      </Drawer>
    </AppBar>
  );
}

/** ------------------------------------------------------------------
 * 3) HERO SECTION: Big Title + CTA => open the modal
 * ------------------------------------------------------------------ */
function HeroSection({ onOpenSignIn }) {
  return (
    <Box
      sx={{
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        background: "linear-gradient(160deg, #000000 40%, #1A1A1A 100%)",
        py: 8
      }}
    >
      <Container>
        {/* Title */}
        <Typography variant="h2" sx={{ fontWeight: "bold", color: "primary.main", mb: 2 }}>
          Master TOEFL with Adaptive AI
        </Typography>

        {/* Subtext */}
        <Typography variant="h6" sx={{ color: "text.secondary", maxWidth: 700, mb: 4, lineHeight: 1.6 }}>
          Tired of juggling endless TOEFL reading passages, vocabulary lists, and time pressure?
          Our AI-driven platform personalizes every step of your TOEFL prep—upload your passages
          or practice materials, and let us tailor quizzes, reading schedules, and writing prompts
          to your exact weaknesses. Focus on what truly boosts your TOEFL score.
        </Typography>

        {/* CTA => open sign-in modal */}
        <Button
          variant="contained"
          color="primary"
          size="large"
          sx={{ mr: 2, fontWeight: "bold" }}
          onClick={onOpenSignIn}
        >
          Start My TOEFL Prep
        </Button>
      </Container>
    </Box>
  );
}

/** ------------------------------------------------------------------
 * 4) PAIN + SOLUTION SECTION
 * ------------------------------------------------------------------ */
function PainGainSection() {
  return (
    <Box sx={{ py: 8, backgroundColor: "background.default" }}>
      <Container>
        <Typography
          variant="h4"
          sx={{ color: "primary.main", fontWeight: "bold", textAlign: "center", mb: 2 }}
        >
          Say Goodbye to Overwhelming TOEFL Passages
        </Typography>

        <Typography variant="body1" sx={{ color: "text.secondary", textAlign: "center", maxWidth: 700, mx: "auto", mb: 4 }}>
          Get rid of generic study approaches that waste time. Our AI-driven system analyzes your 
          reading comprehension, vocabulary needs, and writing performance—ensuring each session 
          directly impacts your TOEFL score.
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3, bgcolor: "background.paper" }}>
              <Typography variant="h6" sx={{ color: "primary.main", mb: 2 }}>
                Common TOEFL Frustrations
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                • Overly long reading passages with limited time
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                • Vocabulary overload—unsure where to focus
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                • Scoring lower than expected on practice tests
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                • Confusion on which question types you miss the most
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3, bgcolor: "background.paper" }}>
              <Typography variant="h6" sx={{ color: "primary.main", mb: 2 }}>
                Our TOEFL-Focused Solution
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                • AI breaks passages into chunks, generating targeted questions
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                • Adaptive approach identifies your weak question types—Inference? Summary? Vocabulary?
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                • Real-time scheduling for reading, writing, and listening practice
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                • Progress tracking to ensure each study session counts
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

/** ------------------------------------------------------------------
 * 5) LEARNING JOURNEY: 5 STAGES
 * ------------------------------------------------------------------ */
function LearningJourneySection() {
  const stages = [
    {
      icon: <PsychologyIcon sx={{ fontSize: 36, color: "primary.main", mb: 1 }} />,
      title: "Assess",
      bullets: [
        "Upload TOEFL reading passages or materials",
        "Baseline your reading speed & comprehension"
      ],
    },
    {
      icon: <AutoAwesomeMotionIcon sx={{ fontSize: 36, color: "primary.main", mb: 1 }} />,
      title: "Focus",
      bullets: [
        "Pinpoint question types you miss (Inference, Negative Fact, etc.)",
        "Prioritize tough vocabulary & grammar"
      ],
    },
    {
      icon: <EmojiObjectsIcon sx={{ fontSize: 36, color: "primary.main", mb: 1 }} />,
      title: "Practice",
      bullets: [
        "Adaptive quizzes mimic TOEFL reading complexity",
        "Review official question formats & sample tasks"
      ],
    },
    {
      icon: <TimelineIcon sx={{ fontSize: 36, color: "primary.main", mb: 1 }} />,
      title: "Track & Adapt",
      bullets: [
        "Real-time analytics for reading speed & accuracy",
        "Plan evolves as your skills improve"
      ],
    },
    {
      icon: <DoneAllIcon sx={{ fontSize: 36, color: "primary.main", mb: 1 }} />,
      title: "Succeed",
      bullets: [
        "Hit your target TOEFL Reading & Writing scores",
        "Walk into test day with confidence"
      ],
    },
  ];

  // same layout logic
  const row1 = stages.slice(0, 3);
  const row2 = stages.slice(3);

  return (
    <Box sx={{ py: 8, backgroundColor: "background.default" }}>
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          sx={{ color: "primary.main", fontWeight: "bold", textAlign: "center", mb: 4 }}
        >
          Your TOEFL Learning Journey
        </Typography>

        {/* FIRST ROW => 3 cards */}
        <Grid container spacing={4} justifyContent="center" sx={{ mb: 4 }}>
          {row1.map((stage, idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  bgcolor: "background.paper",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  height: "100%",
                }}
              >
                {stage.icon}
                <Typography variant="h6" sx={{ color: "primary.main", fontWeight: "bold", mb: 1 }}>
                  {stage.title}
                </Typography>
                {stage.bullets.map((b, i) => (
                  <Typography key={i} variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                    {b}
                  </Typography>
                ))}
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* SECOND ROW => 2 cards, centered */}
        <Grid container spacing={4} justifyContent="center">
          {row2.map((stage, idx) => (
            <Grid item xs={12} sm={6} md={6} key={idx}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  bgcolor: "background.paper",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  height: "100%",
                }}
              >
                {stage.icon}
                <Typography variant="h6" sx={{ color: "primary.main", fontWeight: "bold", mb: 1 }}>
                  {stage.title}
                </Typography>
                {stage.bullets.map((b, i) => (
                  <Typography key={i} variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                    {b}
                  </Typography>
                ))}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

/** ------------------------------------------------------------------
 * 6) STATS + PROOF => random data showcasing improvements
 * ------------------------------------------------------------------ */
function StatsAndProofSection() {
  return (
    <Box sx={{ py: 8, backgroundColor: "background.paper" }}>
      <Container maxWidth="md">
        <Typography
          variant="h4"
          sx={{ color: "primary.main", fontWeight: "bold", textAlign: "center", mb: 4 }}
        >
          Real Results for TOEFL Aspirants
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} sm={6}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                bgcolor: "background.default",
                textAlign: "center"
              }}
            >
              <Typography variant="h6" sx={{ color: "primary.main", fontWeight: "bold", mb: 2 }}>
                3,000+ TOEFL Learners
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Already using adaptive reading + quiz loops to level up their scores.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                bgcolor: "background.default",
                textAlign: "center"
              }}
            >
              <Typography variant="h6" sx={{ color: "primary.main", fontWeight: "bold", mb: 2 }}>
                +8 Avg. Reading Score
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Learners see an 8-point improvement (on average) in TOEFL Reading after 4 weeks of consistent usage.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                bgcolor: "background.default",
                textAlign: "center"
              }}
            >
              <Typography variant="h6" sx={{ color: "primary.main", fontWeight: "bold", mb: 2 }}>
                70% Time Saved
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                By skipping familiar topics and focusing on actual weak areas.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                bgcolor: "background.default",
                textAlign: "center"
              }}
            >
              <Typography variant="h6" sx={{ color: "primary.main", fontWeight: "bold", mb: 2 }}>
                96% Satisfaction
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Students rave about clarity and confidence going into TOEFL test day.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

/** ------------------------------------------------------------------
 * 7) WHY WE'RE DIFFERENT => bullet comparison table
 * ------------------------------------------------------------------ */
function WhyWeAreDifferentSection() {
  return (
    <Box sx={{ py: 8, backgroundColor: "background.default" }}>
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          sx={{ color: "primary.main", fontWeight: "bold", textAlign: "center", mb: 4 }}
        >
          Why We’re Different for TOEFL Prep
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3, bgcolor: "background.paper", height: "100%" }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <TableViewIcon sx={{ color: "primary.main", fontSize: 30, mr: 1 }} />
                <Typography variant="h6" sx={{ color: "primary.main", fontWeight: "bold" }}>
                  Typical Test Prep
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                - Generic reading passages not tailored to your weaknesses
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                - Minimal feedback on why you miss certain question types
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                - One-size-fits-all approach, ignoring your personal vocabulary or grammar gaps
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                - Little to no scheduling or time-management guidance
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3, bgcolor: "background.paper", height: "100%" }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <TableViewIcon sx={{ color: "primary.main", fontSize: 30, mr: 1 }} />
                <Typography variant="h6" sx={{ color: "primary.main", fontWeight: "bold" }}>
                  Our AI TOEFL Approach
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                ✓ Upload official TOEFL reading passages or your own practice sets—AI instantly creates adaptive quizzes
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                ✓ Targets your problem question types: inference, vocabulary in context, summary, etc.
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                ✓ Personalized daily tasks to balance reading, listening, and writing
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                ✓ Real-time score predictions and time-management tips
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

/** ------------------------------------------------------------------
 * 8) SEE IT IN ACTION => mock snippet of PDF -> quiz transformation
 * ------------------------------------------------------------------ */
function SeeItInActionSection() {
  return (
    <Box sx={{ py: 8, backgroundColor: "background.paper" }}>
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          sx={{ color: "primary.main", fontWeight: "bold", textAlign: "center", mb: 2 }}
        >
          See It in Action
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: "text.secondary", textAlign: "center", maxWidth: 700, mx: "auto", mb: 4 }}
        >
          Upload a TOEFL reading passage or practice test, watch AI parse the content,
          and get a personalized quiz targeting your weak question types—just like the real TOEFL.
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <iframe
            width="560"
            height="315"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ"
            title="TOEFL Demo"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </Box>

        <Typography
          variant="body2"
          sx={{ color: "text.secondary", textAlign: "center", maxWidth: 600, mx: "auto" }}
        >
          The entire process takes seconds. Instantly identify your reading comprehension gaps
          and build a realistic TOEFL study strategy—no more guesswork.
        </Typography>
      </Container>
    </Box>
  );
}

/** ------------------------------------------------------------------
 * 9) FEATURES SECTION (The Power of AI)
 * ------------------------------------------------------------------ */
function FeaturesSection() {
  const features = [
    {
      icon: <EmojiObjectsIcon sx={{ fontSize: 40, mb: 1, color: "primary.main" }} />,
      title: "AI Insights for Reading",
      desc: "Analyze your reading speed and question accuracy to refine every step of your prep."
    },
    {
      icon: <ThumbUpIcon sx={{ fontSize: 40, mb: 1, color: "primary.main" }} />,
      title: "Personalized Vocabulary",
      desc: "System identifies repeated vocab issues and drills you on the tough words that appear often in TOEFL."
    },
    {
      icon: <RocketLaunchIcon sx={{ fontSize: 40, mb: 1, color: "primary.main" }} />,
      title: "Faster Score Gains",
      desc: "Zero in on your biggest problem areas so you improve reading and listening scores with minimal wasted time."
    }
  ];

  return (
    <Box sx={{ py: 8 }}>
      <Container>
        <Typography
          variant="h4"
          sx={{ color: "primary.main", fontWeight: "bold", textAlign: "center", mb: 4 }}
        >
          The Power of AI for TOEFL
        </Typography>
        <Grid container spacing={4}>
          {features.map((feat, idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <Card
                variant="outlined"
                sx={{ bgcolor: "background.paper", height: "100%", textAlign: "center", p: 2 }}
              >
                <CardContent>
                  {feat.icon}
                  <Typography variant="h6" sx={{ color: "primary.main", fontWeight: "bold", mb: 1 }}>
                    {feat.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {feat.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

/** ------------------------------------------------------------------
 * 10) TESTIMONIAL
 * ------------------------------------------------------------------ */
function TestimonialSection() {
  return (
    <Box sx={{ py: 6, backgroundColor: "background.paper" }}>
      <Container maxWidth="md">
        <Typography
          variant="h5"
          sx={{ color: "primary.main", fontWeight: "bold", textAlign: "center", mb: 2 }}
        >
          Hear From Our TOEFL Learners
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: "text.secondary", textAlign: "center", mb: 4 }}
        >
          Thousands of aspirants trust our adaptive platform. Check out one user’s story:
        </Typography>

        <Paper sx={{ p: 3, textAlign: "center", bgcolor: "#2A2A2A" }}>
          <Typography variant="body1" sx={{ fontStyle: "italic", color: "#ffffff", mb: 2 }}>
            “I raised my TOEFL Reading score from <strong>20 to 28</strong> in just five weeks! 
            The AI quizzes honed in on my tricky question types and helped me master the 
            vocabulary I kept missing.”
          </Typography>
          <Typography variant="subtitle2" sx={{ color: "primary.main" }}>
            — Hannah, TOEFL Test-Taker
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}

/** ------------------------------------------------------------------
 * 11) ADAPTIVE LEARNING WORKS (bottom)
 * ------------------------------------------------------------------ */
function AdaptiveProcessSection() {
  return (
    <Box sx={{ py: 6, backgroundColor: "background.default", textAlign: "center" }}>
      <Container maxWidth="md">
        <Typography variant="h4" sx={{ color: "primary.main", fontWeight: "bold", mb: 4 }}>
          How Our Adaptive TOEFL System Works
        </Typography>
        <PanelAdaptiveProcess />
      </Container>
    </Box>
  );
}

/** ------------------------------------------------------------------
 * 12) FOOTER
 * ------------------------------------------------------------------ */
function Footer() {
  return (
    <Box sx={{ py: 4, textAlign: "center", bgcolor: "#000000" }}>
      <Container>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          © {new Date().getFullYear()} talk-ai.co. All rights reserved.
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          TOEFL® is a registered trademark of ETS. This platform is not endorsed or approved by ETS.
        </Typography>
      </Container>
    </Box>
  );
}

/** ------------------------------------------------------------------
 * 13) MAIN LANDING PAGE
 * ------------------------------------------------------------------ */
export default function TOEFLLandingPage() {
  const navigate = useNavigate();
  const [openSignIn, setOpenSignIn] = useState(false);

  // If user is already logged in => skip landing
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  // Handlers for open/close the sign-in modal
  const handleOpenSignIn = () => {
    setOpenSignIn(true);
  };
  const handleCloseSignIn = () => {
    setOpenSignIn(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* 1) Navbar */}
      <LandingAppBar onOpenSignIn={handleOpenSignIn} />

      {/* 2) Hero - TOEFL Focus */}
      <HeroSection onOpenSignIn={handleOpenSignIn} />

      {/* 3) Pain+Solution => TOEFL */}
      <PainGainSection />

      {/* 4) 5-Stage Learning Journey => TOEFL */}
      <LearningJourneySection />

      {/* 5) Stats + Proof => For TOEFL */}
      <StatsAndProofSection />

      {/* 6) Why We Are Different => TOEFL vs. Generic */}
      <WhyWeAreDifferentSection />

      {/* 7) See It in Action => PDF -> TOEFL quiz */}
      <SeeItInActionSection />

      {/* 8) Features => AI for TOEFL */}
      <FeaturesSection />

      {/* 9) Testimonial => TOEFL */}
      <TestimonialSection />

      {/* 10) Adaptive Learning Explanation (Bottom) */}
      <AdaptiveProcessSection />

      {/* 11) Footer */}
      <Footer />

      {/* Sign-In Modal */}
      <Dialog
        open={openSignIn}
        onClose={handleCloseSignIn}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { bgcolor: "background.paper" }
        }}
      >
        <AuthSignIn />
      </Dialog>
    </ThemeProvider>
  );
}
