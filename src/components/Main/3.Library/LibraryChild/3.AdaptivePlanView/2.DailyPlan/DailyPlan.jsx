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
  Tooltip,
} from "@mui/material";

// Icons
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import LockIcon from "@mui/icons-material/Lock";

/** Format N seconds => "Xm Ys" */
function formatSeconds(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}m ${s}s`;
}

/** If aggregatorStatus === "locked", show overlay. */
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

/** A small stylized label ("pill") */
function Pill({
  text,
  bgColor = "#424242",
  textColor = "#fff",
  sx = {},
  onClick,
}) {
  return (
    <Box
      onClick={onClick}
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
        cursor: onClick ? "pointer" : "default",
        pointerEvents: "auto", // important for clickable elements in a bigger button
        ...sx,
      }}
    >
      {text}
    </Box>
  );
}

/** Return e.g. "Stage 1, Reading" or "Stage 2, Remember" */
function getStageLabel(act) {
  if ((act.type || "").toLowerCase() === "read") {
    return "Stage 1, Reading";
  }
  const st = (act.quizStage || "").toLowerCase();
  switch (st) {
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

/** subchapter-status => "Reading","Remember","Understand","Apply","Analyze" */
function getTaskInfoStageLabel(act) {
  if ((act.type || "").toLowerCase() === "read") {
    return "Reading";
  }
  const st = (act.quizStage || "").toLowerCase();
  switch (st) {
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
 * Adds a new "Previous" pill that opens a small modal with prior attempts
 */
function ActivityList({
  dayActivities,
  currentIndex,
  onClickActivity,
  timeMap,
  subchapterStatusMap,
  userId,
  planId,
}) {
  // 1) Old subchapter-status debug modal
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugTitle, setDebugTitle] = useState("");
  const [debugData, setDebugData] = useState(null);

  // 2) New subchapter-history debug modal
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTitle, setHistoryTitle] = useState("");
  const [historyData, setHistoryData] = useState(null);

  // 3) "Previous" smaller modal
  const [prevModalOpen, setPrevModalOpen] = useState(false);
  const [prevModalTitle, setPrevModalTitle] = useState("");
  const [prevModalItems, setPrevModalItems] = useState([]); // array of strings or objects?

  // Show old subchapter-status
  function handleOpenDebug(subChId, activity) {
    const data = subchapterStatusMap[subChId] || null;
    setDebugTitle(`(Old) Subchapter-Status => subChId='${subChId}' type='${activity.type}'`);
    setDebugData(data);
    setDebugOpen(true);
  }
  function handleCloseDebug() {
    setDebugOpen(false);
    setDebugTitle("");
    setDebugData(null);
  }

  // Show entire subchapter-history JSON
  async function handleOpenHistoryDebug(subChId) {
    try {
      setHistoryTitle(`(New) Subchapter-History => subChId='${subChId}'`);
      const res = await axios.get("http://localhost:3001/subchapter-history", {
        params: {
          userId,
          planId,
          subchapterId: subChId,
        },
      });
      setHistoryData(res.data);
    } catch (err) {
      console.error("handleOpenHistory => error:", err);
      setHistoryData({ error: err.message });
    } finally {
      setHistoryOpen(true);
    }
  }
  function handleCloseHistory() {
    setHistoryOpen(false);
    setHistoryTitle("");
    setHistoryData(null);
  }

  // "Previous" => open smaller modal with prior attempts
  async function handleOpenPrevious(subChId, activity) {
    try {
      // e.stopPropagation() is called outside
      // We'll fetch subchapter-history => parse prior attempts
      const stage = (activity.quizStage || "").toLowerCase();
      const res = await axios.get("http://localhost:3001/subchapter-history", {
        params: {
          userId,
          planId,
          subchapterId: subChId,
        },
      });

      const historyObj = res.data?.history?.[stage];
      if (!historyObj) {
        setPrevModalTitle(`Previous Attempts => subCh='${subChId}', stage='${stage}'`);
        setPrevModalItems(["No history found for this stage."]);
        setPrevModalOpen(true);
        return;
      }
      // combine quiz + revision attempts => sort
      const quizArr = historyObj.quizAttempts || [];
      const revArr  = historyObj.revisionAttempts || [];

      const combined = [];
      quizArr.forEach((q) => {
        combined.push({
          type: "quiz",
          attemptNumber: q.attemptNumber || 1,
          score: String(q.score || ""),
          ts: q.timestamp || null,
        });
      });
      revArr.forEach((r) => {
        combined.push({
          type: "revision",
          attemptNumber: r.revisionNumber || 1,
          score: "",
          ts: r.timestamp || null,
        });
      });

      combined.sort((a,b) => {
        const aMs = toMillis(a.ts), bMs = toMillis(b.ts);
        if (aMs !== bMs) return aMs - bMs;
        return (a.attemptNumber||0) - (b.attemptNumber||0);
      });

      const lines = combined.length
        ? combined.map((item) => {
            const dateStr = item.ts
              ? new Date(item.ts._seconds * 1000).toLocaleString()
              : "(no time)";
            if (item.type==="quiz") {
              return `Quiz${item.attemptNumber} => Score=${item.score}, ${dateStr}`;
            } else {
              return `Revision${item.attemptNumber} => ${dateStr}`;
            }
          })
        : ["No prior attempts found."];

      setPrevModalTitle(`Previous Attempts => subCh='${subChId}', stage='${stage}'`);
      setPrevModalItems(lines);
      setPrevModalOpen(true);
    } catch (err) {
      console.error("handleOpenPrevious => error:", err);
      setPrevModalTitle("Error fetching previous attempts");
      setPrevModalItems([`Error: ${err.message}`]);
      setPrevModalOpen(true);
    }
  }
  function handleClosePrevious() {
    setPrevModalOpen(false);
    setPrevModalTitle("");
    setPrevModalItems([]);
  }

  return (
    <>
      <List dense sx={{ p: 0 }}>
        {dayActivities.map((act) => {
          const isSelected = act.flatIndex === currentIndex;
          const cardBg = isSelected ? "#EF5350" : "#555";
          const aggregatorLocked = (act.aggregatorStatus || "").toLowerCase() === "locked";

          // Stage label
          const stageLabel = getStageLabel(act);

          // lumps => from aggregator
          const lumpsTime = timeMap[act.activityId] || 0;
          // timeNeeded => "5m"
          const timeNeededVal = act.timeNeeded !== undefined
            ? `${act.timeNeeded}m`
            : null;

          // aggregator => locked? nextTask
          let lockedFromAPI = false;
          let nextTaskLabel = "";
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
            }
          }

          // plan doc => complete/deferred
          const planCompletion = (act.completionStatus || "").toLowerCase();

          // final status => "Complete","Locked","Deferred","WIP","Not Started"
          let finalStatusLabel;
          let finalStatusColor = "#BDBDBD";
          let skipNext = false;

          if (planCompletion === "complete") {
            finalStatusLabel = "Complete";
            finalStatusColor = "#66BB6A";
            skipNext = true;
          } else if (lockedFromAPI) {
            finalStatusLabel = (
              <Box sx={{ display:"inline-flex", alignItems:"center", gap:0.5 }}>
                <LockIcon sx={{ fontSize:"0.9rem" }} />
                Locked
              </Box>
            );
            finalStatusColor = "#9E9E9E"; 
            skipNext = true;
          } else if (planCompletion === "deferred") {
            finalStatusLabel = "Deferred";
            finalStatusColor = "#FFA726";
            skipNext = false;
          } else {
            if (lumpsTime > 0) {
              finalStatusLabel = "WIP";
              finalStatusColor = "#BDBDBD";
            } else {
              finalStatusLabel = "Not Started";
              finalStatusColor = "#EF5350";
            }
            skipNext = false;
          }

          // lumps pill => e.g. "3m"
          const lumpsPill = (
            <Pill text={formatSeconds(lumpsTime)} bgColor="#424242" textColor="#fff" />
          );

          // If we do have a nextTask => we might show "Previous" (for quiz) + "Next"
          let previousPill = null;
          let nextTaskPill = null;

          if (!skipNext && nextTaskLabel) {
            // only if it's a quiz activity => we show the "Previous" pill
            if ((act.type || "").toLowerCase() === "quiz") {
              previousPill = (
                <Pill
                  text="Previous"
                  bgColor="#444"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenPrevious(subChId, act);
                  }}
                />
              );
            }

            nextTaskPill = (
              <Tooltip title={`Next Activity`}>
                <Pill
                  text={
                    <Box sx={{ display:"inline-flex", alignItems:"center", gap: 0.5 }}>
                      <ArrowForwardIosIcon sx={{ fontSize:"0.9rem" }} />
                      {nextTaskLabel}
                    </Box>
                  }
                  bgColor="#FFD700"
                  textColor="#000"
                />
              </Tooltip>
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
                  <Pill text={act.chapterName || "Chapter ?"} />
                  <Pill text={act.subChapterName || "Subchapter ?"} />
                  <Pill text={stageLabel} />
                </Box>

                {/* Row 2 => [i], [History], [timeNeeded], [Previous], [Next], far right => final status + lumps */}
                <Box sx={{ display: "flex", width: "100%", mt: 0.5, alignItems: "center", gap: 1 }}>
                  {/* "i" => old subchapter-status */}
                  <Pill
                    text="i"
                    bgColor="#666"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDebug(subChId, act);
                    }}
                  />

                  {/* "History" => new subchapter-history JSON debug */}
                  <Pill
                    text="History"
                    bgColor="#999"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenHistoryDebug(subChId);
                    }}
                  />

                  {/* timeNeeded => with clock icon => user hover => "Expected Time" */}
                  {timeNeededVal && (
                    <Tooltip title="Expected Time">
                      <Pill
                        text={(
                          <Box sx={{ display:"inline-flex", alignItems:"center", gap: 0.5 }}>
                            <AccessTimeIcon sx={{ fontSize:"0.9rem" }} />
                            {timeNeededVal}
                          </Box>
                        )}
                        bgColor="#424242"
                        textColor="#fff"
                      />
                    </Tooltip>
                  )}

                  {/* "Previous" => small modal with prior attempts */}
                  {previousPill}
                  {/* "Next" => arrow */}
                  {nextTaskPill}

                  {/* far right => final status + lumps */}
                  <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
                    <Pill text={finalStatusLabel} bgColor={finalStatusColor} textColor="#000" />
                    {lumpsPill}
                  </Box>
                </Box>
              </ListItemButton>

              {aggregatorLocked && aggregatorLockedOverlay()}
            </Box>
          );
        })}
      </List>

      {/* 1) Old subchapter-status debug modal */}
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

      {/* 2) subchapter-history debug modal */}
      <Dialog
        open={historyOpen}
        onClose={handleCloseHistory}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>{historyTitle}</DialogTitle>
        <DialogContent sx={{ backgroundColor:"#222" }}>
          {historyData ? (
            <pre style={{ color:"#0f0", fontSize:"0.85rem", whiteSpace:"pre-wrap" }}>
              {JSON.stringify(historyData, null, 2)}
            </pre>
          ) : (
            <p style={{ color:"#fff" }}>No history data found.</p>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor:"#222" }}>
          <Button onClick={handleCloseHistory} variant="contained" color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* 3) "Previous" small modal => listing prior attempts */}
      <Dialog
        open={prevModalOpen}
        onClose={handleClosePrevious}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{prevModalTitle}</DialogTitle>
        <DialogContent sx={{ backgroundColor:"#222" }}>
          {prevModalItems && prevModalItems.length > 0 ? (
            <ul style={{ color:"#0f0", fontSize:"0.85rem" }}>
              {prevModalItems.map((line, idx) => (
                <li key={idx} style={{ marginBottom:"0.4rem" }}>
                  {line}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color:"#fff" }}>No data found.</p>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor:"#222" }}>
          <Button onClick={handleClosePrevious} variant="contained" color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/** convert Firestore timestamp => ms */
function toMillis(ts) {
  if (!ts) return 0;
  if (ts.seconds) return ts.seconds * 1000;
  if (ts._seconds) return ts._seconds * 1000;
  return 0;
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

  // figure out day
  const sessions = plan.sessions;
  let safeIdx = dayDropIdx;
  if (safeIdx >= sessions.length) safeIdx = 0;
  const currentSession = sessions[safeIdx] || {};
  const { activities = [] } = currentSession;

  // local => timeMap, subchapterStatusMap, loading
  const [timeMap, setTimeMap] = useState({});
  const [subchapterStatusMap, setSubchapterStatusMap] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("DailyPlan => dayActivities =>", activities);
  }, [activities]);

  // fetch times + subchapter statuses in parallel
  useEffect(() => {
    let cancel = false;
    if (!activities.length) {
      setTimeMap({});
      setSubchapterStatusMap({});
      return;
    }

    async function doFetch() {
      try {
        setLoading(true);

        // 1) times
        const fetchTimePromise = (async () => {
          const newMap = {};
          for (const act of activities) {
            if (!act.activityId) continue;
            const rawType = (act.type || "").toLowerCase();
            const type = rawType.includes("read") ? "read" : "quiz";
            try {
              const res = await axios.get("http://localhost:3001/api/getActivityTime", {
                params: { activityId: act.activityId, type },
              });
              const totalTime = res.data?.totalTime || 0;
              newMap[act.activityId] = totalTime;
            } catch (err) {
              console.error("Error fetching time for", act.activityId, err);
            }
          }
          return newMap;
        })();

        // 2) subchapter-status
        const fetchStatusPromise = (async () => {
          const uniqueSubIds = new Set();
          for (const act of activities) {
            if (act.subChapterId) uniqueSubIds.add(act.subChapterId);
          }
          const newStatusMap = {};
          for (const subId of uniqueSubIds) {
            try {
              const res = await axios.get("http://localhost:3001/subchapter-status", {
                params: { userId, planId, subchapterId: subId },
              });
              newStatusMap[subId] = res.data;
            } catch (err) {
              console.error("Error fetching subchapter-status for", subId, err);
            }
          }
          return newStatusMap;
        })();

        const [finalTimeMap, finalStatusMap] = await Promise.all([
          fetchTimePromise,
          fetchStatusPromise
        ]);

        if (cancel) return;
        setTimeMap(finalTimeMap);
        setSubchapterStatusMap(finalStatusMap);
      } catch (err) {
        console.error("Error in doFetch dailyplan =>", err);
      } finally {
        if (!cancel) {
          setLoading(false);
        }
      }
    }

    doFetch();
    return () => { cancel = true; };
  }, [activities, planId, userId]);

  // row click => pick activity
  function handleClickActivity(act) {
    dispatch(setCurrentIndex(act.flatIndex));
    if (onOpenPlanFetcher) {
      onOpenPlanFetcher(planId, act);
    }
  }

  if (loading) {
    return (
      <div style={{ color:"#fff", marginTop:"1rem" }}>
        <h2>Loading daily plan...</h2>
      </div>
    );
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

      <ActivityList
        dayActivities={activities}
        currentIndex={currentIndex}
        onClickActivity={handleClickActivity}
        timeMap={timeMap}
        subchapterStatusMap={subchapterStatusMap}
        userId={userId}
        planId={planId}
      />
    </div>
  );
}