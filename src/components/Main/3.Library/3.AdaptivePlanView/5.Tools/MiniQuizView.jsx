import * as React from "react";
import { Box, Typography } from "@mui/material";

const MiniQuizView = () => (
  <Box p={3}>
    <Typography variant="h5" gutterBottom>
      ❓ Mini Quiz
    </Typography>
    <Typography>Five-question quiz to gauge your readiness.</Typography>
  </Box>
);

export default MiniQuizView;