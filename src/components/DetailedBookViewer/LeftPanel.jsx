// UpdatedLeftPanel.jsx
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentIndex } from "./store/planSlice";
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
} from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/KeyboardArrowUp";
import ExpandMoreIcon from "@mui/icons-material/KeyboardArrowDown";

/**
 * If selected => highlight in red (#EF5350).
 * Otherwise => medium gray (#555).
 */
function getActivityStyle(type, isSelected) {
  if (isSelected) {
    return { bgColor: "#EF5350", textColor: "#fff" };
  }
  return { bgColor: "#555", textColor: "#fff" };
}

/**
 * A small pill that displays time in minutes, e.g. "5m".
 * Usually placed on the right side (chapters/sub-ch).
 */
function TimePill({ minutes = 0 }) {
  return (
    <Box sx={timePillSx}>
      {minutes}m
    </Box>
  );
}

/**
 * TruncateTooltip => show text truncated with an ellipsis, plus a tooltip on hover.
 */
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
 * parseTitlePill => extracts a leading digit (if present), e.g. "1. Intro"
 * and places it in a small colored box. The rest is truncated text.
 */
function parseTitlePill(fullTitle, level) {
  const splitted = fullTitle.split(".");
  let indexToken = splitted[0];
  let restName = fullTitle;

  if (/^\d+$/.test(indexToken.trim())) {
    restName = fullTitle.substring(indexToken.length + 1).trim();
  } else {
    indexToken = "";
  }

  let pillBg = "#EC407A"; // default for chapters
  if (level === "subchapter") pillBg = "#7E57C2";
  if (level === "book") pillBg = "#AB47BC";

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
            bgcolor: pillBg,
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

/**
 * LeftPanel
 * ---------
 * - Occupies full height of the parent (height: "100%")
 * - Has a small row for day selection if planType="adaptive"
 * - Then a scrollable area for the chapters (flex:1, overflowY:"auto")
 * - Hides book level if only one book
 * - Time pill on the right side for chapters/sub-ch
 * - Activities have time pill at the far right
 * - Selected activity is highlighted in red
 */
export default function LeftPanel() {
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

  // Whenever currentIndex changes => auto-expand chain
  useEffect(() => {
    if (!flattenedActivities?.length) return;
    if (currentIndex < 0 || currentIndex >= flattenedActivities.length) return;

    const currentAct = flattenedActivities[currentIndex];
    const { dayIndex, bookId, chapterId, subChapterId } = currentAct || {};

    if (planType !== "book") {
      setSelectedDayIndex(dayIndex || 0);
    }
    const newExpanded = buildChain(dayIndex, bookId, chapterId, subChapterId);
    setExpanded(newExpanded);
  }, [currentIndex, flattenedActivities, planType]);

  // Day selection
  function handleDayChange(e) {
    const val = Number(e.target.value);
    setSelectedDayIndex(val);
    setExpanded({ [`day-${val}`]: true });
  }

  // Expand/collapse toggling
  function handleToggleExpand(key, allActs) {
    const isOpen = expanded[key] === true;
    if (isOpen) {
      const nextExpanded = { ...expanded };
      collapseNodeAndChildren(key, nextExpanded, allActs);
      setExpanded(nextExpanded);
    } else {
      // open + chain
      const nextExpanded = {};
      const dayKey = `day-${selectedDayIndex}`;
      nextExpanded[dayKey] = true;

      if (key.startsWith("book-")) {
        nextExpanded[key] = true;
      } else if (key.startsWith("ch-")) {
        nextExpanded[dayKey] = true;
        nextExpanded[key] = true;
        const parentBookKey = findParentBookKey(key, allActs);
        if (parentBookKey) nextExpanded[parentBookKey] = true;
      } else if (key.startsWith("subch-")) {
        nextExpanded[dayKey] = true;
        nextExpanded[key] = true;
        const { parentBookKey, parentChapterKey } = findParentBookChKey(
          key,
          allActs
        );
        if (parentBookKey) nextExpanded[parentBookKey] = true;
        if (parentChapterKey) nextExpanded[parentChapterKey] = true;
      }
      setExpanded(nextExpanded);
    }
  }

  // If planType="book", skip day selection
  if (planType === "book") {
    const singleSession = sessions[0] || {};
    const { activities = [] } = singleSession;
    return (
      <Box sx={containerSx}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
          <Typography sx={titleSx}>Book Plan</Typography>
        </Box>
        {/* Scrollable area for the chapters */}
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          <BookPlanView
            activities={activities}
            currentIndex={currentIndex}
            onSelectActivity={(idx) => dispatch(setCurrentIndex(idx))}
            expanded={expanded}
            onToggleExpand={handleToggleExpand}
          />
        </Box>
      </Box>
    );
  }

  // "adaptive"
  const currentSession = sessions[selectedDayIndex] || {};
  const { activities = [] } = currentSession;

  return (
    <Box sx={containerSx}>
      {/* Day dropdown row */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
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

      {/* Scrollable list */}
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        <BookPlanView
          activities={activities}
          currentIndex={currentIndex}
          onSelectActivity={(idx) => dispatch(setCurrentIndex(idx))}
          expanded={expanded}
          onToggleExpand={handleToggleExpand}
        />
      </Box>
    </Box>
  );
}

/**
 * BookPlanView => group by book => chapters => subchap => activities
 * If only 1 book => skip that level
 */
function BookPlanView({
  activities,
  currentIndex,
  onSelectActivity,
  expanded,
  onToggleExpand,
}) {
  // Group by book
  const bookMap = new Map();
  for (const a of activities) {
    const bId = a.bookId || "_noBook";
    if (!bookMap.has(bId)) {
      bookMap.set(bId, { bookId: bId, bookName: a.bookName || bId, items: [] });
    }
    bookMap.get(bId).items.push(a);
  }
  const books = [...bookMap.values()];

  // If only 1 book => skip the book level
  if (books.length === 1) {
    return (
      <List sx={{ p: 0 }} dense>
        {renderChapters(
          books[0].items,
          currentIndex,
          onSelectActivity,
          expanded,
          onToggleExpand
        )}
      </List>
    );
  }

  return (
    <List sx={{ p: 0 }} dense>
      {books.map((bk) => {
        const bkKey = `book-${bk.bookId}`;
        const isBookOpen = expanded[bkKey] === true;
        const totalTime = bk.items.reduce((acc, x) => acc + (x.timeNeeded || 0), 0);

        return (
          <Box key={bk.bookId} sx={{ mb: 1 }}>
            <ListItemButton
              sx={listItemButtonSx}
              onClick={() => onToggleExpand(bkKey, activities)}
            >
              {parseTitlePill(bk.bookName, "book")}
              <TimePill minutes={totalTime} />
              {isBookOpen ? (
                <ExpandLessIcon sx={{ fontSize: "1rem", ml: 0.5 }} />
              ) : (
                <ExpandMoreIcon sx={{ fontSize: "1rem", ml: 0.5 }} />
              )}
            </ListItemButton>

            <Collapse in={isBookOpen} timeout="auto" unmountOnExit>
              {renderChapters(
                bk.items,
                currentIndex,
                onSelectActivity,
                expanded,
                onToggleExpand
              )}
            </Collapse>
          </Box>
        );
      })}
    </List>
  );
}

/**
 * Renders chapters => subCh => final activities
 */
function renderChapters(
  activities,
  currentIndex,
  onSelectActivity,
  expanded,
  onToggleExpand
) {
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

  return chapters.map((ch) => {
    const chKey = `ch-${ch.chapterId}`;
    const isChOpen = expanded[chKey] === true;
    const totalTime = ch.items.reduce((acc, x) => acc + (x.timeNeeded || 0), 0);

    return (
      <Box key={ch.chapterId} sx={{ mb: 0.8 }}>
        <ListItemButton
          sx={listItemButtonSx}
          onClick={() => onToggleExpand(chKey, activities)}
        >
          {parseTitlePill(ch.chapterName, "chapter")}
          <TimePill minutes={totalTime} />
          {isChOpen ? (
            <ExpandLessIcon sx={{ fontSize: "1rem", ml: 0.5 }} />
          ) : (
            <ExpandMoreIcon sx={{ fontSize: "1rem", ml: 0.5 }} />
          )}
        </ListItemButton>

        <Collapse in={isChOpen} timeout="auto" unmountOnExit>
          {renderSubChapters(
            ch.items,
            currentIndex,
            onSelectActivity,
            expanded,
            onToggleExpand
          )}
        </Collapse>
      </Box>
    );
  });
}

/**
 * Renders subCh => final activities
 */
function renderSubChapters(
  activities,
  currentIndex,
  onSelectActivity,
  expanded,
  onToggleExpand
) {
  const sbMap = new Map();
  for (const act of activities) {
    const sbId = act.subChapterId || "_noSub";
    if (!sbMap.has(sbId)) {
      sbMap.set(sbId, {
        subChapterId: sbId,
        subChapterName: act.subChapterName || sbId,
        items: [],
      });
    }
    sbMap.get(sbId).items.push(act);
  }
  const subs = [...sbMap.values()];

  return subs.map((sb) => {
    const sbKey = `subch-${sb.subChapterId}`;
    const isSbOpen = expanded[sbKey] === true;
    const sbTime = sb.items.reduce((acc, x) => acc + (x.timeNeeded || 0), 0);

    return (
      <Box key={sb.subChapterId} sx={{ mb: 0.8 }}>
        <ListItemButton
          sx={listItemButtonSx}
          onClick={() => onToggleExpand(sbKey, activities)}
        >
          {parseTitlePill(sb.subChapterName, "subchapter")}
          <TimePill minutes={sbTime} />
          {isSbOpen ? (
            <ExpandLessIcon sx={{ fontSize: "1rem", ml: 0.5 }} />
          ) : (
            <ExpandMoreIcon sx={{ fontSize: "1rem", ml: 0.5 }} />
          )}
        </ListItemButton>

        <Collapse in={isSbOpen} timeout="auto" unmountOnExit>
          <List dense sx={{ p: 0 }}>
            {sb.items.map((act) => {
              const isSelected = act.flatIndex === currentIndex;
              const { bgColor, textColor } = getActivityStyle(
                act.type,
                isSelected
              );
              const timeNeeded = act.timeNeeded || 0;

              return (
                <ListItemButton
                  key={act.flatIndex}
                  onClick={() => onSelectActivity && onSelectActivity(act.flatIndex)}
                  sx={{
                    ...listItemButtonSx,
                    mb: 0.4,
                    bgcolor: bgColor,
                    color: textColor,
                  }}
                >
                  {/* final activities => time pill on the rightmost side */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      flex: 1,
                      overflow: "hidden",
                      minWidth: 0,
                    }}
                  >
                    <TruncateTooltip
                      text={`${act.type}: ${act.subChapterName}`}
                      sx={{ fontSize: "0.7rem", flex: 1 }}
                    />
                  </Box>
                  <TimePill minutes={timeNeeded} />
                </ListItemButton>
              );
            })}
          </List>
        </Collapse>
      </Box>
    );
  });
}

/* ---------------------- Expansion Helpers ---------------------- */
function buildChain(dayIndex, bookId, chapterId, subChId) {
  const obj = {};
  if (typeof dayIndex === "number") obj[`day-${dayIndex}`] = true;
  if (bookId) obj[`book-${bookId}`] = true;
  if (chapterId) obj[`ch-${chapterId}`] = true;
  if (subChId) obj[`subch-${subChId}`] = true;
  return obj;
}

function collapseNodeAndChildren(key, expandedObj, allActs) {
  if (expandedObj[key]) {
    delete expandedObj[key];
  }
  if (key.startsWith("ch-")) {
    const chId = key.substring(3);
    allActs.forEach((act) => {
      if (act.chapterId === chId && act.subChapterId) {
        delete expandedObj[`subch-${act.subChapterId}`];
      }
    });
  } else if (key.startsWith("book-")) {
    const bookId = key.substring(5);
    allActs.forEach((act) => {
      if (act.bookId === bookId) {
        if (act.chapterId) delete expandedObj[`ch-${act.chapterId}`];
        if (act.subChapterId) delete expandedObj[`subch-${act.subChapterId}`];
      }
    });
  } else if (key.startsWith("day-")) {
    const dayIdx = Number(key.substring(4));
    allActs.forEach((act) => {
      if (act.dayIndex === dayIdx) {
        if (act.bookId) delete expandedObj[`book-${act.bookId}`];
        if (act.chapterId) delete expandedObj[`ch-${act.chapterId}`];
        if (act.subChapterId) delete expandedObj[`subch-${act.subChapterId}`];
      }
    });
  }
}

function findParentBookKey(chKey, allActs) {
  const chId = chKey.substring(3);
  const item = allActs.find((a) => a.chapterId === chId);
  return item?.bookId ? `book-${item.bookId}` : null;
}

function findParentBookChKey(subchKey, allActs) {
  const subId = subchKey.substring(6);
  const item = allActs.find((a) => a.subChapterId === subId);
  if (!item) return {};
  const parentBookKey = item.bookId ? `book-${item.bookId}` : null;
  const parentChapterKey = item.chapterId ? `ch-${item.chapterId}` : null;
  return { parentBookKey, parentChapterKey };
}

/* ---------------------- STYLES ---------------------- */
const containerSx = {
  width: 300,
  minWidth: 250,
  // Occupy the full parent's height so it won't shrink
  height: "100%",
  bgcolor: "#1A1A1A",
  color: "#fff",
  display: "flex",
  flexDirection: "column",
  p: 1,
  boxSizing: "border-box",
};

const titleSx = {
  fontSize: "0.85rem",
  fontWeight: 600,
  textAlign: "center",
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

const listItemButtonSx = {
  minHeight: 0,
  py: 0.4,
  px: 0.5,
  "&:hover": { bgcolor: "#444" },
  display: "flex",
  alignItems: "center",
  // so text can truncate
  overflow: "hidden",
};

const timePillSx = {
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
};