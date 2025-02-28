// src/components/DetailedBookViewer/EditAdaptivePlanModal.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Grid,
  IconButton,
  InputLabel,
} from "@mui/material";
// Example emoji icons (you can swap for actual icons from @mui/icons-material if preferred)
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import SpeedIcon from "@mui/icons-material/Speed";
import QuizIcon from "@mui/icons-material/Quiz";
import RepeatIcon from "@mui/icons-material/Repeat";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import PlaylistAddCheckCircleIcon from "@mui/icons-material/PlaylistAddCheckCircle";

/**
 * EditAdaptivePlanModal
 *
 * A modal for editing/updating an adaptive plan.
 * You can reuse the logic from AdaptivePlanGenerator,
 * but rename it to "Update Plan" or similar.
 *
 * Props:
 *  - open (bool): controls whether the dialog is open
 *  - onClose (function): called when user cancels or closes the dialog
 *  - userId (string): current user ID
 *  - colorScheme (object): optional styling
 *  - existingPlanData (object): if you have existing plan data to populate
 *  - onPlanUpdate (function): called after successfully updating the plan
 */
export default function EditAdaptivePlanModal({
  open,
  onClose,
  userId,
  colorScheme = {},
  existingPlanData = {},
  onPlanUpdate = () => {},
}) {
  // Here we reuse or adapt your form fields
  const [targetDate, setTargetDate] = useState("");
  const [maxDays, setMaxDays] = useState("");
  const [wpm, setWpm] = useState("");
  const [dailyReadingTime, setDailyReadingTime] = useState("");
  const [quizTime, setQuizTime] = useState("");
  const [reviseTime, setReviseTime] = useState("");
  const [masteryLevel, setMasteryLevel] = useState("");

  // Book/Chapter/Subchapter IDs (if relevant)
  const [bookIdsString, setBookIdsString] = useState("");
  const [chapterIdsString, setChapterIdsString] = useState("");
  const [subchapterIdsString, setSubchapterIdsString] = useState("");

  // Suppose you have an endpoint to update or generate the plan
  const planEndpointURL = "https://generateadaptiveplan-zfztjkkvva-uc.a.run.app";

  // On mount or if existingPlanData changes, fill the form
  useEffect(() => {
    if (existingPlanData) {
      setTargetDate(existingPlanData.targetDate || "");
      setMaxDays(existingPlanData.maxDays || "");
      setWpm(existingPlanData.wpm || "");
      setDailyReadingTime(existingPlanData.dailyReadingTime || "");
      setQuizTime(existingPlanData.quizTime || "");
      setReviseTime(existingPlanData.reviseTime || "");
      setMasteryLevel(existingPlanData.level || "");
      // convert arrays to comma-separated strings
      setBookIdsString(
        existingPlanData.selectedBooks?.join(", ") || ""
      );
      setChapterIdsString(
        existingPlanData.selectedChapters?.join(", ") || ""
      );
      setSubchapterIdsString(
        existingPlanData.selectedSubChapters?.join(", ") || ""
      );
    }
  }, [existingPlanData]);

  // Handler
  const handleSavePlan = async () => {
    if (!userId) {
      alert("No user ID found. Cannot update plan.");
      return;
    }
    if (!targetDate) {
      alert("Target Date is required!");
      return;
    }

    // Build request body
    const requestBody = { userId, targetDate };

    if (maxDays) requestBody.maxDays = Number(maxDays);
    if (wpm) requestBody.wpm = Number(wpm);
    if (dailyReadingTime) requestBody.dailyReadingTime = Number(dailyReadingTime);
    if (quizTime) requestBody.quizTime = Number(quizTime);
    if (reviseTime) requestBody.reviseTime = Number(reviseTime);
    if (masteryLevel.trim()) {
      requestBody.level = masteryLevel.trim();
    }

    // Book/Chapter/SubCh IDs
    if (bookIdsString.trim()) {
      requestBody.selectedBooks = bookIdsString
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
    }
    if (chapterIdsString.trim()) {
      requestBody.selectedChapters = chapterIdsString
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
    }
    if (subchapterIdsString.trim()) {
      requestBody.selectedSubChapters = subchapterIdsString
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
    }

    try {
      const res = await axios.post(planEndpointURL, requestBody, {
        headers: { "Content-Type": "application/json" },
      });
      console.log("Plan updated:", res.data);
      if (res.status === 200) {
        alert("Plan updated successfully!");
        onPlanUpdate(); // or pass back the data
        onClose();      // close the modal
      } else {
        alert("Error updating plan!");
      }
    } catch (err) {
      console.error("Error updating plan:", err);
      alert("Failed to update plan. Check console.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ backgroundColor: colorScheme.cardBg || "#222", color: "#fff" }}>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          Edit Adaptive Plan
        </Typography>
      </DialogTitle>

      <DialogContent
        sx={{
          backgroundColor: colorScheme.cardBg || "#2F2F2F",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          paddingTop: 2,
        }}
      >
        {/* We can group fields visually using MUI's Grid */}
        <Grid container spacing={2}>
          {/* Target Date */}
          <Grid item xs={12} sm={6}>
            <InputLabel>
              <span role="img" aria-label="calendar">📅</span> Target Date:
            </InputLabel>
            <TextField
              fullWidth
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              size="small"
            />
          </Grid>

          {/* Max Days */}
          <Grid item xs={12} sm={6}>
            <InputLabel>
              <span role="img" aria-label="days">⏳</span> Max Days:
            </InputLabel>
            <TextField
              fullWidth
              type="number"
              value={maxDays}
              onChange={(e) => setMaxDays(e.target.value)}
              placeholder="(Leave blank)"
              size="small"
            />
          </Grid>

          {/* WPM */}
          <Grid item xs={12} sm={6}>
            <InputLabel>
              <SpeedIcon fontSize="small" /> WPM:
            </InputLabel>
            <TextField
              fullWidth
              type="number"
              value={wpm}
              onChange={(e) => setWpm(e.target.value)}
              placeholder="(Leave blank)"
              size="small"
            />
          </Grid>

          {/* Daily Reading Time */}
          <Grid item xs={12} sm={6}>
            <InputLabel>
              <LibraryBooksIcon fontSize="small" /> Daily Reading Time (min):
            </InputLabel>
            <TextField
              fullWidth
              type="number"
              value={dailyReadingTime}
              onChange={(e) => setDailyReadingTime(e.target.value)}
              placeholder="(Leave blank)"
              size="small"
            />
          </Grid>

          {/* Quiz Time */}
          <Grid item xs={12} sm={6}>
            <InputLabel>
              <QuizIcon fontSize="small" /> Quiz Time (min):
            </InputLabel>
            <TextField
              fullWidth
              type="number"
              value={quizTime}
              onChange={(e) => setQuizTime(e.target.value)}
              placeholder="(default 1)"
              size="small"
            />
          </Grid>

          {/* Revise Time */}
          <Grid item xs={12} sm={6}>
            <InputLabel>
              <RepeatIcon fontSize="small" /> Revise Time (min):
            </InputLabel>
            <TextField
              fullWidth
              type="number"
              value={reviseTime}
              onChange={(e) => setReviseTime(e.target.value)}
              placeholder="(default 1)"
              size="small"
            />
          </Grid>

          {/* Mastery Level */}
          <Grid item xs={12} sm={12}>
            <InputLabel>
              <PlaylistAddCheckCircleIcon fontSize="small" /> Mastery Level:
            </InputLabel>
            <TextField
              fullWidth
              type="text"
              value={masteryLevel}
              onChange={(e) => setMasteryLevel(e.target.value)}
              placeholder='e.g. "mastery" or "revision"'
              size="small"
            />
          </Grid>

          {/* Book IDs */}
          <Grid item xs={12}>
            <InputLabel>
              <span role="img" aria-label="books">📚</span> Book IDs (comma-separated):
            </InputLabel>
            <TextField
              fullWidth
              type="text"
              value={bookIdsString}
              onChange={(e) => setBookIdsString(e.target.value)}
              placeholder='e.g. "abcd123, efgh456"'
              size="small"
            />
          </Grid>

          {/* Chapter IDs */}
          <Grid item xs={12}>
            <InputLabel>
              <span role="img" aria-label="chapters">📖</span> Chapter IDs (comma-separated):
            </InputLabel>
            <TextField
              fullWidth
              type="text"
              value={chapterIdsString}
              onChange={(e) => setChapterIdsString(e.target.value)}
              placeholder='e.g. "ch1, ch2"'
              size="small"
            />
          </Grid>

          {/* Subchapter IDs */}
          <Grid item xs={12}>
            <InputLabel>
              <span role="img" aria-label="subchapters">📝</span> Subchapter IDs (comma-separated):
            </InputLabel>
            <TextField
              fullWidth
              type="text"
              value={subchapterIdsString}
              onChange={(e) => setSubchapterIdsString(e.target.value)}
              placeholder='e.g. "subA, subB"'
              size="small"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ backgroundColor: colorScheme.cardBg || "#222" }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ color: "#fff", borderColor: "#aaa" }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSavePlan}
          variant="contained"
          sx={{
            backgroundColor: colorScheme.accent || "#BB86FC",
            color: "#000",
            ":hover": { backgroundColor: "#9f6cd9" },
            fontWeight: "bold",
          }}
        >
          Save Plan
        </Button>
      </DialogActions>
    </Dialog>
  );
}