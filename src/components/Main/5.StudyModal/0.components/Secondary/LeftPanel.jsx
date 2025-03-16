import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentIndex } from "../../0.store/planSlice";

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

  // if planType="book" => single session
  if (planType === "book") {
    const singleSession = sessions[0] || {};
    const { activities = [] } = singleSession;
    return (
      <Box sx={containerSx}>
        {renderTopRow()}
        {!isCollapsed && (
          <Box sx={{ flex: 1, overflowY: "auto" }}>
            <ChapterList
              activities={activities}
              currentIndex={currentIndex}
              onSelectAct={(idx) => dispatch(setCurrentIndex(idx))}
              expanded={expanded}
              onToggleExpand={(k) => setExpanded(toggleKey(expanded, k))}
            />
          </Box>
        )}
      </Box>
    );
  }

  // else => "adaptive" => multiple days
  const currentSession = sessions[selectedDayIndex] || {};
  const { activities = [] } = currentSession;

  return (
    <Box sx={containerSx}>
      {renderTopRow()}
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {!isCollapsed && (
          <ChapterList
            activities={activities}
            currentIndex={currentIndex}
            onSelectAct={(idx) => dispatch(setCurrentIndex(idx))}
            expanded={expanded}
            onToggleExpand={(k) => setExpanded(toggleKey(expanded, k))}
          />
        )}
      </Box>
    </Box>
  );

  function renderTopRow() {
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

        {!isCollapsed && planType !== "book" && (
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
        // total time
        const chTime = ch.items.reduce((acc, x) => acc + (x.timeNeeded || 0), 0);

        return (
          <Box key={ch.chapterId} sx={{ mb: 1 }}>
            <ListItemButton
              sx={listItemButtonSx}
              onClick={() => onToggleExpand(chKey)}
            >
              {parseTitlePill(ch.chapterName, "#EC407A")}
              <TimePill minutes={chTime} />
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
  // We'll group them by subChapter, but each activity => 1 line
  // If multiple "activities" for the same sub-ch happen, we show multiple lines.
  const lines = [];
  for (const act of subChActivities) {
    lines.push(act);
  }

  return lines.map((act, idx) => {
    const isSelected = act.flatIndex === currentIndex;
    const { bgColor, textColor } = getActivityStyle(isSelected);
    const subName = act.subChapterName || `SubCh(${act.subChapterId})`;
    // If type=READ => label "Reading"
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


