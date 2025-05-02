// File: AdaptPG2.jsx
import React, { useCallback, useMemo, useState } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setCurrentIndex } from "../../../../../../../store/planSlice";
import {
  Box, Typography, Tabs, Tab,
  Accordion, AccordionSummary, AccordionDetails,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Button
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import PlanOverview   from "./PlanOverview";
import DayActivities  from "./DayActivities";

/* ───────── helpers ───────── */
const dateOnly = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const parseCreated = p => {
  const s = p?.createdAt?.seconds ?? p?.createdAt?._seconds;
  return s ? dateOnly(new Date(s * 1000)) : dateOnly(new Date());
};
const addDays = (d, n) => dateOnly(new Date(+d + n * 86400000));
const fmt = d => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/* ───────── component ───────── */
export default function AdaptPG2({ userId, plan, planId, onOpenPlanFetcher }) {
  if (!plan) return <Typography>No plan object provided.</Typography>;
  if (!plan.sessions?.length) return <Typography>No sessions found in this plan.</Typography>;

  const dispatch   = useDispatch();
  const bookName   = plan.bookName || plan.bookTitle || plan.title || "";   // <── new
  const createdAt  = parseCreated(plan);
  const todayDate  = dateOnly(new Date());

  /* build per-session meta */
  const metaArr = useMemo(() =>
    plan.sessions.map(sess => {
      const n = Number(sess.sessionLabel);
      const date = addDays(createdAt, n - 1);
      const label = date.getTime() === todayDate.getTime()
        ? `Today (${fmt(date)})` : `Day ${n} (${fmt(date)})`;
      return { idx: n - 1, date, label, sess };
    }), [plan.sessions, createdAt, todayDate]);

  const history = metaArr.filter(m => m.date < todayDate);
  const today   = metaArr.filter(m => m.date.getTime() === todayDate.getTime());
  const future  = metaArr.filter(m => m.date > todayDate);

  /* tab + expanded day */
  const [tab, setTab]           = useState(today.length ? "today" : "history");
  const [expandedDay, setExp]   = useState(null);

  /* lazy cache per day */
  const [dayCache, setCache]    = useState({});   // { dayIdx : { acts,timeMap,subMap,timeLogs,statLogs } }

  /* fetch aggregator data on demand */
  const fetchDay = useCallback(async meta => {
    if (dayCache[meta.idx]) return;
    const acts = meta.sess.activities || [];

    const timeMap = {}, subMap = {}, timeLogs = [], statLogs = [];

    for (const act of acts) {
      if (!act.activityId) continue;
      const t   = act.type?.toLowerCase().includes("read") ? "read" : "quiz";
      const req = { activityId: act.activityId, type: t };
      const { data } = await axios.get("http://localhost:3001/api/getActivityTime", { params: req });
      timeMap[act.activityId] = data?.totalTime || 0;
      timeLogs.push({ field: "timeSpent", activityId: act.activityId, usedApi: "/api/getActivityTime", requestPayload: req, responsePayload: data });
    }
    const subIds = [...new Set(acts.map(a => a.subChapterId).filter(Boolean))];
    for (const sid of subIds) {
      const req = { userId, planId, subchapterId: sid };
      const { data } = await axios.get("http://localhost:3001/subchapter-status", { params: req });
      subMap[sid] = data;
      statLogs.push({ field: "subchapterStatus", subchapterId: sid, usedApi: "/subchapter-status", requestPayload: req, responsePayload: data });
    }
    setCache(c => ({ ...c, [meta.idx]: { acts, timeMap, subMap, timeLogs, statLogs } }));

     const dateISO = meta.date.toISOString().slice(0, 10);      // "YYYY-MM-DD"
 setCache(c => ({
   ...c,
   [meta.idx]: { dateISO, acts, timeMap, subMap, timeLogs, statLogs }
 }));


  }, [dayCache, userId, planId]);

  const handleAcc = meta => async (_e, open) => { setExp(open ? meta.idx : null); if (open) await fetchDay(meta); };

  /* dialog states (unchanged) */
  const [debugOpen, setDebugOpen]       = useState(false);
  const [debugTitle, setDebugTitle]     = useState("");
  const [debugData, setDebugData]       = useState(null);

  const [historyOpen, setHistoryOpen]   = useState(false);
  const [historyTitle, setHistoryTitle] = useState("");
  const [historyData, setHistoryData]   = useState(null);

  const [prevOpen, setPrevOpen]         = useState(false);
  const [prevTitle, setPrevTitle]       = useState("");
  const [prevItems, setPrevItems]       = useState([]);

  const [progressOpen, setProgressOpen] = useState(false);
  const [progressTitle, setProgressTitle] = useState("");
  const [progressData, setProgressData] = useState(null);

  const [timeOpen, setTimeOpen]         = useState(false);
  const [timeTitle, setTimeTitle]       = useState("");
  const [timeData, setTimeData]         = useState([]);

  const close = setFn => () => setFn(false);

  /* helper that renders a fully-wired DayActivities */
  const renderDay = cached => (
    <DayActivities
      userId={userId}
      planId={planId}
      bookName={bookName}                 /* NEW */
      activities={cached.acts}
      timeMap={cached.timeMap}
      sessionDateISO={cached.dateISO}        /* ← NEW */
      subchapterStatusMap={cached.subMap}
      dispatch={dispatch}
      setCurrentIndex={setCurrentIndex}
      onOpenPlanFetcher={onOpenPlanFetcher}
      setDebugOpen={setDebugOpen} setDebugTitle={setDebugTitle} setDebugData={setDebugData}
      setHistoryOpen={setHistoryOpen} setHistoryTitle={setHistoryTitle} setHistoryData={setHistoryData}
      setPrevModalOpen={setPrevOpen} setPrevModalTitle={setPrevTitle} setPrevModalItems={setPrevItems}
      setProgressOpen={setProgressOpen} setProgressTitle={setProgressTitle} setProgressData={setProgressData}
      setTimeDetailOpen={setTimeOpen} setTimeDetailTitle={setTimeTitle} setTimeDetailData={setTimeData}
      timeFetchLogs={cached.timeLogs}
      statusFetchLogs={cached.statLogs}
    />
  );

  const panel = meta => (
    <Accordion key={meta.idx} expanded={expandedDay === meta.idx} onChange={handleAcc(meta)}
               sx={{ background: "#2F2F2F", color: "#FFD700", mb: 1 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#FFD700" }} />}>
        <Typography fontWeight={600}>{meta.label}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        {expandedDay === meta.idx && !dayCache[meta.idx] && <CircularProgress size={24} sx={{ color: "#FFD700" }} />}
        {dayCache[meta.idx] && renderDay(dayCache[meta.idx])}
      </AccordionDetails>
    </Accordion>
  );

  /* ───────── render ───────── */
  return (
    <Box sx={{ color: "#fff", mt: 2 }}>
      {/* Plan Overview */ }
      <Accordion sx={{ mb: 2, background: "#333", color: "#fff" }} defaultExpanded={false}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#FFD700" }} />}>
          <Typography variant="h6">Plan Overview</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <PlanOverview planId={planId} plan={plan} />
        </AccordionDetails>
      </Accordion>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="inherit" indicatorColor="secondary" sx={{ mb: 2 }}>
        <Tab value="history" label={`History (${history.length})`} />
        <Tab value="today"   label="Today"  disabled={!today.length} />
        <Tab value="future"  label={`Future (${future.length})`} disabled={!future.length} />
      </Tabs>

      {/* Body */}
      {tab === "today"   && today.map(m => {
        if (!dayCache[m.idx]) fetchDay(m);
        return dayCache[m.idx]
          ? renderDay(dayCache[m.idx])
          : <CircularProgress key={m.idx} size={24} sx={{ color: "#FFD700" }} />;
      })}
      {tab === "history" && (history.length ? history.map(panel) : <Typography>No past sessions.</Typography>)}
      {tab === "future"  && (future.length  ? future.map(panel)  : <Typography>No upcoming sessions.</Typography>)}

      {/* dialogs – unchanged markup, refs renamed where needed */}
      <Dialog open={debugOpen} fullWidth maxWidth="md" onClose={close(setDebugOpen)}>
        <DialogTitle>{debugTitle}</DialogTitle>
        <DialogContent sx={{ background: "#222" }}>
          {debugData
            ? <pre style={{ color: "#0f0", fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>{JSON.stringify(debugData, null, 2)}</pre>
            : <Typography>No data.</Typography>}
        </DialogContent>
        <DialogActions sx={{ background: "#222" }}>
          <Button onClick={close(setDebugOpen)} variant="contained" color="secondary">Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={historyOpen} fullWidth maxWidth="md" onClose={close(setHistoryOpen)}>
        <DialogTitle>{historyTitle}</DialogTitle>
        <DialogContent sx={{ background: "#222" }}>
          {historyData
            ? <pre style={{ color: "#0f0", fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>{JSON.stringify(historyData, null, 2)}</pre>
            : <Typography>No history.</Typography>}
        </DialogContent>
        <DialogActions sx={{ background: "#222" }}>
          <Button onClick={close(setHistoryOpen)} variant="contained" color="secondary">Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={prevOpen} fullWidth maxWidth="sm" onClose={close(setPrevOpen)}>
        <DialogTitle>{prevTitle}</DialogTitle>
        <DialogContent sx={{ background: "#222" }}>
          {prevItems.length
            ? <ul style={{ color: "#0f0", fontSize: "0.85rem" }}>{prevItems.map((l, i) => <li key={i}>{l}</li>)}</ul>
            : <Typography>No data.</Typography>}
        </DialogContent>
        <DialogActions sx={{ background: "#222" }}>
          <Button onClick={close(setPrevOpen)} variant="contained" color="secondary">Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={progressOpen} fullWidth maxWidth="sm" onClose={close(setProgressOpen)}>
        <DialogTitle>{progressTitle}</DialogTitle>
        <DialogContent sx={{ background: "#222", color: "#fff" }}>
          {progressData && !progressData.error
            ? <Typography>Mastery: <strong>{(progressData.masteryPct || 0).toFixed(2)}%</strong></Typography>
            : <Typography sx={{ color: "#f88" }}>{progressData?.error || "No progress."}</Typography>}
        </DialogContent>
        <DialogActions sx={{ background: "#222" }}>
          <Button onClick={close(setProgressOpen)} variant="contained" color="secondary">Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={timeOpen} fullWidth maxWidth="md" onClose={close(setTimeOpen)}>
        <DialogTitle>{timeTitle}</DialogTitle>
        <DialogContent sx={{ background: "#222", color: "#fff" }}>
          {timeData.length
            ? <ul style={{ color: "#0f0", fontSize: "0.85rem" }}>
                {timeData.map((d, i) => <li key={i}>DocID:{d.docId} &nbsp; Collection:{d.collection} &nbsp; TotalSeconds:{d.totalSeconds}</li>)}
              </ul>
            : <Typography>No details.</Typography>}
        </DialogContent>
        <DialogActions sx={{ background: "#222" }}>
          <Button onClick={close(setTimeOpen)} variant="contained" color="secondary">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}