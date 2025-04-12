import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Divider,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

/**************************************************************
 * 1) Merges aggregator quiz+revision => sorted by timestamp
 **************************************************************/
function mergeQuizAndRevision(quizArr, revArr) {
  const combined = [];
  quizArr.forEach((q) => {
    combined.push({
      ...q,
      type: "quiz",
      attemptNumber: q.attemptNumber || 1,
    });
  });
  revArr.forEach((r) => {
    combined.push({
      ...r,
      type: "revision",
      revisionNumber: r.revisionNumber || 1,
    });
  });
  combined.sort((a, b) => toMillis(a.timestamp) - toMillis(b.timestamp));
  return combined;
}
function toMillis(ts) {
  if (!ts) return 0;
  if (ts._seconds) return ts._seconds * 1000;
  if (ts.seconds) return ts.seconds * 1000;
  return 0;
}
function formatDate(ts) {
  const ms = toMillis(ts);
  if (!ms) return "Unknown Date";
  const d = new Date(ms);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/**************************************************************
 * 2) Build a lumps map => attemptNumber => { [dateStr]: totalSeconds }
 *    from the "details" array returned by getActivityTime
 **************************************************************/
function buildUsageMap(details) {
  // details: [ { docId, dateStr, totalSeconds, attemptNumber, revisionNumber, ... }, ...]
  // We want: usageByAttempt[ attemptNumber or revisionNumber ] = { dateStr => totalSec }
  const usageByAttempt = {};

  details.forEach((doc) => {
    const isQuizTime = doc.collection === "quizTimeSubActivity";
    const isRevTime = doc.collection === "reviseTimeSubActivity";

    // For quiz lumps => doc.attemptNumber
    // For revision lumps => doc.revisionNumber
    const attNum = isQuizTime ? doc.attemptNumber : doc.revisionNumber;
    if (!attNum) return; // skip if missing

    const dStr = doc.dateStr || "UnknownDate";
    if (!usageByAttempt[attNum]) {
      usageByAttempt[attNum] = {};
    }
    if (!usageByAttempt[attNum][dStr]) {
      usageByAttempt[attNum][dStr] = 0;
    }
    usageByAttempt[attNum][dStr] += doc.totalSeconds || 0;
  });

  return usageByAttempt;
}

/**************************************************************
 * 3) Concept vs Quiz Attempts 
 *    If no quiz => concepts => NOT_TESTED
 *    Else => Q1, Q2 columns
 **************************************************************/
function ConceptTable({ aggregatorObj, stageKey }) {
  const stageData = aggregatorObj.quizStagesData?.[stageKey] || {};
  const quizAttempts = stageData.quizAttempts || [];
  const allAttemptsConceptStats = stageData.allAttemptsConceptStats || [];
  const concepts = aggregatorObj.concepts || [];

  if (!concepts.length) {
    return null;
  }

  // If no quiz attempts => show concept => NOT_TESTED
  if (!quizAttempts.length) {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Concept vs Quiz Attempts
        </Typography>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Concept</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {concepts.map((c) => (
              <tr key={c.id || c.name}>
                <td style={tdStyle}>{c.name || "Unnamed Concept"}</td>
                <td style={{ ...tdStyle, backgroundColor: "#777" }}>NOT_TESTED</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    );
  }

  // Otherwise => build Q1, Q2 columns from allAttemptsConceptStats
  const attemptNumbers = quizAttempts
    .map((qa) => qa.attemptNumber)
    .filter((x) => x != null)
    .sort((a, b) => a - b);

  // Map => conceptName => { attemptNumber => PASS/FAIL/NOT_TESTED }
  const conceptStatusMap = {};
  allAttemptsConceptStats.forEach((att) => {
    const n = att.attemptNumber;
    (att.conceptStats || []).forEach((cs) => {
      const cName = cs.conceptName || "??";
      if (!conceptStatusMap[cName]) {
        conceptStatusMap[cName] = {};
      }
      conceptStatusMap[cName][n] = cs.passOrFail || "NOT_TESTED";
    });
  });

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Concept vs Quiz Attempts
      </Typography>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Concept</th>
            {attemptNumbers.map((n) => (
              <th key={n} style={thStyle}>
                Q{n}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {concepts.map((c) => {
            const cName = c.name || "Unnamed Concept";
            const rowMap = conceptStatusMap[cName] || {};
            return (
              <tr key={c.id || cName}>
                <td style={tdStyle}>{cName}</td>
                {attemptNumbers.map((n) => {
                  const status = rowMap[n] || "NOT_TESTED";
                  let bg = "#666";
                  if (status === "PASS") bg = "#66bb6a";
                  else if (status === "FAIL") bg = "#ef5350";
                  return (
                    <td key={n} style={{ ...tdStyle, backgroundColor: bg }}>
                      {status}
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

const tableStyle = {
  borderCollapse: "collapse",
  width: "100%",
};
const thStyle = {
  border: "1px solid #555",
  padding: "6px 8px",
  backgroundColor: "#333",
  color: "#fff",
  fontWeight: "bold",
};
const tdStyle = {
  border: "1px solid #555",
  padding: "6px 8px",
  textAlign: "center",
  color: "#fff",
};

/**************************************************************
 * 4) AttemptsByDate => merges aggregator attempts => day-by-day 
 *    + lumps => usage. 
 **************************************************************/
function AttemptsByDate({ quizAttempts, revisionAttempts, usageByAttempt }) {
  // usageByAttempt: { attemptNumber => { dateStr => totalSec } }, 
  // including revisionNumber => dayStr => totalSec

  const combined = mergeQuizAndRevision(quizAttempts, revisionAttempts);
  if (!combined.length) {
    return null;
  }

  // group attempts by date
  const mapByDate = {};
  combined.forEach((att) => {
    const dStr = formatDate(att.timestamp);
    if (!mapByDate[dStr]) mapByDate[dStr] = [];
    mapByDate[dStr].push(att);
  });
  const dateKeys = Object.keys(mapByDate).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Attempts By Date
      </Typography>

      {dateKeys.map((day) => {
        const dayAttempts = mapByDate[day];
        return (
          <Box key={day} sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
              {day} ({dayAttempts.length} attempt{dayAttempts.length > 1 ? "s" : ""})
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              {dayAttempts.map((att, idx) => {
                const prefix = att.type === "quiz" ? "Q" : "R";
                const num = att.attemptNumber || att.revisionNumber || 1;
                const label = `${prefix}${num}`;

                // usage for this attempt => usageByAttempt[num]
                // But be mindful: if it's a quiz attempt, attemptNumber = n
                // If it's a revision, revisionNumber = n. We'll use the same usageByAttempt for both, 
                // since our lumps parse function merges them by doc.attemptNumber or doc.revisionNumber.
                return (
                  <AttemptTile
                    key={idx}
                    label={label}
                    attempt={att}
                    usageMap={usageByAttempt[num] || {}}
                  />
                );
              })}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

/**************************************************************
 * 5) AttemptTile => Q1, R1 => expand => question details + day-wise usage
 **************************************************************/
function AttemptTile({ label, attempt, usageMap }) {
  const [expanded, setExpanded] = useState(false);
  const isQuiz = attempt.type === "quiz";
  const handleToggle = () => {
    if (isQuiz) setExpanded(!expanded);
  };

  return (
    <Paper
      sx={{
        p: 1,
        backgroundColor: "#444",
        color: "#fff",
        border: "1px solid #666",
        borderRadius: 2,
        width: "200px",
      }}
    >
      {/* Header => label + expand icon if quiz */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: isQuiz ? "pointer" : "default",
        }}
        onClick={handleToggle}
      >
        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
          {label}
        </Typography>
        {isQuiz && (
          <ExpandMoreIcon
            sx={{
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          />
        )}
      </Box>

      {/* If revision => just show a note */}
      {!isQuiz && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          (Revision Attempt)
        </Typography>
      )}

      {/* If quiz => small line about score */}
      {isQuiz && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          Score: {attempt.score || "(no score)"}
        </Typography>
      )}

      {/* day-wise usage => usageMap => { dateStr: totalSec, ... } */}
      {Object.keys(usageMap).length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Divider sx={{ mb: 1, borderColor: "#666" }} />
          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
            Day-wise Usage:
          </Typography>
          {Object.entries(usageMap)
            .sort((a, b) => new Date(a[0]) - new Date(b[0]))
            .map(([dStr, secs], idx) => (
              <Typography variant="body2" key={idx}>
                {dStr}: {secs} sec
              </Typography>
            ))}
        </Box>
      )}

      {/* If isQuiz and expanded => show question details */}
      {isQuiz && expanded && attempt.quizSubmission && (
        <Box sx={{ mt: 1 }}>
          <Divider sx={{ mb: 1, borderColor: "#666" }} />
          {attempt.quizSubmission.map((q, i) => {
            // parse userAnswer
            const userAnswerIdx = parseInt(q.userAnswer, 10);
            const correctIdx = q.correctIndex;
            const userAnswer = q.options?.[userAnswerIdx] || "(none)";
            const correctAnswer = q.options?.[correctIdx] || "(none)";
            const isCorrect = q.score && parseFloat(q.score) >= 1;

            return (
              <Box
                key={i}
                sx={{
                  mb: 1,
                  backgroundColor: "#333",
                  p: 1,
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  Q{i + 1}: {q.question || "Untitled question"}
                </Typography>
                <Typography variant="body2">
                  <strong>Your Answer:</strong> {userAnswer}
                </Typography>
                <Typography variant="body2">
                  <strong>Correct Answer:</strong> {correctAnswer}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: isCorrect ? "green" : "red", fontWeight: "bold" }}
                >
                  {isCorrect ? "PASS" : "FAIL"}
                </Typography>
                {q.feedback && (
                  <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                    {q.feedback}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Paper>
  );
}

/**************************************************************
 * 6) MAIN HistoryView => fetch aggregator + getActivityTime 
 *    merges lumps => usage
 **************************************************************/
export default function HistoryView({
  userId,
  planId,
  subChapterId,
  activityId,     // needed for getActivityTime
  stageKey = "remember",
  activityType = "quiz", // "read" or "quiz" if you need that param
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aggregatorObj, setAggregatorObj] = useState(null);

  // lumps from getActivityTime => { totalTime, details: [ { dateStr, attemptNumber, revisionNumber, totalSeconds, ...} ] }
  const [timeData, setTimeData] = useState(null);
  const [timeError, setTimeError] = useState("");

  useEffect(() => {
    if (!userId || !planId || !subChapterId || !activityId) return;

    let cancel = false;

    async function fetchAll() {
      try {
        setLoading(true);
        setError("");
        setTimeError("");

        // (1) aggregator => subchapter-status
        const aggRes = await axios.get("http://localhost:3001/subchapter-status", {
          params: { userId, planId, subchapterId: subChapterId },
        });
        if (!cancel) {
          setAggregatorObj(aggRes.data);
        }

        // (2) getActivityTime => lumps
        const timeRes = await axios.get("http://localhost:3001/api/getActivityTime", {
          params: { activityId, type: activityType },
        });
        if (!cancel) {
          setTimeData(timeRes.data); 
          // => { totalTime, details: [...] }
        }

      } catch (err) {
        if (!cancel) {
          setError(err.message || "Error fetching aggregator/time");
          setAggregatorObj(null);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    }

    fetchAll();
    return () => {
      cancel = true;
    };
  }, [userId, planId, subChapterId, activityId, activityType]);

  // minimal checks
  if (!userId || !planId || !subChapterId || !activityId) {
    return (
      <Box sx={{ p: 2, backgroundColor: "#000", color: "red" }}>
        <Typography variant="body2">
          **HistoryView**: Missing userId, planId, subChapterId, or activityId.
        </Typography>
      </Box>
    );
  }
  if (loading) {
    return (
      <Box sx={{ p: 2, color: "#fff" }}>
        <Typography variant="body2">Loading aggregator + time lumps...</Typography>
      </Box>
    );
  }
  if (error) {
    return (
      <Box sx={{ p: 2, color: "red" }}>
        <Typography variant="body2">{error}</Typography>
      </Box>
    );
  }
  if (!aggregatorObj) {
    return (
      <Box sx={{ p: 2, color: "#fff" }}>
        <Typography variant="body2">No aggregator data found.</Typography>
      </Box>
    );
  }

  // (A) aggregator => quizAttempts, revisionAttempts
  const stageData = aggregatorObj.quizStagesData?.[stageKey] || {};
  const quizAttempts = stageData.quizAttempts || [];
  const revisionAttempts = stageData.revisionAttempts || [];

  // (B) lumps => build usageByAttempt => { attemptNumber => { dateStr => totalSec } }
  let usageByAttempt = {};
  if (timeData?.details) {
    usageByAttempt = buildUsageMap(timeData.details);
  }

  return (
    <Box sx={{ p: 2, backgroundColor: "#000", color: "#fff" }}>
      <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
        History View — Stage: {stageKey}
      </Typography>

      {/* (1) Concept Table */}
      <ConceptTable aggregatorObj={aggregatorObj} stageKey={stageKey} />

      {/* (2) Attempts By Date => merges aggregator attempts => plus lumps usage */}
      <AttemptsByDate
        quizAttempts={quizAttempts}
        revisionAttempts={revisionAttempts}
        usageByAttempt={usageByAttempt}
      />
    </Box>
  );
}