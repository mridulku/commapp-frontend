// File: DayActivities.jsx  (dual-view, with “Completed” fix – FINAL)
import React, { useMemo } from "react";
import { Box, LinearProgress, Tooltip, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import ActivityAccordion from "./ActivityAccordion";

/* ---------- quick admin check ---------- */
const ADMIN_UIDS = ["acbhbtiODoPPcks2CP6ZdmZ"];

/* ---------- icon & colour presets ---------- */
const STAGE_META = {
  READ:        { icon: "📖", color: "#BB86FC", label: "Read" },
  REMEMBER:    { icon: "🧠", color: "#80DEEA", label: "Remember" },
  UNDERSTAND:  { icon: "🤔", color: "#FFD54F", label: "Understand" },
  APPLY:       { icon: "🔧", color: "#AED581", label: "Apply" },
  ANALYSE:     { icon: "🔬", color: "#F48FB1", label: "Analyse" },
};

const ICON_BOOK    = "📚";
const ICON_CHAPTER = "📄";
const ICON_CLOCK   = "⏱";

/* =================================================================== */
export default function DayActivities({
  activities = [],
  subchapterStatusMap,
  onOpenPlanFetcher,
  planId,
  userId,
  ...rest            // modal handlers passed to ActivityAccordion
}) {
  /* ---------- admin / user split ---------- */
  const reduxUid = useSelector((s) => s.auth?.userId);
  const uid      = userId || reduxUid;
  const isAdmin  = ADMIN_UIDS.includes(uid);

  if (isAdmin) {
    /* legacy accordion view for admins */
    return (
      <Box>
        {activities.map((a, i) => (
          <ActivityAccordion key={i} index={i} activity={a} {...rest} />
        ))}
      </Box>
    );
  }

  /* ================= USER CARD GRID ================= */
  const tasks = useMemo(
    () => activities.map((act) => {
        /* ─── 1) concept mastery (quizzes only) ───────────────── */
        const stageKey = (act.type.toLowerCase() === "read")
          ? "read"
          : (act.quizStage || "").toLowerCase();

        const subObj   = subchapterStatusMap?.[act.subChapterId] ?? {};
        const statsArr =
          subObj.quizStagesData?.[stageKey]?.allAttemptsConceptStats ?? [];

        const conceptMap = new Map();
        statsArr.forEach(att =>
          (att.conceptStats || []).forEach(cs => {
            if (!conceptMap.has(cs.conceptName) || conceptMap.get(cs.conceptName) !== "PASS") {
              conceptMap.set(cs.conceptName, cs.passOrFail);  // final PASS wins
            }
          })
        );

        const total     = conceptMap.size;
        const mastered  = [...conceptMap.values()].filter(v => v === "PASS").length;
        const pct       = total ? Math.round(mastered / total * 100) : 0;

        /* ─── 2) stage meta / colours ────────────────────────── */
        const meta = STAGE_META[(stageKey || "").toUpperCase()] || {
          icon: "❓", color: "#888", label: stageKey,
        };

        /* ─── 3) READING completion logic ────────────────────── */
        let readDone   = false;
        let readingPct = 0;

        if (meta.label === "Read") {
          const rSum = subObj.readingSummary || {};          // FIX ← subObj
          readDone   = !!(act.completed || rSum.completed || rSum.dateCompleted);
          readingPct = readDone
            ? 100
            : (typeof rSum.percent === "number" ? Math.round(rSum.percent) : 0);
        }

        /* --- 4) final status flag (for card colours) ---------- */
        const status = meta.label === "Read"
          ? (readDone ? "done" : "normal")
          : (pct === 100 ? "done" : "normal");

        return {
          id:        act.activityId,
          meta,
          status,
          _rawActivity: act,

          subch:   act.subChapterName || act.subChapterId,
          book:    act.bookName       || "—",
          chapter: act.chapterName    || "—",

          pct:       meta.label === "Read" ? readingPct : pct,
          mastered,
          total,
          spentMin: Math.round((act.timeSpent || 0) / 60),
          expMin:   act.timeNeeded || 0,

          conceptList: [...conceptMap.entries()].map(([name, res]) => ({
            name,
            ok: res === "PASS",
          })),

          /* handy for SummaryBar */
          readDone,
        };
      }),
    [activities, subchapterStatusMap]
  );

  /* click → bubble up to AdaptPG2 → PlanFetcher modal */
  const openFetcher = (t) => {
    onOpenPlanFetcher?.(planId, t._rawActivity);
  };

  /* -------------- render -------------- */
  return (
    <Box sx={{ mt: 1 }}>
      <SummaryBar tasks={tasks} />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
          gap: 1.5,
        }}
      >
        {tasks.map((t) => (
          <TaskCard key={t.id} t={t} onOpen={() => openFetcher(t)} />
        ))}
      </Box>
    </Box>
  );
}

