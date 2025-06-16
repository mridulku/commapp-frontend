import * as React from "react";
import { Box, Container, Stack } from "@mui/material";
import HomeTicker from "./subcomponents/HomeTicker";
import ToolGrid from "./subcomponents/ToolGrid";
import ProgressStrip from "./subcomponents/ProgressStrip";
import NextTasksCarousel from "./subcomponents/NextTasksCarousel";

export default function NewHome2({ userId }) {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#0f001f", color: "#fff" }}>
      {/* Sticky top ticker */}
      <HomeTicker userId={userId} />

      <Container sx={{ py: 6 }}>
        <Stack spacing={6}>
          <ToolGrid userId={userId} />
          <ProgressStrip userId={userId} />
          <NextTasksCarousel userId={userId} />
        </Stack>
      </Container>
    </Box>
  );
}