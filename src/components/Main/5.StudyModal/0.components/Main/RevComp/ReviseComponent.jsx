
// ReviseView.jsx  – drop-in replacement
import React, {
  useEffect,
  useState,
  useRef,
  createContext,
  useContext,
} from "react";

// ─── live-seconds context used by ClockPill ───
export const DisplayTimeCtx = createContext(0);
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../../../firebase";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";


import useConceptMastery from "../QuizComp/QuizSupport/useConceptMastery";


import {
  fetchReviseTime,
  incrementReviseTime,
} from "../../../../../../store/reviseTimeSlice";
import { setCurrentIndex, fetchPlan } from "../../../../../../store/planSlice";
import { refreshSubchapter } from "../../../../../../store/aggregatorSlice";

import { Chip, CircularProgress, Fade, Tooltip } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTimeRounded";

import { generateRevisionContent } from "./RevSupport/RevisionContentGenerator";

/* ──────────────────────────────────────────────────────────
   Tiny helpers
─────────────────────────────────────────────────────────── */
// quick null-safe guard for all string operations
const safeStr = (v) => (typeof v === "string" ? v : "");

// ms helper (Firestore ↔ Date)
const tsMs = (t) =>
  t?._seconds ? t._seconds * 1e3 :
  t?.seconds  ? t.seconds  * 1e3 : 0;

  /** banded version identical to QuizView */
function formatBand(sec) {
  if (sec < 60)   return "< 1 min";
  if (sec < 120)  return "< 2 min";
  if (sec < 180)  return "< 3 min";
  if (sec < 300)  return "< 5 min";
  return `${Math.floor(sec / 60)} min`;
}

// human-readable mm:ss
const fmt = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

/* split long HTML into ~`chunkSize`-word pages */



const CACHE_COLL = "revisionCache";



/**
 * Build a *stable* cache-document ID for one specific revision run.
 * (No date-stamp → the same revision opens instantly next time.)
 */
function buildCacheId(userId, planId, subChapterId, stage, revNum) {
  return `${userId}_${planId}_${subChapterId}_${stage}_rev${revNum}`;
}

/* Firestore doc-id helper */
const buildRevisionConfigDocId = (exam, stage) =>
  `revise${safeStr(exam).replace(/^\w/, (c) => c.toUpperCase())}` +
  `${safeStr(stage).replace(/^\w/, (c) => c.toUpperCase())}`;

/* GPT → nicely formatted HTML */


/* last-attempt synthesis (same logic you had in HistoryView) */
function computeConceptStatuses(allAttempts = []) {
  const statusMap = new Map();   // concept → PASS/FAIL/NOT_TESTED
  const conceptSet = new Set();

  const ordered = [...allAttempts].sort(
    (a, b) => (a.attemptNumber || 0) - (b.attemptNumber || 0)
  );

  ordered.forEach((att) => {
    (att.conceptStats || []).forEach((c) => {
      conceptSet.add(c.conceptName);
      if (!statusMap.has(c.conceptName)) statusMap.set(c.conceptName, "NOT_TESTED");
      if (c.passOrFail === "PASS") statusMap.set(c.conceptName, "PASS");
      else if (c.passOrFail === "FAIL" && statusMap.get(c.conceptName) !== "PASS") {
        statusMap.set(c.conceptName, "FAIL");
      }
    });
  });

  return { conceptSet, statusMap };
}


function ClockPill() {
  /* context value comes from the Provider we’ll add in step 4 */
  const seconds  = useContext(DisplayTimeCtx);
  const pulsing  = seconds % 2 === 1;              // blink every odd second

  /* extra 1-s tick → smooth pulse even if nothing else re-renders */
  const [, force] = useState(0);
  useEffect(()=>{
    const id = setInterval(()=>force(v=>v+1),1000);
    return ()=>clearInterval(id);
  },[]);

  return (
    <Chip
      icon={
        <AccessTimeIcon
          sx={{
            fontSize : 16,
            transform: pulsing ? "scale(1.25)" : "scale(1)",
            transition:"transform 250ms ease-out",
          }}
        />
      }
      label={formatBand(seconds)}
      size="small"
      sx={{
        bgcolor: "#263238",         // identical to QuizView
        color  : "#e0f2f1",
        fontSize: 13,
        "& .MuiChip-icon": { ml: -0.4 },
        border: "none",
      }}
    />
  );
}

