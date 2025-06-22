// CumulativeRevision.jsx

import React from "react";
import {
  Box,
  Card,
  Typography,
  CardContent,
  Chip,
} from "@mui/material";
import ReplayIcon from "@mui/icons-material/Replay"; // revision glyph

export default function CumulativeRevision({ examId, activity, userId }) {
  const SHOW_PLACEHOLDER = true;

  if (SHOW_PLACEHOLDER) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#000",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          pt: 12,
          color: "#fff",
        }}
      >
        {/* Title pill */}
        <Chip
          icon={<ReplayIcon sx={{ color: "#BB86FC" }} />}
          label="Cumulative Revision"
          sx={{
            bgcolor: "#1E1E1E",
            color: "#fff",
            px: 2,
            py: 1,
            fontWeight: 600,
            fontSize: "1rem",
            borderRadius: "999px",
            mb: 5,
          }}
        />

        {/* Message card */}
        <Card
          elevation={8}
          sx={{
            width: 420,
            bgcolor: "rgba(30,30,30,0.9)",
            backdropFilter: "blur(6px)",
            borderRadius: 3,
            p: 4,
            textAlign: "center",
            color: "#fff",
          }}
        >
          <CardContent>
            <ReplayIcon sx={{ fontSize: 64, mb: 2, color: "#BB86FC" }} />
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Spaced revision will appear here
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.85 }}>
              Once you’ve covered enough material,<br />
              we’ll launch smart, mixed review sets<br />
              to help you stay sharp over time.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Default dev fallback
  return (
    <div style={{ color: "#fff", padding: 24 }}>
      <h2>Cumulative Revision (Dummy)</h2>
      <p>Exam ID: {examId}</p>
      <pre>{JSON.stringify(activity, null, 2)}</pre>
      <p>User ID: {userId}</p>
    </div>
  );
}
