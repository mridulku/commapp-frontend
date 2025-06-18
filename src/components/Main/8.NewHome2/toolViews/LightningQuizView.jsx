import * as React from "react";
import { Box, Typography } from "@mui/material";

export default function LightningQuizView () {
  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        ⚡  5-min Lightning Quiz
      </Typography>
      <Typography>
        Ten adaptive MCQs (coming soon …).
      </Typography>
    </Box>
  );
}