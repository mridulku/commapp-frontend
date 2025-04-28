// File: src/components/DetailedBookViewer/OnboardingCarousel.jsx
import React, { useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import Slider from "react-slick";
import {
  Box,
  Typography,
  Button,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { CheckCircle } from "@mui/icons-material";
import axios from "axios";

import {
  fetchPlan,
  setCurrentIndex,
} from "../../../../../../../store/planSlice"; // ← adjust path if needed

export default function OnboardingCarousel({ onFinish }) {
  /* ———————————————————————————————————— hooks / redux ———————————————————————————————————— */
  const theme       = useTheme();
  const isMobile    = useMediaQuery(theme.breakpoints.down("sm"));
  const sliderRef   = useRef(null);
  const dispatch    = useDispatch();

  const userId        = useSelector((s) => s.auth?.userId);
  const planId        = useSelector((s) => s.plan?.planDoc?.id);
  const currentIndex  = useSelector((s) => s.plan?.currentIndex);
  const examTypeRaw   = useSelector((s) => s.exam?.examType);       // <-- NEW
  const examType      = (examTypeRaw || "").toUpperCase();          // e.g. "NEET" | "TOEFL" | ""

  /* ———————————————————————————————————— content helpers ———————————————————————————————————— */
  const isNEET = examType === "NEET";

  // Slide-1 (welcome) content
  const welcomeHeading = isNEET
    ? "Hey! Welcome to Your NEET Journey"
    : `Hey! Welcome to Your ${examType || "Exam"} Journey`;

  const welcomeBullets = isNEET
    ? [
        "• We’ll prep Physics, Chemistry, & Biology 🔬",
        "• No big test first. Just quick questions 🤗",
        "• Let’s set up your exam details in a jiffy ⏱️",
      ]
    : [
        "• This exam’s onboarding is still being prepared 🛠️",
        "• Stay tuned for customised guidance 🤗",
        "• We’ll add the details soon ⏱️",
      ];

  // Slide-2 (what we’ll ask) content
  const askBullets = isNEET
    ? [
        "• Areas you want to focus on the most 🎯",
        "• A quick sense of your current skill ⚙️",
      ]
    : [
        "• Areas you want to focus on the most 🎯",
        "• A quick sense of your current skill ⚙️",
      ];

  /* ———————————————————————————————————— slider settings ———————————————————————————————————— */
  const settings = {
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    dots: true,
    beforeChange: (_, next) => setCurrentSlide(next),
  };

  const [currentSlide, setCurrentSlide] = useState(0);
  const goNext = () => sliderRef.current?.slickNext();
  const goPrev = () => sliderRef.current?.slickPrev();

  /* ———————————————————————————————————— colours / styles ———————————————————————————————————— */
  const accentPurple       = "#9b59b6";
  const accentPurpleHover  = "#8e44ad";

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

  /* ———————————————————————————————————— handlers ———————————————————————————————————— */
  async function handleFinishGuide() {
    const oldIndex = currentIndex;

    try {
      /* mark activity & refresh plan … unchanged … */
      await axios.post("http://localhost:3001/api/markActivityCompletion", {
        userId,
        planId,
        activityId: "GUIDE_ACTIVITY_ID",
        completionStatus: "complete",
      });

      const fetchAction = await dispatch(
        fetchPlan({
          planId,
          backendURL: "http://localhost:3001",
          fetchUrl: "/api/adaptive-plan",
        })
      );

      dispatch(setCurrentIndex(oldIndex + 1)); // always increment
    } catch (err) {
      console.error("Error finishing guide activity:", err);
      dispatch(setCurrentIndex(oldIndex + 1));
    }

    typeof onFinish === "function" && onFinish();
  }

  /* ———————————————————————————————————— render ———————————————————————————————————— */
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
        {/* ───── Slide 1 ───── */}
        <Box sx={slideStyle}>
          <Box sx={cardStyle}>
            <Box sx={iconContainerStyle}>
              <CheckCircle sx={{ fontSize: 40, color: accentPurple }} />
            </Box>

            <Typography variant="h4" sx={headingStyle}>
              {welcomeHeading}
            </Typography>

            <Typography
              variant="body1"
              sx={{ marginBottom: "1.5rem", color: "#ccc" }}
            >
              {welcomeBullets.map((txt) => (
                <div key={txt}>{txt}</div>
              ))}
            </Typography>

            <Box sx={buttonRowStyle}>
              <Box /> {/* spacer */}
              <Button variant="contained" sx={primaryButtonStyle} onClick={goNext}>
                Next
              </Button>
            </Box>
          </Box>
        </Box>

        {/* ───── Slide 2 ───── */}
        <Box sx={slideStyle}>
          <Box sx={cardStyle}>
            <Box sx={iconContainerStyle}>
              <CheckCircle sx={{ fontSize: 40, color: accentPurple }} />
            </Box>

            <Typography variant="h4" sx={headingStyle}>
              What We'll Ask You
            </Typography>

            <Typography
              variant="body1"
              sx={{ marginBottom: "1.5rem", color: "#ccc" }}
            >
              {askBullets.map((txt) => (
                <div key={txt}>{txt}</div>
              ))}
            </Typography>

            <Box sx={buttonRowStyle}>
              <Button variant="outlined" sx={backButtonStyle} onClick={goPrev}>
                Back
              </Button>
              <Button variant="contained" sx={primaryButtonStyle} onClick={goNext}>
                Next
              </Button>
            </Box>
          </Box>
        </Box>

        {/* ───── Slide 3 (unchanged) ───── */}
        <Box sx={slideStyle}>
          <Box sx={cardStyle}>
            <Box sx={iconContainerStyle}>
              <CheckCircle sx={{ fontSize: 40, color: accentPurple }} />
            </Box>

            <Typography variant="h4" sx={headingStyle}>
              Ready for Lift-Off?
            </Typography>

            <Typography
              variant="body1"
              sx={{ marginBottom: "1.5rem", color: "#ccc" }}
            >
              <div>• Daily tasks & quizzes adapt to you 🚀</div>
              <div>• No stress: short practice sessions 🧘‍♂️</div>
              <div>• Let’s finalize your plan & start improving!</div>
            </Typography>

            <Box sx={buttonRowStyle}>
              <Button variant="outlined" sx={backButtonStyle} onClick={goPrev}>
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