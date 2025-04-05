// File: DailyPlan.jsx

import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentIndex } from "../../../../../../store/planSlice";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  Tooltip,
  List,
  ListItemButton,
} from "@mui/material";

// MUI icons for demonstration
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";

/** 
 * --------------------------------
 * UTILS & CONSTANTS
 * --------------------------------
 */

// Single pill color for chapter, subchapter, stage, aggregatorTask, time
const PILL_BG = "#424242";
const PILL_TEXT = "#fff";

// If an item is selected => #EF5350 (red); else => #555 (gray)
function getCardBackground(isSelected) {
  return isSelected ? "#EF5350" : "#555";
}

// If aggregatorStatus === "locked", we show a semi-transparent overlay
function aggregatorLockedOverlay() {
  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        bgcolor: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <Typography sx={{ color: "#fff", opacity: 0.8 }}>LOCKED</Typography>
    </Box>
  );
}

/**
 * A simple pill component for consistent styling
 */
function Pill({
  text,
  bgColor = PILL_BG,
  textColor = PILL_TEXT,
  sx = {},
}) {
  return (
    <Box
      sx={{
        display: "inline-block",
        px: 0.8,
        py: 0.3,
        borderRadius: "0.2rem",
        fontSize: "0.75rem",
        fontWeight: 500,
        bgcolor: bgColor,
        color: textColor,
        whiteSpace: "nowrap",
        ...sx,
      }}
    >
      {text}
    </Box>
  );
}

/**
 * Convert an activity's type/quizStage into "Stage X, Reading/Remember/etc."
 * If none matches, fallback "Stage ?, Quiz"
 */
function getStageLabel(act) {
  // For reading
  if ((act.type || "").toLowerCase() === "read") {
    return "Stage 1, Reading";
  }

  const stage = (act.quizStage || "").toLowerCase();
  switch (stage) {
    case "remember":
      return "Stage 2, Remember";
    case "understand":
      return "Stage 3, Understand";
    case "apply":
      return "Stage 4, Apply";
    case "analyze":
      return "Stage 5, Analyze";
    default:
      // fallback if quizStage is unknown
      return "Stage ?, Quiz";
  }
}

/**
 * "CompletionStatusBlock"
 * If "complete" or "deferred", show 3 pills:
 *  1) "Complete"/"Deferred" pill
 *  2) Clock icon pill with static "4:10 PM"
 *  3) Hourglass icon pill with static "2m 15s"
 */
function CompletionStatusBlock({ status }) {
  if (!status) return null;
  const norm = status.toLowerCase();

  let bgColor = "#BDBDBD";
  let label = status;
  let textColor = "#000";

  if (norm === "complete") {
    bgColor = "#66BB6A";
    label = "Complete";
  } else if (norm === "deferred") {
    bgColor = "#FFA726";
    label = "Deferred";
  }

  return (
    <>
      {/* 1) The completion pill */}
      <Pill text={label} bgColor={bgColor} textColor={textColor} />

      {/* 2) The static clock pill */}
      <Pill
        bgColor={bgColor}
        textColor={textColor}
        text={
          <>
            <AccessTimeIcon sx={{ fontSize: "0.8rem", mr: 0.5 }} />
            4:10 PM
          </>
        }
      />

      {/* 3) The static duration pill */}
      <Pill
        bgColor={bgColor}
        textColor={textColor}
        text={
          <>
            <HourglassEmptyIcon sx={{ fontSize: "0.8rem", mr: 0.5 }} />
            2m 15s
          </>
        }
      />
    </>
  );
}

/**
 * (Optional) If you want truncated tooltips for some text
 */
function TruncateTooltip({ text, sx }) {
  return (
    <Tooltip title={text} arrow>
      <Typography
        noWrap
        sx={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          display: "block",
          width: "100%",
          ...sx,
        }}
      >
        {text}
      </Typography>
    </Tooltip>
  );
}

/**
 * ActivityList
 * ------------
 * Two-line layout:
 *   Row 1 => Chapter pill, Subchapter pill, Stage pill
 *   Row 2 => aggregatorTask pill (if present), time pill, completion status block on far right
 *           (the block includes the "complete/deferred" pill + clock + duration)
 */
