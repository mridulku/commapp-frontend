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
import LockIcon from "@mui/icons-material/Lock";

// ============== Utility functions ==============
function parseCreatedAt(plan) {
  // If your plan doc has plan.createdAt as a Firestore Timestamp or ISO string:
  if (!plan?.createdAt) {
    return dateOnly(new Date()); // fallback to today's date
  }

  // If Firestore timestamp => { _seconds, ... } or { seconds, ... }
  if (plan.createdAt._seconds) {
    return dateOnly(new Date(plan.createdAt._seconds * 1000));
  } else if (plan.createdAt.seconds) {
    return dateOnly(new Date(plan.createdAt.seconds * 1000));
  } else {
    // else assume it's a date-string
    return dateOnly(new Date(plan.createdAt));
  }
}

function DayProgressBar({ activities }) {
  // Count how many are complete or deferred => doneCount
  const total = activities.length;
  let doneCount = 0;
  activities.forEach((act) => {
    const cs = (act.completionStatus || "").toLowerCase();
    if (cs === "complete" || cs === "deferred") {
      doneCount++;
    }
  });

  const progressPct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <Box sx={{ display: "flex", alignItems: "center", ml: "auto", flex: 1 }}>
      {/* The progress bar container */}
      <Box
        sx={{
          position: "relative",
          flex: 1,
          height: 8,
          bgcolor: "#444",
          borderRadius: "4px",
          overflow: "hidden",
          mr: 1,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: `${progressPct}%`,
            bgcolor: "#66BB6A",
            borderRadius: "4px",
          }}
        />
      </Box>
      {/* The label => "42%" etc. */}
      <Typography variant="body2" sx={{ fontSize: "0.75rem", color: "#fff" }}>
        {progressPct}%
      </Typography>
    </Box>
  );
}

/** Returns a Date object with hours/minutes/seconds zeroed out for "date-only" comparison */
function dateOnly(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Offsets a date by N days, returning a date-only result. */
function addDays(baseDate, daysOffset) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + daysOffset);
  return dateOnly(d);
}

