// File: ActivityAccordion.jsx
import React, { useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

// optional overlay
import aggregatorLockedOverlay from "./aggregatorLockedOverlay"; 

// aggregator info panel => aggregator fields
import AggregatorInfoPanel from "./AggregatorInfoPanel";

/**
 * Helper to figure out the aggregator "stageKey"
 * e.g. reading => "reading"
 * or quiz => "remember","understand","apply","analyze"
 */
function getStageKey(activity) {
  const rawType = (activity.type || "").toLowerCase();
  if (rawType.includes("read")) return "reading";
  return (activity.quizStage || "").toLowerCase(); // "remember","understand","apply","analyze"
}

export default function ActivityAccordion({
  index,
  activity,
  timeMap,
  subchapterStatusMap,
  onClickActivity,

  // aggregator modals
  setDebugOpen,
  setDebugTitle,
  setDebugData,
  setHistoryOpen,
  setHistoryTitle,
  setHistoryData,
  setPrevModalOpen,
  setPrevModalTitle,
  setPrevModalItems,
  setProgressOpen,
  setProgressTitle,
  setProgressData,
  setTimeDetailOpen,
  setTimeDetailTitle,
  setTimeDetailData,

  // aggregator fetch logs
  timeFetchLogs,
  statusFetchLogs,
}) {
  // 1) aggregatorLocked => if aggregatorStatus says "locked"
  const aggregatorLocked = (activity.aggregatorStatus || "").toLowerCase() === "locked";
  const summaryLabel = `Activity #${index + 1} — ID: ${activity.activityId || "?"} (${activity.type})`;

  // 2) figure out "stageKey" => read or quiz stage
  const subChId = activity.subChapterId || "";
  const stageKey = getStageKey(activity);

  // 3) aggregator data => e.g. "quizStagesData[stageKey]" for quiz attempts
  const aggregatorObj = subchapterStatusMap[subChId] || {};
  const quizStagesData = aggregatorObj.quizStagesData || {};
  const stageData = quizStagesData[stageKey] || {}; 
  const { quizAttempts = [], revisionAttempts = [] } = stageData;

  // 4) A small modal to show the raw attempt data for Q1, Q2, R1, etc.
  const [attemptOpen, setAttemptOpen] = useState(false);
  const [attemptRawTitle, setAttemptRawTitle] = useState("");
  const [attemptRawData, setAttemptRawData] = useState(null);

  function handleOpenAttempt(attempt, isQuiz) {
    const prefix = isQuiz ? "Q" : "R";
    const num = isQuiz ? attempt.attemptNumber : attempt.revisionNumber || 1;
    setAttemptRawTitle(`${prefix}${num} => Raw Data`);
    setAttemptRawData(attempt);
    setAttemptOpen(true);
  }
  function handleCloseAttempt() {
    setAttemptOpen(false);
    setAttemptRawTitle("");
    setAttemptRawData(null);
  }

  return (
    <Box sx={{ position: "relative", mb: 1 }}>
      {aggregatorLocked && aggregatorLockedOverlay()}

      <Accordion
        sx={{
          backgroundColor: "#444",
          color: "#fff",
          border: "1px solid #666",
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#fff" }} />}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {summaryLabel}
          </Typography>
        </AccordionSummary>

        <AccordionDetails>
          {/* 1) Raw plan doc */}
          <Box sx={{ mb: 2, pl: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Plan Doc (Raw)
            </Typography>
            <Box sx={{ ml: 2 }}>
              <pre style={{ color: "#0f0", backgroundColor: "#222", padding: 8 }}>
                {JSON.stringify(activity, null, 2)}
              </pre>
            </Box>
          </Box>

          {/* 2) Aggregator Info => timeSpent, locked, final status, etc. */}
          <AggregatorInfoPanel
            activity={activity}
            timeMap={timeMap}
            subchapterStatusMap={subchapterStatusMap}
            // aggregator lumps doc-level
            setTimeDetailOpen={setTimeDetailOpen}
            setTimeDetailTitle={setTimeDetailTitle}
            setTimeDetailData={setTimeDetailData}

            // aggregator logs
            timeFetchLogs={timeFetchLogs}
            statusFetchLogs={statusFetchLogs}
          />

          {/* 3) QUIZ + REVISION ATTEMPTS => e.g. Q1, Q2,... R1, R2,... */}
          {(stageKey !== "reading") && (quizAttempts.length || revisionAttempts.length) > 0 && (
            <Box sx={{ mt: 2, pl: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Quiz & Revision Attempts
              </Typography>

              {/* QUIZ attempts => Q1, Q2, ... */}
              {quizAttempts.length > 0 && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Quiz Attempts:
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, ml: 1 }}>
                    {quizAttempts.map((q, idxQ) => {
                      const label = `Q${q.attemptNumber}`;
                      return (
                        <Box
                          key={idxQ}
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            backgroundColor: "#555",
                            px: 1,
                            py: 0.5,
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAttempt(q, true);
                          }}
                        >
                          <Typography variant="body2">
                            {label}
                          </Typography>
                          <InfoOutlinedIcon sx={{ fontSize: "1rem" }} />
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              )}

              {/* REVISION attempts => R1, R2, ... */}
              {revisionAttempts.length > 0 && (
                <Box sx={{ mb: 1 }}>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Revision Attempts:
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, ml: 1 }}>
                    {revisionAttempts.map((r, idxR) => {
                      const label = `R${r.revisionNumber || 1}`;
                      return (
                        <Box
                          key={idxR}
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            backgroundColor: "#555",
                            px: 1,
                            py: 0.5,
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAttempt(r, false);
                          }}
                        >
                          <Typography variant="body2">
                            {label}
                          </Typography>
                          <InfoOutlinedIcon sx={{ fontSize: "1rem" }} />
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {/* 4) PlanFetcher link */}
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="body2"
              sx={{ textDecoration: "underline", cursor: "pointer", color: "#ccc" }}
              onClick={(e) => {
                e.stopPropagation();
                onClickActivity(activity);
              }}
            >
              Open PlanFetcher for this Activity
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Attempt RAW data modal => show doc in JSON */}
      <Dialog open={attemptOpen} onClose={handleCloseAttempt} fullWidth maxWidth="md">
        <DialogTitle>{attemptRawTitle}</DialogTitle>
        <DialogContent sx={{ backgroundColor: "#222" }}>
          {attemptRawData ? (
            <pre style={{ color: "#0f0", fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>
              {JSON.stringify(attemptRawData, null, 2)}
            </pre>
          ) : (
            <p style={{ color: "#fff" }}>No data found.</p>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: "#222" }}>
          <Button onClick={handleCloseAttempt} variant="contained" color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}