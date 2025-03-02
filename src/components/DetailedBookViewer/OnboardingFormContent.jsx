// src/components/DetailedBookViewer/OnboardingFormContent.jsx

import React, { useState } from "react";
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
} from "@mui/material";

// Import your updated plan wizard
import EditAdaptivePlanModal from "./1.SidePanels/LibraryChild/EditAdaptivePlanModal";

export default function OnboardingFormContent() {
  const [step, setStep] = useState(1);

  // File + title
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfTitle, setPdfTitle] = useState("");
  const [autoGenerateTitle, setAutoGenerateTitle] = useState(false);

  // Upload states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const [processing, setProcessing] = useState(false);
  // If you eventually need "processingComplete," add it here

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
    setStep(2);
    setUploading(true);

    try {
      await uploadPDF(pdfFile);
      setUploadDone(true);
      setProcessing(true);
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
   * STEP 2: ANALYZING
   * -------------------------------- */
  function Step2Analyzing() {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        {!uploadDone ? (
          <>
            <Typography variant="h6" gutterBottom>
              Uploading Your PDF...
            </Typography>
            <Box sx={{ mb: 2 }}>
              <CircularProgress />
            </Box>
            <Typography sx={{ mt: 1 }}>{uploadProgress}%</Typography>
          </>
        ) : processing ? (
          <>
            <Typography variant="h6" gutterBottom>
              Upload Complete!
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Now analyzing your PDF with AI to understand different sections.
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              We’re working behind the scenes to create a detailed plan. This may take
              some time, so please be patient.
            </Typography>

            <Box
              sx={{
                width: 150,
                height: 150,
                margin: "0 auto",
                background:
                  "url('https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif') center/cover",
                borderRadius: "50%",
                mb: 3,
              }}
            />

            <Button variant="contained" onClick={() => setStep(3)}>
              Create Adaptive Plan
            </Button>
          </>
        ) : (
          <Typography>Unexpected state encountered.</Typography>
        )}
      </Box>
    );
  }

  /* --------------------------------
   * STEP 3: RENDER PLAN WIZARD INLINE
   * -------------------------------- */
  function Step3ShowPlanWizard() {
    // We pass `renderAsDialog={false}` so it does NOT open a MUI <Dialog>.
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Step 3: Create Your Plan
        </Typography>

        <EditAdaptivePlanModal
          renderAsDialog={false}  // Important: no separate dialog
          open={true}             // We'll pass open={true}, but it won't matter in inline mode
          onClose={() => setStep(2)}  // If user clicks "Back" at step=0, we go back to step=2
          userId="demo-user-id-1234"
          // You could pass your real backendURL or bookId here if you have them
        />
      </Box>
    );
  }

  return (
    <Box sx={{ color: "#fff" }}>
      {step === 1 && <Step1UploadForm />}
      {step === 2 && <Step2Analyzing />}
      {step === 3 && <Step3ShowPlanWizard />}
    </Box>
  );
}