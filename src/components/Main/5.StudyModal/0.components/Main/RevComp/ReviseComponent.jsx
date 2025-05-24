// ReviseView.jsx  – drop-in replacement
import React, { useEffect, useState, useRef } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../../../firebase";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";

import {
  fetchReviseTime,
  incrementReviseTime,
} from "../../../../../../store/reviseTimeSlice";
import { setCurrentIndex, fetchPlan } from "../../../../../../store/planSlice";
import { refreshSubchapter } from "../../../../../../store/aggregatorSlice";

import { Chip, CircularProgress, Fade } from "@mui/material";
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

// human-readable mm:ss
const fmt = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

/* split long HTML into ~`chunkSize`-word pages */
function chunkHtmlByParagraphs(html = "", chunkSize = 180) {
  const clean = html.replace(/\\n/g, "\n").replace(/\r?\n/g, " ");
  const paras = clean
    .split(/<\/p>/i)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => p + "</p>");

  const pages = [];
  let curHTML = "";
  let curWC   = 0;

  paras.forEach((para) => {
    const wc = para.replace(/<[^>]+>/g, "")
                   .split(/\s+/).filter(Boolean).length;

    if (curWC + wc <= chunkSize) {
      curHTML += para;
      curWC   += wc;
    } else {
      pages.push(curHTML);
      curHTML = para;
      curWC   = wc;
    }
  });
  if (curHTML.trim()) pages.push(curHTML);
  return pages;
}

/* Firestore doc-id helper */
const buildRevisionConfigDocId = (exam, stage) =>
  `revise${safeStr(exam).replace(/^\w/, (c) => c.toUpperCase())}` +
  `${safeStr(stage).replace(/^\w/, (c) => c.toUpperCase())}`;

/* GPT → nicely formatted HTML */
function createHtmlFromGPTData(data) {
  if (!data) return "";
  let html = "";

  if (data.title) html += `<h3>${data.title}</h3>`;

  (data.concepts || []).forEach((c) => {
    html += `<h4>${c.conceptName}</h4>`;
    html += `<p>${c.explanation}</p>`;

    const ex = c.example || c.examples || c.workedExample || null;
    if (ex) {
      html += `<blockquote>
                 <strong>Example:</strong> ${safeStr(ex.prompt || ex.question)}
                 <br/><em>Solution:</em> ${safeStr(ex.solution || ex.answer)}
               </blockquote>`;
    }
  });

  return html;
}

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

/* ───────────────────── reusable UI bits ───────────────────── */
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
        ".MuiChip-icon": { color: "#eceff1", ml: -.4 },
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

  /* timing refs */
  const docIdRef             = useRef("");
  const [serverSec , setServ] = useState(0);
  const [localSec  , setLoc ] = useState(0);
  const [lastSnapMs, setSnap] = useState(null);

  /* GPT / UI state */
  const [loading , setLoading ] = useState(false);
  const [status  , setStatus  ] = useState("");
  const [error   , setError   ] = useState("");
  const [pages   , setPages   ] = useState([]);
  const [pageIx  , setPageIx  ] = useState(0);

  /* mastery widget */
  const [loadingConceptData, setLCD] = useState(true);
  const [mastered , setMst] = useState(0);
  const [inProg   , setInpr]= useState(0);
  const [notTested, setNot ] = useState(0);
  const [conceptStatuses,setCS]=useState([]);

  /* ── 1. Generate / fetch on mount ───────────────────────── */
  useEffect(()=>{
    if(!userId || !subChapterId) return;

    const dateStr = new Date().toISOString().slice(0,10);
    const docId   = `${userId}_${planId}_${subChapterId}_${quizStage}_rev${revisionNumber}_${dateStr}`;
    docIdRef.current = docId;

    // reset UI
    setLoading(true); setStatus("Generating revision…"); setError("");
    setPages([]); setPageIx(0); setServ(0); setLoc(0); setSnap(Date.now());

    /* 1A – time spent so far */
    dispatch(fetchReviseTime({docId})).then(a=>{
      if(fetchReviseTime.fulfilled.match(a)) setServ(a.payload||0);
    });

    /* 1B – GPT content */
    (async()=>{
      try{
        const cfgId = buildRevisionConfigDocId(examId, quizStage);
        const cfgSnap = await getDoc(doc(db,"revisionConfigs",cfgId));
        if(!cfgSnap.exists()) throw new Error(`No revisionConfig '${cfgId}'`);

        const { success, revisionData, error:errMsg } =
          await generateRevisionContent({
            db,
            subChapterId,
            openAiKey: import.meta.env.VITE_OPENAI_KEY,
            revisionConfig: cfgSnap.data(),
            userId,
            quizStage,
          });

        if(!success) throw new Error(errMsg||"GPT error");

        const html   = createHtmlFromGPTData(revisionData);
        const chunks = chunkHtmlByParagraphs(html,180);
        setPages(chunks);
        setStatus("");
      }catch(e){ console.error(e); setError(e.message); }
      finally{ setLoading(false); }
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
    const t = setInterval(()=>setLoc(sec=>sec+1),1000);
    return ()=>clearInterval(t);
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

  /* helpers */
  const total = serverSec + localSec;
  const html  = pages[pageIx] || "";
  const next  = () => setPageIx(i=>Math.min(i+1,pages.length-1));
  const prev  = () => setPageIx(i=>Math.max(i-1,0));

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
      <div style={styles.card}>
        {loading && <LoadingOverlay text={status||"Generating revision…"}/>}

        {/* mastery panel */}
        <MasterySummaryPanel
          loadingConceptData={loadingConceptData}
          masteredCount={mastered}
          inProgressCount={inProg}
          notTestedCount={notTested}
          conceptStatuses={conceptStatuses}
        />

        {/* header */}
        <div style={styles.header}>
          <h2 style={{margin:0,fontWeight:600}}>Revision</h2>
          <Pill label={`Round #${revisionNumber}`}/>
          <Pill label={fmt(total)} icon={<AccessTimeIcon sx={{fontSize:16}}/>}/>
        </div>

        {/* body */}
        <div style={styles.body}>
          {error && <p style={{color:"red"}}>{error}</p>}
          {/* eslint-disable-next-line react/no-danger */}
          <div style={styles.page} dangerouslySetInnerHTML={{__html:html}}/>
        </div>

        {/* footer */}
        <div style={styles.footer}>
          <div style={styles.nav}>
            {pageIx>0 && <button style={styles.btn} onClick={prev}>Previous</button>}
            {pageIx < pages.length-1 && (
              <button style={styles.btn} onClick={next}>Next</button>
            )}
            {pageIx === pages.length-1 && (
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
};