// -------------------------------------------------------------
// /src/components/MaterialsDashboard.jsx   (v3 – live plan list)
// -------------------------------------------------------------
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch }   from "react-redux";
import DashboardHeader from "./DashboardHeader";   // ⬅️ NE

import usePlans     from "./usePlans";
import PlanDropdown from "./PlanDropdown";

import { Dialog, DialogContent } from "@mui/material";
import PlanFetcher from "../../5.StudyModal/StudyModal";   // ← tweak the path if your folders differ
/* axios import kept in case you use it elsewhere in this file */
// import axios                        from "axios";

import {
  doc, getDoc,
  collection, query, where, orderBy, onSnapshot   // ⬅️ new
} from "firebase/firestore";
import { db } from "../../../../firebase";        // adjust path if needed

import { Grid, Box } from "@mui/material";

import PlanSelector from "../1.PlanSelector/PlanSelector";
import Child2       from "../3.AdaptivePlanView/0.Parent/0.Parent";
import StatsPanel   from "../4.StatsPanel/StatsPanel";
import Loader       from "./Loader";

import { setAuth }  from "../../../../store/authSlice";

/* -------------------------------------------------------------
   Map exam → field in users/{uid} that stores the cloned book
------------------------------------------------------------- */
const FIELD_MAP = {
  NEET  : "clonedNeetBook",
  TOEFL : "clonedToeflBooks",
};

const ADMIN_UIDS = ["acbhbtiODoPPcks2CP6Z"];

/* =================================================================
   MAIN COMPONENT
   ================================================================= */
