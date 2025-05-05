/* ────────────────────────────────────────────────────────────────
   File:  src/components/3.AdaptivePlanView/0.Parent/Child2.jsx
   v4 – hides admin tabs for non-admins                (2025-04-28)
───────────────────────────────────────────────────────────────── */
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Dialog, DialogContent,
  Tabs, Tab,
} from "@mui/material";
import { doc, getDoc } from "firebase/firestore";

/* sub-panels ---------------------------------------------------- */
import StatsPanel     from "../1.StatsPanel/StatsPanel";
import DailyPlan      from "../2.DailyPlan/DailyPlan";
import ProgressView   from "../3.ProgressView/ProgressView";
import AdminPanel     from "../4.AdminPanel/AdminPanel";
import TimelinePanel  from "./TimelinePanel";
import AdaptPG        from "./AdaptPG/AdaptPG";
import AdaptPG2        from "./AdaptPG2/AdaptPG2";

import AdaptPlayground        from "./AdaptPlayground";

import ConceptProgressTable from "./ConceptProgressTable";

import Adapting       from "./Adapting";
import AggregatorPanel from "./AggregatorPanel";
import DailyOverviewDemo from "./DailyOverviewDemo";


/* modal player -------------------------------------------------- */
import PlanFetcher from "../../../../5.StudyModal/StudyModal";

/* firebase instance -------------------------------------------- */
import { db } from "../../../../../../firebase";

