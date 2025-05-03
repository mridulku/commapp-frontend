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
  CircularProgress,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import LockIcon from "@mui/icons-material/Lock";
import axios from "axios";

/**
 * DayProgressCircle
 * -----------------
 * shows a 28-px ring that fills to `pct` and prints the % inside.
 * Uses MUI <CircularProgress variant="determinate">.
 */
function DayProgressCircle({ pct = 0 }) {
  return (
    <Box sx={{ position: "relative", width: 28, height: 28 }}>
      <CircularProgress
        variant="determinate"
        value={pct}
        size={28}
        thickness={4}
        sx={{
          color: "#66BB6A",
          bgcolor: "#333",
          borderRadius: "50%",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography
          variant="caption"
          sx={{ fontSize: "0.55rem", color: "#fff", fontWeight: 600 }}
        >
          {pct}%
        </Typography>
      </Box>
    </Box>
  );
}

// ============= Helpers =============
function getStageNumberAndLabel(act) {
  const lowerType = (act.type || "").toLowerCase();
  if (lowerType === "read") {
    return "Stage 1: Reading";
  }

  const stageMap = {
    remember: 2,
    understand: 3,
    apply: 4,
    analyze: 5,
  };
  const sKey = (act.quizStage || "").toLowerCase();
  const number = stageMap[sKey] || 0;
  if (!number) {
    return "Quiz"; // fallback if unknown
  }
  const label = sKey.charAt(0).toUpperCase() + sKey.slice(1);
  return `Stage ${number}: ${label}`;
}

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
        pointerEvents: "none",
      }}
    >
      <LockIcon sx={{ color: "#fff", opacity: 0.8, fontSize: 30 }} />
    </Box>
  );
}

function aggregatorTaskPill(taskLabel) {
  return (
    <Box
      sx={{
        mt: 0.5,
        px: 0.8,
        py: 0.3,
        borderRadius: "0.2rem",
        fontSize: "0.7rem",
        bgcolor: "#FFA726",
        color: "#000",
      }}
    >
      {taskLabel}
    </Box>
  );
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

function completionStatusPill(completed) {
  // We'll no longer treat "deferred" as 'done'. We just show a pill if completed===true
  if (!completed) return null;
  return (
    <Box
      sx={{
        mt: 0.5,
        px: 0.8,
        py: 0.3,
        borderRadius: "0.2rem",
        fontSize: "0.7rem",
        bgcolor: "#66BB6A",
        color: "#000",
      }}
    >
      Complete
    </Box>
  );
}

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
 * Compute mastery fraction => passCount / totalConcepts
 */
function computeMasteryFraction(allAttemptsConceptStats) {
  const passedSet = new Set();
  const conceptSet = new Set();
  allAttemptsConceptStats.forEach((att) => {
    (att.conceptStats || []).forEach((cs) => {
      conceptSet.add(cs.conceptName);
      if (cs.passOrFail === "PASS") {
        passedSet.add(cs.conceptName);
      }
    });
  });
  const total = conceptSet.size;
  if (total === 0) return 0;
  const passCount = passedSet.size;
  return passCount / total;
}

// -------------- Subcomponent => mastery bar --------------
function SmallMasteryBar({ fraction }) {
  const pct = Math.round(fraction * 100);
  return (
    <Box sx={{ mt: 1, width: "100%" }}>
      <Box
        sx={{
          position: "relative",
          height: "6px",
          bgcolor: "#444",
          borderRadius: "3px",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: `${pct}%`,
            bgcolor: "#66BB6A",
          }}
        />
      </Box>
      <Typography variant="caption" sx={{ color: "#ccc" }}>
        {pct}%
      </Typography>
    </Box>
  );
}

/**
 * For non-reading quiz => fetch aggregator => parse mastery fraction
 * If completed === true => skip aggregator => full 1.0
 * If reading => skip aggregator => 0 if not completed
 */
function ActivityItem({
  act,
  isSelected,
  onSelectAct,
}) {
  const { bgColor, textColor } = getActivityStyle(isSelected);

  const aggregatorStatus = (act.aggregatorStatus || "").toLowerCase();
  const aggregatorTask = act.aggregatorTask || "";

  // completed => if act.completed===true => show pill
  const completedPill = completionStatusPill(act.completed);

  // Show aggregatorTask only if type!=="read"
  let aggregatorTaskNode = null;
  if ((act.type || "").toLowerCase() !== "read" && aggregatorTask) {
    aggregatorTaskNode = aggregatorTaskPill(aggregatorTask);
  }

  let lockedOverlay = null;
  if (aggregatorStatus === "locked") {
    lockedOverlay = aggregatorLockedOverlay();
  }

  // If quiz & not completed => aggregator mastery => local fetch
  // If completed => we show full 100% => skip aggregator call
  // If read & not completed => 0 => skip aggregator call
  return (
    <Box
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
          bgcolor: bgColor,
          color: textColor,
          minHeight: 0,
          py: 1,
          px: 1,
          "&:hover": { bgcolor: "#444" },
        }}
        onClick={() => onSelectAct(act.flatIndex)}
      >
        {/* Basic text */}
        <TruncateTooltip
          text={`Chapter: ${act.chapterName || "No Chapter"}`}
          sx={{ fontSize: "0.8rem", fontWeight: 600 }}
        />
        <TruncateTooltip
          text={`Subchapter: ${act.subChapterName || "No Subchapter"}`}
          sx={{ fontSize: "0.75rem", mt: 0.5 }}
        />
        <TruncateTooltip
          text={getStageNumberAndLabel(act)}
          sx={{ fontSize: "0.75rem", mt: 0.5 }}
        />

        {/* aggregator task pill */}
        {aggregatorTaskNode && <Box sx={{ mt: 0.5 }}>{aggregatorTaskNode}</Box>}

        {/* completed pill */}
        {completedPill && <Box sx={{ mt: 0.5 }}>{completedPill}</Box>}

        {/* Time pill */}
        <TimePill minutes={act.timeNeeded || 0} />

        {/* Mastery bar if quiz & not completed */}
        {(act.type || "").toLowerCase() === "quiz" && !act.completed && (
          <QuizMasteryWidget
            subChapterId={act.subChapterId}
            quizStage={act.quizStage}
          />
        )}
      </ListItemButton>

      {/* locked overlay */}
      {lockedOverlay}
    </Box>
  );
}

