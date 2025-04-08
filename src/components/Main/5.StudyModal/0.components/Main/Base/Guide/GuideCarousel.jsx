// File: src/components/DetailedBookViewer/TOEFLOnboardingCarousel.jsx
import React, { useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import Slider from "react-slick";
import {
  Box,
  Typography,
  Button,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { CheckCircle } from "@mui/icons-material";
import axios from "axios";

import { fetchPlan, setCurrentIndex } from "../../../../../../../store/planSlice"; 
// ^ Make sure your actual import paths match your project

export default function GuideCarousel({ onFinish }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const sliderRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Grab whatever you need from Redux (similar to ReadingView)
  const dispatch = useDispatch();
  const userId = useSelector((state) => state.auth?.userId);
  const planId = useSelector((state) => state.plan?.planDoc?.id);
  const currentIndex = useSelector((state) => state.plan?.currentIndex);

  // Use a hypothetical ID for the “guide” activity
  // If you actually have a real activity in your plan for the guide,
  // replace this with the correct ID from your data.
  const guideActivityId = "GUIDE_ACTIVITY_ID";

  // React-slick slider settings
  const settings = {
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    dots: true,
    beforeChange: (oldIndex, newIndex) => setCurrentSlide(newIndex),
  };

  // Go to next/previous slides
  const goNext = () => sliderRef.current?.slickNext();
  const goPrev = () => sliderRef.current?.slickPrev();

  // Theme colors
  const accentPurple = "#9b59b6";
  const accentPurpleHover = "#8e44ad";

  // When user clicks "Finish" on the last slide
  async function handleFinishGuide() {
    const oldIndex = currentIndex;

    try {
      // 1) Mark the “guide activity” as complete (optional; remove if no such activity)
      await axios.post("http://localhost:3001/api/markActivityCompletion", {
        userId,
        planId,
        activityId: guideActivityId,
        completionStatus: "complete",
      });

      // 2) Re-fetch the plan from the backend
      const backendURL = "http://localhost:3001"; 
      const fetchUrl = "/api/adaptive-plan";

      const fetchAction = await dispatch(
        fetchPlan({ planId, backendURL, fetchUrl })
      );

      // 3) If success => increment index. If failure => still increment
      if (fetchPlan.fulfilled.match(fetchAction)) {
        dispatch(setCurrentIndex(oldIndex + 1));
      } else {
        dispatch(setCurrentIndex(oldIndex + 1));
      }
    } catch (err) {
      console.error("Error finishing guide activity:", err);
      // Even if there's an error, fallback to increment anyway
      dispatch(setCurrentIndex(oldIndex + 1));
    }

    // 4) If you still want to run the old `onFinish` callback, do so here:
    if (typeof onFinish === "function") {
      onFinish();
    }
  }

  // Shared styling
  const slideStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: isMobile ? "1rem" : "2rem",
  };

  const cardStyle = {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: "12px",
    padding: isMobile ? "1.5rem" : "2rem",
    maxWidth: isMobile ? "90%" : "600px",
    margin: "auto",
    boxShadow: "0 4px 30px rgba(0,0,0,0.5)",
  };

  const iconContainerStyle = {
    width: 80,
    height: 80,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: "50%",
    marginBottom: "1.5rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const buttonRowStyle = {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "1rem",
    width: "100%",
  };

  const backButtonStyle = {
    color: "#fff",
    borderColor: "#fff",
    textTransform: "none",
    fontWeight: "bold",
    "&:hover": { borderColor: "#ccc" },
  };

  const primaryButtonStyle = {
    backgroundColor: accentPurple,
    color: "#fff",
    textTransform: "none",
    fontWeight: "bold",
    "&:hover": { backgroundColor: accentPurpleHover },
  };

  const headingStyle = {
    fontWeight: "bold",
    color: accentPurple,
    marginBottom: "1rem",
  };

  return (
    <Box
      sx={{
        width: "100%",
        backgroundColor: "transparent",
        position: "relative",
        color: "#fff",
      }}
    >
      <Slider ref={sliderRef} {...settings}>
        
        {/* Slide 1 */}
        <Box sx={slideStyle}>
          <Box sx={cardStyle}>
            <Box sx={iconContainerStyle}>
              <CheckCircle sx={{ fontSize: 40, color: accentPurple }} />
            </Box>
            <Typography variant="h4" sx={headingStyle}>
              Hey! Welcome to Your TOEFL Journey
            </Typography>
            <Typography variant="body1" sx={{ marginBottom: "1.5rem", color: "#ccc" }}>
              {/* Keep it short & bullet-like, with an emoji or two */}
              <div>• We’ll prep Reading, Listening, Speaking, & Writing ✍️</div>
              <div>• No big test first. Just quick questions 🤗</div>
              <div>• Let’s set up your exam details in a jiffy ⏱️</div>
            </Typography>
            <Box sx={buttonRowStyle}>
              <Box /> {/* Empty box to align Next on the right */}
              <Button
                variant="contained"
                sx={primaryButtonStyle}
                onClick={goNext}
              >
                Next
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Slide 2 */}
        <Box sx={slideStyle}>
          <Box sx={cardStyle}>
            <Box sx={iconContainerStyle}>
              <CheckCircle sx={{ fontSize: 40, color: accentPurple }} />
            </Box>
            <Typography variant="h4" sx={headingStyle}>
              What We'll Ask You
            </Typography>
            <Typography variant="body1" sx={{ marginBottom: "1.5rem", color: "#ccc" }}>
              <div>• Your TOEFL exam date 🗓️</div>
              <div>• Areas you want to focus on the most 🎯</div>
              <div>• A quick sense of your current skill ⚙️</div>
            </Typography>
            <Box sx={buttonRowStyle}>
              <Button
                variant="outlined"
                sx={backButtonStyle}
                onClick={goPrev}
              >
                Back
              </Button>
              <Button
                variant="contained"
                sx={primaryButtonStyle}
                onClick={goNext}
              >
                Next
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Slide 3 (Last Slide) */}
        <Box sx={slideStyle}>
          <Box sx={cardStyle}>
            <Box sx={iconContainerStyle}>
              <CheckCircle sx={{ fontSize: 40, color: accentPurple }} />
            </Box>
            <Typography variant="h4" sx={headingStyle}>
              Ready for Lift-Off?
            </Typography>
            <Typography variant="body1" sx={{ marginBottom: "1.5rem", color: "#ccc" }}>
              <div>• Daily tasks & quizzes adapt to you 🚀</div>
              <div>• No stress: short practice sessions 🧘‍♂️</div>
              <div>• Let’s finalize your plan & start improving!</div>
            </Typography>
            <Box sx={buttonRowStyle}>
              <Button
                variant="outlined"
                sx={backButtonStyle}
                onClick={goPrev}
              >
                Back
              </Button>
              <Button
                variant="contained"
                sx={primaryButtonStyle}
                onClick={handleFinishGuide}
              >
                Finish
              </Button>
            </Box>
          </Box>
        </Box>

      </Slider>
    </Box>
  );
}