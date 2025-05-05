// -------------------------------------------------------------
// /src/components/MaterialsDashboard.jsx
// -------------------------------------------------------------
import React, { useEffect, useState } from "react";
import { useSelector }  from "react-redux";
import axios            from "axios";
import { doc, getDoc }  from "firebase/firestore";
import { db }           from "../../../../../firebase";           // TODO: adjust path

import { Grid, Box, CircularProgress } from "@mui/material";

import PlanSelector from "../1.SelectionPanel/PlanSelector";      // left column
import Child2       from "../3.AdaptivePlanView/0.Parent/0.Parent";
import StatsPanel   from "./StatsPanel";      // ➊ NEW

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
  /* -------- Redux -------- */
  const examType = useSelector((s) => s.exam?.examType);

  /* -------- 1) lookup bookId -------- */
  const [bookId,    setBookId]    = useState(null);
  const [bookErr,   setBookErr]   = useState(null);
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
        const id = Array.isArray(entry)
          ? entry?.[0]?.newBookId
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

  /* -------- 2) fetch plan IDs -------- */
  const [planIds,        setPlanIds]        = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");

  useEffect(() => {
    if (!userId || !bookId) return;
    (async () => {
      try {
        const res = await axios.get(
          `${backendURL}/api/adaptive-plan-id`,
          { params: { userId, bookId } }
        );
        const ids = res.data?.planIds || [];
        setPlanIds(ids);
        if (ids.length) setSelectedPlanId(ids[0]);
      } catch (e) {
        console.error("planId fetch:", e);
        setPlanIds([]);
        setSelectedPlanId("");
      }
    })();
  }, [userId, bookId, backendURL]);

  const handlePlanSelect = (pid) => setSelectedPlanId(pid);

  /* -------- loading / error -------- */
  if (loadingBook) {
    return (
      <Box sx={{ width:"100%", textAlign:"center", mt:4 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (bookErr || !bookId) {
    return (
      <Box sx={{ p:2, color:"#f44336" }}>
        {bookErr || "No configured book found for this exam."}
      </Box>
    );
  }

  /* -------- RENDER -------- */
  /* -------- RENDER -------- */
return (
  <Box sx={{ width:"100%", height:"100%", display:"flex", flexDirection:"column" }}>

    {/* ─── STATS STRIP ACROSS THE TOP ─── */}
    <Box sx={{ px:2, pt:2 }}>
      <StatsPanel userId={userId} />
    </Box>

    {/* ─── TWO-COLUMN LAYOUT BELOW ─── */}
    <Grid container sx={{ flex:1 /* fill remaining height */ }}>
      {/* LEFT column — My Plans */}
      <Grid item xs={12} md={4} lg={3}
            sx={{ borderRight:"1px solid #333", bgcolor:"#000" }}>
        <PlanSelector
          planIds={planIds}
          selectedPlanId={selectedPlanId}
          onPlanSelect={handlePlanSelect}
          onOpenOnboarding={onOpenOnboarding}
        />
      </Grid>

      {/* RIGHT column — adaptive plan viewer */}
      <Grid item xs={12} md={8} lg={9} sx={{ bgcolor:"#111" }}>
        <Box sx={{ p:2, height:"100%", display:"flex", flexDirection:"column" }}>
          <Box sx={{ flexGrow:1, overflowY:"auto" }}>
            <Child2
              userId={userId}
              isAdmin={isAdmin}
              bookId={bookId}
              planId={selectedPlanId}
              backendURL={backendURL}
              onOverviewSelect={onHomeSelect}
              onOpenPlayer={onOpenPlayer}
              colorScheme={{
                panelBg:    themeColors.sidebarBg,
                textColor:  themeColors.textPrimary,
                borderColor: themeColors.borderColor,
                heading:    themeColors.accent,
              }}
            />
          </Box>
        </Box>
      </Grid>
    </Grid>
  </Box>
);
}