/**
 * If the user hasn't completed the quiz, fetch aggregator => 
 * parse quizStagesData[quizStage].allAttemptsConceptStats => compute fraction => show bar
 */
function QuizMasteryWidget({ subChapterId, quizStage }) {
  const plan = useSelector((state) => state.plan.planDoc);
  const userId = plan?.userId || "";    // adjust if your userId is stored differently
  const planId = plan?.id || plan?.planId || "";

  const [fraction, setFraction] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancel = false;
    if (!subChapterId || !quizStage || !planId || !userId) {
      setLoading(false);
      setFraction(0);
      return;
    }

    async function doFetch() {
      try {
        setLoading(true);
        setError("");
        const resp = await axios.get("http://localhost:3001/subchapter-status", {
          params: { userId, planId, subchapterId: subChapterId },
        });
        if (cancel) return;
        const data = resp.data || {};
        const stageObj = data.quizStagesData?.[quizStage] || {};
        const allStats = stageObj.allAttemptsConceptStats || [];
        const frac = computeMasteryFraction(allStats);
        setFraction(frac);
      } catch (err) {
        console.error("QuizMasteryWidget => aggregator error:", err);
        if (!cancel) {
          setError("Aggregator error.");
        }
      } finally {
        if (!cancel) {
          setLoading(false);
        }
      }
    }
    doFetch();
    return () => {
      cancel = true;
    };
  }, [subChapterId, quizStage, planId, userId]);

  if (error) {
    return (
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" sx={{ color: "red" }}>
          {error}
        </Typography>
      </Box>
    );
  }
  if (loading) {
    return (
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" sx={{ color: "#ccc" }}>
          Loading aggregator...
        </Typography>
      </Box>
    );
  }

  return <SmallMasteryBar fraction={fraction} />;
}

