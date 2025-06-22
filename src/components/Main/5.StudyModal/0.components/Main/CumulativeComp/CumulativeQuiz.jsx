/***********************************************************************
 * CumulativeQuiz.jsx
 **********************************************************************/
import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchAllSubSummaries,
} from "../../../../../../store/planSummarySlice";

import {
  Box,
  Typography,
  CircularProgress,
  Table, TableHead, TableRow, TableCell, TableBody,
  Paper,
  Card,
  CardContent,
  Chip,
} from "@mui/material";

import QuizIcon from "@mui/icons-material/Quiz";

const SHOW_PLACEHOLDER = true;

/* ─────────── helpers ─────────── */
function highestCompletedTier(s = {}) {
  if ((s.analyzePct     ?? 0) >= 100) return "analyse";
  if ((s.applyPct       ?? 0) >= 100) return "apply";
  if ((s.understandPct  ?? 0) >= 100) return "understand";
  if ((s.rememberPct    ?? 0) >= 100) return "remember";
  if ((s.readingPct     ?? 0) >= 100) return "read";
  return "notRead";
}

const BUCKETS = [
  { key: "analyse"  , label: "Analyse ✓"   , color: "#F48FB1" },
  { key: "apply"    , label: "Apply ✓"     , color: "#AED581" },
  { key: "understand",label: "Understand ✓", color: "#FFD54F" },
  { key: "remember" , label: "Remember ✓"  , color: "#80DEEA" },
  { key: "read"     , label: "Read ✓"      , color: "#BB86FC" },
  { key: "notRead"  , label: "Not read"    , color: "#E53935" },
];

/* ─────────── component ─────────── */
export default function CumulativeQuiz() {
  const dispatch = useDispatch();
  const planId   = useSelector((s) => s.plan.planDoc?.id);
  const {
    entities,
    allLoaded,
    allLoading,
    allError,
  } = useSelector((s) => s.planSummary);

  useEffect(() => {
    if (!planId) return;
    if (!allLoaded && !allLoading && !allError) {
      dispatch(fetchAllSubSummaries({ planId }));
    }
  }, [planId, allLoaded, allLoading, allError, dispatch]);

  const counts = useMemo(() => {
    if (!allLoaded) return {};
    const c = {
      analyse: 0, apply: 0, understand: 0,
      remember: 0, read: 0, notRead: 0,
    };
    Object.values(entities).forEach((sum) => {
      const tier = highestCompletedTier(sum);
      c[tier] = (c[tier] || 0) + 1;
    });
    return c;
  }, [allLoaded, entities]);

  /* ---------- render ---------- */
  if (SHOW_PLACEHOLDER) return <PlaceholderFullScreen />;

  if (allLoading || !allLoaded) {
    return (
      <Box sx={sx.outer}>
        <Box sx={sx.center}>
          <CircularProgress size={32} sx={{ mr: 1 }} />
          <Typography>Gathering progress data…</Typography>
        </Box>
      </Box>
    );
  }

  if (allError) {
    return (
      <Box sx={sx.outer}>
        <Typography color="error">
          Error loading summaries: {allError}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={sx.outer}>
      <Typography variant="h5" gutterBottom>
        Cumulative Quiz – Overview
      </Typography>

      <Paper elevation={3} sx={sx.tableWrapper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {BUCKETS.map((b) => (
                <TableCell
                  key={b.key}
                  align="center"
                  sx={{ fontWeight: 700, color: b.color }}
                >
                  {b.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              {BUCKETS.map((b) => (
                <TableCell
                  key={b.key}
                  align="center"
                  sx={{ fontSize: 18, fontWeight: 700, color: b.color }}
                >
                  {counts[b.key] ?? 0}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

/* ─────────── styles ─────────── */
const sx = {
  outer: {
    p: 3,
    color: "#fff",
    minHeight: "100%",
    boxSizing: "border-box",
  },
  center: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "60vh",
    color: "#fff",
  },
  tableWrapper: {
    bgcolor: "#111",
    "& thead th": { bgcolor: "#222" },
  },
};

/* ─────────── placeholder UI ─────────── */
function PlaceholderFullScreen() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        pt: 12,
        color: "#fff",
      }}
    >
      {/* Title chip */}
      <Chip
        icon={<QuizIcon sx={{ color: "#BB86FC" }} />}
        label="Cumulative Quiz"
        sx={{
          bgcolor: "#1E1E1E",
          color: "#fff",
          px: 2,
          py: 1,
          fontWeight: 600,
          fontSize: "1rem",
          borderRadius: "999px",
          mb: 5,
        }}
      />

      {/* Central card */}
      <Card
        elevation={8}
        sx={{
          width: 420,
          bgcolor: "rgba(30,30,30,0.9)",
          backdropFilter: "blur(6px)",
          borderRadius: 3,
          p: 4,
          textAlign: "center",
          color: "#fff",
        }}
      >
        <CardContent>
          <QuizIcon sx={{ fontSize: 64, mb: 2, color: "#BB86FC" }} />
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            An adaptive quiz awaits
          </Typography>
          <Typography variant="subtitle1" sx={{ opacity: 0.85 }}>
            Once you’ve completed enough concepts,<br />
            this section will serve up a mixed quiz<br />
            to test what you truly remember.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
