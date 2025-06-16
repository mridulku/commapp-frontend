import * as React from "react";
import { Box, Container, Typography, Button, Chip, Stack } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import googleIcon from "../../logo.png";              // adjust path if needed

const GoogleLogo = () => (
  <img src={googleIcon} alt="G" width={18} height={18}
       style={{ marginRight: 8, verticalAlign: "middle" }} />
);

const chips = [
  "Personal Plan in 60 sec",
  "Fixes Your Weak Spots",
  "Saves 50 % Study Time",
];

export default function Hero({ onGoogle }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        background:
          "linear-gradient(150deg,#19002c 0%,#29005a 55%,#070012 100%)",
      }}
    >
      <Container>
        <Typography variant="h2" sx={{ fontWeight: 800, mb: 3 }}>
          Study smarter, not longer.
        </Typography>

        <Typography
          variant="h6"
          sx={{ maxWidth: 720, mb: 4, color: "text.secondary" }}
        >
          Your personal AI coach builds a daily plan, fills knowledge gaps, and
          keeps you on track—so you learn faster and ace the exam.
        </Typography>

        <Button
          variant="contained"
          size="large"
          color="secondary"
          sx={{ fontWeight: 600, mb: 3 }}
          onClick={onGoogle}
        >
          <GoogleLogo />
          Start Learning
        </Button>

        <Stack direction="row" spacing={1} flexWrap="wrap">
          {chips.map((c) => (
            <Chip
              key={c}
              icon={<CheckCircleIcon sx={{ color: "#FFD700" }} />}
              label={c}
              size="small"
              sx={{
                bgcolor: "rgba(255,255,255,0.08)",
                color: "text.secondary",
              }}
            />
          ))}
        </Stack>
      </Container>
    </Box>
  );
}