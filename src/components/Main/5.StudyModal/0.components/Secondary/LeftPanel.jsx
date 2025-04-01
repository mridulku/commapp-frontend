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

//
// Helpers
//

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
 * Simple truncated text that shows a tooltip with the full string on hover
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
 * Now includes aggregatorTask & aggregatorStatus in the rendered info,
 * assuming they exist in each 'act' object.
 */
function ActivityList({ activities, currentIndex, onSelectAct }) {
  return (
    <List dense sx={{ p: 0 }}>
      {activities.map((act) => {
        const isSelected = act.flatIndex === currentIndex;
        const { bgColor, textColor } = getActivityStyle(isSelected);

        // Derive an activity label like "Reading", "Quiz", etc.
        let stageLabel = "Reading";
        if (act.type && act.type.toUpperCase().includes("QUIZ")) {
          if (act.quizStage) {
            stageLabel =
              act.quizStage.charAt(0).toUpperCase() + act.quizStage.slice(1);
          } else {
            stageLabel = "Quiz";
          }
        } else if (act.type && act.type.toUpperCase().includes("REVIS")) {
          stageLabel = "Revision";
        }

        const chapterName = act.chapterName || "No Chapter";
        const subChapterName = act.subChapterName || "No Subchapter";
        const minutes = act.timeNeeded || 0;

        // aggregator fields if present
        const aggregatorTask = act.aggregatorTask || null;
        const aggregatorStatus = act.aggregatorStatus || null;

        return (
          <ListItemButton
            key={act.flatIndex}
            sx={{
              ...listItemButtonSx,
              flexDirection: "column", // stack vertically
              alignItems: "flex-start",
              bgcolor: bgColor,
              color: textColor,
              mb: 0.8,
            }}
            onClick={() => onSelectAct(act.flatIndex)}
          >
            {/* Chapter name */}
            <TruncateTooltip
              text={`Chapter: ${chapterName}`}
              sx={{ fontSize: "0.8rem", fontWeight: 600 }}
            />
            {/* Subchapter name */}
            <TruncateTooltip
              text={`Subchapter: ${subChapterName}`}
              sx={{ fontSize: "0.75rem", mt: 0.5 }}
            />
            {/* Stage label (Reading, Quiz, etc.) */}
            <TruncateTooltip
              text={stageLabel}
              sx={{ fontSize: "0.75rem", mt: 0.5 }}
            />

            {/* aggregatorTask & aggregatorStatus (if available) */}
            {aggregatorTask && (
              <TruncateTooltip
                text={`Task: ${aggregatorTask}`}
                sx={{ fontSize: "0.7rem", mt: 0.5 }}
              />
            )}
            {aggregatorStatus && (
              <TruncateTooltip
                text={`Status: ${aggregatorStatus}`}
                sx={{ fontSize: "0.7rem", mt: 0.3 }}
              />
            )}

            {/* Time pill */}
            <TimePill minutes={minutes} />
          </ListItemButton>
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

    // Example placeholder
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

  // Else => "adaptive"
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

        {/* If not collapsed and planType is adaptive => day selector */}
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

// Styles
const containerSx = {
  height: "100%",
  bgcolor: "#1A1A1A",
  color: "#fff",
  display: "flex",
  flexDirection: "column",
  p: 1,
  boxSizing: "border-box",
};

const listItemButtonSx = {
  minHeight: 0,
  py: 1,
  px: 1,
  "&:hover": { bgcolor: "#444" },
  mb: 0.5,
  borderRadius: "4px",
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