// -------------- The activity list --------------
function ActivityList({ activities, currentIndex, onSelectAct }) {
  return (
    <List dense sx={{ p: 0 }}>
      {activities.map((act) => {
        const isSelected = act.flatIndex === currentIndex;
        return (
          <ActivityItem
            key={act.flatIndex}
            act={act}
            isSelected={isSelected}
            onSelectAct={onSelectAct}
          />
        );
      })}
    </List>
  );
}

/**
 * DayLevelProgress
 * ----------------
 * A subcomponent that calculates the day’s overall progress:
 *   - For each activity:
 *     - If completed===true => 1.0
 *     - else if quiz => aggregator mastery fraction
 *     - else => 0
 *   Summation / totalActivities => progressPct
 */
/**
 * useDayProgress(session)  → `%` integer 0-100
 * identical logic to previous DayLevelProgress but returns number.
 */
function useDayProgress(session) {
  const planDoc = useSelector((s) => s.plan.planDoc);
  const userId  = planDoc?.userId || "";
  const planId  = planDoc?.id || planDoc?.planId || "";

  const [pct, setPct] = useState(0);

  useEffect(() => {
    let cancel = false;
    async function calc() {
      if (!session?.activities?.length) { setPct(0); return; }

      const out = [];
      for (const a of session.activities) {
        if (a.completed) { out.push(1); continue; }
        if ((a.type || "").toLowerCase() === "quiz") {
          try {
            const r = await axios.get("http://localhost:3001/subchapter-status", {
              params: { userId, planId, subchapterId: a.subChapterId },
            });
            if (cancel) return;
            const stage = r.data?.quizStagesData?.[a.quizStage] || {};
            const frac  = computeMasteryFraction(stage.allAttemptsConceptStats || []);
            out.push(frac);
          } catch { out.push(0); }
        } else { out.push(0); }
      }
      if (!cancel) {
        const pctVal = Math.round(
          (out.reduce((s,x)=>s+x,0) / out.length) * 100
        );
        setPct(pctVal);
      }
    }
    calc();
    return () => { cancel = true; };
  }, [session, planId, userId]);

  return pct;
}

// ============= Main LeftPanel =============
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

  // Sync day with currentIndex
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

    // pick the session whose progress we want
  const sessionForProgress =
    planType === "book"
      ? sessions[0] || {}
      : sessions[selectedDayIndex] || {};

  // ★ call the hook every render, regardless of planType
  const dayProgressPct = useDayProgress(sessionForProgress);

  function renderTopRow(type) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
          height: 32,
        }}
      >
        {/* hamburger */}
        <IconButton
          size="small"
          onClick={onToggleCollapse}
          sx={{ color: "#fff" }}
        >
          <MenuIcon />
        </IconButton>
  
        {/* Day selector (only when not collapsed & adaptive) */}
        {!isCollapsed && type !== "book" && (
          <FormControl variant="standard" sx={{ minWidth: 60 }}>
            <Select
              value={selectedDayIndex}
              onChange={handleDayChange}
              disableUnderline
              sx={selectSx}
              MenuProps={{
                PaperProps: { sx: { bgcolor: "#222", color: "#fff" } },
              }}
            >
              {sessions.map((s, idx) => (
                <MenuItem key={idx} value={idx}>
                  Day&nbsp;{s.sessionLabel || idx + 1}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
  
        {/* compact progress dial */}
        {!isCollapsed && (
          <DayProgressCircle pct={dayProgressPct} />
        )}
      </Box>
    );
  }

  // For "book" plan
  if (planType === "book") {
    const singleSession = sessions[0] || {};
    const { activities = [] } = singleSession;
    return (
      <Box sx={containerSx}>
        {renderTopRow("book")}
        {!isCollapsed && (
          <>
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

  // For "adaptive"
  const currentSession = sessions[selectedDayIndex] || {};
  const { activities = [] } = currentSession;

  return (
    <Box sx={containerSx}>
      {renderTopRow("adaptive")}
      {!isCollapsed && (
        <>
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