/* ----------------------------------------------------------------
   AdaptivePlanContainer
----------------------------------------------------------------- */
export default function Child2({
  userId,
  bookId,
  planId   = "",
  isAdmin  = false,            // 🔸 NEW PROP
  colorScheme = {},
}) {
  /* styling */
  const containerStyle = {
    backgroundColor: colorScheme.panelBg  || "#0D0D0D",
    color:           colorScheme.textColor|| "#FFD700",
    padding: "1rem",
    minHeight: "100vh",
    boxSizing: "border-box",
  };

  /* local state */
  const [plan, setPlan] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [dayIdx, setDayIdx] = useState(0);
  const [expanded, setExpanded] = useState([]);

  /* PlanFetcher dialog */
  const [showDlg, setShowDlg]   = useState(false);
  const [dlgPlan, setDlgPlan]   = useState("");
  const [dlgAct,  setDlgAct]    = useState(null);

  /* fetch plan once planId changes */
  useEffect(()=>{
    if(!planId){ setPlan(null); return; }
    (async()=>{
      try{
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/adaptive-plan`,
          { params:{ planId } }
        );
        setPlan(res.data?.planDoc || null);
      }catch(e){ setPlan(null); }
    })();
  },[planId]);

  /* reset view when plan changes */
  useEffect(()=>{
    setActiveTab(0); setDayIdx(0); setExpanded([]);
  },[plan]);

  /* open PlanFetcher */
  const openFetcher = (pid, act=null)=>{
    setDlgPlan(pid);
    setDlgAct(act ? {
      subChapterId: act.subChapterId,
      type:         act.type,
      stage:        act.quizStage || null,
    } : null);
    setShowDlg(true);
  };

  /* ────────────────────────────────────────────────────────────────
     Tab configuration (only 1 array → easier to filter & render)
  ──────────────────────────────────────────────────────────────── */
  const TAB_CONF = [
    { label:"Daily Overview",      comp: () =>
      <DailyOverviewDemo userId={userId}
                         plan={plan}
                         planId={planId}
                         colorScheme={colorScheme}/> },
                         { label:"Timeline",    comp: renderTimeline },

                         { label:"Concept Progress",      comp: () =>
                          <ConceptProgressTable userId={userId}
                                             plan={plan}
                                             planId={planId}
                                             colorScheme={colorScheme}/> },
                                             { label:"Timeline",    comp: renderTimeline },

    { label:"Daily Plan",    admin:true,        comp: renderDaily },
    { label:"AdaptPG2",     comp: renderAdaptPG2 },


    { label:"AdaptPlayground",     comp: renderAdaptPlayground },

   
     

    { label:"Progress",   admin:true, comp: renderProgress },
    { label:"Admin",      admin:true, comp: renderAdmin },
    { label:"AdaptPG",    admin:true, comp: renderAdaptPG },
    { label:"Adapting",   admin:true, comp: renderAdapting },
    { label:"Aggregator", admin:true, comp: renderAggregator },
  ];

  /* filter for current user */
  const VISIBLE_TABS = TAB_CONF.filter(cfg => !cfg.admin || isAdmin);

  /* ────────────────────────────────────────────────────────────────
     RENDER
  ──────────────────────────────────────────────────────────────── */
  return (
    <div style={containerStyle}>
      {/* Stats header (includes RESUME button & pen icon) */}
      <StatsPanel
        db={db}
        userId={userId}
        bookId={bookId}
        planId={planId}
        colorScheme={colorScheme}
        onResume={() => openFetcher(planId)}
      />

      {/* tab strip */}
      <Tabs
        value={activeTab}
        onChange={(e,v)=>setActiveTab(v)}
        textColor="inherit"
        TabIndicatorProps={{
          style:{ backgroundColor: colorScheme.heading || "#FFD700" }
        }}
        sx={{ mb:1 }}
      >
        {VISIBLE_TABS.map((cfg,idx)=>(
          <Tab
            key={cfg.label}
            label={cfg.admin ? `${cfg.label} 🛠` : cfg.label}
          />
        ))}
      </Tabs>

      {/* tab body */}
      { planId && plan
        ? VISIBLE_TABS[activeTab].comp()
        : <div>{!planId ? "No plan selected." : "Loading plan…"}</div>
      }

      {/* modal player */}
      <Dialog open={showDlg} onClose={()=>setShowDlg(false)} fullScreen>
        <DialogContent sx={{ p:0, bgcolor:"#000" }}>
          {dlgPlan ? (
            <PlanFetcher
              planId={dlgPlan}
              initialActivityContext={dlgAct}
              userId={userId}
              onClose={()=>setShowDlg(false)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );

  /* ─── per-tab render helpers ──────────────────────────────── */
  function renderDaily(){
    return (
      <DailyPlan
        userId={userId}
        plan={plan}
        planId={planId}
        colorScheme={colorScheme}
        dayDropIdx={dayIdx}
        onDaySelect={setDayIdx}
        expandedChapters={expanded}
        onToggleChapter={toggleChapter}
        onOpenPlanFetcher={openFetcher}
      />
    );
  }
  function renderProgress(){
    return (
      <ProgressView
        db={db}
        userId={userId}
        planId={planId}
        bookId={bookId}
        colorScheme={colorScheme}
      />
    );
  }
  function renderTimeline(){
    return (
      <TimelinePanel
        db={db}
        userId={userId}
        planId={planId}
        bookId={bookId}
        colorScheme={colorScheme}
      />
    );
  }
  function renderAdmin(){
    return (
      <AdminPanel
        db={db}
        plan={plan}
        planId={planId}
        bookId={bookId}
        userId={userId}
        colorScheme={colorScheme}
      />
    );
  }
  function renderAdaptPG(){
    return (
      <AdaptPG
        userId={userId}
        plan={plan}
        planId={planId}
        colorScheme={colorScheme}
        dayDropIdx={dayIdx}
        onDaySelect={setDayIdx}
        expandedChapters={expanded}
        onToggleChapter={toggleChapter}
        onOpenPlanFetcher={openFetcher}
      />
    );
  }
  function renderAdaptPG2(){
    return (
      <AdaptPG2
        userId={userId}
        plan={plan}
        planId={planId}
        colorScheme={colorScheme}
        dayDropIdx={dayIdx}
        onDaySelect={setDayIdx}
        expandedChapters={expanded}
        onToggleChapter={toggleChapter}
        onOpenPlanFetcher={openFetcher}
      />
    );
  }
  function renderAdaptPlayground(){
    return (
      <AdaptPlayground
        userId={userId}
        plan={plan}
        planId={planId}
        colorScheme={colorScheme}
        dayDropIdx={dayIdx}
        onDaySelect={setDayIdx}
        expandedChapters={expanded}
        onToggleChapter={toggleChapter}
        onOpenPlanFetcher={openFetcher}
      />
    );
  }
  function renderAdapting(){
    return (
      <Adapting
        userId={userId}
        plan={plan}
        planId={planId}
        colorScheme={colorScheme}
        dayDropIdx={dayIdx}
        onDaySelect={setDayIdx}
        expandedChapters={expanded}
        onToggleChapter={toggleChapter}
        onOpenPlanFetcher={openFetcher}
      />
    );
  }
  function renderAggregator(){
    return (
      <AggregatorPanel
        db={db}
        userId={userId}
        planId={planId}
        bookId={bookId}
        colorScheme={colorScheme}
      />
    );
  }

  /* expand / collapse helper */
  function toggleChapter(chKey){
    setExpanded(prev =>
      prev.includes(chKey)
        ? prev.filter(k=>k!==chKey)
        : [...prev, chKey]
    );
  }
}