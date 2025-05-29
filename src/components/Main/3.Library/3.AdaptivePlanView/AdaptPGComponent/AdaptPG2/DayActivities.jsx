// File: DayActivities.jsx  (dual-view, attempt buckets + new status logic) 2025-05-01
import React, { useMemo } from "react";
import { Box, LinearProgress, Tooltip, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import ActivityAccordion from "./ActivityAccordion";

import Loader from "../../../../5.StudyModal/0.components/Secondary/shared/Loader";

 import useTaskModel from "../../../../5.StudyModal/0.components/Secondary/shared/useTaskModel";


/* ---------- quick admin check ---------- */
const ADMIN_UIDS = ["acbhbtiODoPPcks2CP6ZdmZ"];

import TaskCard from "../../../../5.StudyModal/0.components/Secondary/shared/TaskCard";

/* ---------- icon & colour presets ---------- */





/* =================================================================== */



export default function DayActivities({
  activities = [],
  subchapterStatusMap,
  onOpenPlanFetcher,
  planId,
  userId,
  sessionDateISO,            // "YYYY-MM-DD"
  ...rest
}) {
  /* ---------- admin / user split ---------- */
  const reduxUid = useSelector((s) => s.auth?.userId);
  const uid      = userId || reduxUid;
  const isAdmin  = ADMIN_UIDS.includes(uid);

  const currentIndex = useSelector(s => s.plan.currentIndex);
  const timeMap      = useSelector(s => s.aggregator.timeMap);


  if (isAdmin) {
    return (
      <Box>
        {activities.map((a, i) => (
          <ActivityAccordion key={i} index={i} activity={a} {...rest} />
        ))}
      </Box>
    );
  }

  /* ================= USER CARD GRID ================= */

 const tasks = useTaskModel(
   activities,
   subchapterStatusMap,
   timeMap,
   sessionDateISO      // you already have this arg
 );

  /* ---------- UI ---------- */
  const openFetcher = (t) =>
    onOpenPlanFetcher?.(planId, t._rawActivity);
    

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
           <TaskCard
   key={t.id}
   t={t}
   selected={currentIndex === t.flatIndex}
   onOpen={() => openFetcher(t)}
 />
        ))}
      </Box>
    </Box>
  );
}

/* =====================================================================
   TaskCard – colours itself by status
===================================================================== */


/* ---------- Summary bar ---------- */
function SummaryBar({ tasks }) {
  const total       = tasks.length;
  const completed   = tasks.filter((t) => t.status === "completed").length;
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