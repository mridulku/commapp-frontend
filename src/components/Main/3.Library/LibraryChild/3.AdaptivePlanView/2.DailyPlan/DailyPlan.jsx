// File: DailyPlan.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentIndex } from "../../../../../../store/planSlice";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  List,
  ListItemButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";

// (Optional) MUI icons
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";

/** 
 * Format N seconds => "Xm Ys"
 */
function formatSeconds(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}m ${s}s`;
}

/** 
 * If aggregatorStatus === "locked", show overlay
 */
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
 * Pill => small stylized label
 */
function Pill({
  text,
  bgColor = "#424242",
  textColor = "#fff",
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
 * Return an English label for activity’s stage
 */
function getStageLabel(act) {
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
      return "Stage ?, Quiz";
  }
}

/**
 * Decide which "Reading"/"Remember"/"Understand"/"Apply"/"Analyze" to look for in taskInfo
 */
function getTaskInfoStageLabel(act) {
  if ((act.type || "").toLowerCase() === "read") {
    return "Reading";
  }
  const stage = (act.quizStage || "").toLowerCase();
  switch (stage) {
    case "remember":
      return "Remember";
    case "understand":
      return "Understand";
    case "apply":
      return "Apply";
    case "analyze":
      return "Analyze";
    default:
      return "Quiz";
  }
}

/**
 * ActivityList
 * ------------
 * The row 2 logic:
 *  - If completionStatus === "complete" => single "Complete" pill + time
 *  - Else if locked => "Locked" + time
 *  - Else if completionStatus === "deferred" => "Deferred" + time, show nextTask
 *  - Else if timeSpent>0 => "WIP" + time, show nextTask
 *  - Else => "Not Started" + time, show nextTask
 */
function ActivityList({
  dayActivities,
  currentIndex,
  onClickActivity,
  timeMap,
  subchapterStatusMap
}) {
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugTitle, setDebugTitle] = useState("");
  const [debugData, setDebugData] = useState(null);

  function handleOpenDebug(subChId, activity) {
    const data = subchapterStatusMap[subChId] || null;
    setDebugTitle(`Debug for subCh='${subChId}' type='${activity.type}'`);
    setDebugData(data);
    setDebugOpen(true);
  }
  function handleCloseDebug() {
    setDebugOpen(false);
    setDebugTitle("");
    setDebugData(null);
  }

  return (
    <>
      <List dense sx={{ p: 0 }}>
        {dayActivities.map((act) => {
          const isSelected = act.flatIndex === currentIndex;
          const cardBg = isSelected ? "#EF5350" : "#555";
          const aggregatorLocked = (act.aggregatorStatus || "").toLowerCase() === "locked";

          // Stage label => might be displayed above
          const stageLabel = getStageLabel(act);
          // timeNeeded => "5m" if any
          const timeNeeded = act.timeNeeded !== undefined
            ? `${act.timeNeeded}m`
            : null;

          // Real time from getActivityTime
          const activityTime = timeMap[act.activityId] || 0;

          // subchapter-status => read `locked`, `nextTaskLabel`, etc.
          let lockedFromAPI = false;
          let nextTaskLabel = "";
          let subChCompleteStatus = "not-started";
          // Look up the correct "stage" from the new subchapter-status
          const subChId = act.subChapterId || "";
          const statusObj = subchapterStatusMap[subChId] || null;
          if (statusObj && Array.isArray(statusObj.taskInfo)) {
            const desiredLabel = getTaskInfoStageLabel(act);
            const found = statusObj.taskInfo.find(
              (ti) => (ti.stageLabel || "").toLowerCase() === desiredLabel.toLowerCase()
            );
            if (found) {
              lockedFromAPI = !!found.locked;
              nextTaskLabel = found.nextTaskLabel || "";
              subChCompleteStatus = found.status || "not-started"; 
              // e.g. "done", "in-progress", "not-started"
            }
          }

          // Also the plan doc has completionStatus => "complete"/"deferred"/...
          const planCompletion = (act.completionStatus || "").toLowerCase();

          // Decide final label for the status pill
          // If plan says "complete" => ignore locked, show "Complete"
          // If aggregator says locked => show "Locked"
          // Else if plan says "deferred" => "Deferred"
          // Else if activityTime>0 => "WIP"
          // else => "Not Started"
          let finalStatusLabel = "";
          let finalStatusColor = "#BDBDBD"; // default for WIP
          let skipNext = false;

          if (planCompletion === "complete") {
            finalStatusLabel = "Complete";
            finalStatusColor = "#66BB6A";
            skipNext = true;
          } else if (lockedFromAPI) {
            finalStatusLabel = "Locked";
            finalStatusColor = "#EF5350"; // or something
            skipNext = true;
          } else if (planCompletion === "deferred") {
            finalStatusLabel = "Deferred";
            finalStatusColor = "#FFA726";
            skipNext = false; // user said if locked or complete => skip next, but not for deferred
          } else {
            // not complete, not locked, not deferred
            if (activityTime > 0) {
              finalStatusLabel = "WIP";
              finalStatusColor = "#BDBDBD";
            } else {
              finalStatusLabel = "Not Started";
              finalStatusColor = "#EF5350";
            }
            skipNext = false;
          }

          // We always display the time next to final status
          const timePill = (
            <Pill text={formatSeconds(activityTime)} bgColor="#424242" textColor="#fff" />
          );

          // Next Task => skip if skipNext===true
          let nextTaskPill = null;
          if (!skipNext && nextTaskLabel) {
            nextTaskPill = (
              <Pill text={`Next: ${nextTaskLabel}`} bgColor="#FFD700" textColor="#000" />
            );
          }

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
                {/* Row 1 => ChapterName, SubchapterName, Stage */}
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, width: "100%" }}>
                  {/* Remove aggregatorTask => user requested that. */}
                  <Pill text={act.chapterName || "Chapter ?"} />
                  <Pill text={act.subChapterName || "Subchapter ?"} />
                  <Pill text={stageLabel} />
                </Box>

                {/* Row 2 => timeNeeded, debug button, final status + time pill, nextTask if any */}
                <Box sx={{ display: "flex", width: "100%", mt: 0.5, alignItems: "center", gap: 1 }}>
                  {/* If timeNeeded => show it */}
                  {timeNeeded && <Pill text={timeNeeded} />}

                  {/* The debug button => subchapter-status raw JSON */}
                  <button
                    style={{
                      backgroundColor:"#666",
                      color:"#fff",
                      border:"none",
                      borderRadius:"4px",
                      padding:"4px 8px",
                      cursor:"pointer",
                      fontSize:"0.8rem"
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDebug(subChId, act);
                    }}
                  >
                    i
                  </button>

                  {/* final status pill + time pill */}
                  <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
                    <Pill text={finalStatusLabel} bgColor={finalStatusColor} textColor="#000" />
                    {timePill}
                    {/* If not skipNext => show nextTask */}
                    {nextTaskPill}
                  </Box>
                </Box>
              </ListItemButton>

              {aggregatorLocked && aggregatorLockedOverlay()}
            </Box>
          );
        })}
      </List>

      {/* Debug modal => raw JSON from subchapterStatusMap */}
      <Dialog
        open={debugOpen}
        onClose={handleCloseDebug}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>{debugTitle}</DialogTitle>
        <DialogContent sx={{ backgroundColor:"#222" }}>
          {debugData ? (
            <pre style={{ color:"#0f0", fontSize:"0.85rem", whiteSpace:"pre-wrap" }}>
              {JSON.stringify(debugData, null, 2)}
            </pre>
          ) : (
            <p style={{ color:"#fff" }}>No data found.</p>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor:"#222" }}>
          <Button onClick={handleCloseDebug} variant="contained" color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/**
 * Main DailyPlan component
 */
export default function DailyPlan({
  userId,
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

  // We'll store fetched times in a map => { [activityId]: number }
  const [timeMap, setTimeMap] = useState({});

  // We'll also store subchapter-status in a map => { [subChapterId]: response JSON }
  const [subchapterStatusMap, setSubchapterStatusMap] = useState({});

  // Log out the activities on initial render
  useEffect(() => {
    console.log("DailyPlan => dayActivities =>", activities);
  }, [activities]);

  // 1) getActivityTime => time lumps
  useEffect(() => {
    async function fetchActivityTimes() {
      if (!activities.length) {
        setTimeMap({});
        return;
      }

      const newMap = {};
      for (const act of activities) {
        if (!act.activityId) {
          console.log("Skipping activity with no activityId:", act);
          continue;
        }

        const rawType = (act.type || "").toLowerCase();
        const type = rawType.includes("read") ? "read" : "quiz";

        try {
          const res = await axios.get("http://localhost:3001/api/getActivityTime", {
            params: {
              activityId: act.activityId,
              type,
            },
          });
          const totalTime = res.data?.totalTime || 0;
          newMap[act.activityId] = totalTime;
        } catch (err) {
          console.error("Error fetching time for", act.activityId, err);
        }
      }
      setTimeMap(newMap);
    }

    fetchActivityTimes();
  }, [activities]);

  // 2) subchapter-status => locked, nextTaskLabel, etc.
  useEffect(() => {
    async function fetchAllSubchapterStatus() {
      if (!activities.length) {
        setSubchapterStatusMap({});
        return;
      }

      const uniqueSubIds = new Set();
      for (const act of activities) {
        if (act.subChapterId) {
          uniqueSubIds.add(act.subChapterId);
        }
      }

      const newStatusMap = {};
      for (const subId of uniqueSubIds) {
        try {
          const res = await axios.get("http://localhost:3001/subchapter-status", {
            params: {
              userId,
              planId,
              subchapterId: subId,
            },
          });
          newStatusMap[subId] = res.data;
        } catch (err) {
          console.error("Error fetching subchapter-status for", subId, err);
        }
      }
      setSubchapterStatusMap(newStatusMap);
    }

    fetchAllSubchapterStatus();
  }, [activities, planId]);

  function handleClickActivity(act) {
    dispatch(setCurrentIndex(act.flatIndex));
    if (onOpenPlanFetcher) {
      onOpenPlanFetcher(planId, act);
    }
  }

  return (
    <div style={{ marginTop: "1rem" }}>
      {/* Day dropdown */}
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

      {/* ActivityList */}
      <ActivityList
        dayActivities={activities}
        currentIndex={currentIndex}
        onClickActivity={handleClickActivity}
        timeMap={timeMap}
        subchapterStatusMap={subchapterStatusMap}
      />
    </div>
  );
}