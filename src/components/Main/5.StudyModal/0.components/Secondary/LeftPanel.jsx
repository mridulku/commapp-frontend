// File: LeftPanel.jsx

import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentIndex } from "../../../../../store/planSlice";

import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  List,
  ListItemButton,
  Tooltip,
  IconButton,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import LockIcon from "@mui/icons-material/Lock";

//
// Helpers
//

/**
 * getStageNumberAndLabel(act)
 * - If act.type = "read" => "Stage 1: Reading"
 * - If quizStage = "remember"/"understand"/"apply"/"analyze" => "Stage X: Label"
 *   Otherwise fallback => "Quiz"
 */
function getStageNumberAndLabel(act) {
  // Convert .type to lowerCase so we consistently handle "read"/"quiz"
  const lowerType = (act.type || "").toLowerCase();

  if (lowerType === "read") {
    return "Stage 1: Reading";
  }

  // If it's quiz, figure out which stage number
  const stageMap = {
    remember: 2,
    understand: 3,
    apply: 4,
    analyze: 5,
  };
  const sKey = (act.quizStage || "").toLowerCase();
  const number = stageMap[sKey] || 0;

  if (!number) {
    // fallback if quizStage is unknown => just "Quiz"
    return "Quiz";
  }

  const label = sKey.charAt(0).toUpperCase() + sKey.slice(1);
  return `Stage ${number}: ${label}`;
}

/**
 * getActivityStyle(isSelected)
 * - If selected => highlight red
 * - else => dark gray
 */
function getActivityStyle(isSelected) {
  if (isSelected) {
    return {
      bgColor: "#EF5350",
      textColor: "#fff",
    };
  }
  return {
    bgColor: "#555",
    textColor: "#fff",
  };
}

/**
 * aggregatorTaskPill(taskLabel)
 * - Renders aggregatorTask (e.g. "QUIZ1"|"REVISION2") as a styled orange pill
 */
function aggregatorTaskPill(taskLabel) {
  return (
    <Box
      sx={{
        mt: 0.5,
        px: 0.8,
        py: 0.3,
        borderRadius: "0.2rem",
        fontSize: "0.7rem",
        bgcolor: "#FFA726", // orange pill
        color: "#000",
      }}
    >
      {taskLabel}
    </Box>
  );
}

/**
 * aggregatorLockedOverlay()
 * - Semi-transparent box with a lock icon,
 *   BUT pointerEvents="none" => user can still click the underlying item
 */
function aggregatorLockedOverlay() {
  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        bgcolor: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "4px",
        pointerEvents: "none", // do NOT block clicks
      }}
    >
      <LockIcon sx={{ color: "#fff", opacity: 0.8, fontSize: 30 }} />
    </Box>
  );
}

/**
 * TimePill => "5m" bubble
 */
function TimePill({ minutes = 0 }) {
  return (
    <Box
      sx={{
        mt: 1,
        width: "fit-content",
        bgcolor: "#424242",
        color: "#fff",
        fontSize: "0.75rem",
        px: 0.8,
        py: 0.3,
        borderRadius: "0.2rem",
      }}
    >
      {minutes}m
    </Box>
  );
}

/**
 * completionStatusPill
 * - Renders a small pill for "deferred" or "complete" statuses
 */
function completionStatusPill(status) {
  // If not present, do nothing
  if (!status) return null;

  let label = "";
  let bgColor = "#424242"; // fallback color

  if (status === "deferred") {
    label = "Deferred";
    bgColor = "#BDBDBD"; // a gray pill
  } else if (status === "complete") {
    label = "Complete";
    bgColor = "#66BB6A"; // a green pill
  } else {
    // If it's some other unexpected value, do nothing
    return null;
  }

  return (
    <Box
      sx={{
        mt: 0.5,
        px: 0.8,
        py: 0.3,
        borderRadius: "0.2rem",
        fontSize: "0.7rem",
        bgcolor: bgColor,
        color: "#000",
      }}
    >
      {label}
    </Box>
  );
}