/* =====================================================================
   TaskCard – colours itself when t.status === "done"
===================================================================== */
function TaskCard({ t, onOpen }) {
  const { meta, status } = t;

  const done   = status === "done";
  const bg     = done ? "rgba(76,175,80,.15)" : "#1a1a1a";
  const border = done ? "#4CAF50"             : meta.color;
  const badge  = done ? "Completed"           : null;

  const conceptTip = t.total
    ? (
        <Box sx={{ fontSize: 12 }}>
          {t.conceptList.map(c => (
            <Box key={c.name}>
              {c.ok ? "✅" : "❌"} {c.name}
            </Box>
          ))}
        </Box>
      )
    : "No concepts";

  return (
    <Box
      onClick={onOpen}
      sx={{
        p: 1.2,
        cursor: "pointer",
        bgcolor: bg,
        border: `2px solid ${border}`,
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        height: 225,
        transition: "transform .15s",
        "&:hover": { transform: "translateY(-3px)" },
      }}
    >
      {/* header */}
      <Tooltip title={t.subch}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: ".88rem",
            color: meta.color,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            mb: 0.6,
          }}
        >
          {t.subch}
        </Typography>
      </Tooltip>

      {badge && (
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: border }}>
          {badge}
        </Typography>
      )}

      <Row icon={meta.icon} label={meta.label} bold color={meta.color} />
      <Row icon={ICON_BOOK}    label={t.book} />
      <Row icon={ICON_CHAPTER} label={t.chapter} />
      <Row icon={ICON_CLOCK}   label={`${t.spentMin}/${t.expMin} min`} />

      <Box sx={{ flex: 1 }} />

      {meta.label !== "Read" && (
        <>
          <LinearProgress
            variant="determinate"
            value={t.pct}
            sx={{
              height: 6,
              borderRadius: 2,
              bgcolor: "#333",
              "& .MuiLinearProgress-bar": { bgcolor: meta.color },
            }}
          />
          <Box
            sx={{
              mt: 0.4,
              fontSize: 11,
              display: "flex",
              justifyContent: "space-between",
              color: "#fff",
            }}
          >
            <span>{t.pct}%</span>
            <Tooltip title={conceptTip} arrow>
              <span style={{ cursor: "help", textDecoration: "underline" }}>
                {t.mastered}/{t.total} concepts
              </span>
            </Tooltip>
          </Box>
        </>
      )}
    </Box>
  );
}

/* ---------- Summary bar ---------- */
function SummaryBar({ tasks }) {
  const total       = tasks.length;
  const completed   = tasks.filter(t => t.status === "done").length;
  const spentMin    = tasks.reduce((s, t) => s + t.spentMin, 0);

  return (
    <Box
      sx={{
        mb: 1.5,
        p: 1,
        bgcolor: "#262626",
        border: "1px solid #555",
        borderRadius: 2,
        display: "flex",
        justifyContent: "space-between",
        color: "#fff",
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      <span>{completed} / {total} tasks completed</span>
      <span>{spentMin} min spent</span>
    </Box>
  );
}

/* ---------- tiny helper row ---------- */
function Row({ icon, label, bold = false, color = "#fff" }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", mb: 0.3 }}>
      <Box sx={{ width: 18, textAlign: "center", mr: 0.6 }}>{icon}</Box>
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: bold ? 700 : 400,
          color,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}