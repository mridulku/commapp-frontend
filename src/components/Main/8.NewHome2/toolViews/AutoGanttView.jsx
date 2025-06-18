import * as React from "react";
import { Box, Typography } from "@mui/material";

export default function AutoGanttView () {
  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        📅  Auto-Gantt Planner
      </Typography>
      <Typography>
        This will render a backward Gantt chart with buffer days.
      </Typography>
    </Box>
  );
}