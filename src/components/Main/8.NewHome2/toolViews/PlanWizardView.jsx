import * as React from "react";
import { Box, Typography } from "@mui/material";

export default function PlanWizardView () {
  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        🗺️  Plan Wizard
      </Typography>
      <Typography>
        Three-step wizard goes here.<br/>
        (Select topics → set level → pick hours/day)
      </Typography>
    </Box>
  );
}