/** Formats the date as e.g. "Apr 8, 2025" (no time). */
function formatDate(d) {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Utility: Format N seconds => "Xm Ys" */
function formatSeconds(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}m ${s}s`;
}

/** A small "pill" component */
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
        pointerEvents: "auto",
        ...sx,
      }}
    >
      {text}
    </Box>
  );
}

/** aggregatorLocked => overlay if aggregator says locked */
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

/** e.g. "Stage 1, Reading" or "Stage 2, Remember" */
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

/** aggregator => "Reading","Remember","Understand","Apply","Analyze" */
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

/** Example: Summation of quiz + revision attempts => "X tasks done" */
function getTasksDoneCount(subchapterStatusMap, subChId, stageLower) {
  const hist = subchapterStatusMap[subChId]?.history?.[stageLower];
  if (!hist) return 0;
  const quizArr = hist.quizAttempts || [];
  const revArr = hist.revisionAttempts || [];
  return quizArr.length + revArr.length;
}

/** Example: Mastery% from aggregator => "50%" */
function getMasteryPct(subchapterStatusMap, subChId, stageLower) {
  const hist = subchapterStatusMap[subChId]?.history?.[stageLower];
  if (!hist || !hist.masteryPct) return 0;
  return hist.masteryPct;
}

/**
 * ActivityList
 * ------------
 * The main list of subchapter tasks for the day
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
  // 1) Old aggregator debug
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugTitle, setDebugTitle] = useState("");
  const [debugData, setDebugData] = useState(null);

  // 2) subchapter-history debug
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyTitle, setHistoryTitle] = useState("");
  const [historyData, setHistoryData] = useState(null);

  // 3) "Previous" smaller modal
  const [prevModalOpen, setPrevModalOpen] = useState(false);
  const [prevModalTitle, setPrevModalTitle] = useState("");
  const [prevModalItems, setPrevModalItems] = useState([]);

  // 4) "Progress" modal => mastery
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressTitle, setProgressTitle] = useState("");
  const [progressData, setProgressData] = useState(null);

  // (NEW) => "Time Detail"
  const [timeDetailOpen, setTimeDetailOpen] = useState(false);
  const [timeDetailTitle, setTimeDetailTitle] = useState("");
  const [timeDetailData, setTimeDetailData] = useState([]);

  /** aggregator debug => old subchapterStatus */
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

  /** subchapter-history => entire JSON debug */
  async function handleOpenHistoryDebug(subChId) {
    try {
      setHistoryTitle(`(New) Subchapter-History => subChId='${subChId}'`);
      const res = await axios.get("http://localhost:3001/subchapter-history", {
        params: { userId, planId, subchapterId: subChId },
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

  /** "Previous" => show quiz + revision attempts in chronological order */
  async function handleOpenPrevious(subChId, activity) {
    try {
      const stage = (activity.quizStage || "").toLowerCase();
      const res = await axios.get("http://localhost:3001/subchapter-history", {
        params: { userId, planId, subchapterId: subChId },
      });
      const historyObj = res.data?.history?.[stage];
      if (!historyObj) {
        setPrevModalTitle(`Previous Attempts => subCh='${subChId}', stage='${stage}'`);
        setPrevModalItems(["No history found for this stage."]);
        setPrevModalOpen(true);
        return;
      }
      const quizArr = historyObj.quizAttempts || [];
      const revArr = historyObj.revisionAttempts || [];

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

      // sort by timestamp
      combined.sort((a, b) => {
        const aMs = toMillis(a.ts);
        const bMs = toMillis(b.ts);
        if (aMs !== bMs) return aMs - bMs;
        return (a.attemptNumber || 0) - (b.attemptNumber || 0);
      });

      const lines = combined.length
        ? combined.map((item) => {
            const dateStr = item.ts
              ? new Date(item.ts._seconds * 1000).toLocaleString()
              : "(no time)";
            if (item.type === "quiz") {
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

  /** "Progress" => mastery details */
  async function handleOpenProgress(subChId, stageLower) {
    try {
      setProgressTitle(`Progress => subCh='${subChId}', stage='${stageLower}'`);
      const res = await axios.get("http://localhost:3001/subchapter-history", {
        params: { userId, planId, subchapterId: subChId },
      });
      const stgData = res.data?.history?.[stageLower] || {};
      setProgressData(stgData);
    } catch (err) {
      console.error("handleOpenProgress => error:", err);
      setProgressData({ error: err.message });
    } finally {
      setProgressOpen(true);
    }
  }
  function handleCloseProgress() {
    setProgressOpen(false);
    setProgressTitle("");
    setProgressData(null);
  }

  /** (NEW) Time detail => doc-level breakdown */
  async function handleOpenTimeDetail(activityId, type) {
    try {
      setTimeDetailTitle(`Time Breakdown => activityId='${activityId}'`);
      const res = await axios.get("http://localhost:3001/api/getActivityTime", {
        params: { activityId, type },
      });
      setTimeDetailData(res.data?.details || []);
    } catch (err) {
      console.error("handleOpenTimeDetail => error:", err);
      setTimeDetailData([{ error: err.message }]);
    } finally {
      setTimeDetailOpen(true);
    }
  }
  function handleCloseTimeDetail() {
    setTimeDetailOpen(false);
    setTimeDetailTitle("");
    setTimeDetailData([]);
  }

  return (
    <>
      <List dense sx={{ p: 0 }}>
        {dayActivities.map((act) => {
          const isSelected = act.flatIndex === currentIndex;
          const cardBg = isSelected ? "#EF5350" : "#555";

          const aggregatorLocked = (act.aggregatorStatus || "").toLowerCase() === "locked";
          const stageLabel = getStageLabel(act);

          // time tracking => lumpsSec from timeMap
          const lumpsSec = timeMap[act.activityId] || 0;
          const lumpsStr = formatSeconds(lumpsSec);
          const timeNeededVal = act.timeNeeded !== undefined ? `${act.timeNeeded}m` : null;

          // aggregator subchapterStatus
          const subChId = act.subChapterId || "";
          let lockedFromAPI = false;
          let nextTaskLabel = "";
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

          // plan completion => final status
          const planCompletion = (act.completionStatus || "").toLowerCase();
          let finalStatusLabel = "Not Started";
          let finalStatusColor = "#EF5350";

          if (planCompletion === "complete") {
            finalStatusLabel = "Complete";
            finalStatusColor = "#66BB6A";
          } else if (lockedFromAPI) {
            finalStatusLabel = (
              <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                <LockIcon sx={{ fontSize: "0.9rem" }} />
                Locked
              </Box>
            );
            finalStatusColor = "#9E9E9E";
          } else if (planCompletion === "deferred") {
            finalStatusLabel = "Deferred";
            finalStatusColor = "#FFA726";
          } else if (lumpsSec > 0) {
            // user started
            finalStatusLabel = "WIP";
            finalStatusColor = "#BDBDBD";
          }

          const stageLower = (act.quizStage || "").toLowerCase();
          const isQuizStage = ["remember", "understand", "apply", "analyze"].includes(stageLower);

          // tasks done + mastery if quiz
          let tasksDonePill = null;
          let masteryPill = null;
          if (isQuizStage) {
            const doneCount = getTasksDoneCount(subchapterStatusMap, subChId, stageLower);
            tasksDonePill = (
              <Pill
                text={`${doneCount} tasks done`}
                bgColor="#444"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenPrevious(subChId, act);
                }}
              />
            );

            const masteryPct = getMasteryPct(subchapterStatusMap, subChId, stageLower);
            const masteryLabel = `${masteryPct.toFixed(0)}%`;
            masteryPill = (
              <Pill
                text={masteryLabel}
                bgColor="#4CAF50"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenProgress(subChId, stageLower);
                }}
              />
            );
          }

          // The type => "read" or "quiz" for doc-level breakdown
          const rawType = (act.type || "").toLowerCase().includes("read") ? "read" : "quiz";

          // time pill => e.g. "Elapsed: 3m 10s / Expected: 5m"
          let timePill;
          if (timeNeededVal) {
            const tooltipText = `Elapsed: ${lumpsStr}, Expected: ${timeNeededVal}`;
            timePill = (
              <Tooltip title={tooltipText}>
                <Pill
                  text={
                    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                      <AccessTimeIcon sx={{ fontSize: "0.9rem" }} />
                      {lumpsStr} / {timeNeededVal}
                    </Box>
                  }
                  bgColor="#424242"
                  textColor="#fff"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenTimeDetail(act.activityId, rawType);
                  }}
                />
              </Tooltip>
            );
          } else {
            const tooltipText = `Elapsed: ${lumpsStr}`;
            timePill = (
              <Tooltip title={tooltipText}>
                <Pill
                  text={
                    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                      <AccessTimeIcon sx={{ fontSize: "0.9rem" }} />
                      {lumpsStr}
                    </Box>
                  }
                  bgColor="#424242"
                  textColor="#fff"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenTimeDetail(act.activityId, rawType);
                  }}
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
                {/* Row 1 => Chapter/Subchapter/Stage */}
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, width: "100%" }}>
                  <Pill text={act.chapterName || "Chapter ?"} />
                  <Pill text={act.subChapterName || "Subchapter ?"} />
                  <Pill text={stageLabel} />
                </Box>

                {/* Row 2 => [i], [History], [tasksDone], [mastery], far right => finalStatus + time */}
                <Box sx={{ display: "flex", width: "100%", mt: 0.5, alignItems: "center", gap: 1 }}>
                  {/* aggregator debug => i */}
                  <Pill
                    text="i"
                    bgColor="#666"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDebug(subChId, act);
                    }}
                  />

                  <Pill
                    text="History"
                    bgColor="#999"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenHistoryDebug(subChId);
                    }}
                  />

                  {tasksDonePill}
                  {masteryPill}

                  {/* final status + time => far right */}
                  <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
                    <Pill text={finalStatusLabel} bgColor={finalStatusColor} textColor="#000" />
                    {timePill}
                  </Box>
                </Box>
              </ListItemButton>

              {aggregatorLocked && aggregatorLockedOverlay()}
            </Box>
          );
        })}
      </List>

      {/* aggregator debug */}
      <Dialog open={debugOpen} onClose={handleCloseDebug} fullWidth maxWidth="md">
        <DialogTitle>{debugTitle}</DialogTitle>
        <DialogContent sx={{ backgroundColor: "#222" }}>
          {debugData ? (
            <pre style={{ color: "#0f0", fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>
              {JSON.stringify(debugData, null, 2)}
            </pre>
          ) : (
            <p style={{ color: "#fff" }}>No data found.</p>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: "#222" }}>
          <Button onClick={handleCloseDebug} variant="contained" color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* subchapter-history debug */}
      <Dialog open={historyOpen} onClose={handleCloseHistory} fullWidth maxWidth="md">
        <DialogTitle>{historyTitle}</DialogTitle>
        <DialogContent sx={{ backgroundColor: "#222" }}>
          {historyData ? (
            <pre style={{ color: "#0f0", fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>
              {JSON.stringify(historyData, null, 2)}
            </pre>
          ) : (
            <p style={{ color: "#fff" }}>No history data found.</p>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: "#222" }}>
          <Button onClick={handleCloseHistory} variant="contained" color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* "Previous" => tasks done list */}
      <Dialog open={prevModalOpen} onClose={handleClosePrevious} fullWidth maxWidth="sm">
        <DialogTitle>{prevModalTitle}</DialogTitle>
        <DialogContent sx={{ backgroundColor: "#222" }}>
          {prevModalItems && prevModalItems.length > 0 ? (
            <ul style={{ color: "#0f0", fontSize: "0.85rem" }}>
              {prevModalItems.map((line, idx) => (
                <li key={idx} style={{ marginBottom: "0.4rem" }}>
                  {line}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: "#fff" }}>No data found.</p>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: "#222" }}>
          <Button onClick={handleClosePrevious} variant="contained" color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* "Progress" => mastery details */}
      <Dialog open={progressOpen} onClose={handleCloseProgress} fullWidth maxWidth="sm">
        <DialogTitle>{progressTitle}</DialogTitle>
        <DialogContent sx={{ backgroundColor: "#222", color: "#fff" }}>
          {progressData && !progressData.error ? (
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Mastery: <strong>{(progressData.masteryPct || 0).toFixed(2)}%</strong>
              </Typography>
              {Array.isArray(progressData.conceptMastery) && progressData.conceptMastery.length > 0 ? (
                <ul style={{ paddingLeft: "1.25rem" }}>
                  {progressData.conceptMastery.map((cObj, idx) => (
                    <li key={idx} style={{ marginBottom: "0.4rem" }}>
                      <strong>{cObj.conceptName}</strong>:
                      &nbsp;{cObj.passOrFail === "PASS" ? `PASS (on quiz attempt #${cObj.passAttempt})` : "FAIL"}
                      &nbsp;({((cObj.ratio || 0) * 100).toFixed(0)}%)
                    </li>
                  ))}
                </ul>
              ) : (
                <Typography variant="body2">No concept data found.</Typography>
              )}
            </Box>
          ) : (
            <p style={{ color: "#f88" }}>
              {progressData?.error || "No progress data found."}
            </p>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: "#222" }}>
          <Button onClick={handleCloseProgress} variant="contained" color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Time Detail => doc-level breakdown */}
      <Dialog open={timeDetailOpen} onClose={handleCloseTimeDetail} fullWidth maxWidth="md">
        <DialogTitle>{timeDetailTitle}</DialogTitle>
        <DialogContent sx={{ backgroundColor: "#222", color: "#fff" }}>
          {timeDetailData && timeDetailData.length > 0 ? (
            <ul style={{ color: "#0f0", fontSize: "0.85rem" }}>
              {timeDetailData.map((item, idx) => {
                const lumpsCount = item.lumps?.length || 0;
                return (
                  <li key={idx} style={{ marginBottom: "0.6rem" }}>
                    <p>
                      <strong>DocID:</strong> {item.docId} <br />
                      <strong>Collection:</strong> {item.collection} <br />
                      <strong>TotalSeconds:</strong> {item.totalSeconds}
                    </p>
                    {lumpsCount > 0 && (
                      <ul>
                        {item.lumps.map((lump, i2) => (
                          <li key={i2}>
                            Lump #{i2 + 1}: {JSON.stringify(lump)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>No detailed docs found.</p>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: "#222" }}>
          <Button onClick={handleCloseTimeDetail} variant="contained" color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function toMillis(ts) {
  if (!ts) return 0;
  if (ts.seconds) return ts.seconds * 1000;
  if (ts._seconds) return ts._seconds * 1000;
  return 0;
}

// ============== Main DailyPlan Component =============

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
  const sessions = plan.sessions;

  // 1) We’ll store the dayIndex here. If dayDropIdx is controlled by parent, that’s fine.
  //    If you want to internally override it, you can do so in a useEffect.
  //    For now, we’ll assume you’re controlling it from outside => we rely on dayDropIdx.

  // (A) We'll parse plan.createdAt => baseDate
  const createdAtDate = parseCreatedAt(plan);
  const today = dateOnly(new Date());
  
  // sessions.map => for each sessionLabel = N
  // dayDate = createdAtDate + (N - 1) days
  // if dayDate === today => label "Today (Apr 8, 2025)"
  // else => "Day N (Apr 8, 2025)"
  const dayLabels = sessions.map((sess) => {
    const sNum = Number(sess.sessionLabel); // 1,2,3...
    const dayDate = addDays(createdAtDate, sNum - 1);
    const dayDateStr = formatDate(dayDate);
  
    // compare dayDate with today
    if (dayDate.getTime() === today.getTime()) {
      return `Today (${dayDateStr})`;
    }
  
    return `Day ${sNum} (${dayDateStr})`;
  });

  // (C) We'll compute a "defaultDayIndex" that ensures:
  //   - if today < first day => day 0
  //   - if today > last day => last day
  //   - else => whichever day matches "today"
  // But in your code, you have dayDropIdx from the parent. We'll see if you want to override it.

  // Let's do a small effect that sets dayDropIdx if needed:
  useEffect(() => {
    // Identify the first day date => createdAtDate
    // last day date => createdAtDate + (sessions.length - 1)
    const firstDayDate = addDays(createdAtDate, 0);
    const lastDayDate = addDays(createdAtDate, sessions.length - 1);
  
    // If today < firstDay => pick dayIndex=0
    if (today < firstDayDate) {
      onDaySelect(0);
      return;
    }
  
    // If today > lastDay => pick dayIndex = sessions.length-1
    if (today > lastDayDate) {
      onDaySelect(sessions.length - 1);
      return;
    }
  
    // else "today" is within [firstDay, lastDay]
    // so find the day offset
    const daysDiff = (today.getTime() - firstDayDate.getTime()) / (1000 * 60 * 60 * 24);
    // daysDiff => 0 => day1, 1 => day2, etc.
    const exactIdx = Math.floor(daysDiff); // e.g. if daysDiff=2 => dayIndex=2 => sessionLabel=3
    if (exactIdx < 0) {
      onDaySelect(0);
    } else if (exactIdx >= sessions.length) {
      onDaySelect(sessions.length - 1);
    } else {
      onDaySelect(exactIdx);
    }
  }, [planId, sessions]);
  // 2) The current day => sessions[dayDropIdx]
  let safeIdx = dayDropIdx;
  if (safeIdx < 0) safeIdx = 0;
  if (safeIdx >= sessions.length) safeIdx = sessions.length - 1;

  const currentSession = sessions[safeIdx] || {};
  const { activities = [] } = currentSession;

  const [timeMap, setTimeMap] = useState({});
  const [subchapterStatusMap, setSubchapterStatusMap] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("DailyPlan => dayActivities =>", activities);
  }, [activities]);

  // ============= Fetch times + subchapter-status for this day's activities =============
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

        // 1) fetch times
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

        // 2) fetch aggregator subchapter-status
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
          fetchStatusPromise,
        ]);

        if (!cancel) {
          setTimeMap(finalTimeMap);
          setSubchapterStatusMap(finalStatusMap);
        }
      } catch (err) {
        console.error("Error in doFetch dailyplan =>", err);
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
  }, [activities, planId, userId]);

  // 3) onClickActivity => setCurrentIndex => open PlanFetcher
  function handleClickActivity(act) {
    dispatch(setCurrentIndex(act.flatIndex));
    if (onOpenPlanFetcher) {
      onOpenPlanFetcher(planId, act);
    }
  }

  if (loading) {
    return (
      <div style={{ color: "#fff", marginTop: "1rem" }}>
        <h2>Loading daily plan...</h2>
      </div>
    );
  }

  // ============= Render =============
  return (
    <div style={{ marginTop: "1rem" }}>
      {/* Row with day dropdown + progress bar */}
      <Box sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
        <Typography
          variant="body2"
          sx={{ fontSize: "0.85rem", color: colorScheme.textColor || "#FFD700" }}
        >
          Day:
        </Typography>

        <Select
          value={safeIdx}
          onChange={(e) => onDaySelect(Number(e.target.value))}
          sx={{
            minWidth: 180,
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
          {sessions.map((sess, idx) => (
            <MenuItem key={sess.sessionLabel} value={idx}>
              {dayLabels[idx]}
            </MenuItem>
          ))}
        </Select>

        {/* Here is the progress bar filling remaining space */}
        <DayProgressBar activities={activities} />
      </Box>

      {/* Activities list */}
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

/**
 * Return difference in days (day2 - day1) ignoring time of day
 */
function diffInDays(date1, date2) {
  // we want date2 - date1 => how many days from date1 to date2
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  const diffMs = d2 - d1;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}