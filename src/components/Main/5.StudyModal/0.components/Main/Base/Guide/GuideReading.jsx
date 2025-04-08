/**
 * File: ReadingGuide.jsx
 * Description:
 *   - A more visually guided introduction when the user first arrives
 *   - Encourages them to press “Continue” (Begin Reading) to move forward
 *     in the plan flow by incrementing the activity index.
 */

import React from "react";
import {
  Box,
  Paper,
  Grid,
  Typography,
  Button,
  Divider,
  useMediaQuery
} from "@mui/material";

import { useDispatch, useSelector } from "react-redux";
// Adjust import path to wherever your planSlice is:
import { setCurrentIndex } from "../../../../../../../store/planSlice";

// Icons (example placeholders)
import MenuBookIcon from "@mui/icons-material/MenuBook";       // Reading
import QuizIcon from "@mui/icons-material/Quiz";              // Remember
import WbIncandescentIcon from "@mui/icons-material/WbIncandescent"; // Understand
import BuildCircleIcon from "@mui/icons-material/BuildCircle"; // Apply
import PsychologyIcon from "@mui/icons-material/Psychology";  // Analyze
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

export default function GuideReading({ activity, onFinish }) {
  const dispatch = useDispatch();
  // Adjust if your store shape is different:
  const currentIndex = useSelector((state) => state.plan?.currentIndex ?? 0);

  // Use a media query to adjust layout on small screens
  const isSmallScreen = useMediaQuery("(max-width:600px)");

  // Handle button click: increment the plan's activity index
  function handleBeginReading() {
    dispatch(setCurrentIndex(currentIndex + 1));
    if (typeof onFinish === "function") {
      onFinish();
    }
  }

  return (
    <Box sx={styles.container}>
      <Paper elevation={3} sx={styles.innerPaper}>
        {/* Title / Welcome */}
        <Typography variant="h3" sx={styles.title}>
          Welcome to Your Learning Journey
        </Typography>
        <Typography variant="body1" sx={styles.subtitle}>
          We’ll walk you through <strong>Reading</strong> first, then
          guide you through all stages of deep learning.
        </Typography>

        <Divider sx={{ my: 2, borderColor: "#555" }} />

        {/* Body grid => icons for the 5 stages */}
        <Typography variant="body2" sx={styles.introText}>
          Our platform follows a <strong>5-stage flow</strong> based on 
          <em> Bloom's Taxonomy</em>:
        </Typography>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Box sx={styles.stageBox}>
              <MenuBookIcon sx={styles.stageIcon} />
              <Typography variant="subtitle1" sx={styles.stageTitle}>
                Reading
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Box sx={styles.stageBox}>
              <QuizIcon sx={styles.stageIcon} />
              <Typography variant="subtitle1" sx={styles.stageTitle}>
                Remember
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Box sx={styles.stageBox}>
              <WbIncandescentIcon sx={styles.stageIcon} />
              <Typography variant="subtitle1" sx={styles.stageTitle}>
                Understand
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Box sx={styles.stageBox}>
              <BuildCircleIcon sx={styles.stageIcon} />
              <Typography variant="subtitle1" sx={styles.stageTitle}>
                Apply
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Box sx={styles.stageBox}>
              <PsychologyIcon sx={styles.stageIcon} />
              <Typography variant="subtitle1" sx={styles.stageTitle}>
                Analyze
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Typography variant="body2" sx={styles.paragraph}>
          You’ll <strong>start with Reading</strong> to get an overview of
          the subchapter content, then we’ll move to 
          <em> immediate recall (Remember)</em>, 
          deeper comprehension (Understand), 
          scenario-based practice (Apply), 
          and advanced tasks (Analyze).
        </Typography>

        <Divider sx={{ my: 2, borderColor: "#555" }} />

        <Typography variant="h5" sx={{ mt: 2, color: "#fff" }}>
          Time to Begin Reading!
        </Typography>
        <Typography variant="body2" sx={styles.paragraph}>
          Once you finish reading, we’ll show you a quick quiz to see what
          you recall, and then guide you further. Take your time, and let the 
          system track your reading speed automatically.
        </Typography>

        <Button
          variant="contained"
          color="primary"
          endIcon={<ArrowForwardIcon />}
          sx={{ mt: 2, fontWeight: "bold" }}
          onClick={handleBeginReading}
        >
          {isSmallScreen ? "Begin" : "Begin Reading"}
        </Button>
      </Paper>
    </Box>
  );
}

const styles = {
  container: {
    backgroundColor: "#000", // dark background
    width: "100%",
    minHeight: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxSizing: "border-box",
    padding: "1rem",
  },
  innerPaper: {
    maxWidth: "800px",
    width: "100%",
    backgroundColor: "#111",
    color: "#fff",
    borderRadius: "8px",
    padding: "24px",
    textAlign: "left",
  },
  title: {
    color: "#fff",
    fontWeight: "bold",
    marginBottom: "0.5rem",
  },
  subtitle: {
    color: "#ddd",
    marginBottom: "1rem",
  },
  introText: {
    marginBottom: "0.5rem",
    color: "#bbb",
  },
  paragraph: {
    marginTop: "1rem",
    color: "#ccc",
  },
  stageBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#222",
    borderRadius: "6px",
    padding: "1rem",
    textAlign: "center",
  },
  stageIcon: {
    fontSize: "2rem",
    color: "#FFD700",
    marginBottom: "0.5rem",
  },
  stageTitle: {
    color: "#fff",
    fontWeight: "bold",
  },
};