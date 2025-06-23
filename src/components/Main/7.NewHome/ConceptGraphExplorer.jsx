// ────────────────────────────────────────────────────────────────
// File: src/components/ConceptGraphExplorer.jsx   (v4)
// ────────────────────────────────────────────────────────────────
import React, { useState, useMemo } from "react";
import {
  Box, Grid, Card, Typography, Chip, Stack, CircularProgress
} from "@mui/material";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import { motion } from "framer-motion";

import useConceptGraph from "./useConceptGraph";
import ConceptCard      from "./ConceptCard";

/* ─── styling tokens ─────────────────────────────────────────── */
const MotionCard = motion(Card);

const cardBase = {
  p: 2,
  bgcolor: "rgba(255,255,255,.06)",
  color: "#f0f0f0",
  backdropFilter: "blur(6px)",
  borderRadius: 4,
  boxShadow: "0 8px 24px rgba(0,0,0,.55)"
};

const lift = { whileHover: { y: -4, boxShadow: "0 14px 30px rgba(0,0,0,.8)" } };

const chipStyle = { bgcolor: "rgba(255,255,255,.12)", color: "#fff", fontWeight: 600, height: 24 };

/* ─── numeric-aware sort helpers ─────────────────────────────── */
const numPrefix = (t = "") => {
  const m = t.trim().match(/^(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1] ?? m[0]) : Infinity;
};
const byNumberThenAlpha = (a, b) => {
  const na = numPrefix(a);
  const nb = numPrefix(b);
  return na === nb ? a.localeCompare(b) : na - nb;
};

/* ─── main component ─────────────────────────────────────────── */
export default function ConceptGraphExplorer({ onSelect }) {
  const { concepts, loading } = useConceptGraph();

  /* static whitelist → Chemistry (all) + Physics▪Mechanics only */
  const VISIBLE = { Chemistry: true, Physics: ["Mechanics"] };

  /* apply whitelist once */
  const scoped = useMemo(
    () =>
      concepts.filter((c) => {
        const rule = VISIBLE[c.subject];
        if (!rule) return false;
        return rule === true || rule.includes(c.grouping);
      }),
    [concepts]
  );

  /* user filter state */
  const [filter, setFilter] = useState({ subject: null, grouping: null, chapter: null, subChap: null });

  /* build unique lists (no sorting here for chapters; we sort when rendering) */
  const lists = useMemo(
    () => ({
      subjects: [...new Set(scoped.map((c) => c.subject))],
      groupings:
        filter.subject
          ? [...new Set(scoped.filter((c) => c.subject === filter.subject).map((c) => c.grouping))]
          : [],
      chapters:
        filter.grouping
          ? [
              ...new Set(
                scoped
                  .filter((c) => c.subject === filter.subject && c.grouping === filter.grouping)
                  .map((c) => c.chapter)
              )
            ]
          : [],
      subChaps:
        filter.chapter
          ? [
              ...new Set(
                scoped
                  .filter(
                    (c) =>
                      c.subject === filter.subject &&
                      c.grouping === filter.grouping &&
                      c.chapter === filter.chapter
                  )
                  .map((c) => c.subChap)
              )
            ]
          : []
    }),
    [scoped, filter]
  );

  /* visible concepts after all filters */
  const visible = useMemo(
    () =>
      scoped.filter((c) => {
        if (filter.subject && c.subject !== filter.subject) return false;
        if (filter.grouping && c.grouping !== filter.grouping) return false;
        if (filter.chapter && c.chapter !== filter.chapter) return false;
        if (filter.subChap && c.subChap !== filter.subChap) return false;
        return true;
      }),
    [scoped, filter]
  );

  /* loading spinner */
  if (loading) return <CircularProgress sx={{ m: 4 }} />;

  /* ─── JSX ──────────────────────────────────────────────────── */
  return (
    <MotionCard {...lift} sx={cardBase}>
      {/* 1️⃣ Header */}
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <LibraryBooksIcon />
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Explore Concept Graph
        </Typography>
        <Chip
          label={`${visible.length} concept${visible.length !== 1 ? "s" : ""}`}
          sx={{ ...chipStyle, bgcolor: "#374151" }}
        />


         {/* new “coming soon” pill */}
 <Chip
   label="Full version coming soon"
   sx={{ ...chipStyle, bgcolor: "#ffa726", color: "#000" }}
 />


      </Stack>

      {/* 2️⃣ Filter rows */}
      <Box sx={{ mb: 2 }}>
        {/* Subject row */}
        <FilterRow
          label="Subject"
          items={lists.subjects}
          active={filter.subject}
          onSelect={(v) => setFilter({ subject: v === filter.subject ? null : v, grouping: null, chapter: null, subChap: null })}
        />

        {/* Grouping row */}
        {lists.groupings.length > 0 && (
          <FilterRow
            label="Grouping"
            items={lists.groupings}
            active={filter.grouping}
            onSelect={(v) =>
              setFilter({ ...filter, grouping: v === filter.grouping ? null : v, chapter: null, subChap: null })
            }
          />
        )}

        {/* Chapter row */}
        {lists.chapters.length > 0 && (
          <FilterRow
            label="Chapter"
            items={lists.chapters.sort(byNumberThenAlpha)}
            active={filter.chapter}
            onSelect={(v) => setFilter({ ...filter, chapter: v === filter.chapter ? null : v, subChap: null })}
          />
        )}

        {/* Sub-chapter row */}
        {lists.subChaps.length > 0 && (
          <FilterRow
            label="Sub-chapter"
            items={lists.subChaps.sort(byNumberThenAlpha)}
            active={filter.subChap}
            onSelect={(v) => setFilter({ ...filter, subChap: v === filter.subChap ? null : v })}
          />
        )}
      </Box>

      {/* 3️⃣ Concept grid */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {visible.map((c) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={c.id}>
            <ConceptCard data={c} lift={lift} sx={cardBase} onClick={() => onSelect?.(c)} />
          </Grid>
        ))}
      </Grid>
    </MotionCard>
  );
}

/* ─── internal components ────────────────────────────────────── */
const ChipList = ({ items, active, onSelect }) => (
  <Stack direction="row" spacing={1} flexWrap="wrap">
    {items.map((txt) => (
      <Chip
        key={txt}
        label={txt}
        clickable
        onClick={() => onSelect(txt)}
        sx={{
          ...chipStyle,
          ...(active === txt && { bgcolor: "#BB86FC", color: "#000" })
        }}
      />
    ))}
  </Stack>
);

const FilterRow = ({ label, items, active, onSelect }) => (
  <Stack sx={{ mb: 1 }}>
    <Typography variant="caption" sx={{ mb: 0.5, opacity: 0.7 }}>
      {label}
    </Typography>
    <ChipList items={items} active={active} onSelect={onSelect} />
  </Stack>
);
