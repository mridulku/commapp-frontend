// src/components/LandingPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ---- Material UI Imports ----
import {
  createTheme,
  ThemeProvider,
  styled
} from "@mui/material/styles";
import {
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
import AutoAwesomeMotionIcon from "@mui/icons-material/AutoAwesomeMotion";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import EmojiObjectsIcon from "@mui/icons-material/EmojiObjects";

// Import your PanelAdaptiveProcess
import PanelAdaptiveProcess from "./PanelAdaptiveProcess";
// Import the sign-in component
import AuthSignIn from "./AuthSignIn";

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
 *    Instead of navigate('/authsignin'), we open a modal
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
          MyAdaptiveApp
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
          Adaptive Learning for Everyone
        </Typography>

        {/* Subtext */}
        <Typography variant="h6" sx={{ color: "text.secondary", maxWidth: 700, mb: 4, lineHeight: 1.6 }}>
          Whether you're a high-school student, competitive exam aspirant, or a professional upskilling—our 
          AI-powered platform personalizes each lesson to your unique pace and goals.
        </Typography>

        {/* CTA => open sign-in modal */}
        <Button
          variant="contained"
          color="primary"
          size="large"
          sx={{ mr: 2, fontWeight: "bold" }}
          onClick={onOpenSignIn}
        >
          Get Started
        </Button>
      </Container>
    </Box>
  );
}

/** ------------------------------------------------------------------
 * 4) PAIN vs GAIN SECTION
 * ------------------------------------------------------------------ */
function PainGainSection() {
  return (
    <Box sx={{ py: 8, backgroundColor: "background.default" }}>
      <Container>
        <Typography
          variant="h4"
          sx={{ color: "primary.main", fontWeight: "bold", textAlign: "center", mb: 2 }}
        >
          Say Goodbye to Aimless Studying
        </Typography>

        <Typography variant="body1" sx={{ color: "text.secondary", textAlign: "center", maxWidth: 700, mx: "auto", mb: 4 }}>
          Tired of generic textbooks or endless question banks? Our AI-driven approach focuses exactly on what you
          need, when you need it—so you can learn faster, score higher, and stay motivated.
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3, bgcolor: "background.paper" }}>
              <Typography variant="h6" sx={{ color: "primary.main", mb: 2 }}>
                Common Frustrations
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                • Wasting hours on chapters you already know
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                • Feeling overwhelmed with no clear direction
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                • Boredom from repetitive drills that aren’t adaptive
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                • Guessing which topics matter most
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 3, bgcolor: "background.paper" }}>
              <Typography variant="h6" sx={{ color: "primary.main", mb: 2 }}>
                Our Solution
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                • Personalized study paths skipping your mastered areas
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                • Targeted quizzes to optimize retention
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                • Intelligent scheduling for your comfortable pace
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                • AI analytics ensuring each minute is productive
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

/** ------------------------------------------------------------------
 * 5) FEATURES SECTION
 * ------------------------------------------------------------------ */
function FeaturesSection() {
  const features = [
    {
      icon: <EmojiObjectsIcon sx={{ fontSize: 40, mb: 1, color: "primary.main" }} />,
      title: "AI-Powered Insights",
      desc: "Algorithms analyze reading speed, quiz performance, and complexity to dynamically refine your plan."
    },
    {
      icon: <ThumbUpIcon sx={{ fontSize: 40, mb: 1, color: "primary.main" }} />,
      title: "Personalized Feedback",
      desc: "Pinpoint your strengths and weaknesses quickly. Get strategies for continuous improvement."
    },
    {
      icon: <RocketLaunchIcon sx={{ fontSize: 40, mb: 1, color: "primary.main" }} />,
      title: "Rapid Mastery",
      desc: "No guesswork—focus on precisely what matters for maximum progress, exam readiness, or skill mastery."
    }
  ];

  return (
    <Box sx={{ py: 8 }}>
      <Container>
        <Typography
          variant="h4"
          sx={{ color: "primary.main", fontWeight: "bold", textAlign: "center", mb: 4 }}
        >
          The Power of AI
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
 * 6) SHORT TESTIMONIAL
 * ------------------------------------------------------------------ */
function TestimonialSection() {
  return (
    <Box sx={{ py: 6, backgroundColor: "background.paper" }}>
      <Container maxWidth="md">
        <Typography
          variant="h5"
          sx={{ color: "primary.main", fontWeight: "bold", textAlign: "center", mb: 2 }}
        >
          Hear From Our Learners
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: "text.secondary", textAlign: "center", mb: 4 }}
        >
          Thousands of students and professionals use MyAdaptiveApp. Here’s what one user says:
        </Typography>

        <Paper sx={{ p: 3, textAlign: "center", bgcolor: "#2A2A2A" }}>
          <Typography variant="body1" sx={{ fontStyle: "italic", color: "#ffffff", mb: 2 }}>
            “I improved my exam scores by <strong>20%</strong> in just four weeks!
            The adaptive plan saved me hours by focusing on exactly what I needed.”
          </Typography>
          <Typography variant="subtitle2" sx={{ color: "primary.main" }}>
            — Alex, Engineering Student
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}

/** ------------------------------------------------------------------
 * 7) ADAPTIVE PROCESS SECTION
 *     - Use your existing PanelAdaptiveProcess
 * ------------------------------------------------------------------ */
function AdaptiveProcessSection() {
  return (
    <Box sx={{ py: 6, backgroundColor: "background.default", textAlign: "center" }}>
      <Container maxWidth="md">
        <PanelAdaptiveProcess />
      </Container>
    </Box>
  );
}

/** ------------------------------------------------------------------
 * 8) FOOTER
 * ------------------------------------------------------------------ */
function Footer() {
  return (
    <Box sx={{ py: 4, textAlign: "center", bgcolor: "#000000" }}>
      <Container>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
          © {new Date().getFullYear()} MyAdaptiveApp. All rights reserved.
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Terms &nbsp; | &nbsp; Privacy &nbsp; | &nbsp; Contact
        </Typography>
      </Container>
    </Box>
  );
}

/** ------------------------------------------------------------------
 * 9) MAIN LANDING PAGE:
 *     - If user has token => go /dashboard
 *     - Buttons open a MUI <Dialog> with AuthSignIn
 * ------------------------------------------------------------------ */
export default function LandingPage() {
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

      {/* 2) Hero with CTA => open sign in */}
      <HeroSection onOpenSignIn={handleOpenSignIn} />

      {/* 3) PainGainSection */}
      <PainGainSection />

      {/* 4) FeaturesSection */}
      <FeaturesSection />

      {/* 5) Testimonial */}
      <TestimonialSection />

      {/* 6) Adaptive Process */}
      <AdaptiveProcessSection />

      {/* 7) Footer */}
      <Footer />

      {/* The Sign-In Modal */}
      <Dialog
        open={openSignIn}
        onClose={handleCloseSignIn}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { bgcolor: "background.paper" }
        }}
      >
        {/* The AuthSignIn component you already have */}
        <AuthSignIn />
      </Dialog>
    </ThemeProvider>
  );
}