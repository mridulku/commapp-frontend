// BottomBar.jsx

import React from "react";
import ProgressBar from "./ProgressBar"; 
//   ^-- Your existing progress bar component expecting stepPercent.

import { Box, Typography, Tooltip } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import QuizIcon from "@mui/icons-material/Quiz";

/**
 * Minimal "bottomBarStyle" container:
 * - black background (#000)
 * - white text
 * - only 50px high
 * - horizontally flexible
 */
const bottomBarStyle = {
  backgroundColor: "#000",
  color: "#fff",
  height: 50,
  display: "flex",
  alignItems: "center",
  padding: "0 10px",
  fontFamily: "sans-serif",
};

/**
 * Dummy timeline data with short "category" or "stage" names
 * so that user sees them at a glance (e.g. "Read", "Understand", etc.).
 */
const dummyStages = [
  {
    label: "Read",
    completed: true,
    positionPct: 0,
    eventsAfter: [
      { type: "QUIZ_FAIL", date: "2025-03-01", detail: "Score 40%. Retried." },
      { type: "QUIZ_PASS", date: "2025-03-02", detail: "Score 80%. Advanced." },
    ],
  },
  {
    label: "Understand",
    completed: true,
    positionPct: 33,
    eventsAfter: [
      { type: "REVISION", date: "2025-03-05", detail: "Short revision." },
      { type: "QUIZ_PASS", date: "2025-03-06", detail: "Score 90%. Next stage!" },
    ],
  },
  {
    label: "Apply",
    completed: false,
    positionPct: 66,
    eventsAfter: [],
  },
  {
    label: "Analyze",
    completed: false,
    positionPct: 100,
    eventsAfter: [],
  },
];

/**
 * BottomBar
 * ---------
 * PROPS:
 *  - stepPercent (number): for your custom ProgressBar
 *  - currentIndex (number): e.g. current step
 *  - totalSteps (number)
 *
 * Layout:
 *   [ Left: ProgressBar + "Step X / Y (Z%)" ] | [ Right: mini timeline w/ labeled dots ]
 */
export default function BottomBar({ stepPercent, currentIndex, totalSteps }) {
  return (
    <div style={bottomBarStyle}>
      {/* Left side: progress bar + step label */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexShrink: 0,
          minWidth: 220, // ensure space for the bar + label
        }}
      >
        <ProgressBar stepPercent={stepPercent} />
        <Typography variant="caption" sx={{ color: "#fff" }}>
          Step {currentIndex + 1} / {totalSteps} ({stepPercent}%)
        </Typography>
      </Box>

      {/* Right side: mini timeline */}
      <Box
        sx={{
          position: "relative",
          flex: 1,
          height: 20, // short timeline
          ml: 2,
          mr: 2,
        }}
      >
        {/* Thin "rail" line */}
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            height: 2,         // minimal thickness
            backgroundColor: "#555",
            transform: "translateY(-50%)",
          }}
        />

        {/* Render each stage dot + label + events */}
        {dummyStages.map((stage, idx) => {
          const next = dummyStages[idx + 1];
          const isLast = idx === dummyStages.length - 1;
          return (
            <React.Fragment key={stage.label}>
              <StageDot stage={stage} />
              {/* If there's a next stage, render the "hover" zone for events */}
              {!isLast && next && (
                <EventsSegment currentStage={stage} nextStage={next} />
              )}
            </React.Fragment>
          );
        })}
      </Box>
    </div>
  );
}

/**
 * StageDot
 * --------
 * A small dot with text label (above or below).
 * Hover shows short tooltip with "Complete" vs "In Progress".
 */
function StageDot({ stage }) {
  const dotSize = 14;
  // Use slightly brighter colors
  const color = stage.completed ? "#66BB6A" : "#EF5350";
  // Icon depends on completion
  const icon = stage.completed
    ? <CheckCircleIcon sx={{ fontSize: 12 }} />
    : <QuizIcon sx={{ fontSize: 12 }} />;

  return (
    <Box
      sx={{
        position: "absolute",
        left: `${stage.positionPct}%`,
        top: "50%",
        transform: "translate(-50%, -50%)",
        // We'll hold dot + label in this container
        width: 50,
        textAlign: "center",
      }}
    >
      {/* The dot itself */}
      <Tooltip
        arrow
        title={
          <Box sx={{ p: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: "bold" }}>
              {stage.label}
            </Typography>
            <br />
            {stage.completed ? (
              <Typography variant="caption">Complete</Typography>
            ) : (
              <Typography variant="caption">In Progress</Typography>
            )}
          </Box>
        }
      >
        <Box
          sx={{
            width: dotSize,
            height: dotSize,
            borderRadius: "50%",
            backgroundColor: color,
            margin: "0 auto",
            cursor: "pointer",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </Box>
      </Tooltip>

      {/* Label "Read", "Understand" etc. (always visible, small text) */}
      <Typography
        variant="caption"
        sx={{
          display: "block",
          marginTop: "2px",
          color: "#fff",
          fontSize: "10px", // quite small
          lineHeight: 1.0,
        }}
      >
        {stage.label}
      </Typography>
    </Box>
  );
}

/**
 * EventsSegment
 * -------------
 * Invisible area between currentStage & nextStage.
 * On hover => shows short event info.
 */
function EventsSegment({ currentStage, nextStage }) {
  const left = currentStage.positionPct;
  const right = nextStage.positionPct;
  const events = currentStage.eventsAfter || [];

  // Build minimal tooltip
  const content = events.length ? (
    <Box sx={{ p: 1 }}>
      {events.map((ev, i) => {
        let evIcon = null;
        if (ev.type === "QUIZ_FAIL") {
          evIcon = <CancelIcon sx={{ fontSize: 12, color: "#EF5350", mr: 0.5 }} />;
        } else if (ev.type === "QUIZ_PASS") {
          evIcon = <CheckCircleIcon sx={{ fontSize: 12, color: "#66BB6A", mr: 0.5 }} />;
        } else if (ev.type === "REVISION") {
          evIcon = <QuizIcon sx={{ fontSize: 12, color: "#2196f3", mr: 0.5 }} />;
        }
        return (
          <Box key={i} sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
            {evIcon}
            <Typography variant="caption" sx={{ color: "#fff" }}>
              {ev.date} – {ev.detail}
            </Typography>
          </Box>
        );
      })}
    </Box>
  ) : (
    <Typography variant="caption" sx={{ p: 1, color: "#fff" }}>
      No events.
    </Typography>
  );

  return (
    <Tooltip title={content} placement="top" arrow enterTouchDelay={0}>
      <Box
        sx={{
          position: "absolute",
          left: `${left}%`,
          width: `${right - left}%`,
          top: "50%",
          transform: "translateY(-50%)",
          height: 20,
          backgroundColor: "transparent",
          cursor: events.length ? "pointer" : "default",
        }}
      />
    </Tooltip>
  );
}