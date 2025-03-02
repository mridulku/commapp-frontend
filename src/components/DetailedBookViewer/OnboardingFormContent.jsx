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
} from "@mui/material";

// Import your final ProcessAnimation component
import ProcessAnimation from "./ProcessAnimation"; // <-- adjust path if needed

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

  // We won't have a separate "processing" flag anymore; 
  // once the upload is done, we show "Upload Complete" and the animation.

  // For the user ID
  const [currentUserId, setCurrentUserId] = useState("demoUserId");

  // On mount, fetch the user from Firebase auth
  useEffect(() => {
    const user = auth.currentUser;
    if (user?.uid) {
      setCurrentUserId(user.uid);
    }
  }, []);

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
   * STEP 2: SHOW UPLOAD PROGRESS OR "UPLOAD COMPLETE + ProcessAnimation"
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
          // Upload finished => show "Upload Complete" AND the ProcessAnimation component
          <Box>
            <Typography variant="h6" gutterBottom>
              Upload Complete!
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Now you can analyze your PDF with AI to detect chapters and sub-chapters.
            </Typography>

            {/* Render the ProcessAnimation right here */}
            <ProcessAnimation userId={currentUserId} />
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ color: "#fff" }}>
      {step === 1 && <Step1UploadForm />}
      {step === 2 && <Step2UploadingOrAnalyze />}
    </Box>
  );
}