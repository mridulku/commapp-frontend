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
  LinearProgress,
  Tabs,
  Tab,
  Chip
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

/**************************************************************
 * merges quiz+revision => sorted
 **************************************************************/
function mergeQuizAndRevision(quizArr, revArr) {
  const combined = [];
  quizArr.forEach((q) => {
    combined.push({ ...q, type: "quiz", attemptNumber: q.attemptNumber || 1 });
  });
  revArr.forEach((r) => {
    combined.push({ ...r, type: "revision", revisionNumber: r.revisionNumber || 1 });
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
 * lumps => attemptNumber => { dateStr => totalSeconds }
 **************************************************************/
function buildUsageMap(details) {
  const usageByAttempt = {};
  details.forEach((doc) => {
    const isQuizTime = doc.collection === "quizTimeSubActivity";
    const attNum = isQuizTime ? doc.attemptNumber : doc.revisionNumber;
    if (!attNum) return;
    const dStr = doc.dateStr || "UnknownDate";
    if (!usageByAttempt[attNum]) usageByAttempt[attNum] = {};
    if (!usageByAttempt[attNum][dStr]) usageByAttempt[attNum][dStr] = 0;
    usageByAttempt[attNum][dStr] += doc.totalSeconds || 0;
  });
  return usageByAttempt;
}

/**************************************************************
 * Concepts Panel => 
 *   Collapsed => progress bar
 *   Expanded => old table => Concept vs Quiz
 **************************************************************/
function ConceptsPanel({ aggregatorObj, stageKey }) {
  const stageData = aggregatorObj.quizStagesData?.[stageKey] || {};
  const allAttemptsConceptStats = stageData.allAttemptsConceptStats || [];
  const quizAttempts = stageData.quizAttempts || [];
  const concepts = aggregatorObj.concepts || [];

  const totalConcepts = concepts.length;
  if (!totalConcepts) return null;

  const conceptPassMap = buildConceptPassMap(allAttemptsConceptStats);
  const passedCount = concepts.filter((c) => conceptPassMap[c.name]?.passed).length;
  const percent = totalConcepts > 0 ? (passedCount / totalConcepts) * 100 : 0;

  const [expanded, setExpanded] = useState(false);

  return (
    <Box sx={{ mb: 3 }}>
      <Accordion
        expanded={expanded}
        onChange={() => setExpanded(!expanded)}
        sx={{ backgroundColor: "#222", color: "#fff" }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#fff" }} />}>
          <Box sx={{ width: "100%" }}>
            <Typography variant="body2" sx={{ fontWeight: "bold", mb: 0.5 }}>
              Concepts
            </Typography>
            <LinearProgress
              variant="determinate"
              value={percent}
              sx={{ height: 6, borderRadius: 2, backgroundColor: "#333" }}
            />
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {passedCount}/{totalConcepts} mastered
            </Typography>
          </Box>
        </AccordionSummary>

        <AccordionDetails sx={{ backgroundColor: "#333" }}>
          <ConceptTable
            concepts={concepts}
            quizAttempts={quizAttempts}
            allAttemptsConceptStats={allAttemptsConceptStats}
          />
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}

function buildConceptPassMap(allAttemptsConceptStats) {
  const map = {};
  allAttemptsConceptStats.forEach((att) => {
    const label = `Q${att.attemptNumber}`;
    att.conceptStats?.forEach((cs) => {
      const cName = cs.conceptName;
      if (!map[cName]) {
        map[cName] = { tested: false, passed: false, attemptLabels: [] };
      }
      map[cName].tested = true;
      if (cs.passOrFail === "PASS") {
        map[cName].passed = true;
        map[cName].attemptLabels.push(label);
      }
    });
  });
  return map;
}

/**************************************************************
 * The old table => “Concept vs Quiz Attempts”
 **************************************************************/
function ConceptTable({ concepts, quizAttempts, allAttemptsConceptStats }) {
  if (!quizAttempts?.length) {
    return (
      <Box sx={{ p: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
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

  const attemptNumbers = quizAttempts
    .map((q) => q.attemptNumber)
    .filter((n) => n != null)
    .sort((a, b) => a - b);

  const conceptStatusMap = {};
  allAttemptsConceptStats.forEach((attempt) => {
    const n = attempt.attemptNumber;
    attempt.conceptStats?.forEach((cs) => {
      const cName = cs.conceptName;
      if (!conceptStatusMap[cName]) conceptStatusMap[cName] = {};
      conceptStatusMap[cName][n] = cs.passOrFail || "NOT_TESTED";
    });
  });

  return (
    <Box sx={{ p: 1 }}>
      <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
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
                  const st = rowMap[n] || "NOT_TESTED";
                  let bg = "#666";
                  if (st === "PASS") bg = "#66bb6a";
                  else if (st === "FAIL") bg = "#ef5350";
                  return (
                    <td key={n} style={{ ...tdStyle, backgroundColor: bg }}>
                      {st}
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
 * AttemptsTabs => row of Q1(R1) => below => AttemptDetail
 **************************************************************/
function AttemptsTabs({ quizAttempts, revisionAttempts, usageByAttempt }) {
  const combined = mergeQuizAndRevision(quizAttempts, revisionAttempts);
  if (!combined.length) {
    return <Typography variant="body2">No attempts found.</Typography>;
  }
  // build array => { label: "Q1 (Apr 11)", isQuiz, ... }
  const attemptsArray = combined.map((att) => {
    const isQuiz = att.type === "quiz";
    const prefix = isQuiz ? "Q" : "R";
    const num = att.attemptNumber || att.revisionNumber || 1;
    const dateStr = formatDate(att.timestamp);
    return {
      ...att,
      isQuiz,
      label: `${prefix}${num} (${dateStr})`,
    };
  });

  const [tabIndex, setTabIndex] = useState(0);
  const handleChange = (evt, val) => setTabIndex(val);

  const selectedAttempt = attemptsArray[tabIndex] || null;

  return (
    <Box sx={{ mt: 2 }}>
      <Tabs
        value={tabIndex}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        textColor="inherit"
        TabIndicatorProps={{ style: { backgroundColor: "#fff" } }}
        sx={{ minHeight: "32px" }}
      >
        {attemptsArray.map((a, i) => (
          <Tab
            key={i}
            label={a.label}
            sx={{
              minHeight: "32px",
              color: "#ccc",
              "&.Mui-selected": { color: "#fff", fontWeight: "bold" },
            }}
          />
        ))}
      </Tabs>

      {selectedAttempt && (
        <AttemptDetail
          attempt={selectedAttempt}
          usageMap={usageByAttempt[getAttemptNum(selectedAttempt)] || {}}
        />
      )}
    </Box>
  );
}
function getAttemptNum(a) {
  return a.type === "quiz" ? a.attemptNumber : a.revisionNumber;
}

/**************************************************************
 * AttemptDetail => 
 *   - If revision => show “(Revision Attempt)”
 *   - If quiz => show pills: Score, Time Usage, “X / Y correct”
 *   - Then each question is collapsed => question header, concept, pass/fail
 *       => expand => 4 options highlight
 **************************************************************/
function AttemptDetail({ attempt, usageMap }) {
  if (attempt.type !== "quiz") {
    // Just show revision => usage
    return (
      <Box sx={{ mt: 2, p: 2, backgroundColor: "#222", borderRadius: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
          (Revision Attempt)
        </Typography>
        <TimeUsage usageMap={usageMap} />
      </Box>
    );
  }

  // It's a quiz => show advanced info
  const quizSubmission = attempt.quizSubmission || [];
  const totalQuestions = quizSubmission.length;
  const correctCount = quizSubmission.filter(
    (q) => q.score && parseFloat(q.score) >= 1
  ).length;

  // parse attempt.score => might be “33%” or “2/3” or numeric
  const scoreStr = attempt.score || "N/A";

  return (
    <Box sx={{ mt: 2, p: 2, backgroundColor: "#222", borderRadius: 2 }}>
      {/* Pills row => Score, time usage, correct/total */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
        <Chip
          label={`Score: ${scoreStr}`}
          sx={{ backgroundColor: "#333", color: "#fff", fontWeight: "bold" }}
        />
        <TimeUsagePill usageMap={usageMap} />
        <Chip
          label={`Correct: ${correctCount}/${totalQuestions}`}
          sx={{ backgroundColor: "#333", color: "#fff", fontWeight: "bold" }}
        />
      </Box>

      {/* Then each question => collapsed state => question + pass/fail */}
      {quizSubmission.map((q, idx) => (
        <QuestionAccordion key={idx} q={q} index={idx} />
      ))}
    </Box>
  );
}

/**************************************************************
 * TimeUsage => if usageMap empty => “Time usage: 0 seconds”
 *             else => list day/time
 **************************************************************/
function TimeUsage({ usageMap }) {
  const entries = Object.entries(usageMap).sort((a,b) => new Date(a[0]) - new Date(b[0]));
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" sx={{ fontWeight: "bold", mb: 0.5 }}>
        Time usage:
      </Typography>
      {entries.length === 0 ? (
        <Typography variant="body2">0 seconds</Typography>
      ) : (
        entries.map(([dStr, secs], i) => (
          <Typography variant="body2" key={i}>
            {dStr}: {secs} sec
          </Typography>
        ))
      )}
    </Box>
  );
}

/**************************************************************
 * TimeUsagePill => same data, but as a single “pill” if you prefer
 **************************************************************/
function TimeUsagePill({ usageMap }) {
  // sum total
  let totalSec = 0;
  Object.values(usageMap).forEach((val) => { totalSec += val; });
  return (
    <Chip
      label={`Time: ${totalSec || 0}s`}
      sx={{ backgroundColor: "#333", color: "#fff", fontWeight: "bold" }}
    />
  );
}

/**************************************************************
 * QuestionAccordion => collapsed => Q# + pass/fail + concept
 *                     expanded => show all 4 options, highlight
 **************************************************************/
function QuestionAccordion({ q, index }) {
  const [expanded, setExpanded] = useState(false);
  const userAnswerIdx = parseInt(q.userAnswer, 10);
  const correctIdx = q.correctIndex;
  const isCorrect = q.score && parseFloat(q.score) >= 1;

  return (
    <Box
      sx={{
        mb: 2,
        backgroundColor: "#333",
        borderRadius: 1,
        overflow: "hidden",
      }}
    >
      {/* Header row => Q# + pass/fail + concept */}
      <Box
        onClick={() => setExpanded(!expanded)}
        sx={{
          display: "flex",
          flexDirection: "column",
          p: 1,
          cursor: "pointer",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" sx={{ fontWeight: "bold" }}>
            Q{index + 1}: {q.question || "Untitled question"}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: isCorrect ? "green" : "red", fontWeight: "bold" }}
          >
            {isCorrect ? "PASS" : "FAIL"}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: "#bbb", fontSize: "0.85rem", mt: 0.5 }}>
          Concept: {q.conceptName || "N/A"}
        </Typography>
      </Box>

      {/* If expanded => show options */}
      {expanded && (
        <Box sx={{ p: 1, backgroundColor: "#222" }}>
          {/* All 4 options => highlight user vs correct */}
          {q.options?.map((opt, i) => {
            let bg = "#444";
            if (i === correctIdx && i === userAnswerIdx) {
              bg = "#66bb6a"; 
            } else if (i === correctIdx) {
              bg = "#2e7d32";
            } else if (i === userAnswerIdx) {
              bg = "#ef5350";
            }
            return (
              <Box
                key={i}
                sx={{
                  p: 1,
                  backgroundColor: bg,
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <Typography variant="body2">{opt}</Typography>
              </Box>
            );
          })}
          {q.feedback && (
            <Typography variant="body2" sx={{ fontStyle: "italic" }}>
              {q.feedback}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}

/**************************************************************
 * Main => aggregator + lumps => 
 *   (A) ConceptsPanel
 *   (B) AttemptsTabs
 **************************************************************/
export default function HistoryView({
  userId,
  planId,
  subChapterId,
  activityId,
  stageKey = "remember",
  activityType = "quiz",
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aggregatorObj, setAggregatorObj] = useState(null);
  const [timeData, setTimeData] = useState(null);

  useEffect(() => {
    if (!userId || !planId || !subChapterId || !activityId) return;

    let cancel = false;

    async function doFetch() {
      try {
        setLoading(true);
        setError("");

        // aggregator
        const aggRes = await axios.get("http://localhost:3001/subchapter-status", {
          params: { userId, planId, subchapterId: subChapterId },
        });
        if (!cancel) {
          setAggregatorObj(aggRes.data);
        }

        // lumps => getActivityTime
        const timeRes = await axios.get("http://localhost:3001/api/getActivityTime", {
          params: { activityId, type: activityType },
        });
        if (!cancel) {
          setTimeData(timeRes.data);
        }

      } catch (err) {
        if (!cancel) {
          setError(err.message || "Error fetching aggregator/time lumps");
          setAggregatorObj(null);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    doFetch();

    return () => {
      cancel = true;
    };
  }, [userId, planId, subChapterId, activityId, activityType]);

  if (!userId || !planId || !subChapterId || !activityId) {
    return (
      <Box sx={{ p: 2, color: "red", backgroundColor: "#000" }}>
        <Typography variant="body2">
          Missing userId, planId, subChapterId, or activityId.
        </Typography>
      </Box>
    );
  }
  if (loading) {
    return (
      <Box sx={{ p: 2, color: "#fff" }}>
        <Typography variant="body2">Loading data...</Typography>
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
        <Typography variant="body2">No aggregator data found</Typography>
      </Box>
    );
  }

  // aggregator => attempts
  const stageData = aggregatorObj.quizStagesData?.[stageKey] || {};
  const quizAttempts = stageData.quizAttempts || [];
  const revisionAttempts = stageData.revisionAttempts || [];

  // lumps => usage
  let usageByAttempt = {};
  if (timeData?.details) {
    usageByAttempt = buildUsageMap(timeData.details);
  }

  return (
    <Box sx={{ p: 2, backgroundColor: "#000", color: "#fff" }}>
      {/* (A) Concepts => collapsed => progress, expanded => table */}
      <ConceptsPanel aggregatorObj={aggregatorObj} stageKey={stageKey} />

      {/* (B) Attempts => row of tabs => below => detail */}
      <AttemptsTabs
        quizAttempts={quizAttempts}
        revisionAttempts={revisionAttempts}
        usageByAttempt={usageByAttempt}
      />
    </Box>
  );
}