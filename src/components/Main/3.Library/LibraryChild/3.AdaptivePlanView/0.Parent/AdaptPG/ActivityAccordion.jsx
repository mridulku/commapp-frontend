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

import aggregatorLockedOverlay from "./aggregatorLockedOverlay"; 
import AggregatorInfoPanel from "./AggregatorInfoPanel";

/**
 * If activity.type includes 'read', we use 'reading', else quizStage => 'remember','understand','apply','analyze'
 */
function getStageKey(activity) {
  const rawType = (activity.type || "").toLowerCase();
  if (rawType.includes("read")) return "reading";
  return (activity.quizStage || "").toLowerCase();
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
  // aggregator logs
  timeFetchLogs,
  statusFetchLogs,
}) {
  // 1) aggregatorLocked => if aggregatorStatus says "locked"
  const aggregatorLocked = (activity.aggregatorStatus || "").toLowerCase() === "locked";
  const summaryLabel = `Activity #${index + 1} — ID: ${activity.activityId || "?"} (${activity.type})`;

  // 2) subchapter aggregator info
  const subChId = activity.subChapterId || "";
  const aggregatorObj = subchapterStatusMap[subChId] || {};

  // 3) quizStagesData => e.g. aggregatorObj.quizStagesData[ stageKey ].quizAttempts
  const stageKey = getStageKey(activity);
  const quizStagesData = aggregatorObj.quizStagesData || {};
  const stageData = quizStagesData[stageKey] || {};
  const { quizAttempts = [], revisionAttempts = [] } = stageData;

  // 3a) concepts => aggregatorObj.concepts (added in your updated /subchapter-status)
  const conceptList = aggregatorObj.concepts || [];

  // 4) RAW Attempt Modal => Q1, Q2, R1, ...
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

  // NEW: For each concept & quiz attempt, check pass/fail
  // We'll do a small function that finds if this concept is tested in that quizSubmission
  // Return "PASS","FAIL","NT"
  function getConceptResult(conceptName, quizAttempt) {
    if (!quizAttempt || !quizAttempt.quizSubmission) return "NT";
    const question = quizAttempt.quizSubmission.find(
      (q) => (q.conceptName || "").toLowerCase() === conceptName.toLowerCase()
    );
    if (!question) {
      return "NT"; // not tested
    }
    // question.score => 1 => pass, 0 => fail
    return question.score && parseFloat(question.score) >= 1 ? "PASS" : "FAIL";
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
            setTimeDetailOpen={setTimeDetailOpen}
            setTimeDetailTitle={setTimeDetailTitle}
            setTimeDetailData={setTimeDetailData}
            timeFetchLogs={timeFetchLogs}
            statusFetchLogs={statusFetchLogs}
          />

          {/* 3) Subchapter Concepts => aggregatorObj.concepts */}
          <Box sx={{ mt: 2, pl: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Subchapter Concepts
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Found {conceptList.length} concept(s) for subChId={subChId}.
            </Typography>

            {conceptList.length > 0 && (
              <ul style={{ marginLeft: "1.25rem" }}>
                {conceptList.map((cn) => (
                  <li key={cn.id} style={{ marginBottom: "0.2rem" }}>
                    {cn.name || `Concept ${cn.id}`}
                  </li>
                ))}
              </ul>
            )}
          </Box>

          {/* 4) Concept-based Quiz Attempt Table (Optional) */}
          {(stageKey !== "reading") && quizAttempts.length > 0 && conceptList.length > 0 && (
            <Box sx={{ mt: 2, pl: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Concept vs Quiz Attempts
              </Typography>
              <ConceptQuizTable conceptList={conceptList} quizAttempts={quizAttempts} />
            </Box>
          )}

          {/* 5) QUIZ + REVISION ATTEMPTS => e.g. Q1, Q2,... R1, R2,... */}
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

          {/* 6) PlanFetcher link */}
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

/** 
 * Small sub-component => concept-based quiz matrix
 * For each concept, for each quiz attempt => PASS / FAIL / NT 
 */
function ConceptQuizTable({ conceptList, quizAttempts }) {
  // Sort attempts by attemptNumber ascending
  const sortedAttempts = [...quizAttempts].sort(
    (a, b) => (a.attemptNumber || 0) - (b.attemptNumber || 0)
  );

  // We define a small helper to see if concept was tested and pass/fail
  function getConceptResult(conceptName, attempt) {
    if (!attempt?.quizSubmission) return "NT";
    const foundQ = attempt.quizSubmission.find(
      (q) => (q.conceptName || "").toLowerCase() === conceptName.toLowerCase()
    );
    if (!foundQ) return "NT"; // not tested
    return foundQ.score && Number(foundQ.score) >= 1 ? "PASS" : "FAIL";
  }

  return (
    <Box sx={{ overflowX: "auto", mb: 2 }}>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={thStyle}>Concept</th>
            {sortedAttempts.map((att) => (
              <th key={att.attemptNumber} style={thStyle}>
                Q{att.attemptNumber}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {conceptList.map((cn) => {
            return (
              <tr key={cn.id}>
                <td style={tdStyle}>{cn.name || `Concept ${cn.id}`}</td>
                {sortedAttempts.map((att) => {
                  const res = getConceptResult(cn.name, att); 
                  // "PASS","FAIL","NT"
                  let bg = "#555";
                  if (res === "PASS") bg = "#66bb6a";
                  else if (res === "FAIL") bg = "#ef5350";
                  return (
                    <td key={att.attemptNumber} style={{ ...tdStyle, backgroundColor: bg }}>
                      {res}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </Box>
  );
}

const thStyle = {
  border: "1px solid #888",
  padding: "6px 8px",
  backgroundColor: "#333",
  color: "#fff",
  fontWeight: "bold",
};

const tdStyle = {
  border: "1px solid #888",
  padding: "6px 8px",
  textAlign: "center",
};