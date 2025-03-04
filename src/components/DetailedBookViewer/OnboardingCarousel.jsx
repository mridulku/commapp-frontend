// src/components/DetailedBookViewer/OnboardingCarousel.jsx

import React, { useState } from "react";
import { Box, Button, Typography } from "@mui/material";

export default function OnboardingCarousel({ onFinish }) {
  // A simple local state to track which slide is active
  const [slideIndex, setSlideIndex] = useState(0);

  // Example slides (replace with your own content or design)
  const slides = [
    {
      title: "Welcome to Our Platform",
      description:
        "This quick tour will show you how to get started with your book uploading!",
    },
    {
      title: "How It Works",
      description:
        "You can upload your book, let us analyze it, and then create an adaptive plan.",
    },
    {
      title: "Ready to Begin?",
      description:
        "Click 'Start Uploading' to proceed to the upload step. You can revisit these steps later if needed.",
    },
  ];

  // Move to the next slide or finish if we're on the last one
  const handleNext = () => {
    if (slideIndex < slides.length - 1) {
      setSlideIndex((prev) => prev + 1);
    } else {
      // When user is done with the final slide, call onFinish
      onFinish();
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 600,
        margin: "0 auto",
        textAlign: "center",
        backgroundColor: "#f5f5f5",
        p: 3,
        borderRadius: 2,
      }}
    >
      <Typography variant="h5" gutterBottom>
        {slides[slideIndex].title}
      </Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        {slides[slideIndex].description}
      </Typography>

      <Button variant="contained" onClick={handleNext}>
        {slideIndex < slides.length - 1 ? "Next" : "Start Uploading"}
      </Button>
    </Box>
  );
}