/* ───────────────────── reusable UI bits ───────────────────── */
/** tiny chip identical to QuizView */
function Pill({ label, icon = null }) {
  return (
    <Chip
      icon={icon}
      label={label}
      size="small"
      sx={{
        bgcolor: "#263238",
        color:  "#eceff1",
        fontWeight: 500,
        ".MuiChip-icon": { color: "#eceff1", ml: -0.4 }
      }}
    />
  );
}


const ProgressBar = ({ pct }) => (
  <div style={{
    width:"100%",height:8,background:"#444",borderRadius:4,overflow:"hidden",
  }}>
    <div style={{ width:`${pct}%`,height:"100%",background:"#66bb6a" }}/>
  </div>
);



/* -------------------------------------------------------------
   Compact concept bar  ✓ 2 / 3  (tooltip shows individual names)
-------------------------------------------------------------*/
/* ── compact pill identical to QuizView ───────────────────── */
function ConceptInlineBar({ conceptStatuses = [] }) {
  if (!conceptStatuses.length) return null;             // hide if nothing to show

  const pass = conceptStatuses.filter(c => c.status === "PASS").length;
  const tot  = conceptStatuses.length;

  /* one ✓ / ✗ line per concept – keep the \n, Tooltip handles it */
    const tooltip = (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {conceptStatuses.map(c => (
        <span key={c.conceptName}>
          {c.status === "PASS" ? "✓" : "✗"} {c.conceptName}
        </span>
      ))}
    </div>
  );

  return (
    <div style={{ marginLeft:"auto", display:"inline-flex", alignItems:"center" }}>
      <Tooltip title={tooltip} arrow placement="bottom-start">
        <span
          style={{
            background:"#37474f", color:"#e0f7fa",
            padding:"2px 8px", borderRadius:4, userSelect:"none",
            whiteSpace:"nowrap", cursor:"default"
          }}
        >
          {pass === tot ? "✓" : "✗"}&nbsp;{pass}&nbsp;/&nbsp;{tot}
        </span>
      </Tooltip>
    </div>
  );
}

// ─── cards for the new layout ─────────────────────────────────
const ConceptPill = ({ name, status }) => (
  <span
    style={{
      background: status==="PASS" ? "#2e7d32"
               : status==="FAIL" ? "#c62828" : "#37474f",
      color:"#e0f7fa", padding:"2px 8px", borderRadius:4,
      fontWeight:600, marginRight:6, fontSize:13
    }}
  >
    {name}
  </span>
);

const ExplanationText = ({ text }) => (
  <p style={{ margin:"8px 0 12px", lineHeight:1.55 }}>{text}</p>
);

const ExampleBlock = ({ prompt, solution }) => (
  <div style={{
    background:"#1e1e1e", border:"1px solid #333",
    borderRadius:4, padding:10, fontSize:14, marginBottom:16
  }}>
    <strong>Example</strong><br/>
    <em>{prompt}</em><br/>
    {solution}
  </div>
);

const ConceptCard = ({ concept, status }) => (
  <div style={{
    
    padding:16, marginBottom:24
  }}>
    <ConceptPill name={concept.conceptName} status={status}/>
    <ExplanationText text={concept.explanation}/>
    <ExampleBlock
      prompt={concept.example.prompt}
      solution={concept.example.solution}
    />
  </div>
);

const LoadingOverlay = ({ text }) => (
  <Fade in>
    <div style={{
      position:"absolute",inset:0,display:"flex",flexDirection:"column",
      alignItems:"center",justifyContent:"center",
      background:"rgba(0,0,0,.65)",zIndex:50,
    }}>
      <CircularProgress size={48} color="secondary"/>
      <span style={{marginTop:12,color:"#eee"}}>{text}</span>
    </div>
  </Fade>
);

