// src/components/DetailedBookViewer/UploadBook.jsx

import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import {
  ref as firebaseRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { storage, auth } from "../../firebase";

export default function UploadBook({ userId, onComplete }) {
  // States for PDF selection and title
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfTitle, setPdfTitle] = useState("");
  const [autoGenerateTitle, setAutoGenerateTitle] = useState(false);

  // Upload states
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadDone, setUploadDone] = useState(false);

  // If you need the user from Firebase directly:
  // const [currentUserId, setCurrentUserId] = useState(userId || null);

  // Handler for uploading the selected PDF
  const handleUpload = async () => {
    if (!pdfFile) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // 1. Upload PDF to Firebase
      const downloadURL = await uploadPDF(pdfFile);

      // 2. Mark user as onboarded
      await markUserOnboarded(userId);

      setUploadDone(true);
      console.log("PDF uploaded. Download URL:", downloadURL);

      // 3. Signal parent that we’re done (move to next step)
      onComplete();
    } catch (error) {
      console.error("Error uploading PDF:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Upload to Firebase Storage
  const uploadPDF = (file) => {
    return new Promise((resolve, reject) => {
      const currentUser = auth.currentUser;
      const path = `pdfUploads/${file.name}/${file.name}`;
      const storageRef = firebaseRef(storage, path);

      const metadata = {
        customMetadata: {
          category: "academic",
          userId: currentUser?.uid || userId || "noUser",
          courseName: pdfTitle,
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
  };

  // Mark the user as onboarded in your backend
  const markUserOnboarded = async (uid) => {
    if (!uid) return;
    try {
      // Replace this endpoint with your actual backend endpoint
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/learner-personas/onboard`, {
        userId: uid,
      });
      console.log("User marked as onboarded:", uid);
    } catch (err) {
      console.error("Error marking user onboarded:", err);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 600,
        margin: "0 auto",
        backgroundColor: "#f5f5f5",
        p: 3,
        borderRadius: 2,
        textAlign: "center",
      }}
    >
      <Typography variant="h6" gutterBottom>
        Upload Your Book
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Select a PDF file, optionally enter a title (or auto-generate it).
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
          sx={{ mb: 1, width: "100%" }}
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

      {/* Upload / Next button */}
      <Box sx={{ mt: 3 }}>
        {uploading ? (
          <>
            {!uploadDone ? (
              <>
                <Typography variant="body1" gutterBottom>
                  Uploading {uploadProgress}%
                </Typography>
                <CircularProgress />
              </>
            ) : (
              <Typography variant="body1" color="success.main">
                Upload Complete!
              </Typography>
            )}
          </>
        ) : (
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!pdfFile}
          >
            Upload
          </Button>
        )}
      </Box>
    </Box>
  );
}