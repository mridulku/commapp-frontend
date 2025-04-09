// File: AggregatorInfoPanel.jsx
import React, { useState } from "react";
import { Box, Typography, Tooltip } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import Pill from "./Pill";
import ExplanationModal from "./ExplanationModal"; 
import TimeBreakdownModal from "./TimeBreakdownModal"; // <-- Import the new modal

function formatSeconds(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

/** aggregatorLocked => from activity.aggregatorStatus or subchapterStatus */
function checkAggregatorLocked(activity, subchapterStatusMap) {
  const aggregatorLocked = (activity.aggregatorStatus || "").toLowerCase() === "locked";
  let lockedFromAPI = false;
  const subChId = activity.subChapterId || "";
  if (subChId && subchapterStatusMap[subChId]?.taskInfo) {
    const rawType = (activity.type || "").toLowerCase();
    const stageKey = rawType.includes("read")
      ? "reading"
      : (activity.quizStage || "").toLowerCase();

    const found = subchapterStatusMap[subChId].taskInfo.find(
      (ti) => (ti.stageLabel || "").toLowerCase() === stageKey
    );
    if (found?.locked) lockedFromAPI = true;
  }
  return aggregatorLocked || lockedFromAPI;
}

export default function AggregatorInfoPanel({
  activity,
  timeMap,
  subchapterStatusMap,
  // aggregator lumps doc-level
  setTimeDetailOpen,
  setTimeDetailTitle,
  setTimeDetailData,
  // aggregator logs => so we can show them in an ExplanationModal
  timeFetchLogs,
  statusFetchLogs,
}) {
  // 1) Basic aggregator logic => lumpsSec, final status
  const lumpsSec = timeMap[activity.activityId] || 0;
  const lumpsStr = formatSeconds(lumpsSec);
  const expectedMin = activity.timeNeeded || 0;
  const expectedStr = `${expectedMin}m`;

  const aggregatorLocked = checkAggregatorLocked(activity, subchapterStatusMap);
  const planCompletion = (activity.completionStatus || "").toLowerCase();

  let finalStatusLabel = "Not Started";
  let finalStatusColor = "#EF5350";
  if (planCompletion === "complete") {
    finalStatusLabel = "Complete";
    finalStatusColor = "#66BB6A";
  } else if (aggregatorLocked) {
    finalStatusLabel = "Locked";
    finalStatusColor = "#9E9E9E";
  } else if (planCompletion === "deferred") {
    finalStatusLabel = "Deferred";
    finalStatusColor = "#FFA726";
  } else if (lumpsSec > 0) {
    finalStatusLabel = "WIP";
    finalStatusColor = "#BDBDBD";
  }

  // 2) Explanation logs => same as before
  const [explanationOpen, setExplanationOpen] = useState(false);
  const [explanationData, setExplanationData] = useState([]);

  function openExplanation(fieldName) {
    let relevantLogs = [];
    if (fieldName === "timeSpent") {
      relevantLogs = timeFetchLogs.filter(
        (log) => log.field === "timeSpent" && log.activityId === activity.activityId
      );
    } else if (fieldName === "locked") {
      if (activity.subChapterId) {
        relevantLogs = statusFetchLogs.filter(
          (log) => log.subchapterId === activity.subChapterId
        );
      }
    }
    setExplanationData(relevantLogs);
    setExplanationOpen(true);
  }
  function closeExplanation() {
    setExplanationOpen(false);
    setExplanationData([]);
  }

  // 3) State => new day-based breakdown modal
  const [dayBreakOpen, setDayBreakOpen] = useState(false);

  return (
    <Box sx={{ mb: 2, pl: 1 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
        Aggregator Fields
      </Typography>

      {/* A) Time Spent Section */}
      <Box sx={{ mb: 2, ml: 2, borderLeft: "2px solid #999", pl: 1 }}>
        <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
          Time Spent
        </Typography>

        {/* Actual time => lumpsSec => lumpsStr */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
          <Typography variant="body2" sx={{ width: 130 }}>
            Actual Time:
          </Typography>
          <Tooltip title={`Elapsed: ${lumpsStr}`}>
            <Pill text={lumpsStr} />
          </Tooltip>

          {/* "i" => aggregator logs */}
          <InfoOutlinedIcon
            sx={{ ml: 1, fontSize: "1rem", cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              openExplanation("timeSpent");
            }}
          />

          {/* AccessTimeIcon => lumps doc-level detail (existing feature) */}
          <AccessTimeIcon
            sx={{ ml: 1, fontSize: "1rem", cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              if (setTimeDetailOpen) {
                setTimeDetailTitle(`Time Breakdown => activityId='${activity.activityId}'`);
                setTimeDetailData([]); // or fetch lumps detail
                setTimeDetailOpen(true);
              }
            }}
          />

          {/* NEW: Another icon => day-based time breakdown */}
          <AccessTimeIcon
            sx={{ ml: 1, fontSize: "1rem", cursor: "pointer", color: "#FFD700" }}
            onClick={(e) => {
              e.stopPropagation();
              setDayBreakOpen(true);
            }}
          />
        </Box>

        {/* 2) Expected Time */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
          <Typography variant="body2" sx={{ width: 130 }}>
            Expected Time:
          </Typography>
          <Pill text={expectedStr} />
        </Box>
      </Box>

      {/* B) Completion Status */}
      <Box sx={{ mb: 1, ml: 2, borderLeft: "2px solid #999", pl: 1 }}>
        <Typography variant="body2" sx={{ mb: 1, fontWeight: "bold" }}>
          Completion Status
        </Typography>

        {/* Plan.Completion */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
          <Typography variant="body2" sx={{ width: 130 }}>
            Plan Completion:
          </Typography>
          <Pill text={planCompletion || "(none)"} />
        </Box>

        {/* aggregatorLocked => Eye button for subchapter logs */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
          <Typography variant="body2" sx={{ width: 130 }}>
            Aggregator Locked:
          </Typography>
          <Pill text={aggregatorLocked ? "Yes" : "No"} bgColor={aggregatorLocked ? "#9E9E9E" : "#424242"} />
          <InfoOutlinedIcon
            sx={{ ml: 1, fontSize: "1rem", cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              openExplanation("locked");
            }}
          />
        </Box>

        {/* lumpsSec => if >0 => WIP */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
          <Typography variant="body2" sx={{ width: 130 }}>
            User Spent Time?
          </Typography>
          <Pill text={lumpsSec > 0 ? "Yes" : "No"} />
        </Box>

        {/* Final derived */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
          <Typography variant="body2" sx={{ width: 130 }}>
            Final Status:
          </Typography>
          <Pill text={finalStatusLabel} bgColor={finalStatusColor} textColor="#000" />
        </Box>
      </Box>

      {/* ExplanationModal => aggregator logs */}
      <ExplanationModal
        open={explanationOpen}
        logs={explanationData}
        onClose={closeExplanation}
        title="Aggregator Explanation"
      />

      {/* NEW => TimeBreakdownModal => day-based breakdown */}
      <TimeBreakdownModal
        open={dayBreakOpen}
        onClose={() => setDayBreakOpen(false)}
        activity={activity}
      />
    </Box>
  );
}