/* ────────────────────────────────────────────────────────────────
   File:  AdaptPG2.jsx      (2025-05-06 – obeys external viewMode)
───────────────────────────────────────────────────────────────── */
import React, { useCallback, useMemo, useState } from "react";
import axios  from "axios";
import { useDispatch } from "react-redux";
import { setCurrentIndex } from "../../../../../../../store/planSlice";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import DayActivities from "./DayActivities";
import Loader        from "./Loader";

/* ───── helpers ───── */
const dateOnly = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const parseCreated = p => {
  const s = p?.createdAt?.seconds ?? p?.createdAt?._seconds;
  return s ? dateOnly(new Date(s * 1000)) : dateOnly(new Date());
};
const addDays  = (d, n) => dateOnly(new Date(+d + n * 86400000));
const fmt      = d => d.toLocaleDateString("en-US",
                     { month:"short", day:"numeric", year:"numeric" });

/* ───── component ───── */
export default function AdaptPG2({
  userId,
  plan,
  planId,
  viewMode = "today",           // <<< comes from Child2
  onOpenPlanFetcher,
}) {
  if (!plan)                     return <Typography>No plan object provided.</Typography>;
  if (!plan.sessions?.length)    return <Typography>No sessions found in this plan.</Typography>;

  const dispatch   = useDispatch();
  const bookName   = plan.bookName || plan.bookTitle || plan.title || "";
  const createdAt  = parseCreated(plan);
  const todayDate  = dateOnly(new Date());

  /* build meta for each session */
  const metaArr = useMemo(
    () =>
      plan.sessions.map(sess => {
        const n     = Number(sess.sessionLabel);
        const date  = addDays(createdAt, n - 1);
        const label = date.getTime() === todayDate.getTime()
          ? `Today (${fmt(date)})`
          : `Day ${n} (${fmt(date)})`;
        return { idx:n-1, date, label, sess };
      }),
    [plan.sessions, createdAt, todayDate]
  );

  const history = metaArr.filter(m => m.date <  todayDate);
  const today   = metaArr.filter(m => m.date.getTime() === todayDate.getTime());
  const future  = metaArr.filter(m => m.date >  todayDate);

  /* pick list by viewMode */
  const sessionList = viewMode === "history" ? history
                     : viewMode === "future"  ? future
                     :                         today;

  /* accordion & cache */
  const [expandedDay, setExp] = useState(null);
  const [dayCache,    setCache] = useState({}); // { dayIdx : {...} }

  const fetchDay = useCallback(async meta => {
    if (dayCache[meta.idx]) return;
    const acts     = meta.sess.activities || [];
    const timeMap  = {};
    const subMap   = {};
    const timeLogs = [];
    const statLogs = [];

    /* ---- time per activity ---- */
    for (const act of acts) {
      if (!act.activityId) continue;
      const type = act.type?.toLowerCase().includes("read") ? "read" : "quiz";
      const req  = { activityId: act.activityId, type };
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/getActivityTime`, { params:req }
      );
      timeMap[act.activityId] = data?.totalTime || 0;
      timeLogs.push({ field:"timeSpent", activityId:act.activityId, usedApi:"/api/getActivityTime", requestPayload:req, responsePayload:data });
    }

    /* ---- sub-chapter status ---- */
    const subIds = [...new Set(acts.map(a => a.subChapterId).filter(Boolean))];
    for (const sid of subIds) {
      const req = { userId, planId, subchapterId:sid };
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/subchapter-status`, { params:req }
      );
      subMap[sid] = data;
      statLogs.push({ field:"subchapterStatus", subchapterId:sid, usedApi:"/subchapter-status", requestPayload:req, responsePayload:data });
    }

    const dateISO = meta.date.toISOString().slice(0,10);
    setCache(c => ({
      ...c,
      [meta.idx]: { dateISO, acts, timeMap, subMap, timeLogs, statLogs },
    }));
  }, [dayCache, userId, planId]);

  const handleAcc = meta => async (_e, open) => {
    setExp(open ? meta.idx : null);
    if (open) await fetchDay(meta);
  };

  /* ---- dialogs (unchanged) ---- */
  const [debugOpen, setDebugOpen]         = useState(false);
  const [debugTitle, setDebugTitle]       = useState("");      const [debugData, setDebugData] = useState(null);
  const [historyOpen, setHistoryOpen]     = useState(false);  const [historyTitle, setHistoryTitle] = useState(""); const [historyData,setHistoryData]=useState(null);
  const [prevOpen,setPrevOpen]            = useState(false);  const [prevTitle,setPrevTitle] = useState(""); const [prevItems,setPrevItems]=useState([]);
  const [progressOpen,setProgressOpen]    = useState(false);  const [progressTitle,setProgressTitle]=useState(""); const [progressData,setProgressData]=useState(null);
  const [timeOpen,setTimeOpen]            = useState(false);  const [timeTitle,setTimeTitle]=useState(""); const [timeData,setTimeData]=useState([]);

  const close = fn => () => fn(false);

  const renderDay = cached => (
    <DayActivities
      userId={userId}
      planId={planId}
      bookName={bookName}
      activities={cached.acts}
      timeMap={cached.timeMap}
      sessionDateISO={cached.dateISO}
      subchapterStatusMap={cached.subMap}
      dispatch={dispatch}
      setCurrentIndex={setCurrentIndex}
      onOpenPlanFetcher={onOpenPlanFetcher}
      /* many modal setters … */
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
    <Accordion key={meta.idx}
               expanded={expandedDay === meta.idx}
               onChange={handleAcc(meta)}
               sx={{ background:"transparent", border:"none",            color:"#FFD700", mb:0.5 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color:"#FFD700" }} />}>
        <Typography fontWeight={600}>{meta.label}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        {!dayCache[meta.idx] && expandedDay === meta.idx ? (
          <Loader type="bar" accent="#FFD700" determinate={false} />
        ) : (
          dayCache[meta.idx] && renderDay(dayCache[meta.idx])
        )}
      </AccordionDetails>
    </Accordion>
  );

  if (viewMode === "today" && sessionList.length === 1) {
      const meta = sessionList[0];
      if (!dayCache[meta.idx]) fetchDay(meta);          // lazy-load once
    
      return (
        <Box sx={{ mt: 2 }}>
          {!dayCache[meta.idx] ? (
            <Box sx={{ px: 2, py: 1 }}>
              <Loader type="bar" accent="#FFD700" determinate={false} />
            </Box>
          ) : (
            renderDay(dayCache[meta.idx])
          )}
        </Box>
      );
    }

  /* ─── render ─────────────────────────────────────────────── */
  return (
    <Box sx={{ color:"#fff", mt:2 }}>
      {sessionList.length === 0 ? (
        <Typography>
          {viewMode === "today"   && "No session for today."}
          {viewMode === "history" && "No past sessions."}
          {viewMode === "future"  && "No upcoming sessions."}
        </Typography>
      ) : (
        sessionList.map(panel)
      )}

      {/* dialogs – same markup as before (omitted here for brevity, keep unchanged) */}
      {/* DEBUG */}
      <Dialog open={debugOpen} fullWidth maxWidth="md" onClose={close(setDebugOpen)}>
        <DialogTitle>{debugTitle}</DialogTitle>
        <DialogContent sx={{ background:"#222" }}>
          {debugData
            ? <pre style={{ color:"#0f0", fontSize:"0.85rem", whiteSpace:"pre-wrap" }}>
                {JSON.stringify(debugData,null,2)}
              </pre>
            : <Typography>No data.</Typography>}
        </DialogContent>
        <DialogActions sx={{ background:"#222" }}>
          <Button onClick={close(setDebugOpen)} variant="contained" color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

       {/* ----- HISTORY DIALOG ----- */}
       <Dialog open={historyOpen} fullWidth maxWidth="md" onClose={close(setHistoryOpen)}>
        <DialogTitle>{historyTitle}</DialogTitle>
        <DialogContent sx={{ background:"#222" }}>
          {historyData
            ? <pre style={{ color:"#0f0", fontSize:"0.85rem", whiteSpace:"pre-wrap" }}>
                {JSON.stringify(historyData,null,2)}
              </pre>
            : <Typography>No history.</Typography>}
        </DialogContent>
        <DialogActions sx={{ background:"#222" }}>
          <Button onClick={close(setHistoryOpen)} variant="contained" color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ----- PREVIOUS-ITEMS DIALOG ----- */}
      <Dialog open={prevOpen} fullWidth maxWidth="sm" onClose={close(setPrevOpen)}>
        <DialogTitle>{prevTitle}</DialogTitle>
        <DialogContent sx={{ background:"#222" }}>
          {prevItems.length
            ? <ul style={{ color:"#0f0", fontSize:"0.85rem" }}>
                {prevItems.map((l,i)=><li key={i}>{l}</li>)}
              </ul>
            : <Typography>No data.</Typography>}
        </DialogContent>
        <DialogActions sx={{ background:"#222" }}>
          <Button onClick={close(setPrevOpen)} variant="contained" color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ----- PROGRESS DIALOG ----- */}
      <Dialog open={progressOpen} fullWidth maxWidth="sm" onClose={close(setProgressOpen)}>
        <DialogTitle>{progressTitle}</DialogTitle>
        <DialogContent sx={{ background:"#222", color:"#fff" }}>
          {progressData && !progressData.error
            ? <Typography>
                Mastery:&nbsp;
                <strong>{(progressData.masteryPct || 0).toFixed(2)}%</strong>
              </Typography>
            : <Typography sx={{ color:"#f88" }}>
                {progressData?.error || "No progress."}
              </Typography>}
        </DialogContent>
        <DialogActions sx={{ background:"#222" }}>
          <Button onClick={close(setProgressOpen)} variant="contained" color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ----- TIME-DETAIL DIALOG ----- */}
      <Dialog open={timeOpen} fullWidth maxWidth="md" onClose={close(setTimeOpen)}>
        <DialogTitle>{timeTitle}</DialogTitle>
        <DialogContent sx={{ background:"#222", color:"#fff" }}>
          {timeData.length
            ? <ul style={{ color:"#0f0", fontSize:"0.85rem" }}>
                {timeData.map((d,i)=>(
                  <li key={i}>
                    DocID:{d.docId}&nbsp; Collection:{d.collection}&nbsp;
                    TotalSeconds:{d.totalSeconds}
                  </li>
                ))}
              </ul>
            : <Typography>No details.</Typography>}
        </DialogContent>
        <DialogActions sx={{ background:"#222" }}>
          <Button onClick={close(setTimeOpen)} variant="contained" color="secondary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}