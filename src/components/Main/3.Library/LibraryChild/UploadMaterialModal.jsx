// src/components/DetailedBookViewer/UploadMaterialModal.jsx

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Stack
} from "@mui/material";

export default function UploadMaterialModal({
  open,
  onClose,
  onUpload,
}) {
  // Local states for the form
  const [materialName, setMaterialName] = useState("");
  const [materialFile, setMaterialFile] = useState(null);

  // If the parent wants to reset these fields each time the modal opens,
  // you can do so by resetting them in `onClose` or using `useEffect`.
  // For simplicity, we'll keep them as is.

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setMaterialFile(e.target.files[0]);
    }
  };

  const handleUploadClick = () => {
    // Pass the data back to parent
    if (onUpload) {
      onUpload({
        name: materialName,
        file: materialFile,
      });
    }
    // Then close
    if (onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Upload New Material</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Material Name"
            value={materialName}
            onChange={(e) => setMaterialName(e.target.value)}
            fullWidth
          />
          <Button variant="outlined" component="label">
            Choose File
            <input
              hidden
              type="file"
              onChange={handleFileChange}
            />
          </Button>
          {materialFile && (
            <Typography variant="body2" sx={{ color: "#444" }}>
              Selected file: {materialFile.name}
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="primary" onClick={handleUploadClick}>
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
}