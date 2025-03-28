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
  Collapse,
  Tooltip,
  IconButton,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import ExpandLessIcon from "@mui/icons-material/KeyboardArrowUp";
import ExpandMoreIcon from "@mui/icons-material/KeyboardArrowDown";

//
// Helpers
//

/** 
 * getActivityStyle
 * For color highlighting if the user has selected that item 
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

/** A small pill for e.g. "5m" */
function TimePill({ minutes = 0 }) {
  return (
    <Box sx={{
      ml: 1,
      bgcolor: "#424242",
      color: "#fff",
      fontSize: "0.7rem",
      px: 0.6,
      py: 0.2,
      borderRadius: "0.2rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}>
      {minutes}m
    </Box>
  );
}

/**
 * formatMinutes
 *  - Takes a total number of minutes
 *  - Returns a string like "1h 20m" or "45m"
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

/** TruncateTooltip => truncated text with ellipsis + tooltip */
function TruncateTooltip({ text, sx }) {
  return (
    <Tooltip title={text} arrow>
      <Typography
        noWrap
        sx={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          ...sx,
        }}
      >
        {text}
      </Typography>
    </Tooltip>
  );
}

/** 
 * parseTitlePill
 * Extracts leading digit (e.g. "1.") and places in a small colored box, 
 * the rest is truncated with a tooltip
 */
function parseTitlePill(fullTitle, color = "#EC407A") {
  // Attempt to split out leading digit(s).
  let splitted = fullTitle.split(".");
  let indexToken = splitted[0].trim();
  let restName = fullTitle;

  // If that token is truly numeric
  if (/^\d+$/.test(indexToken)) {
    restName = fullTitle.substring(indexToken.length + 1).trim();
  } else {
    indexToken = "";
    restName = fullTitle;
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        flex: 1,
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      {indexToken && (
        <Box
          sx={{
            minWidth: "1.4rem",
            height: "1.4rem",
            bgcolor: color,
            borderRadius: "0.2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#fff" }}>
            {indexToken}
          </Typography>
        </Box>
      )}

      <TruncateTooltip
        text={restName || fullTitle}
        sx={{ fontSize: "0.75rem", flex: 1 }}
      />
    </Box>
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
  const [expanded, setExpanded] = useState({});

  // If plan not loaded
  if (status !== "succeeded" || !planDoc) {
    return (
      <Box sx={containerSx}>
        <Typography variant="body2">No plan loaded yet.</Typography>
      </Box>
    );
  }

  const { planType = "adaptive", sessions = [] } = planDoc;

  // On currentIndex change => expand chain
  useEffect(() => {
    if (!flattenedActivities?.length) return;
    if (currentIndex < 0 || currentIndex >= flattenedActivities.length) return;

    const currentAct = flattenedActivities[currentIndex];
    const { dayIndex, chapterId } = currentAct || {};

    if (planType !== "book") {
      setSelectedDayIndex(dayIndex || 0);
    }
    // expand the relevant chapter
    setExpanded({ [`ch-${chapterId}`]: true });
  }, [currentIndex, flattenedActivities, planType]);

  function handleDayChange(e) {
    const val = Number(e.target.value);
    setSelectedDayIndex(val);
    setExpanded({});
  }

  // For displaying total day time + progress
  // (If you have a real “minutesSpent” or “progress” from Redux, you can incorporate it here.)
  function renderDayStats(session) {
    const totalMinutes = session.activities?.reduce((acc, x) => acc + (x.timeNeeded || 0), 0) || 0;
    const totalTimeStr = formatMinutes(totalMinutes);

    // Example “progress” placeholder
    const userProgress = 40; // or compute real usage / total
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

  // if planType="book" => single session
  if (planType === "book") {
    const singleSession = sessions[0] || {};
    const { activities = [] } = singleSession;
    return (
      <Box sx={containerSx}>
        {renderTopRow("book")}
        {!isCollapsed && (
          <>
            {renderDayStats(singleSession)}
            <Box sx={{ flex: 1, overflowY: "auto" }}>
              <MasterList
                activities={activities}
                currentIndex={currentIndex}
                onSelectAct={(idx) => dispatch(setCurrentIndex(idx))}
                expanded={expanded}
                onToggleExpand={(k) => setExpanded(toggleKey(expanded, k))}
              />
            </Box>
          </>
        )}
      </Box>
    );
  }

  // else => "adaptive" => multiple days
  const currentSession = sessions[selectedDayIndex] || {};
  const { activities = [] } = currentSession;

  return (
    <Box sx={containerSx}>
      {renderTopRow("adaptive")}
      {!isCollapsed && (
        <>
          {renderDayStats(currentSession)}
          <Box sx={{ flex: 1, overflowY: "auto" }}>
            <MasterList
              activities={activities}
              currentIndex={currentIndex}
              onSelectAct={(idx) => dispatch(setCurrentIndex(idx))}
              expanded={expanded}
              onToggleExpand={(k) => setExpanded(toggleKey(expanded, k))}
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

        {/* If not collapsed and planType is adaptive => show day selector */}
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

/**
 * MasterList
 * ----------
 * This wraps:
 *   1) "Global" or "Cumulative" activities that have no chapter or 
 *      are quizStage like "cumulativequiz"/"cumulativerevision"
 *   2) Normal chapter-based activities (rendered via ChapterList).
 */
function MasterList({
  activities,
  currentIndex,
  onSelectAct,
  expanded,
  onToggleExpand,
}) {
  // PARTITION the activities into "global" vs. "chapter-based"
  const globalActivities = [];
  const chapterBased = [];

  for (const act of activities) {
    // Identify condition(s) for "global/cumulative" vs normal
    const quizStageLower = (act.quizStage || "").toLowerCase();
    const isCumulative =
      quizStageLower === "cumulativequiz" ||
      quizStageLower === "cumulativerevision";

    if (!act.chapterId || isCumulative) {
      globalActivities.push(act);
    } else {
      chapterBased.push(act);
    }
  }

  return (
    <List dense sx={{ p: 0 }}>
      {/* 1) Render global/cumulative items first */}
      {globalActivities.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="subtitle1"
            sx={{ color: "#fff", fontSize: "0.8rem", ml: 1, mb: 0.5 }}
          >
            Global Activities
          </Typography>

          <List dense sx={{ p: 0, ml: 1 }}>
            {globalActivities.map((act) => {
              const isSelected = act.flatIndex === currentIndex;
              const { bgColor, textColor } = getActivityStyle(isSelected);
              // Construct a label
              let label = act.quizStage
                ? `Cumulative (${act.quizStage})`
                : "Global Activity";
              if (label.toLowerCase().includes("cumulativerevision")) {
                label = "Cumulative Revision";
              } else if (label.toLowerCase().includes("cumulativequiz")) {
                label = "Cumulative Quiz";
              }

              return (
                <ListItemButton
                  key={act.flatIndex}
                  sx={{
                    ...listItemButtonSx,
                    bgcolor: bgColor,
                    color: textColor,
                    mb: 0.4,
                  }}
                  onClick={() => onSelectAct(act.flatIndex)}
                >
                  <TruncateTooltip text={label} sx={{ fontSize: "0.75rem" }} />
                  {act.timeNeeded && <TimePill minutes={act.timeNeeded} />}
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      )}

      {/* 2) Now render the normal chapters */}
      <ChapterList
        activities={chapterBased}
        currentIndex={currentIndex}
        onSelectAct={onSelectAct}
        expanded={expanded}
        onToggleExpand={onToggleExpand}
      />
    </List>
  );
}

/** Renders a list of chapters with collapsible blocks. Each sub-chapter => single line. */
function ChapterList({
  activities,
  currentIndex,
  onSelectAct,
  expanded,
  onToggleExpand,
}) {
  // group by chapter
  const chMap = new Map();
  for (const act of activities) {
    const cId = act.chapterId || "_noChap";
    if (!chMap.has(cId)) {
      chMap.set(cId, {
        chapterId: cId,
        chapterName: act.chapterName || cId,
        items: [],
      });
    }
    chMap.get(cId).items.push(act);
  }

  const chapters = [...chMap.values()];

  return (
    <List dense sx={{ p: 0 }}>
      {chapters.map((ch) => {
        const chKey = `ch-${ch.chapterId}`;
        const isOpen = expanded[chKey] === true;
        // total time for the entire chapter
        const chTime = ch.items.reduce((acc, x) => acc + (x.timeNeeded || 0), 0);

        return (
          <Box key={ch.chapterId} sx={{ mb: 1 }}>
            <ListItemButton
              sx={listItemButtonSx}
              onClick={() => onToggleExpand(chKey)}
            >
              {parseTitlePill(ch.chapterName, "#EC407A")}
              {/* 
                Show chapter time only if collapsed.
                If expanded, we hide the time to show 
                it's "broken down" by sub-items.
              */}
              {!isOpen && <TimePill minutes={chTime} />}

              {isOpen ? (
                <ExpandLessIcon sx={{ fontSize: "1rem", ml: 0.5 }} />
              ) : (
                <ExpandMoreIcon sx={{ fontSize: "1rem", ml: 0.5 }} />
              )}
            </ListItemButton>

            <Collapse in={isOpen} timeout="auto" unmountOnExit>
              <List dense sx={{ p: 0, ml: 2 }}>
                {/* sub-ch lines => each activity is its own line */}
                {renderSubChLines(ch.items, currentIndex, onSelectAct)}
              </List>
            </Collapse>
          </Box>
        );
      })}
    </List>
  );
}

/** 
 * Each sub-ch activity => 1 line
 *  e.g.  "1. Some SubCh   [Reading or Understand or Apply etc.]   [5m]"
 */
function renderSubChLines(subChActivities, currentIndex, onSelectAct) {
  // We'll just map them directly
  return subChActivities.map((act, idx) => {
    const isSelected = act.flatIndex === currentIndex;
    const { bgColor, textColor } = getActivityStyle(isSelected);
    const subName = act.subChapterName || `SubCh(${act.subChapterId})`;

    let stageLabel = "Reading";
    if (act.type === "QUIZ") {
      if (act.quizStage) {
        stageLabel =
          act.quizStage.charAt(0).toUpperCase() + act.quizStage.slice(1);
      } else {
        stageLabel = "Quiz";
      }
    }
    const timeNeeded = act.timeNeeded || 0;

    return (
      <ListItemButton
        key={`${act.flatIndex}-${idx}`}
        onClick={() => onSelectAct && onSelectAct(act.flatIndex)}
        sx={{
          ...listItemButtonSx,
          bgcolor: bgColor,
          color: textColor,
          mb: 0.4,
        }}
      >
        {/* left: subCh index + name pill */}
        {parseTitlePill(subName, "#7E57C2")}

        {/* center: stage label */}
        <Typography sx={{ fontSize: "0.7rem", ml: 1 }}>
          {stageLabel}
        </Typography>

        {/* right: time pill */}
        <TimePill minutes={timeNeeded} />
      </ListItemButton>
    );
  });
}

/** Toggle a key in expanded object */
function toggleKey(expandedObj, key) {
  const newObj = { ...expandedObj };
  if (newObj[key]) {
    delete newObj[key];
  } else {
    newObj[key] = true;
  }
  return newObj;
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
  py: 0.4,
  px: 0.5,
  "&:hover": { bgcolor: "#444" },
  display: "flex",
  alignItems: "center",
  overflow: "hidden",
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