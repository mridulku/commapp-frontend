/* ──────────────────────────────────────────────────────────────
   File:  StatsPanel.jsx   (v3 – compact header, no mini-tiles)
──────────────────────────────────────────────────────────────── */

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Chip,
  LinearProgress,
  Button,
  Tooltip,
} from "@mui/material";

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";

/* floating “create / edit” pen */
import ChildStats from "../../2.CreateNewPlan/CreatePlanButton";

/* ------------------------------------------------------------ */
/* 1.  tiny helper pools for *dummy* meta until real data hooks */
const SUBJECTS = [
  "Kinematics",
  "Electrostatics",
  "Cell Bio",
  "Genetics",
  "Optics",
  "Mechanics",
  "Organic Chem",
  "Thermo",
  "Geometry",
  "Probability",
];
const GOALS = [
  { key: "fresh", label: "Start fresh", emoji: "🆕" },
  { key: "brush", label: "Quick brush-up", emoji: "✨" },
  { key: "diag", label: "Diagnose me", emoji: "❓" },
];
const ACCENTS = ["#BB86FC", "#F48FB1", "#80DEEA", "#AED581", "#FFB74D"];

const hash = (s) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
};
const rand = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

/* produce *stable* pseudo-random adornments for a planId */
function buildDummyMeta(planId) {
  const h = hash(planId);
  const accent = ACCENTS[h % ACCENTS.length];
  const goal = GOALS[h % GOALS.length];

  const topics = SUBJECTS
    .slice()
    .sort((a, b) => hash(a + planId) - hash(b + planId))
    .slice(0, 3 + Math.floor(rand(h + 3) * 3)); // 3-5 topics

  return {
    planName: `${topics[0].split(" ")[0]} Mastery Plan`,
    goal,
    accent,
    topics,
  };
}

/* ------------------------------------------------------------ */
/* 2.  progress helpers (aggregator doc)                         */
const doneLike = (v = "") =>
  ["done", "complete", "pass"].some((w) => v.toLowerCase().includes(w));

const overallPct = (obj = {}) => {
  const keys = Object.keys(obj);
  if (!keys.length) return 0;
  let sum = 0;
  keys.forEach((id) => {
    const r = obj[id] || {};
    let d = 0;
    if (doneLike(r.reading)) d++;
    if (doneLike(r.remember)) d++;
    if (doneLike(r.understand)) d++;
    if (doneLike(r.apply)) d++;
    if (doneLike(r.analyze)) d++;
    sum += (d / 5) * 100;
  });
  return Math.round(sum / keys.length);
};

async function buildAggregator(uid, pid, bid) {
  await fetch(
    "https://us-central1-comm-app-ff74b.cloudfunctions.net/generateUserProgressAggregator2",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: uid, planId: pid, bookId: bid }),
    }
  );
}
async function fetchAggregator(db, uid, pid, bid) {
  if (!db) return 0;
  const q = query(
    collection(db, "aggregator_v2"),
    where("userId", "==", uid),
    where("planId", "==", pid),
    where("bookId", "==", bid),
    orderBy("createdAt", "desc"),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return 0;
  const data = snap.docs[0].data() || {};
  return overallPct(data.aggregatorResult || {});
}

/* ------------------------------------------------------------ */
/* 3.  MAIN COMPONENT                                            */
export default function StatsPanel({
  db,
  userId,
  bookId,
  planId,
  onResume = () => {},
  colorScheme = {},
}) {
  const meta = planId ? buildDummyMeta(planId) : null;

  /* live progress % ------------------------------------------- */
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!db || !userId || !bookId || !planId) return;
    (async () => {
      const cached = await fetchAggregator(db, userId, planId, bookId);
      await buildAggregator(userId, planId, bookId);
      const fresh = await fetchAggregator(db, userId, planId, bookId);
      setProgress(fresh || cached || 0);
    })();
  }, [db, userId, bookId, planId]);

  /* ------------------------------------------------------------ */
  /* RENDER                                                       */
  if (!meta)
    return (
      <Box sx={{ color: "#888", mb: 2, mt: 1 }}>No plan selected.</Box>
    );

  return (
    <Box sx={{ mb: 3 }}>
      {/* ╭────────────────────────── header bar ───────────────────╮ */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          alignItems: "center",
          p: 1.5,
          bgcolor: "#1c1c1c",
          borderRadius: 2,
          border: `1px solid ${meta.accent}40`,
        }}
      >
        {/* plan name */}
        <Typography
          sx={{ fontWeight: 700, color: meta.accent, mr: 0.5 }}
          noWrap
        >
          {meta.planName}
        </Typography>

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

        {/* topics: 2 visible + “…+n” chip */}
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
              sx={{
                bgcolor: "#444",
                color: "#ccc",
                height: 22,
                cursor: "default",
              }}
            />
          </Tooltip>
        )}

        {/* goal chip */}
        <Chip
          label={`${meta.goal.emoji} ${meta.goal.label}`}
          size="small"
          sx={{
            bgcolor: "#2b2b2b",
            color: "#fff",
            border: `1px solid ${meta.accent}`,
            ml: "auto",
            height: 22,
          }}
        />

        {/* resume btn */}
        <Button
          variant="contained"
          size="small"
          sx={{
            bgcolor: meta.accent,
            color: "#000",
            fontWeight: 700,
            ml: 1,
            "&:hover": { bgcolor: meta.accent },
          }}
          onClick={() => onResume(planId)}
        >
          Resume
        </Button>

        {/* pen icon (create / edit) */}
        <ChildStats
          userId={userId}
          bookId={bookId}
          colorScheme={colorScheme}
          backendURL={import.meta.env.VITE_BACKEND_URL}
          sx={{ ml: 0.5 }}
        />
      </Box>

      {/* linear progress bar under header */}
      
    </Box>
  );
}