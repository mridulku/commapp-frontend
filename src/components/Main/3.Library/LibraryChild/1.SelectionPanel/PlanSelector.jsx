/* ────────────────────────────────────────────────────────────────
   File:  src/components/1.SelectionPanel/PlanSelector.jsx
   v3 – compact cards w/ progress badge (2025-04-28)
───────────────────────────────────────────────────────────────── */

import React, { useEffect, useState } from "react";
import {
  Box, Typography, IconButton, Grid,
  Card, CardContent, CardActions, Button, Chip
} from "@mui/material";
import AddIcon       from "@mui/icons-material/Add";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

/* ─── Accent palette & placeholder pools ─────────────────────── */
const ACCENTS  = ["#BB86FC", "#F48FB1", "#80DEEA", "#AED581", "#FFB74D"];
const SUBJECTS = [
  "Physics", "Chemistry", "Biology",
  "Maths", "English", "Reasoning",
  "Reading", "Listening", "Speaking", "Writing"
];
const LEVELS = ["Mastery", "Revision", "Glance"];
const EMOJIS = ["📘", "📙", "📗", "📕", "📒"];

const pick = (arr, idx) => arr[idx % arr.length];

/* deterministic pseudo-random helpers so content is stable */
function seededRand(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}

function createMeta(planId) {
  const seed = Math.abs(hashCode(planId));
  const main  = SUBJECTS[seed % SUBJECTS.length];
  const level = LEVELS[(seed >> 3) % LEVELS.length];
  const days  = 10 + Math.floor(seededRand(seed) * 80);        // 10-90
  const mins  = 15 + Math.floor(seededRand(seed + 42) * 10) * 5; // 15-60
  const progress = Math.floor(seededRand(seed + 99) * 100);     // 0-99

  // up to 2 extra subjects
  const others = SUBJECTS
    .filter(s => s !== main)
    .sort((a, b) => hashCode(a + planId) - hashCode(b + planId))
    .slice(0, Math.floor(seededRand(seed + 7) * 3));            // 0-2

  return {
    name     : `${main} ${level} Plan`,
    daysLeft : days,
    dailyMin : mins,
    subjects : [main, ...others],
    progress,
  };
}

/* ───────────────────────────────────────────────────────────────
   COMPONENT
──────────────────────────────────────────────────────────────── */
export default function PlanSelector({
  planIds          = [],
  selectedPlanId   = "",
  onPlanSelect     = () => {},
  onOpenOnboarding = () => {},
}) {
  /* generate once per plan list */
  const [metaMap, setMetaMap] = useState({});
  useEffect(() => {
    const m = {};
    planIds.forEach(pid => (m[pid] = createMeta(pid)));
    setMetaMap(m);
  }, [planIds]);

  return (
    <Box sx={styles.wrapper}>
      {/* Header row */}
      <Box sx={styles.header}>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          My Plans
        </Typography>
        <IconButton
          size="small"
          sx={{ color: "#4CAF50" }}
          onClick={onOpenOnboarding}
          title="Create / Upload material"
        >
          <AddIcon />
        </IconButton>
      </Box>

      {/* Content */}
      {planIds.length === 0 ? (
        <Typography sx={{ opacity: 0.8 }}>No plans yet.</Typography>
      ) : (
        <Grid container spacing={1.5}>
          {planIds.map((pid, idx) => {
              const meta = metaMap[pid];
                if (!meta) return null;                    //  ← skip first render
              
                const accent = pick(ACCENTS, idx);
                const emoji  = pick(EMOJIS,  idx);
                const isSel  = pid === selectedPlanId;

            return (
              <Grid item xs={12} key={pid}>
                <Card
                  onClick={() => onPlanSelect(pid)}
                  sx={{
                    bgcolor: "#1a1a1a",
                    color: "#fff",
                    cursor: "pointer",
                    border: `2px solid ${isSel ? accent : "#444"}`,
                    "&:hover": { borderColor: accent },
                  }}
                >
                  <CardContent sx={{ p: 1.5 }}>
                    {/* Top row (icon + name + progress badge) */}
                    <Box sx={styles.topRow}>
                      <Box sx={{ fontSize: "1.5rem", mr: 1 }}>{emoji}</Box>

                      <Typography
                        sx={styles.nameText}
                        title={meta.name}
                      >
                        {meta.name}
                      </Typography>

                      <Box
                        sx={{
                          ml: "auto",
                          fontSize: ".8rem",
                          fontWeight: 700,
                          color: accent,
                        }}
                      >
                        {meta.progress}% 
                      </Box>
                    </Box>

                    {/* Subtitle */}
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      ⏰ {meta.daysLeft} d&nbsp;·&nbsp;{meta.dailyMin} min/day
                    </Typography>

                    {/* Chips */}
                    <Box sx={styles.chipRow}>
                      {meta.subjects.map(s => (
                        <Chip
                          key={s}
                          size="small"
                          label={s}
                          sx={styles.chip}
                        />
                      ))}
                    </Box>
                  </CardContent>

                  
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}

/* ───────────────────────────────────────────────────────────────
   Styles
──────────────────────────────────────────────────────────────── */
const styles = {
  wrapper: {
    height: "100%",
    p: 2,
    boxSizing: "border-box",
    color: "#fff",
    overflowY: "auto",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    mb: 2,
  },
  topRow: {
    display: "flex",
    alignItems: "center",
    mb: 0.5,
  },
  nameText: {
    fontWeight: "bold",
    fontSize: ".9rem",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "70%",
  },
  chipRow: {
    mt: 0.8,
    display: "flex",
    flexWrap: "wrap",
    gap: 0.5,
  },
  chip: {
    bgcolor: "#333",
    color: "#fff",
    fontSize: 11,
    height: 20,
  },
};