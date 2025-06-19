// ────────────────────────────────────────────────────────────────
// File: src/components/CoreTextbooksPage.jsx      (demo v1)
// Lists every core textbook in pretty cards + short intro banner
// ────────────────────────────────────────────────────────────────
import React from "react";
import {
  Box,
  Grid,
  Card,
  Typography,
  Stack,
  Avatar,
  Chip,
  Tooltip,
} from "@mui/material";
import { motion } from "framer-motion";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";

/* ===== 1.  Dummy data (swap with real API later) =============== */
const SUBJECTS = [
  {
    id: "phy",
    name: "Physics",
    grad: ["#818cf8", "#d8b4fe"],
    books: [
      "NCERT Class 11 – Part 1",
      "NCERT Class 11 – Part 2",
      "NCERT Class 12 – Part 1",
      "NCERT Class 12 – Part 2",
    ],
  },
  {
    id: "chem",
    name: "Chemistry",
    grad: ["#6366f1", "#a5b4fc"],
    books: [
      "NCERT Class 11 – Part 1",
      "NCERT Class 11 – Part 2",
      "NCERT Class 12 – Part 1",
      "NCERT Class 12 – Part 2",
    ],
  },
  {
    id: "bio",
    name: "Biology",
    grad: ["#3b82f6", "#6ee7b7"],
    books: ["NCERT Class 11", "NCERT Class 12"],
  },
];

/* ===== 2.  Shared tokens (same glassy look as Home) ============ */
const PAGE_BG =
  "radial-gradient(circle at 35% 0%, #181924 0%, #0e0f15 100%)";
const GLASS_BG = "rgba(255,255,255,.06)";
const MotionCard = motion(Card);
const lift = {
  whileHover: { y: -4, boxShadow: "0 14px 30px rgba(0,0,0,.8)" },
};
const grad = ([a, b]) => `linear-gradient(135deg,${a} 0%,${b} 100%)`;
const CardSX = {
  borderRadius: 4,
  p: 3,
  bgcolor: GLASS_BG,
  backdropFilter: "blur(6px)",
  boxShadow: "0 8px 24px rgba(0,0,0,.55)",
  color: "#f0f0f0",
};

/* ===== 3.  MAIN PAGE ========================================== */
export default function CoreTextbooksPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: PAGE_BG,
        p: { xs: 3, md: 5 },
        fontFamily: "Inter, sans-serif",
        color: "#fff",
      }}
    >
      {/* Banner / Explanation */}
      <MotionCard {...lift} sx={{ ...CardSX, mb: 4 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            sx={{
              width: 40,
              height: 40,
              bgcolor: "rgba(255,255,255,.15)",
            }}
          >
            <LibraryBooksIcon />
          </Avatar>

          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Core Textbooks Library
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              We’ve parsed the **official NCERT set** first. More reference books
              (HC Verma, OP Tandon, JD Lee…) will be stitched in over the next
              sprint so your concept-graph keeps getting richer.
            </Typography>
          </Box>
        </Stack>
      </MotionCard>

      {/* Subject sections */}
      {SUBJECTS.map((s) => (
        <Box key={s.id} sx={{ mb: 5 }}>
          {/* Subject header */}
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            {s.name}
          </Typography>

          <Grid container spacing={3}>
            {s.books.map((bk) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={bk}>
                <MotionCard
                  {...lift}
                  sx={{
                    ...CardSX,
                    // colourful hero stripe
                    background: grad(s.grad),
                    minHeight: 140,
                  }}
                >
                  <Stack
                    spacing={1}
                    sx={{ height: "100%", justifyContent: "center" }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 700, color: "#000" }}
                    >
                      {bk}
                    </Typography>

                    {/* tiny badge */}
                    <Tooltip title="Currently mapped down to concept level">
                      <Chip
                        label="Mapped ✅"
                        size="small"
                        sx={{
                          bgcolor: "#fff",
                          color: "#000",
                          fontWeight: 600,
                          alignSelf: "flex-start",
                        }}
                      />
                    </Tooltip>
                  </Stack>
                </MotionCard>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
    </Box>
  );
}