/**
 * formatMinutes(totalMin)
 * => "1h 20m" or "45m"
 */
function formatMinutes(totalMin) {
  if (!totalMin) return "0m";
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

/**
 * TruncateTooltip
 * => truncated text with tooltip
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
 * -------------
 * - Renders each activity as a card
 * - "Stage 1: Reading" or "Stage 2: Remember" or "Stage 3: Understand" ...
 * - aggregatorTask => pill if quiz, none if reading
 * - aggregatorStatus="locked" => translucent lock overlay
 * - completionStatus => shows a small pill if "deferred" or "complete"
 */
function ActivityList({ activities, currentIndex, onSelectAct }) {
  return (
    <List dense sx={{ p: 0 }}>
      {activities.map((act) => {
        const isSelected = act.flatIndex === currentIndex;
        const { bgColor, textColor } = getActivityStyle(isSelected);

        // 1) Stage label
        const stageLabel = getStageNumberAndLabel(act);

        // 2) Basic info
        const chapterName = act.chapterName || "No Chapter";
        const subChapterName = act.subChapterName || "No Subchapter";
        const minutes = act.timeNeeded || 0;

        // 3) aggregator fields
        const aggregatorTask = act.aggregatorTask || "";
        const aggregatorStatus = (act.aggregatorStatus || "").toLowerCase();

        // Convert the activity type to lowercase for consistency
        const lowerType = (act.type || "").toLowerCase();

        // aggregatorTask => skip if reading
        let aggregatorTaskNode = null;
        if (lowerType !== "read" && aggregatorTask) {
          aggregatorTaskNode = aggregatorTaskPill(aggregatorTask);
        }

        // aggregatorStatus => "locked" => show overlay
        let lockedOverlay = null;
        if (aggregatorStatus === "locked") {
          lockedOverlay = aggregatorLockedOverlay();
        }

        // 4) completionStatus pill
        const completionStatusNode = completionStatusPill(act.completionStatus);

        return (
          <Box
            key={act.flatIndex}
            sx={{
              position: "relative",
              mb: 0.8,
              borderRadius: "4px",
              overflow: "hidden", // for the overlay
            }}
          >
            <ListItemButton
              sx={{
                flexDirection: "column",
                alignItems: "flex-start",
                bgcolor: bgColor,
                color: textColor,
                minHeight: 0,
                py: 1,
                px: 1,
                "&:hover": { bgcolor: "#444" },
              }}
              onClick={() => onSelectAct(act.flatIndex)}
            >
              {/* 1) Chapter name */}
              <TruncateTooltip
                text={`Chapter: ${chapterName}`}
                sx={{ fontSize: "0.8rem", fontWeight: 600 }}
              />

              {/* 2) Subchapter name */}
              <TruncateTooltip
                text={`Subchapter: ${subChapterName}`}
                sx={{ fontSize: "0.75rem", mt: 0.5 }}
              />

              {/* 3) Stage label => "Stage 1: Reading" etc. */}
              <TruncateTooltip
                text={stageLabel}
                sx={{ fontSize: "0.75rem", mt: 0.5 }}
              />

              {/* aggregatorTask => pill (only if quiz) */}
              {aggregatorTaskNode && <Box sx={{ mt: 0.5 }}>{aggregatorTaskNode}</Box>}

              {/* completionStatus => pill */}
              {completionStatusNode && <Box sx={{ mt: 0.5 }}>{completionStatusNode}</Box>}

              {/* Time pill */}
              <TimePill minutes={minutes} />
            </ListItemButton>

            {/* If locked => translucent overlay w/ lock icon (non-blocking) */}
            {lockedOverlay}
          </Box>
        );
      })}
    </List>
  );
}

/** The main LeftPanel component */
export default function LeftPanel({
  isCollapsed = false,
  onToggleCollapse = () => {},
}) {
  const dispatch = useDispatch();
  const { planDoc, flattenedActivities, currentIndex, status } = useSelector(
    (state) => state.plan
  );

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // If plan not loaded
  if (status !== "succeeded" || !planDoc) {
    return (
      <Box sx={containerSx}>
        <Typography variant="body2">No plan loaded yet.</Typography>
      </Box>
    );
  }

  const { planType = "adaptive", sessions = [] } = planDoc;

  // Sync the day with the currentIndex
  useEffect(() => {
    if (!flattenedActivities?.length) return;
    if (currentIndex < 0 || currentIndex >= flattenedActivities.length) return;

    const currentAct = flattenedActivities[currentIndex];
    const { dayIndex } = currentAct || {};

    if (planType !== "book") {
      setSelectedDayIndex(dayIndex || 0);
    }
  }, [currentIndex, flattenedActivities, planType]);

  function handleDayChange(e) {
    const val = Number(e.target.value);
    setSelectedDayIndex(val);
  }

  // For displaying total day time + progress
  function renderDayStats(session) {
    const totalMinutes =
      session.activities?.reduce((acc, x) => acc + (x.timeNeeded || 0), 0) || 0;
    const totalTimeStr = formatMinutes(totalMinutes);

    // example placeholder
    const userProgress = 40;
    return (
      <Box sx={{ color: "#fff", mb: 2, ml: 1 }}>
        <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
          <strong>Today's Total Time:</strong> {totalTimeStr}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
          <strong>Today's Progress:</strong> {userProgress}%
        </Typography>
      </Box>
    );
  }

  // If planType="book"
  if (planType === "book") {
    const singleSession = sessions[0] || {};
    const { activities = [] } = singleSession;
    return (
      <Box sx={containerSx}>
        {renderTopRow("book")}
        {!isCollapsed && (
          <>
            {renderDayStats(singleSession)}
            <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
              <ActivityList
                activities={activities}
                currentIndex={currentIndex}
                onSelectAct={(idx) => dispatch(setCurrentIndex(idx))}
              />
            </Box>
          </>
        )}
      </Box>
    );
  }

  // else => "adaptive"
  const currentSession = sessions[selectedDayIndex] || {};
  const { activities = [] } = currentSession;

  return (
    <Box sx={containerSx}>
      {renderTopRow("adaptive")}
      {!isCollapsed && (
        <>
          {renderDayStats(currentSession)}
          <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
            <ActivityList
              activities={activities}
              currentIndex={currentIndex}
              onSelectAct={(idx) => dispatch(setCurrentIndex(idx))}
            />
          </Box>
        </>
      )}
    </Box>
  );

  function renderTopRow(type) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 1,
          position: "relative",
          height: 32,
        }}
      >
        <IconButton
          size="small"
          onClick={onToggleCollapse}
          sx={{
            color: "#fff",
            marginRight: 1,
            zIndex: 2,
          }}
        >
          <MenuIcon />
        </IconButton>

        {/* If not collapsed and planType != "book" => show day dropdown */}
        {!isCollapsed && type !== "book" && (
          <Box
            sx={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1,
            }}
          >
            <FormControl variant="standard" sx={{ minWidth: 60 }}>
              <Select
                value={selectedDayIndex}
                onChange={handleDayChange}
                disableUnderline
                sx={selectSx}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: "#222",
                      color: "#fff",
                    },
                  },
                }}
              >
                {sessions.map((sess, idx) => (
                  <MenuItem key={idx} value={idx}>
                    Day {sess.sessionLabel || idx + 1}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
      </Box>
    );
  }
}

// --------------------- STYLES ---------------------
const containerSx = {
  height: "100%",
  bgcolor: "#1A1A1A",
  color: "#fff",
  display: "flex",
  flexDirection: "column",
  p: 1,
  boxSizing: "border-box",
};

const selectSx = {
  fontSize: "0.8rem",
  color: "#fff",
  bgcolor: "#222",
  borderRadius: 1,
  px: 1,
  py: 0.5,
  "& .MuiSelect-icon": {
    color: "#fff",
  },
};