/* collapsible mastery box (identical look to the Quiz one) */
function MasterySummaryPanel({
  loadingConceptData,
  masteredCount,
  inProgressCount,
  notTestedCount,
  conceptStatuses,
}) {
  const [open, setOpen] = useState(false);
  const total = masteredCount + inProgressCount + notTestedCount;
  const pct   = total ? Math.round((masteredCount / total) * 100) : 0;

  return (
    <div style={styles.masteryBox}>
      {loadingConceptData ? (
        <p style={{fontSize:".9rem",margin:0}}>Loading concept data…</p>
      ) : (
        <>
          {!open ? (
            <div style={{fontSize:".9rem"}}>
              <div style={{marginBottom:6}}>
                <strong>{masteredCount}</strong> / {total} mastered&nbsp;({pct}%)
              </div>
              <ProgressBar pct={pct}/>
            </div>
          ) : (
            <>
              <div style={{fontSize:".85rem",marginBottom:8}}>
                <strong>Mastered:</strong> {masteredCount}&nbsp;|&nbsp;
                <strong>In&nbsp;Progress:</strong> {inProgressCount}&nbsp;|&nbsp;
                <strong>Not&nbsp;Tested:</strong> {notTestedCount}
              </div>
              <ul style={styles.conceptList}>
                {conceptStatuses.map(({conceptName,status})=>{
                  let c="#bbb";
                  if(status==="PASS") c="#4caf50";
                  if(status==="FAIL") c="#f44336";
                  return (
                    <li key={conceptName} style={{marginBottom:4}}>
                      <span style={{color:c}}>{conceptName}</span>
                      <span style={{color:"#999",fontSize:".8rem"}}>
                        &nbsp;({status})
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          <div style={{textAlign:"right",marginTop:6}}>
            <button onClick={()=>setOpen(!open)} style={styles.expandBtn}>
              {open ? "▲":"▼"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ───────────────────── MAIN COMPONENT ───────────────────── */
export default function ReviseView({
  userId,
  examId      = "general",
  quizStage   = "remember",
  subChapterId= "",
  revisionNumber = 1,
  onRevisionDone,
  activity,
}) {
  const { activityId } = activity || {};
  const planId       = useSelector(s => s.plan?.planDoc?.id);
  const currentIndex = useSelector(s => s.plan?.currentIndex);
  const dispatch     = useDispatch();

  const [concepts, setConcepts] = useState([]);  // ← replaces `pages`
const CONCEPTS_PER_PAGE = 2;                   // pick the batch size you want

  /* timing refs */
  const docIdRef             = useRef("");
  const [serverSec , setServ] = useState(0);
  const [localSec  , setLoc ] = useState(0);
const [lastSnapMs, setSnap] = useState(null);        // left as is
// NEW: remember the exact moment we started the current local session
const sessionStartMs        = useRef(Date.now());
  /* GPT / UI state */
  const [loading , setLoading ] = useState(false);
  const [status  , setStatus  ] = useState("");
  const [error   , setError   ] = useState("");
  const [pageIx  , setPageIx  ] = useState(0);

  // ── NEW : local state for the mastery side-panel ──────────────
const [LCD , setLCD ] = useState(false);  // “loading concept data”
const [mst , setMst ] = useState(0);      // masteredCount
const [inpr, setInpr] = useState(0);      // in-progressCount
const [not , setNot ] = useState(0);      // notTestedCount
const [CS  , setCS  ] = useState([]);     // conceptStatuses (array)

  /* mastery widget */
  // one-liner now:
const {
  loading     : loadingConceptData,
  masteredCount,
  inProgressCount,
  notTestedCount,
  conceptStatuses
} = useConceptMastery(subChapterId, quizStage);

  /* ── 1. Generate / fetch on mount ───────────────────────── */
  useEffect(()=>{
    if(!userId || !subChapterId) return;

    const dateStr = new Date().toISOString().slice(0,10);
    const docId = `${userId}_${planId}_${subChapterId}_${quizStage}`
            + `_rev${revisionNumber}`;        // ← NO date → stable ID
docIdRef.current = docId;

    // reset UI
    setLoading(true); setStatus("Generating revision…"); setError("");
     setPageIx(0); setSnap(Date.now());

    /* 1A – time spent so far */
    dispatch(fetchReviseTime({docId})).then(a=>{
      if(fetchReviseTime.fulfilled.match(a)) setServ(a.payload||0);
      sessionStartMs.current = Date.now();   // NEW – start this session’s stopwatch
    });

    /* 1B – GPT content */
   /* 1B – GPT content (+ simple Firestore cache) */
(async () => {
  try {
    // ---------- 2-line cache lookup ----------
    const cacheId   = buildCacheId(userId, planId, subChapterId, quizStage, revisionNumber);
    const cacheRef  = doc(db, CACHE_COLL, cacheId);
     const cacheSnap = await getDoc(cacheRef);
 if (cacheSnap.exists()) {
   console.log("[Revision] cache HIT →", cacheId);
   const cached = cacheSnap.data().revisionData;
   setConcepts(cached?.concepts || []);
 } else {
      console.log("[Revision] cache MISS →", cacheId);

      const cfgId   = buildRevisionConfigDocId(examId, quizStage);
      const cfgSnap = await getDoc(doc(db, "revisionConfigs", cfgId));
      if (!cfgSnap.exists()) throw new Error(`No revisionConfig '${cfgId}'`);

       const { success, revisionData, error: errMsg } =
  await generateRevisionContent({
    db,
    examId,                        // ← NEW line
    subChapterId,
    openAiKey: import.meta.env.VITE_OPENAI_KEY,
    revisionConfig: cfgSnap.data(),
    userId,
    quizStage,
    revisionNumber,
  });        

      if (!success) throw new Error(errMsg || "GPT error");

setConcepts(revisionData.concepts || []);
      // ---------- write to cache so next open is instant ----------
       await setDoc(cacheRef, {
   revisionData,                       //  ✅  store the raw JSON
   createdAt     : serverTimestamp(),
   userId, planId, subChapterId,
   stage         : quizStage,
   revisionNumber,
 });
    }

    
    setStatus("");
  } catch (e) {
    console.error(e);
    setError(e.message || "Error generating revision");
  } finally {
    setLoading(false);
  }
})();

  },[userId,subChapterId,quizStage,revisionNumber,planId,dispatch]);

  /* ── 2. Load mastery data ───────────────────────── */
  useEffect(()=>{
    if(!userId || !planId || !subChapterId){ setLCD(false); return; }
    (async()=>{
      try{
        setLCD(true);
        const { data } = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/subchapter-status`,
          { params: { userId, planId, subchapterId: subChapterId } }
        );
        const stageObj = data?.quizStagesData?.[quizStage]||{};
        const allStats = stageObj.allAttemptsConceptStats||[];
        const { conceptSet,statusMap } = computeConceptStatuses(allStats);

        const pass = [...statusMap.values()].filter(v=>v==="PASS").length;
        const fail = [...statusMap.values()].filter(v=>v==="FAIL").length;
        const notT = conceptSet.size - pass - fail;

        setMst(pass); setInpr(fail); setNot(notT);

        const arr=[];
        conceptSet.forEach(c=>{
          arr.push({conceptName:c,status:statusMap.get(c)||"NOT_TESTED"});
        });
        arr.sort((a,b)=>a.conceptName.localeCompare(b.conceptName));
        setCS(arr);
      }catch(e){ console.error(e); }
      finally{ setLCD(false); }
    })();
  },[userId,planId,subChapterId,quizStage]);

  /* ── 3. Local second tick ───────────────────────── */
  useEffect(()=>{
      const id = setInterval(() => setLoc(sec => sec + 1), 1000);

  /*  ⬇︎ CLEANUP — fires once when the component un-mounts  */
  return () => {
    clearInterval(id);

    /* how much time since the last successful POST? */
    const remainder = Math.floor(
      (Date.now() - sessionStartMs.current) / 1000
    );
    if (remainder > 0) {
      dispatch(
        incrementReviseTime({ docId: docIdRef.current, increment: remainder })
      );
      setServ(sec => sec + remainder);         // keep local view consistent
    }
  };
  },[]);

  /* ── 4. Lumps-of-15 uploader ─────────────────────── */
  useEffect(()=>{
    if(!lastSnapMs) return;
    const h = setInterval(()=>{
      if(localSec >= 15){
        const lumps = Math.floor(localSec/15)*15;
        dispatch(incrementReviseTime({docId:docIdRef.current,increment:lumps}));
        setServ(s=>s+lumps);
        setLoc(l=>l%15);
        setSnap(Date.now());
      }
    },1000);
    return ()=>clearInterval(h);
  },[localSec,lastSnapMs,dispatch]);

const totalPages = Math.ceil(concepts.length / CONCEPTS_PER_PAGE);
const pageConcepts = concepts.slice(
  pageIx * CONCEPTS_PER_PAGE,
  pageIx * CONCEPTS_PER_PAGE + CONCEPTS_PER_PAGE
);
  /* helpers */
  const total = serverSec + localSec;
 const next = () => setPageIx(i => Math.min(i + 1, totalPages - 1))
 const prev = () => setPageIx(i => Math.max(i - 1, 0));


  /* record attempt then delegate */
  const submitRevisionAttempt = async()=>{
    try{
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/submitRevision`,{
        userId,activityId,subchapterId:subChapterId,revisionType:quizStage,
        revisionNumber,planId,
      });
      dispatch(refreshSubchapter(subChapterId));
    }catch(e){ console.error(e); }
  };

  const handleQuizNow = async()=>{
    await submitRevisionAttempt();
    onRevisionDone?.();
  };

  const handleQuizLater = async()=>{
    try{
      const old = currentIndex;
      if(activityId){
        await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/markActivityCompletion`,
          { userId,planId,activityId,completed:false }
        );
      }
      const backendURL = import.meta.env.VITE_BACKEND_URL;
      const fetchUrl   = "/api/adaptive-plan";
      const a = await dispatch(fetchPlan({planId,backendURL,fetchUrl}));
      if(fetchPlan.fulfilled.match(a)) dispatch(setCurrentIndex(old+1));
      else dispatch(setCurrentIndex(old+1));
      await submitRevisionAttempt();
    }catch(e){
      console.error(e);
      dispatch(setCurrentIndex(currentIndex+1));
    }
  };


  /* ────────────────────────────────────────────────────────── */
  return (
    <div style={styles.outer}>
    <DisplayTimeCtx.Provider
      value={serverSec + localSec /* live seconds */}
    >
      <div style={styles.card}>
          {loading && <LoadingOverlay text={status||"Generating revision…"}/>}

        

        {/* header */}
        <div style={styles.header}>
          <h2 style={{margin:0,fontWeight:600}}>Revision</h2>
          <Pill label={`Round #${revisionNumber}`}/>
<ClockPill />
          <ConceptInlineBar conceptStatuses={conceptStatuses} />
        </div>

        {/* body */}
        <div style={styles.body}>
          {error && <p style={{color:"red"}}>{error}</p>}
          {pageConcepts.map(c => {
  const stat = conceptStatuses.find(s => s.conceptName === c.conceptName)?.status || "NOT_TESTED";
  return <ConceptCard key={c.conceptName} concept={c} status={stat}/>;
})}
        </div>

        {/* footer */}
{/* footer */}
<div style={styles.footer}>
  <div style={styles.navRow}>
    {/* left chunk – Previous */}
    <div style={{ flex: "0 0 auto" }}>
      {pageIx > 0 && (
        <button style={styles.btn} onClick={prev}>
          Previous
        </button>
      )}
    </div>

    {/* centre chunk – page counter */}
    <div style={styles.pageLabel}>
      Page {pageIx + 1} / {totalPages || 1}
    </div>

    {/* right chunk – Next / Quiz */}
    <div style={{ flex: "0 0 auto", display: "flex", gap: 8 }}>
      {pageIx < totalPages - 1 && (
        <button style={styles.btn} onClick={next}>
          Next
        </button>
      )}
      {pageIx === totalPages - 1 && (
        <>
          <button style={styles.btnMain} onClick={handleQuizNow}>
            Take Quiz Now
          </button>
          <button style={styles.btn} onClick={handleQuizLater}>
            Take Quiz Later
          </button>
        </>
      )}
    </div>
  </div>
</div>
            </div>
    </DisplayTimeCtx.Provider>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Inline styles – kept lightweight & identical to your quiz
─────────────────────────────────────────────────────────── */
const styles = {
  outer:{position:"relative",width:"100%",height:"100%",background:"#000",
         color:"#fff",display:"flex",justifyContent:"center",alignItems:"center",
         padding:20,boxSizing:"border-box",fontFamily:"'Inter','Roboto',sans-serif"},
  card :{position:"relative",width:"80%",maxWidth:700,background:"#111",
         border:"1px solid #333",borderRadius:8,display:"flex",
         flexDirection:"column",overflow:"hidden"},
  header:{background:"#222",padding:"12px 16px",borderBottom:"1px solid #333",
          display:"flex",alignItems:"center",gap:12},
  body :{flex:1,padding:16,overflowY:"auto"},
  page :{fontSize:"1.1rem",lineHeight:1.6},
  footer:{borderTop:"1px solid #333",padding:"12px 16px"},
  nav  :{display:"flex",justifyContent:"flex-end",gap:8},
  btn  :{background:"#444",color:"#fff",border:0,padding:"8px 12px",
         borderRadius:4,cursor:"pointer"},
  btnMain:{background:"purple",color:"#fff",border:0,padding:"8px 16px",
           borderRadius:4,cursor:"pointer",fontWeight:"bold"},
  masteryBox:{position:"absolute",top:8,right:8,background:"#222",
              border:"1px solid #444",borderRadius:4,padding:"8px 12px",
              fontSize:".9rem",maxWidth:220,minHeight:44},
  expandBtn:{background:"#444",color:"#fff",border:"none",borderRadius:4,
             padding:"2px 6px",cursor:"pointer",fontSize:".8rem",lineHeight:1},
  conceptList:{margin:0,paddingLeft:16,maxHeight:120,overflowY:"auto"},
  navRow:   { display: "flex", alignItems: "center", justifyContent: "space-between" },
};