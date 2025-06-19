// -------------------------------------------------------------
// /src/components/MaterialsDashboard.jsx   (v4 – create-plan flow)
// -------------------------------------------------------------
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch }   from "react-redux";
import DashboardHeader     from "./DashboardHeader";

import { useLocation } from "react-router-dom";   // NEW

import usePlans            from "./usePlans";
import PlanDropdown        from "./PlanDropdown";

import { Dialog, DialogContent } from "@mui/material";
import PlanFetcher         from "../../5.StudyModal/StudyModal";
import GuideOnboarding from "../../5.StudyModal/0.components/Main/Base/Guide/GuideOnboarding";

import { doc, getDoc }     from "firebase/firestore";
import { db }              from "../../../../firebase";

import { Grid, Box }       from "@mui/material";

import Child2              from "../3.AdaptivePlanView/0.Parent/0.Parent";
import Loader              from "./Loader";

import { setAuth }         from "../../../../store/authSlice";

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

  /* ---------- Plan-player dialog state ---------- */
  const [showPlayer, setShowPlayer] = useState(false);
  const [playerPlan, setPlayerPlan] = useState(null);

  const handleResume = () => {
    if (selectedPlanId) {
      setPlayerPlan(selectedPlanId);
      setShowPlayer(true);
    }
  };

  /* ---------- New-plan wizard dialog state ---------- */
  const [showOnboard, setShowOnboard] = useState(false);

  const handleCreatePlan = () => {
    setShowOnboard(true);
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
    loading: loadingPlans,
  } = usePlans({ userId, bookId });

   /* ---------- NEW: pre-select plan coming from HomeHub ---------- */
const location = useLocation();
useEffect(() => {
  const incoming = location.state?.planId;
  if (incoming && planIds.includes(incoming)) {
    setSelectedPlanId(incoming);        // auto-select once
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [location.state?.planId, planIds.length]);

  /* ---------- subject list for header chips ---------- */
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
        zIndex={1000}
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

  const currentMeta = metaMap?.[selectedPlanId] || {};
  const subjectList = subjects.length ? subjects
                                      : currentMeta.subjects || [];

  /* ---------- MAIN RENDER ---------- */
  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>

      {/* ─── PAGE HEADER ─── */}
      <DashboardHeader
        planName={
          <PlanDropdown
            selectedId={selectedPlanId}
            planIds={planIds}
            metaMap={metaMap}
            onSelect={setSelectedPlanId}
            onCreate={handleCreatePlan}          /* NEW */
          />
        }
        subjects={subjectList}
        onResume={handleResume}
        kpis={[
          { icon: "⏱️", label: "Time Studied Today", value: "0 h 0 m" },
          { icon: "🎯", label: "Today’s Target",     value: "0 %"    },
          { icon: "📈", label: "Total Time Studied", value: "0 h"   },
          { icon: "🔥", label: "Current Streak",     value: "1 day"  },
        ]}
      />

      {/* ─── TWO-COLUMN LAYOUT BELOW ─── */}
      <Grid container sx={{ flex: 1 }}>
        {/* RIGHT column — adaptive plan viewer */}
        <Grid item xs={12}>
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

          {/* Existing Plan-player dialog */}
          <Dialog open={showPlayer} onClose={() => setShowPlayer(false)} fullScreen>
            <DialogContent sx={{ p: 0, bgcolor: "#000" }}>
              {playerPlan && (
                <PlanFetcher
                  planId={playerPlan}
                  initialActivityContext={null}  /* null ⇒ resume last */
                  userId={userId}
                  onClose={() => setShowPlayer(false)}
                />
              )}
            </DialogContent>
          </Dialog>

          {/* NEW: GuideOnboarding dialog */}
          <Dialog open={showOnboard} onClose={() => setShowOnboard(false)} fullScreen>
            <DialogContent sx={{ p: 0, bgcolor: "#000" }}>
              {showOnboard && (
                <GuideOnboarding
                  onClose={() => setShowOnboard(false)}
                  onPlanCreated={(newId) => {
                    if (newId) setSelectedPlanId(newId); // auto-select new plan
                    setShowOnboard(false);
                  }}
                  showCloseBtn            // ⇠  we want the “×” in this context
                />
              )}
            </DialogContent>
          </Dialog>
        </Grid>
      </Grid>
    </Box>
  );
}