/* ────────────────────────────────────────────────────────────────
   File:  src/components/3.AdaptivePlanView/1.StatsPanel/StatsPanel.jsx
   v5 – adds *optional* auto-resume flag (OFF by default) so the
        Plan-Fetcher no longer pops up on every hard refresh.
        All existing behaviour kept intact.
───────────────────────────────────────────────────────────────── */

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Chip,
  Button,
  Tooltip,
} from "@mui/material";

import { doc, getDoc } from "firebase/firestore";

/* Floating “create / edit” pen  (temporarily hidden)          */
// import ChildStats from "../../2.CreateNewPlan/CreatePlanButton";

/* ──────────────────────────────────────────────────────────── */
/* Helpers                                                     */
function unique(arr = []) {
  return Array.from(new Set(arr));
}

/* ──────────────────────────────────────────────────────────── */
export default function StatsPanel({
  db,
  userId,       // kept for future use
  bookId,       // kept for future use
  planId,
  onResume = () => {},
  colorScheme = {},
  /* NEW ▸ if you **really** want the old auto-open behaviour,
     pass autoResume={true} from the parent.  Default is false,
     meaning the dialog opens only when the user clicks “Resume”. */
  autoResume = false,
}) {
  /* ---------- dynamic meta pulled from planDoc -------------- */
  const [meta, setMeta] = useState(null);

  useEffect(() => {
    if (!db || !planId) return;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "adaptive_demo", planId));
        if (!snap.exists()) return;
        const plan = snap.data() || {};

        /* topics ⇒ use groupings if present; else subject names */
        let topics = [];
        if (Array.isArray(plan.subjects) && plan.subjects.length) {
          const groupings = plan.subjects.flatMap((s) => s.groupings || []);
          topics = unique(
            groupings.length ? groupings : plan.subjects.map((s) => s.subject)
          );
        }

        setMeta({
          planName: plan.planName || "Untitled Plan",
          topics,
          accent: colorScheme.heading || "#BB86FC",
        });
      } catch (e) {
        console.error("StatsPanel: unable to fetch planDoc", e);
      }
    })();
  }, [db, planId, colorScheme.heading]);

  /* ---------- OPTIONAL auto-resume -------------------------- */
  useEffect(() => {
    /* Fire only once per mount when autoResume is explicitly true */
    if (autoResume && meta && planId) {
      onResume(planId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoResume, meta, planId]); // keep deps minimal & explicit

  /* ---------- progress % (0 for now) ------------------------ */
  const progress = 0;

  /* ---------- RENDER ---------------------------------------- */
  if (!meta) {
    return <Box sx={{ color: "#888", mb: 2, mt: 1 }}>No plan selected.</Box>;
  }

  return (
    <Box sx={{ mb: 2 /* a tad tighter */ }}>
      {/* header bar */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          alignItems: "center",
          py: 0.5,
          px: 0,
          bgcolor: "transparent",              // ← FLUSH WITH PAGE
          border: "none",
        }}
      >
        {/* plan name (clamped width, tooltip for full text) */}
        <Tooltip title={meta.planName}>
          <Typography
            sx={{
              fontWeight: 700,
              color: meta.accent,
              maxWidth: 260,             /* ← adjust to taste */
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            noWrap
          >
            {meta.planName}
          </Typography>
        </Tooltip>

        {/* % badge */}
        <Chip
          label={`${progress}%`}
          size="small"
          sx={{
            bgcolor: meta.accent,
            color: "#000",
            fontWeight: 700,
            height: 22,
          }}
        />

        {/* topics (up to 2) */}
        {meta.topics.slice(0, 2).map((t) => (
          <Chip
            key={t}
            label={t}
            size="small"
            sx={{ bgcolor: "#333", color: "#fff", height: 22 }}
          />
        ))}
        {meta.topics.length > 2 && (
          <Tooltip title={meta.topics.slice(2).join(", ")}>
            <Chip
              label={`+${meta.topics.length - 2} more`}
              size="small"
              sx={{ bgcolor: "#444", color: "#ccc", height: 22, cursor: "default" }}
            />
          </Tooltip>
        )}

        {/* resume button pushed to far right */}
        <Button
          variant="contained"
          size="small"
          sx={{
            bgcolor: meta.accent,
            color: "#000",
            fontWeight: 700,
            ml: "auto",
            "&:hover": { bgcolor: meta.accent },
          }}
          onClick={() => onResume(planId)}
        >
          Resume
        </Button>

        {/* pen icon – hidden for now */}
        {/*
        <ChildStats
          userId={userId}
          bookId={bookId}
          colorScheme={colorScheme}
          backendURL={import.meta.env.VITE_BACKEND_URL}
          sx={{ ml: 0.5 }}
        />
        */}
      </Box>
    </Box>
  );
}