function ActivityList({ dayActivities, currentIndex, onClickActivity }) {
  return (
    <List dense sx={{ p: 0 }}>
      {dayActivities.map((act) => {
        const isSelected = act.flatIndex === currentIndex;
        const cardBg = getCardBackground(isSelected);

        // aggregator locked?
        const locked = (act.aggregatorStatus || "").toLowerCase() === "locked";

        // Stage label => e.g. "Stage 2, Remember"
        const stageLabel = getStageLabel(act);

        // aggregatorTask => e.g. "Quiz 1" or "Read" or "5-Minute Quiz"
        const aggregatorTask = act.aggregatorTask || "";

        // time => e.g. "5m"
        const timeNeeded = act.timeNeeded !== undefined 
          ? `${act.timeNeeded}m`
          : null;

        return (
          <Box
            key={act.flatIndex}
            sx={{
              position: "relative",
              mb: 0.8,
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <ListItemButton
              sx={{
                flexDirection: "column",
                alignItems: "flex-start",
                bgcolor: cardBg,
                color: "#fff",
                py: 1,
                px: 1,
                "&:hover": { bgcolor: "#444" },
              }}
              onClick={() => onClickActivity(act)}
            >
              {/* Row 1 */}
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                  width: "100%",
                }}
              >
                {/* Chapter pill */}
                <Pill text={act.chapterName || "Chapter ?"} />
                {/* Subchapter pill */}
                <Pill text={act.subChapterName || "Subchapter ?"} />
                {/* Stage pill => e.g. "Stage 2, Remember" */}
                <Pill text={stageLabel} />
              </Box>

              {/* Row 2 => aggregatorTask, time, completion block on far right */}
              <Box
                sx={{
                  display: "flex",
                  width: "100%",
                  mt: 0.5,
                  alignItems: "center",
                  gap: 1,
                }}
              >
                {/* aggregatorTask pill (left side) if we have aggregatorTask */}
                {aggregatorTask && <Pill text={aggregatorTask} />}

                {/* time pill if we have timeNeeded */}
                {timeNeeded && <Pill text={timeNeeded} />}

                {/* completion status block on far right */}
                <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
                  <CompletionStatusBlock status={act.completionStatus} />
                </Box>
              </Box>
            </ListItemButton>
            {locked && aggregatorLockedOverlay()}
          </Box>
        );
      })}
    </List>
  );
}

/**
 * Main DailyPlan component
 */
export default function DailyPlan({
  plan,
  planId,
  colorScheme,
  dayDropIdx,
  onDaySelect,
  expandedChapters,
  onToggleChapter,
  onOpenPlanFetcher,
}) {
  const dispatch = useDispatch();
  const currentIndex = useSelector((state) => state.plan.currentIndex);

  if (!plan?.sessions?.length) {
    return <div>No sessions found in this plan.</div>;
  }

  // Ensure dayDropIdx is valid
  const sessions = plan.sessions;
  let safeIdx = dayDropIdx;
  if (safeIdx >= sessions.length) {
    safeIdx = 0;
  }
  const currentSession = sessions[safeIdx] || {};
  const { activities = [] } = currentSession;

  function handleClickActivity(act) {
    dispatch(setCurrentIndex(act.flatIndex));
    if (onOpenPlanFetcher) {
      onOpenPlanFetcher(planId, act);
    }
  }

  return (
    <div style={{ marginTop: "1rem" }}>
      {/* Smaller day dropdown label: "Day" */}
      <Box sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
        <Typography
          variant="body2"
          sx={{
            fontSize: "0.85rem",
            color: colorScheme.textColor || "#FFD700",
          }}
        >
          Day:
        </Typography>
        <Select
          value={safeIdx}
          onChange={(e) => onDaySelect(Number(e.target.value))}
          sx={{
            minWidth: 100,
            fontSize: "0.8rem",
            height: 32,
            backgroundColor: "#2F2F2F",
            color: colorScheme.textColor || "#FFD700",
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                bgcolor: "#2F2F2F",
                color: "#fff",
              },
            },
          }}
        >
          {sessions.map((sess, idx) => {
            const sLabel = Number(sess.sessionLabel);
            let displayName = "";
            if (sLabel === 1) displayName = "Today";
            else if (sLabel === 2) displayName = "Tomorrow";
            else displayName = `Day ${sLabel}`;
            return (
              <MenuItem key={sess.sessionLabel} value={idx}>
                {displayName}
              </MenuItem>
            );
          })}
        </Select>
      </Box>

      {/* The updated ActivityList */}
      <ActivityList
        dayActivities={activities}
        currentIndex={currentIndex}
        onClickActivity={handleClickActivity}
      />
    </div>
  );
}