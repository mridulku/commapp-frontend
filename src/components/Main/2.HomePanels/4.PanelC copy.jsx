/*  ────────────────────────────────────────────────────────────────────
    File:  src/components/DetailedBookViewer/PanelC.jsx
    ──────────────────────────────────────────────────────────────────── */

    import React, { useState, useEffect } from "react";
    import axios from "axios";
    import { Dialog } from "@mui/material";
    import { useSelector } from "react-redux";
    
    // Firestore
    import {
      collection,
      getDocs,
      query,
      where,
      orderBy,
      limit,
    } from "firebase/firestore";
    
    // CHILD PANELS
    import PanelTOEFL   from "./PanelTOEFL";
    import PanelGeneral from "./PanelGeneral";
    import PanelExam    from "./PanelExam";      // ← NEW generic per‑exam panel
    import PlanFetcher  from "../5.StudyModal/StudyModal";
    
    /* ------------------------------------------------------------------ */
    /*  Exam list that should use PanelExam (case‑sensitive to your DB)   */
    /* ------------------------------------------------------------------ */
    const KNOWN_EXAMS = [
      "CBSE",
      "JEE Adv",
      "NEET",
      "SAT",
      "GATE",
      "CAT",
      "GRE",
      "UPSC",
      "FRM",
    ];
    
    /* ------------------------------------------------------------------ */
    /*  Helper functions                                                  */
    /* ------------------------------------------------------------------ */
    function isStageDone(v) {
      if (!v) return false;
      const x = v.toString().toLowerCase();
      return x.includes("done") || x.includes("complete") || x.includes("pass");
    }
    
    function computeOverallProgress(result) {
      const ids = Object.keys(result || {});
      if (!ids.length) return 0;
    
      let sum = 0;
      ids.forEach((id) => {
        const row = result[id] || {};
        let done = 0;
        if (isStageDone(row.reading))    done++;
        if (isStageDone(row.remember))   done++;
        if (isStageDone(row.understand)) done++;
        if (isStageDone(row.apply))      done++;
        if (isStageDone(row.analyze))    done++;
        sum += (done / 5) * 100;
      });
    
      return sum / ids.length;
    }
    
    async function generateAggregatorDoc(userId, planId, bookId) {
      await fetch(
        "https://us-central1-comm-app-ff74b.cloudfunctions.net/generateUserProgressAggregator2",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, planId, bookId }),
        }
      );
    }
    
    async function fetchAggregatorDoc(db, userId, planId, bookId) {
      if (!db) return 0;
    
      const col = collection(db, "aggregator_v2");
      const q = query(
        col,
        where("userId", "==", userId),
        where("planId", "==", planId),
        where("bookId", "==", bookId),
        orderBy("createdAt", "desc"),
        limit(1)
      );
      const snap = await getDocs(q);
      if (snap.empty) return 0;
    
      const data = snap.docs[0].data() || {};
      return computeOverallProgress(data.aggregatorResult || {});
    }
    
    /* ------------------------------------------------------------------ */
    /*  MAIN COMPONENT                                                    */
    /* ------------------------------------------------------------------ */
    export default function PanelC({
      db,
      userId = "",
      onOpenOnboarding = () => {},
      onSeeAllCourses = () => {},
    }) {
      const examType = useSelector((s) => s.exam.examType);
    
      /* ---------------- state ---------------- */
      const [books, setBooks]               = useState([]);
      const [plansData, setPlansData]       = useState({});
      const [showPlanDialog, setShowDlg]    = useState(false);
      const [currentPlanId, setCurrentPid]  = useState(null);
    
      /* ---------------- fetch books ---------------- */
      useEffect(() => {
        if (!userId) return;
    
        (async () => {
          try {
            const res = await axios.get(
              `${import.meta.env.VITE_BACKEND_URL}/api/books-user`,
              { params: { userId } }
            );
            setBooks(res.data?.data || []);
          } catch (e) {
            console.error("fetchBooks:", e);
            setBooks([]);
          }
        })();
      }, [userId]);
    
      /* ---------------- per‑book plan / aggregator ---------------- */
      useEffect(() => {
        if (!books.length) return;
    
        books.forEach((b) => {
          if (!b.id) return;
    
          setPlansData((p) => ({
            ...p,
            [b.id]: { loading: true, hasPlan: false },
          }));
    
          (async () => {
            try {
              const res = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/adaptive-plans`,
                { params: { userId, bookId: b.id } }
              );
              const plans = res.data?.plans || [];
              if (!plans.length) {
                setPlansData((p) => ({
                  ...p,
                  [b.id]: { loading: false, hasPlan: false },
                }));
                return;
              }
    
              plans.sort(
                (a, z) =>
                  new Date(z.createdAt).getTime() - new Date(a.createdAt).getTime()
              );
              const plan = plans[0];
    
              const oldProg = await fetchAggregatorDoc(db, userId, plan.id, b.id);
              await generateAggregatorDoc(userId, plan.id, b.id);
              const newProg = await fetchAggregatorDoc(db, userId, plan.id, b.id);
    
              setPlansData((p) => ({
                ...p,
                [b.id]: {
                  loading: false,
                  hasPlan: true,
                  planId: plan.id,
                  aggregatorProgress: newProg || oldProg || 0,
                },
              }));
            } catch (e) {
              console.error("plan/agg:", e);
              setPlansData((p) => ({
                ...p,
                [b.id]: { loading: false, hasPlan: false, error: e.message },
              }));
            }
          })();
        });
      }, [books, db, userId]);
    
      /* ---------------- open plan modal ---------------- */
      function handleStartLearning(bookId) {
        const info = plansData[bookId];
        if (!info?.planId) return;
        setCurrentPid(info.planId);
        setShowDlg(true);
      }
    
      /* ---------------- choose which panel to render ---------------- */
      let panelEl;
      if (examType === "TOEFL") {
        panelEl = (
          <PanelTOEFL
            books={books}
            plansData={plansData}
            handleStartLearning={handleStartLearning}
            onOpenOnboarding={onOpenOnboarding}
            onSeeAllCourses={onSeeAllCourses}
          />
        );
      } else if (KNOWN_EXAMS.includes(examType)) {
        panelEl = (
          <PanelExam
            books={books}
            plansData={plansData}
            handleStartLearning={handleStartLearning}
            examType={examType}
          />
        );
      } else {
        panelEl = (
          <PanelGeneral
            books={books}
            plansData={plansData}
            handleStartLearning={handleStartLearning}
            onOpenOnboarding={onOpenOnboarding}
            onSeeAllCourses={onSeeAllCourses}
          />
        );
      }
    
      /* ---------------- render ---------------- */
      return (
        <div style={styles.wrapper}>
          {panelEl}
    
          <Dialog
            open={showPlanDialog}
            onClose={() => setShowDlg(false)}
            fullScreen
            PaperProps={{
              sx: { m: 0, borderRadius: 0, width: "100%", height: "100%", bg: "#000" },
            }}
          >
            {currentPlanId ? (
              <PlanFetcher
                planId={currentPlanId}
                userId={userId}
                onClose={() => setShowDlg(false)}
              />
            ) : (
              <p style={{ color: "#fff" }}>No planId found.</p>
            )}
          </Dialog>
        </div>
      );
    }
    
    /* ---------------- styles ---------------- */
    const styles = {
      wrapper: {
        padding: 20,
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        background: "#000",
        color: "#fff",
      },
    };