

// ────────────────────────────────────────────────────────────────
// CoreTextbooksPage  ·  full file (v2 – now with Back button)
// ────────────────────────────────────────────────────────────────
import React from "react";
import {
  Box, Grid, Card, Typography, Stack, Avatar,
  Chip, Tooltip, IconButton
} from "@mui/material";
import { motion }      from "framer-motion";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import ArrowBackIos     from "@mui/icons-material/ArrowBackIos";

/* ── 1. demo data (unchanged) ────────────────────────────────── */
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

/* ── 2. design tokens (unchanged) ────────────────────────────── */
const PAGE_BG="radial-gradient(circle at 35% 0%, #181924 0%, #0e0f15 100%)";
const GLASS_BG="rgba(255,255,255,.06)";
const MotionCard = motion(Card);
const lift={ whileHover:{ y:-4, boxShadow:"0 14px 30px rgba(0,0,0,.8)" }};
const grad = ([a,b])=>`linear-gradient(135deg,${a} 0%,${b} 100%)`;
const CardSX={
  borderRadius:4,p:3,bgcolor:GLASS_BG,backdropFilter:"blur(6px)",
  boxShadow:"0 8px 24px rgba(0,0,0,.55)",color:"#f0f0f0"
};
const headerAvatar={ width:40,height:40,bgcolor:"rgba(255,255,255,.15)" };

/* ── 3. main page ────────────────────────────────────────────── */
export default function CoreTextbooksPage({ onBack = ()=>{} }) {
  return (
    <Box sx={{
      minHeight:"100vh", background:PAGE_BG,
      p:{ xs:3, md:5 }, fontFamily:"Inter, sans-serif", color:"#fff"
    }}>
      {/* header strip with back */}
      <Stack direction="row" spacing={1} alignItems="center" mb={3}>
        <IconButton onClick={onBack} sx={{ color:"#fff", mr:1 }}>
          <ArrowBackIos/>
        </IconButton>
        <Avatar sx={headerAvatar}><LibraryBooksIcon/></Avatar>
        <Typography variant="h4" sx={{ fontWeight:800 }}>
          Core&nbsp;Textbooks
        </Typography>
      </Stack>

      {/* SUBJECT SECTIONS */}
      {SUBJECTS.map(s=>(
        <Box key={s.id} sx={{ mb:5 }}>
          <Typography variant="h6" sx={{ fontWeight:700, mb:1 }}>
            {s.name}
          </Typography>

          <Grid container spacing={3}>
            {s.books.map(bk=>(
              <Grid item xs={12} sm={6} md={4} lg={3} key={bk}>
                <MotionCard {...lift}
                  sx={{ ...CardSX, background:grad(s.grad), minHeight:140 }}>
                  <Stack
                    spacing={1}
                    sx={{ height:"100%", justifyContent:"center" }}>
                    <Typography variant="subtitle1"
                      sx={{ fontWeight:700, color:"#000" }}>
                      {bk}
                    </Typography>
                    <Tooltip title="Mapped down to concept level">
                      <Chip label="Mapped ✅" size="small"
                        sx={{ bgcolor:"#fff", color:"#000", fontWeight:600 }}/>
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