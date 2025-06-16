import * as React from "react";
import { Box, Container, Typography, Button } from "@mui/material";
import googleIcon from "../../logo.png"; // adjust path

const GoogleLogo = () => (
  <img src={googleIcon} alt="G" width={18} height={18}
       style={{marginRight:8,verticalAlign:"middle"}}/>
);

export default function ProofCTA({ onGoogle }) {
  return (
    <Box sx={{ py: 10, bgcolor: "#1a0033" }}>
      <Container sx={{ textAlign: "center" }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, mb: 2, color: "#FFD54F" }}
        >
          Save 50 % study time – boost scores
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: "text.secondary",
            mb: 4,
            maxWidth: 580,
            mx: "auto",
          }}
        >
          Join the free pilot. Your adaptive engine spins up in seconds – then
          let the system hand-hold you to success on exam day.
        </Typography>

        <Button
          variant="contained"
          size="large"
          color="secondary"
          sx={{ fontWeight: 600 }}
          onClick={onGoogle}
        >
          <GoogleLogo />
          Start Learning
        </Button>
      </Container>
    </Box>
  );
}