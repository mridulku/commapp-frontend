import * as React from "react";
import {
  Box,
  Typography,
  Chip,
  Stack,
  CircularProgress,
} from "@mui/material";

/* mocked subject progress — replace with API */
const subjects = [
  { name: "Physics",   pct: 68 },
  { name: "Biology",   pct: 55 },
  { name: "Chemistry", pct: 72 },
  { name: "Math",      pct: 40 },
];

export default function ProgressStrip() {
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        Quick Progress
      </Typography>

      <Stack direction="row" spacing={2} flexWrap="wrap">
        {subjects.map((s) => (
          <Chip
            key={s.name}
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress
                  variant="determinate"
                  value={s.pct}
                  size={24}
                  thickness={6}
                  sx={{
                    "& .MuiCircularProgress-circle": {
                      stroke: "#FFD700",
                    },
                  }}
                />
                <Typography variant="caption" sx={{ color: "#fff" }}>
                  {s.name} {s.pct}%
                </Typography>
              </Box>
            }
            sx={{
              bgcolor: "rgba(255,255,255,0.05)",
              pl: 1,
              pr: 1.5,
              height: 32,
            }}
          />
        ))}
      </Stack>
    </Box>
  );
}