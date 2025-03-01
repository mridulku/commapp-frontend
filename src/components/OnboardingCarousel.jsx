import React, { useState, useRef } from 'react';
import Slider from 'react-slick';
import {
  Box,
  Typography,
  Button,
  TextField,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';

// IMPORTANT: you must import slick CSS once in your project (e.g. in App.js or index.js):
// import "slick-carousel/slick/slick.css";
// import "slick-carousel/slick/slick-theme.css";

const OnboardingCarousel = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const sliderRef = useRef(null);

  const [userName, setUserName] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  // react-slick settings
  const settings = {
    infinite: false,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false, // hide default arrows to use custom nav
    dots: true,    // bullet dots at bottom
    beforeChange: (oldIndex, newIndex) => setCurrentSlide(newIndex),
  };

  // Helper functions
  const goNext = () => sliderRef.current?.slickNext();
  const goPrev = () => sliderRef.current?.slickPrev();

  // -------------------------
  //  COLOR & THEME SETTINGS
  // -------------------------
  // A near-black background for the entire page
  const pageBackgroundColor = '#0F0F0F'; 

  // The “card” that sits above the background
  // This is tinted black with some transparency
  const cardBackgroundColor = 'rgba(255,255,255,0.04)';

  // A “royal purple” accent color for headings and buttons
  // Adjust to match your screenshot’s purple
  const accentPurple = '#9b59b6';  
  // A slightly darker shade for button hover or text emphasis
  const accentPurpleHover = '#8e44ad'; 

  // Shared style for each full-slide container
  const slideStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    textAlign: 'center',
    padding: isMobile ? '1rem' : '2rem',
  };

  // A semi‐transparent “card” with a subtle shadow
  const cardStyle = {
    backgroundColor: cardBackgroundColor,
    borderRadius: '12px',
    padding: isMobile ? '1.5rem' : '2rem',
    maxWidth: isMobile ? '90%' : '600px',
    margin: 'auto',
    boxShadow: '0 4px 30px rgba(0,0,0,0.5)',
  };

  // A central icon container, again lightly tinted
  const iconContainerStyle = {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: '50%',
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  // A re-usable style for the “Back” button
  const backButtonStyle = {
    color: '#fff',
    borderColor: '#fff',
    textTransform: 'none',
    '&:hover': { borderColor: '#ccc' },
  };

  // A re-usable style for the “Next”/“Submit”/“Finish” button
  const primaryButtonStyle = {
    backgroundColor: accentPurple,
    color: '#fff',
    textTransform: 'none',
    fontWeight: 'bold',
    '&:hover': { backgroundColor: accentPurpleHover },
  };

  // If you’d like your headings to be purple, you can do so inline or via MUI theme
  const headingStyle = {
    fontWeight: 'bold',
    color: accentPurple,
    marginBottom: '1rem',
  };

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: pageBackgroundColor,
        position: 'relative',
        color: '#fff', // default text color is white
      }}
    >
      <Slider ref={sliderRef} {...settings}>
        {/* Slide 1: Ask for name */}
        <Box sx={slideStyle}>
          <Box sx={cardStyle}>
            <Box sx={iconContainerStyle}>
              <CheckCircle sx={{ fontSize: 40, color: accentPurple }} />
            </Box>
            <Typography variant="h4" sx={headingStyle}>
              Welcome
            </Typography>
            <Typography variant="body1" sx={{ marginBottom: '1.5rem', color: '#ccc' }}>
              We're excited to have you on board! Let’s get to know you better.
            </Typography>
            <TextField
              variant="filled"
              label="What’s your name?"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              sx={{
                mb: 3,
                width: '100%',
                backgroundColor: 'rgba(255,255,255,0.1)',
                input: { color: '#fff' },
                label: { color: '#aaa' },
                '& .MuiFilledInput-underline:before': { borderBottomColor: '#666' },
                '& .MuiFilledInput-underline:hover:before': { borderBottomColor: '#fff' },
              }}
            />
            <Button variant="contained" sx={primaryButtonStyle} onClick={goNext}>
              Submit
            </Button>
          </Box>
        </Box>

        {/* Slide 2: Upload any content */}
        <Box sx={slideStyle}>
          <Box sx={cardStyle}>
            <Box sx={iconContainerStyle}>
              <CheckCircle sx={{ fontSize: 40, color: accentPurple }} />
            </Box>
            <Typography variant="h4" sx={headingStyle}>
              Upload Any Content
            </Typography>
            <Typography variant="body1" sx={{ marginBottom: '1.5rem', color: '#ccc' }}>
              Our platform lets you upload textbooks, PDFs, or articles. 
              We'll transform them into a personalized learning experience.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
              {/* Back button only if not the first slide */}
              {currentSlide > 0 && (
                <Button variant="outlined" sx={backButtonStyle} onClick={goPrev}>
                  Back
                </Button>
              )}
              <Button variant="contained" sx={primaryButtonStyle} onClick={goNext}>
                Next
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Slide 3: Plan creation & breakdown */}
        <Box sx={slideStyle}>
          <Box sx={cardStyle}>
            <Box sx={iconContainerStyle}>
              <CheckCircle sx={{ fontSize: 40, color: accentPurple }} />
            </Box>
            <Typography variant="h4" sx={headingStyle}>
              Smart Study Plans
            </Typography>
            <Typography variant="body1" sx={{ marginBottom: '1.5rem', color: '#ccc' }}>
              We create a custom plan that breaks your content into manageable chunks, so you can study at your own pace.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
              {currentSlide > 0 && (
                <Button variant="outlined" sx={backButtonStyle} onClick={goPrev}>
                  Back
                </Button>
              )}
              <Button variant="contained" sx={primaryButtonStyle} onClick={goNext}>
                Next
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Slide 4: Quizzes & Summaries */}
        <Box sx={slideStyle}>
          <Box sx={cardStyle}>
            <Box sx={iconContainerStyle}>
              <CheckCircle sx={{ fontSize: 40, color: accentPurple }} />
            </Box>
            <Typography variant="h4" sx={headingStyle}>
              Quizzes & Summaries
            </Typography>
            <Typography variant="body1" sx={{ marginBottom: '1.5rem', color: '#ccc' }}>
              Test yourself with quick quizzes and let our summarization tools help you recall key ideas. 
              Our system continuously learns your strengths, so you'll improve faster.
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
              {currentSlide > 0 && (
                <Button variant="outlined" sx={backButtonStyle} onClick={goPrev}>
                  Back
                </Button>
              )}
              <Button
                variant="contained"
                sx={primaryButtonStyle}
                onClick={() => alert(`Finish Onboarding, ${userName || 'User'}!`)}
              >
                Finish
              </Button>
            </Box>
          </Box>
        </Box>
      </Slider>
    </Box>
  );
};

export default OnboardingCarousel;