export default function MaterialsDashboard({
  userId,
  backendURL        = import.meta.env.VITE_BACKEND_URL,
  onOpenOnboarding  = () => {},
  onHomeSelect      = () => {},
  onOpenPlayer      = () => {},
  themeColors       = {},
}) {
  /* ---------- auth (hydrate userId in the store) ---------- */
  const dispatch = useDispatch();
  useEffect(() => {
    if (userId) dispatch(setAuth({ userId }));
  }, [userId, dispatch]);

  /* ---------- exam type from global store ---------- */
  const examType = useSelector((s) => s.exam?.examType);

    /* ---------- resume-player dialog state ---------- */
  const [showPlayer, setShowPlayer] = useState(false);
  const [playerPlan, setPlayerPlan] = useState(null);

  const handleResume = () => {
    if (selectedPlanId) {
      setPlayerPlan(selectedPlanId);
      setShowPlayer(true);
    }
  };

  /* ---------- 1) look up bookId in users/{uid} ---------- */
  const [bookId,      setBookId]      = useState(null);
  const [bookErr,     setBookErr]     = useState(null);
  const [loadingBook, setLoadingBook] = useState(false);

  const isAdmin = ADMIN_UIDS.includes(userId);

  useEffect(() => {
    if (!userId || !examType) return;
    (async () => {
      setLoadingBook(true); setBookErr(null);
      try {
        const snap = await getDoc(doc(db, "users", userId));
        if (!snap.exists()) throw new Error("user doc not found");

        const entry = snap.data()[FIELD_MAP[examType.toUpperCase()]];
        const id    = Array.isArray(entry) ? entry?.[0]?.newBookId
                                           : entry?.newBookId;
        if (!id) throw new Error("newBookId missing in user doc");
        setBookId(id);
      } catch (e) {
        console.error("book lookup:", e);
        setBookErr(e.message || String(e));
      } finally {
        setLoadingBook(false);
      }
    })();
  }, [userId, examType]);
  
    /* ---------- use shared hook ------------ */
  const {
    planIds,
    metaMap,
    selected: selectedPlanId,
    setSelected: setSelectedPlanId,
    loading: loadingPlans
  } = usePlans({ userId, bookId });

  /* ---------- loading / error UI ---------- */

    /* ───────────────────────────────────────────────
     OPTIONAL: pull *subjects* for header chip list
     (If your usePlans hook already puts .subjects
     inside metaMap, you can delete this block.)
  ─────────────────────────────────────────────── */

  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    if (!selectedPlanId) { setSubjects([]); return; }
    (async () => {
      try {
        const snap = await getDoc(doc(db, "adaptive_demo", selectedPlanId));
        const data = snap.exists() ? snap.data() : {};
        const subjArr =
          (data.subjects || []).map((s) => s.title || s.name || String(s));
        setSubjects(subjArr);
      } catch (e) {
        console.warn("failed to fetch subjects →", e);
        setSubjects([]);
      }
    })();
  }, [selectedPlanId]);

  /* ---------- loading / error UI ---------- */


  if (loadingBook || loadingPlans) {
    return (
      <Loader
        type="bar"
        fullScreen
        accent={themeColors.accent || "#BB86FC"}
        message="Loading your study plans…"
        zIndex={1000}               /* one step below MUI modal (1300) */
      />
    );
  }

  if (bookErr || !bookId) {
    return (
      <Box sx={{ p: 2, color: "#f44336" }}>
        {bookErr || "No configured book found for this exam."}
      </Box>
    );
  }

  /* If you kept the effect above, prefer its list;
     otherwise fall back to metaMap (from usePlans). */
  const currentMeta    = metaMap?.[selectedPlanId] || {};
  const subjectList    = subjects.length ? subjects
                                         : currentMeta.subjects || [];
 

  /* ---------- MAIN RENDER ---------- */
  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>

      {/* ─── STATS STRIP ACROSS THE TOP ─── */}
            {/* ─── PAGE HEADER / HERO ─── */}
      <DashboardHeader
               /* Replace hard-coded title with dropdown */
        planName={ <PlanDropdown
                     selectedId={selectedPlanId}
                     planIds={planIds}
                     metaMap={metaMap}
                     onSelect={setSelectedPlanId}
                   /> }
        subjects={subjectList}
        onResume={handleResume} 
        kpis={[
          { icon: "⏱️", label: "Time Studied Today", value: "7 h 6 m" },
          { icon: "🎯", label: "Today’s Target",       value: "60 %"   },
          { icon: "📈", label: "Total Time Studied",   value: "195 h"  },
          { icon: "🔥", label: "Current Streak",       value: "2 days"},
        ]}
      />
 
      {/* (optional) keep StatsPanel below if you still want it) */}
      {/* <Box sx={{ px: 2, pt: 2 }}>
           <StatsPanel userId={userId} />
         </Box> */}

      {/* ─── TWO-COLUMN LAYOUT BELOW ─── */}
      <Grid container sx={{ flex: 1 }}>

        {/* LEFT column — My Plans */}
        

        {/* RIGHT column — adaptive plan viewer */}
        <Grid item xs={12} >
          <Box sx={{ p: 0, height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ flexGrow: 1, overflowY: "auto" }}>
              <Child2
                userId={userId}
                isAdmin={isAdmin}
                bookId={bookId}
                planId={selectedPlanId}
                backendURL={backendURL}
                onOverviewSelect={onHomeSelect}
                onOpenPlayer={onOpenPlayer}
                colorScheme={{
                  panelBg:     themeColors.sidebarBg,
                  textColor:   themeColors.textPrimary,
                  borderColor: themeColors.borderColor,
                  heading:     themeColors.accent,
                }}
              />
            </Box>
          </Box>
           <Dialog open={showPlayer} onClose={()=>setShowPlayer(false)} fullScreen>
      <DialogContent sx={{ p:0, bgcolor:"#000" }}>
        {playerPlan && (
          <PlanFetcher
            planId={playerPlan}
            initialActivityContext={null}  /* null ⇒ resume last */
            userId={userId}
            onClose={()=>setShowPlayer(false)}
          />
        )}
      </DialogContent>
    </Dialog>
        </Grid>
      </Grid>
    </Box>

   
  );
}