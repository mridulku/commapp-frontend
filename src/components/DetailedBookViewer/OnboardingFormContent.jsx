// src/components/DetailedBookViewer/OnboardingFormContent.jsx

import React, { useState } from "react";
import axios from "axios";
import {
  ref as firebaseRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { storage, auth } from "../../firebase";

import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  FormHelperText,
} from "@mui/material";

const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

const UPSC_SUBJECTS = [
  "History",
  "Polity & Governance",
  "Geography",
  "Economics",
  "Environment & Ecology",
  "General Science",
  "Current Affairs",
];
const JEE_SUBJECTS = ["Physics", "Chemistry", "Mathematics"];

export default function OnboardingFormContent() {
  // Single-step form approach collecting the same data
  const [formData, setFormData] = useState({
    name: "",
    exam: "",
    subject: "",
    dailyHours: "",
    preparationGoal: "",
    additionalNote: "",
    pdfFile: null,
  });

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // If exam changes, reset subject
  const handleExamChange = (examVal) => {
    setFormData((prev) => ({
      ...prev,
      exam: examVal,
      subject: "", // reset subject if exam changes
    }));
  };

  const handlePdfSelect = (e) => {
    const file = e.target.files?.[0];
    setFormData((prev) => ({ ...prev, pdfFile: file || null }));
  };

  // Based on exam, choose subject array
  let subjectOptions = [];
  if (formData.exam === "UPSC") subjectOptions = UPSC_SUBJECTS;
  if (formData.exam === "IIT JEE") subjectOptions = JEE_SUBJECTS;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMessage("");

    try {
      // 1) If pdfFile is present, upload
      let pdfLink = "";
      if (formData.pdfFile) {
        pdfLink = await uploadPDFWithMetadata(formData.pdfFile);
      }

      // 2) Build payload
      const payload = {
        category: "academic",
        answers: {
          name: formData.name,
          exam: formData.exam,
          subject: formData.subject,
          dailyHours: formData.dailyHours,
          preparationGoal: formData.preparationGoal,
          additionalNote: formData.additionalNote,
          pdfLink: pdfLink,
        },
      };

      const token = localStorage.getItem("token") || "";
      const resp = await axios.post(`${backendURL}/api/learnerpersona`, payload, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      if (resp.data.success) {
        setSuccessMessage("All set! Your onboarding is complete.");
      } else {
        setSuccessMessage("Something went wrong storing your info.");
      }
    } catch (err) {
      console.error("Error submitting =>", err);
      setSuccessMessage("Error uploading or submitting. Check console logs.");
    }

    setSubmitting(false);
  }

  // Same PDF logic as the chat version
  function uploadPDFWithMetadata(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve("");
        return;
      }
      const user = auth.currentUser;
      const path = `pdfUploads/${file.name}/${file.name}`;
      const storageRef = firebaseRef(storage, path);
      const metadata = {
        customMetadata: {
          category: "Academic",
          userId: user?.uid || "noUser",
        },
      };

      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      uploadTask.on(
        "state_changed",
        (snap) => {
          const progress = (snap.bytesTransferred / snap.totalBytes) * 100;
          console.log(`[UploadProgress] => ${progress}%`);
        },
        (err) => reject(err),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  }

  return (
    <Box sx={{ color: "#fff" }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Onboarding Form
      </Typography>
      {successMessage && (
        <Typography sx={{ color: "lime", mb: 2 }}>{successMessage}</Typography>
      )}

      {/* Form */}
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          {/* Name */}
          <Grid item xs={12}>
            <TextField
              label="Name"
              variant="outlined"
              fullWidth
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              InputProps={{ style: { backgroundColor: "#fff" } }}
            />
          </Grid>

          {/* Exam */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Exam</InputLabel>
              <Select
                label="Exam"
                value={formData.exam}
                onChange={(e) => handleExamChange(e.target.value)}
                sx={{ backgroundColor: "#fff" }}
              >
                <MenuItem value="">(Select an exam)</MenuItem>
                <MenuItem value="UPSC">UPSC</MenuItem>
                <MenuItem value="IIT JEE">IIT JEE</MenuItem>
              </Select>
              <FormHelperText>Which exam are you preparing for?</FormHelperText>
            </FormControl>
          </Grid>

          {/* Subject (conditional) */}
          {formData.exam && (
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Subject</InputLabel>
                <Select
                  label="Subject"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, subject: e.target.value }))
                  }
                  sx={{ backgroundColor: "#fff" }}
                >
                  <MenuItem value="">(Select a subject)</MenuItem>
                  {subjectOptions.map((subj) => (
                    <MenuItem key={subj} value={subj}>
                      {subj}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>Which subject are you focusing on?</FormHelperText>
              </FormControl>
            </Grid>
          )}

          {/* Daily Hours */}
          <Grid item xs={12}>
            <TextField
              label="Daily Study Hours"
              type="number"
              variant="outlined"
              fullWidth
              value={formData.dailyHours}
              onChange={(e) =>
                setFormData((p) => ({ ...p, dailyHours: e.target.value }))
              }
              InputProps={{ style: { backgroundColor: "#fff" }, inputProps: { min: 0 } }}
            />
          </Grid>

          {/* Preparation Goal */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Preparation Goal</InputLabel>
              <Select
                label="Preparation Goal"
                value={formData.preparationGoal}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, preparationGoal: e.target.value }))
                }
                sx={{ backgroundColor: "#fff" }}
              >
                <MenuItem value="">(Select a goal)</MenuItem>
                <MenuItem value="revise">Revise</MenuItem>
                <MenuItem value="start afresh">Start Afresh</MenuItem>
                <MenuItem value="deep mastery">Deep Mastery</MenuItem>
              </Select>
              <FormHelperText>What's your preparation approach?</FormHelperText>
            </FormControl>
          </Grid>

          {/* Additional Note */}
          <Grid item xs={12}>
            <TextField
              label="Additional Note"
              variant="outlined"
              fullWidth
              multiline
              rows={2}
              value={formData.additionalNote}
              onChange={(e) =>
                setFormData((p) => ({ ...p, additionalNote: e.target.value }))
              }
              InputProps={{ style: { backgroundColor: "#fff" } }}
            />
          </Grid>

          {/* PDF Upload */}
          <Grid item xs={12}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Upload PDF (optional)
            </Typography>
            <input type="file" accept="application/pdf" onChange={handlePdfSelect} />
            {formData.pdfFile && (
              <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
                {formData.pdfFile.name}
              </Typography>
            )}
          </Grid>
        </Grid>

        {/* Submit button */}
        <Box sx={{ textAlign: "right", mt: 3 }}>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            sx={{ fontWeight: "bold" }}
          >
            {submitting ? "Submitting..." : "Finalize"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}