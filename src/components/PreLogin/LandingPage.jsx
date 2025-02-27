import React, { useEffect } from 'react';
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  CssBaseline,
  createTheme,
  Divider,
  Grid,
  IconButton,
  Stack,
  ThemeProvider,
  Toolbar,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import Drawer from '@mui/material/Drawer';

// --- Icons for the Features
import AutoAwesomeMotionIcon from '@mui/icons-material/AutoAwesomeMotion'; // for Adaptive Lessons
import ThumbUpIcon from '@mui/icons-material/ThumbUp'; // for Personalized Feedback
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'; // for Engaging Content

import { useNavigate } from 'react-router-dom'; // or your routing library

/** ======================
 *  1) Create a custom Theme
 *  Dark background + Gold (#FFD700) primary color
 * ======================= */
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#FFD700', // Gold accent
    },
    background: {
      default: '#000000', // Black
      paper: '#111111',   // Dark gray
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#b3b3b3',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Helvetica',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

/** ======================
 *  2) Define sub-components in the same file
 * ======================= */

/** AppBar / Navbar */
function LandingAppBar() {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  // Handle sign in click => /authlogin
  const handleSignIn = () => {
    navigate('/authlogin');
  };

  return (
    <AppBar position="sticky" sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        {/* Left side: Logo / Title */}
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          TalkAI
        </Typography>

        {/* Large screen: only Sign In */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
          <Button
            variant="outlined"
            color="primary"
            sx={{ borderColor: 'primary.main' }}
            onClick={handleSignIn}
          >
            Sign In
          </Button>
        </Box>

        {/* Small screen Menu icon */}
        <IconButton
          onClick={handleDrawerToggle}
          sx={{ display: { xs: 'block', md: 'none' }, color: 'primary.main' }}
        >
          <MenuIcon />
        </IconButton>
      </Toolbar>

      {/* Mobile Drawer => only Sign In */}
      <Drawer anchor="top" open={open} onClose={handleDrawerToggle}>
        <Box sx={{ p: 2, bgcolor: 'background.default' }}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <IconButton onClick={handleDrawerToggle} sx={{ color: 'primary.main' }}>
              <CloseRoundedIcon />
            </IconButton>
          </Box>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Divider sx={{ my: 1 }} />
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                handleDrawerToggle();
                handleSignIn();
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

/** Hero Section */
function HeroSection() {
  const navigate = useNavigate();
  // Start Learning => /authlogin
  const handleStartLearning = () => {
    navigate('/authlogin');
  };

  return (
    <Box
      sx={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(160deg, #000000 50%, #1A1A1A 100%)',
        py: 8,
      }}
    >
      <Container>
        <Typography
          variant="h2"
          sx={{ fontWeight: 'bold', color: 'primary.main', mb: 2 }}
        >
          Personalized Learning with AI
        </Typography>
        <Typography variant="h6" sx={{ color: 'text.secondary', maxWidth: 600, mb: 4 }}>
          Master any topic faster with AI-driven adaptive learning. Our system personalizes
          study plans, quizzes, and summaries based on your pace, ensuring efficient
          pathways to success!
        </Typography>
        <Button
          variant="contained"
          color="primary"
          size="large"
          sx={{ mr: 2 }}
          onClick={handleStartLearning}
        >
          Start Learning
        </Button>
      </Container>
    </Box>
  );
}

/** Features */
function FeaturesSection() {
  const features = [
    {
      icon: <AutoAwesomeMotionIcon sx={{ fontSize: 40, mb: 1, color: 'primary.main' }} />,
      title: 'Adaptive Lessons',
      description:
        'AI tracks your progress in real-time and adjusts the study plan dynamically, delivering a personalized path to mastery.',
    },
    {
      icon: <ThumbUpIcon sx={{ fontSize: 40, mb: 1, color: 'primary.main' }} />,
      title: 'Personalized Feedback',
      description:
        'Identify learning gaps quickly with AI-driven insights, and get optimized strategies for efficient improvement.',
    },
    {
      icon: <RocketLaunchIcon sx={{ fontSize: 40, mb: 1, color: 'primary.main' }} />,
      title: 'Engaging Content',
      description:
        'Interactive quizzes, AI-generated insights, and adaptive recommendations make learning fun and effective.',
    },
  ];

  return (
    <Container sx={{ py: 8 }}>
      <Typography
        variant="h4"
        sx={{ color: 'primary.main', fontWeight: 'bold', textAlign: 'center', mb: 4 }}
      >
        Why Choose Our Platform?
      </Typography>
      <Grid container spacing={4}>
        {features.map((feature, idx) => (
          <Grid item xs={12} md={4} key={idx}>
            <Card variant="outlined" sx={{ bgcolor: 'background.paper', height: '100%', textAlign: 'center' }}>
              <CardContent>
                {feature.icon}
                <Typography variant="h6" sx={{ color: 'primary.main', mb: 1 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

/** CTA (Call to Action) Section */
function CTASection() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/authlogin');
  };

  return (
    <Box
      sx={{
        py: 6,
        textAlign: 'center',
        // remove the weird green background => just make it transparent/dark
        background: '#1A1A1A', // or 'transparent'
      }}
    >
      <Container>
        <Typography
          variant="h4"
          sx={{
            color: 'primary.main',
            fontWeight: 'bold',
            mb: 2,
          }}
        >
          Join Thousands of Learners
        </Typography>
        <Typography variant="body1" sx={{ color: '#ffffff', maxWidth: 600, mx: 'auto', mb: 3 }}>
          Explore new interests or excel in competitive exams with our AI-driven
          platform that adapts to your unique goals, style, and pace.
        </Typography>
        <Button variant="contained" color="primary" size="large" onClick={handleGetStarted}>
          Get Started
        </Button>
      </Container>
    </Box>
  );
}

/** Footer */
function FooterSection() {
  return (
    <Box sx={{ py: 4, textAlign: 'center', bgcolor: '#000000' }}>
      <Container>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
          © {new Date().getFullYear()} TalkAI. All rights reserved.
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Terms | Privacy | Contact
        </Typography>
      </Container>
    </Box>
  );
}

/** ======================
 *  3) Main LandingPage
 *     - If user has token => redirect /dashboard
 * ======================= */
export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Example: if localStorage has "token", redirect
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LandingAppBar />
      <HeroSection />
      <FeaturesSection />
      <CTASection />
      <FooterSection />
    </ThemeProvider>
  );
}