/* ────────────────────────────────────────────────────────────────
   File:  src/components/GuideOnboarding.jsx           2025-06-20 v8
   − integrates FancySyllabusPicker, keeps original Goal step
───────────────────────────────────────────────────────────────── */

import React, { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import axios from "axios";

import SuccessPlanCreation from "./SuccessPlanCreation";
import FancyLoader          from "./FancyLoader";
import FancySyllabusPicker  from "./FancySyllabusPicker";

import {
  Box, Button, Grid, Paper, Slider, Stack, Typography, Alert,
  LinearProgress, Collapse
} from "@mui/material";

const ACCENT = "#BB86FC";
const OFF_BG = "rgba(255,255,255,.08)";




/* ── buckets that are allowed right now ─────────────── */
const ALLOWED_GROUPS = {
  physics   : ["Mechanics"],
  chemistry : ["Physical Chemistry", "Inorganic Chemistry", "Organic Chemistry"],
  biology   : [],                       // lock every Biology bucket for now
};
/* quick helper */
const isBucketAllowed = (sub, grp) =>
  ALLOWED_GROUPS[(sub || "").toLowerCase()]?.includes(grp) ?? false;

export default function GuideOnboarding({
  onClose       = () => {},
  onPlanCreated = () => {},
  showCloseBtn  = false,
}) {
  /* ───────── redux selectors ───────── */
  const userId   = useSelector(s => s.auth?.userId);
  const examType = useSelector(s => s.exam?.examType);

  /* ───── add this beside your other top-level hooks ───────────── */
const [openSubj, setOpenSubj] = useState({
  Chemistry : true,          // open by default
  Physics   : true,
  Biology   : false
});


  /* ───────── wizard steps ──────────── */
  const [step, setStep] = useState(0);             // 0: picker | 1: goal/min

  /* ───────── book lookup ───────────── */
  const [bookId,   setBookId]   = useState(null);
  const [bookErr,  setBookErr]  = useState(null);
  const [loadingBook, setLB]    = useState(false);

  /* ───────── chapters list ─────────── */
  const [chapters, setChapters]  = useState([]);
  const [chapErr,  setChapErr]   = useState(null);
  const [loadingCh,setLoadingCh] = useState(false);

  

  /* ───────── plan-creation state ───── */
  const [creating, setCreating] = useState(false);
  const [fakePct,  setFakePct]  = useState(0);
  const [success,  setSuccess]  = useState(false);
  const [planDoc,  setPlanDoc]  = useState(null);
  const [planId,   setPlanId]   = useState(null);
  const [genErr,   setGenErr]   = useState(null);

  /* --- misc step-2 state --- */
  const [dailyMinutes, setDailyMinutes] = useState(30);
  const [goal, setGoal] = useState("fresh");       // fresh | brush | diagnose

    const [timeMode,      setTimeMode]     = useState("preset-30"); // preset-30 | preset-60 | custom
  const minCustom = 30;


  /* ═════════ 1. FIRESTORE: get bookId ══════════════════════════ */
  useEffect(() => {
    if (!userId || !examType) return;
    (async () => {
      try {
        setLB(true);
        const { doc, getDoc } = await import("firebase/firestore");
        const fb = await import("../../../../../../../firebase");
        const snap = await getDoc(doc(fb.db,"users",userId));
        if (!snap.exists()) throw new Error("user doc missing");

        const bookEntry = snap.data().clonedNeetBook;
        const id = Array.isArray(bookEntry)
                   ? bookEntry?.[0]?.newBookId
                   : bookEntry?.newBookId;
        if (!id) throw new Error("newBookId missing");
        setBookId(id);
      } catch (e) {
        setBookErr(e.message || String(e));
      } finally { setLB(false); }
    })();
  }, [userId, examType]);

  /* ═════════ 2. BACKEND: fetch chapters for that book ═════════ */
  useEffect(() => {
    if (!userId || !bookId) return;
    (async () => {
      try {
        setLoadingCh(true); setChapErr(null);
        const url = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
        const { data } = await axios.get(`${url}/api/process-book-data`,
                          { params:{ userId, bookId } });
        setChapters(
          (data?.chapters || []).map(c=>({
            id:c.id, title:c.name,
            subject:c.subject||"Unknown",
            grouping:c.grouping||"Other",
            selected:false
          }))
        );
      } catch (e) {
        setChapErr(e.message || String(e));
      } finally { setLoadingCh(false); }
    })();
  }, [userId, bookId]);

  /* ═════════ 3. Make data shape for FancySyllabusPicker ═══════ */
 /* ═════════ 3. Make data shape for FancySyllabusPicker ═══════ */
const pickerData = useMemo(() => {
  if (!chapters.length) return [];

  /* nice rotating gradient palette */
  const PAL = [
    ["#ff7d7d", "#ffb199"], ["#818cf8", "#d8b4fe"],
    ["#34d399", "#6ee7b7"], ["#f59e0b", "#fde68a"],
    ["#60a5fa", "#a5b4fc"], ["#ec4899", "#f9a8d4"],
  ];
  let p = 0;

  const dict = {};
  chapters.forEach((ch) => {
    const subj = ch.subject;
    const grp  = ch.grouping;
    const key  = `${subj}___${grp}`;

    /* make subject entry if needed */
    (dict[subj] ??= { subject: subj, icon: "📘", buckets: [] });

    /* make / find the bucket */
    let bucket = dict[subj].buckets.find((b) => b.id === key);
    if (!bucket) {
      bucket = {
        id   : key,
        label: grp,
        grad : PAL[p++ % PAL.length],
        comingSoon: !isBucketAllowed(subj, grp),
        chapters  : [],
      };
      dict[subj].buckets.push(bucket);
    }

    /*  ‼️ store both id & visible name, not just id  */
    bucket.chapters.push({ id: ch.id, name: ch.title });
  });

  return Object.values(dict);
}, [chapters]);

  /* ═════════ 4. Sync picker selection <-> chapters array ══════ */
  const selectedSet = useMemo(() => {
    const s=new Set(); chapters.forEach(c=>{ if (c.selected) s.add(c.id); });
    return s;
  }, [chapters]);

  const handlePickerChange = (newSet) => {
    setChapters(prev => prev.map(c=>({ ...c, selected:newSet.has(c.id) })));
  };

  /* ═════════ 5. Plan generation helpers (unchanged) ═══════════ */
  const PLAN_ENDPOINT = "https://generateadaptiveplan2-zfztjkkvva-uc.a.run.app";

  async function handleGenerate() {
    if (!chapters.some(c=>c.selected)) {
      setGenErr("Select at least one chapter.");
      return;
    }
    const body = {
      userId, bookId,
      dailyReadingTime:dailyMinutes,
      targetDate: new Date(Date.now()+155*24*3600e3).toISOString().slice(0,10),
      planType:"mastery",
      quizTime:5, reviseTime:5,
      selectedChapters:[...selectedSet]
    };

    try {
      setCreating(true); setGenErr(null);
      const { data } = await axios.post(PLAN_ENDPOINT, body,
                             { headers:{ "Content-Type":"application/json" } });
      setPlanDoc(data?.planDoc||null);
      setPlanId (data?.planId  || data?.planDocId || data?.planDoc?.id || null);
      setSuccess(true);
    } catch(e){ setGenErr(e.message||String(e)); }
    finally  { setCreating(false); }
  }

  /* fake progress bar */
  useEffect(()=>{
    if (!creating) { setFakePct(0); return; }
    const id=setInterval(()=>setFakePct(p=>p>=97?97:p+3),400);
    return ()=>clearInterval(id);
  },[creating]);

  /* ═════════ 6.  loader shortcuts ═════════════════════════════ */
  if (loadingBook || loadingCh) return <FancyLoader/>;

  /* ═════════ 7.  STEP-0 UI (picker) ═══════════════════════════ */
  /* ═════════ STEP 0  ── subject picker  ═════════════════════════════ */

/* ═════════ STEP-0 UI – subject picker ═════════════════════════ */
function StepTopics() {
  const subjOrder = ["Chemistry", "Physics", "Biology"];

  return (
    <>
      {/* pill header */}
      <Box sx={{
        mx:"auto", mb:3, px:3, py:1, width:"max-content",
        bgcolor:ACCENT, color:"#000", fontWeight:700,
        borderRadius:20, fontSize:14, letterSpacing:0.3
      }}>
        {examType} study-plan setup
      </Box>

            {/* STEP 1 title */}
      <Typography
        variant="h5"
        sx={{ fontWeight: 700, mb: 3 }}
      >
        Step&nbsp;1:&nbsp;Pick the areas you’d like to cover
      </Typography>

      

      {/* subjects */}
      {subjOrder.map(subj => {
        const subjObj = pickerData.find(s => s.subject === subj);
        if (!subjObj) return null;

        return (
          <Box key={subj} sx={{mb:4}}>
            {/* toggler */}
            <Box
              onClick={() => setOpenSubj(o => ({...o, [subj]:!o[subj]}))}
              sx={{cursor:"pointer",userSelect:"none",
                   display:"flex",alignItems:"center",gap:1,mb:1}}
            >
              <Typography component="span" sx={{fontSize:22}}>
                {subjObj.icon || "📘"}
              </Typography>
              <Typography variant="h6" sx={{fontWeight:700}}>
                {subj}
              </Typography>
              <Typography component="span" sx={{
                ml:0.5,fontSize:18,
                transform:openSubj[subj] ? "rotate(90deg)" : "none",
                transition:".2s",opacity:.7
              }}>
                ▶
              </Typography>
            </Box>

            {/* bucket grid */}
            <Collapse in={openSubj[subj]} unmountOnExit timeout="auto">
              <FancySyllabusPicker
                data={[subjObj]}            /* only this subject’s buckets */
                value={selectedSet}
                onChange={handlePickerChange}
                 showSubjectHeader={false}     /* hide inner header */
              />
            </Collapse>
          </Box>
        );
      })}

      {/* helper + nav */}
      {selectedSet.size===0 &&
        <Alert severity="info" sx={{mt:2}}>
          Select at least one chapter to continue.
        </Alert>}

      <Box sx={{textAlign:"right",mt:4}}>
        <Button
          variant="contained"
          sx={{bgcolor:ACCENT,fontWeight:"bold"}}
          disabled={selectedSet.size===0}
          onClick={() => setStep(1)}
        >
          Next
        </Button>
      </Box>
    </>
  );
}

  /* ═════════ 8. STEP-1 UI (goal & minutes)  – unchanged logic ═ */
  const GoalCard = ({ id, emoji, title, desc, disabled=false }) => {
    const active = goal===id;
    return (
      <Paper
        onClick={()=>!disabled&&setGoal(id)}
        elevation={0}
        sx={{
          p:2,flex:1,cursor:disabled?"not-allowed":"pointer",
          bgcolor:disabled?"rgba(255,255,255,.12)":active?ACCENT:OFF_BG,
          color:active?"#000":"#fff",
          border:`1px solid ${active?ACCENT:"#666"}`,
          display:"flex",flexDirection:"column",gap:1
        }}
      >
        <Typography sx={{fontSize:"1.8rem"}}>{emoji}</Typography>
        <Typography sx={{fontWeight:"bold"}}>{title}</Typography>
        <Typography variant="body2" sx={{opacity:.8}}>{desc}</Typography>
      </Paper>
    );
  };

  const StepGoal = (
    <>
      <Typography variant="h5" sx={{fontWeight:"bold",mb:2}}>
        2&nbsp;&nbsp;Set your goal & daily budget
      </Typography>

      <Grid container spacing={2} sx={{mb:4}}>
                {[
          { id:"fresh",    emoji:"📚", title:"Start fresh",
            desc:"Full coverage of the chosen units." },
          { id:"brush",    emoji:"📝", title:"Quick brush-up",
            desc:"Revision schedule when basics already covered. Coming soon.", coming:true },
          { id:"diagnose", emoji:"❓", title:"Diagnose me",
            desc:"We probe weak spots before planning Coming Soon.", coming:true },
        ].map(cfg=>(
          <Grid item xs={12} md={4} key={cfg.id}>
            <GoalCard
              id={cfg.id}
              emoji={cfg.emoji}
              title={cfg.title}
              desc={cfg.desc}
              disabled={cfg.coming}
            />
          </Grid>
        ))}
      </Grid>

            {/* ─── daily-minutes picker ────────────────────── */}
      <Typography variant="h6" sx={{ mb: 1 }}>
        Daily study budget
      </Typography>

      {/* preset chips */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        {["30","60"].map(n=>(
          <Button
            key={n}
            variant={timeMode===`preset-${n}`?"contained":"outlined"}
            sx={{
              bgcolor: timeMode===`preset-${n}` ? ACCENT : "transparent",
              borderColor: ACCENT, color:"#fff", fontWeight:600,
              "&.MuiButton-contained":{ color:"#000" }
            }}
            onClick={()=>{ setTimeMode(`preset-${n}`); setDailyMinutes(+n); }}
          >
            {n}&nbsp;m
          </Button>
        ))}
        <Button
          variant={timeMode==="custom"?"contained":"outlined"}
          sx={{
            bgcolor: timeMode==="custom" ? ACCENT : "transparent",
            borderColor: ACCENT, color:"#fff", fontWeight:600,
            "&.MuiButton-contained":{ color:"#000" }
          }}
          onClick={()=>setTimeMode("custom")}
        >
          Custom
        </Button>
      </Stack>

      {/* slider only when Custom is active */}
      {timeMode==="custom" && (
        <Box sx={{ display:"flex", alignItems:"center", gap:2 }}>
          <Slider
            min={minCustom}
            max={120}
            step={5}
            value={dailyMinutes}
            onChange={(_,v)=>setDailyMinutes(v)}
            sx={{ flex:1, color:ACCENT }}
          />
          <Typography sx={{ width:60, textAlign:"right" }}>
            {dailyMinutes}&nbsp;m
          </Typography>
        </Box>
      )}

      {/* warning if custom < 30 m (shouldn’t happen but guard anyway) */}
      {timeMode==="custom" && dailyMinutes<minCustom && (
        <Alert severity="warning" sx={{ mt:1 }}>
          Minimum daily budget is {minCustom} minutes.
        </Alert>
      )}

      <Stack direction="row" spacing={2} sx={{mt:4}}>
        <Button variant="outlined" onClick={()=>setStep(0)}
                sx={{borderColor:ACCENT,color:"#fff"}}>Back</Button>
        <Button variant="contained" sx={{bgcolor:ACCENT,fontWeight:"bold"}}
                disabled={creating}
                onClick={handleGenerate}>
          {creating
            ? <Box sx={{width:"160px"}}>
                <LinearProgress value={fakePct} variant="determinate"
                                sx={{height:6,borderRadius:3,
                                     "& .MuiLinearProgress-bar":{transition:"transform .4s linear"},
                                     bgcolor:"#664bb0"}}/>
                <Typography variant="caption" sx={{color:"#eee"}}>
                  Generating… {fakePct}%
                </Typography>
              </Box>
            : "Generate plan"}
        </Button>
      </Stack>

      {genErr && <Alert severity="error" sx={{mt:2}}>{genErr}</Alert>}
    </>
  );

  /* ═════════ 9. Success slide (unchanged) ═════════════════════ */
  if (success) {
    return (
      <SuccessPlanCreation
        planDoc={planDoc}
        planId={planId}
        onClose={()=>{ setSuccess(false); onClose(); }}
        onStart={(id)=>{ onPlanCreated(id); setSuccess(false); }}
      />
    );
  }

  /* ═════════ 10. Wrapper shell ════════════════════════════════ */
  return (
    <Box sx={{
      maxWidth:760,mx:"auto",my:4,px:3,py:4,
      bgcolor:"#000",color:"#fff",border:`1px solid ${OFF_BG}`,borderRadius:2
    }}>
      
      {bookErr && <Alert severity="error" sx={{mb:2}}>{bookErr}</Alert>}
      {chapErr && <Alert severity="error" sx={{mb:2}}>{chapErr}</Alert>}
      {step===0 ? <StepTopics/> : StepGoal}
    </Box>
  );
}