// src/components/DetailedBookViewer/OnboardingFormContent.jsx

import React, { useState, useEffect } from "react";
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
  Button,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";

// Import your final ProcessAnimation component
import ProcessAnimation from "./ProcessAnimation"; // <-- adjust path if needed

/**
 * OnboardingFormContent
 * Renders a top nav bar (3-step), then the usual
 * (1) PDF Upload => (2) ProcessAnimation => (3) Plan Wizard (via EditAdaptivePlanModal).
 */
export default function OnboardingFormContent() {
  // "step" is the internal logic:
  //   step=1 => show upload form
  //   step=2 => show upload progress or process animation
  //
  // But we also have an "activeNavStep" for the top Stepper (1..3):
  //   1 => "Upload"
  //   2 => "Analyze"
  //   3 => "Plan"
  const [step, setStep] = useState(1);
  const [activeNavStep, setActiveNavStep] = useState(0);

  // File + title
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfTitle, setPdfTitle] = useState("");
  const [autoGenerateTitle, setAutoGenerateTitle] = useState(false);

  // Upload states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);

  // For the user ID
  const [currentUserId, setCurrentUserId] = useState("demoUserId");

  useEffect(() => {
    // On mount, fetch user from Firebase
    const user = auth.currentUser;
    if (user?.uid) {
      setCurrentUserId(user.uid);
    }
  }, []);

  // On load, we set the navigation step to 0 => "Upload"
  useEffect(() => {
    setActiveNavStep(0); // step index: 0 => "Upload", 1 => "Analyze", 2 => "Plan"
  }, []);

  /* --------------------------------
   * Step Navigation (Top Bar)
   * -------------------------------- */
  const steps = ["Upload", "Analyze", "Plan"]; // 3 steps
  // "activeNavStep" = 0, 1, or 2

  function renderNavBar() {
    return (
      <Box sx={{ mb: 2 }}>
        <Stepper activeStep={activeNavStep}>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>
    );
  }

  /* --------------------------------
   * STEP 1: SELECT & UPLOAD
   * -------------------------------- */
  function Step1UploadForm() {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" gutterBottom>
          Upload Your PDF
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose your PDF file and enter a title (or auto-generate).
        </Typography>

        {/* File Picker */}
        <Button variant="contained" component="label" sx={{ mb: 2 }}>
          Choose PDF
          <input
            type="file"
            accept="application/pdf"
            hidden
            onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
          />
        </Button>
        {pdfFile && (
          <Typography variant="subtitle2" sx={{ mt: 1 }}>
            Selected: {pdfFile.name}
          </Typography>
        )}

        {/* PDF Title or auto-generate */}
        <Box sx={{ mt: 2 }}>
          <TextField
            label="PDF Title"
            variant="outlined"
            disabled={autoGenerateTitle}
            value={pdfTitle}
            onChange={(e) => setPdfTitle(e.target.value)}
            sx={{ backgroundColor: "#fff", mb: 1, width: "100%", maxWidth: 400 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={autoGenerateTitle}
                onChange={(e) => setAutoGenerateTitle(e.target.checked)}
              />
            }
            label="Auto-generate title"
          />
        </Box>

        {/* Next button */}
        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            onClick={handleNextFromStep1}
            disabled={!pdfFile}
          >
            Next
          </Button>
        </Box>
      </Box>
    );
  }

  async function handleNextFromStep1() {
    if (!pdfFile) return;
    // Move local step => 2
    setStep(2);
    // Move nav => 1 => "Analyze"
    setActiveNavStep(1);

    setUploading(true);
    try {
      await uploadPDF(pdfFile);
      setUploadDone(true);
    } catch (err) {
      console.error("Upload error:", err);
      setUploadDone(false);
    } finally {
      setUploading(false);
    }
  }

  function uploadPDF(file) {
    return new Promise((resolve, reject) => {
      const user = auth.currentUser;
      const path = `pdfUploads/${file.name}/${file.name}`;
      const storageRef = firebaseRef(storage, path);

      const metadata = {
        customMetadata: {
          category: "academic",
          userId: user?.uid || "noUser",
          courseName: pdfTitle, // <<-- pass your pdfTitle here
        },
      };

      const uploadTask = uploadBytesResumable(storageRef, file, metadata);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(prog));
        },
        (err) => reject(err),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  }

  /* --------------------------------
   * STEP 2: SHOW UPLOAD PROGRESS OR "PROCESS ANIMATION"
   * -------------------------------- */
  function Step2UploadingOrAnalyze() {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        {!uploadDone ? (
          // Still uploading => show progress
          <>
            <Typography variant="h6" gutterBottom>
              Uploading Your PDF...
            </Typography>
            <Box sx={{ mb: 2 }}>
              <CircularProgress />
            </Box>
            <Typography sx={{ mt: 1 }}>{uploadProgress}%</Typography>
          </>
        ) : (
          // Upload finished => show "Upload Complete" AND the ProcessAnimation
          <Box>
            <Typography variant="h6" gutterBottom>
              Upload Complete!
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Now analyzing your PDF with AI to detect chapters and sub-chapters...
            </Typography>

            {/* 
              Render the ProcessAnimation right here.
              We pass a callback that sets activeNavStep=2 
              whenever the "Create Plan" button is clicked in that component 
              (which triggers the EditAdaptivePlanModal).
            */}
            <ProcessAnimation
              userId={currentUserId}
              onShowPlanModal={() => setActiveNavStep(2)}
            />
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ color: "#fff" }}>
      {/* Top step navigation bar */}
      {renderNavBar()}

      {/* Then the main content */}
      {step === 1 && <Step1UploadForm />}
      {step === 2 && <Step2UploadingOrAnalyze />}
    </Box>
  );
}