// File: Child2.jsx (AdaptivePlanContainer)

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  Tabs,
  Tab,
  Button,
} from "@mui/material";
import { doc, getDoc } from "firebase/firestore";

import StatsPanel from "../1.StatsPanel/StatsPanel";
import DailyPlan from "../2.DailyPlan/DailyPlan";
import ProgressView from "../3.ProgressView/ProgressView";
import AdminPanel from "../4.AdminPanel/AdminPanel";
import TimelinePanel from "./TimelinePanel";

// NEW aggregator panel
import AggregatorPanel from "./AggregatorPanel"; 

import PlanFetcher from "../../../../5.StudyModal/StudyModal";
import { db } from "../../../../../../firebase"; // Firestore import

export default function Child2({
  userId = null,
  bookId = "",
  planIds = [],
  colorScheme = {},
}) {
  // ---------- container styling ----------
  const containerStyle = {
    backgroundColor: colorScheme.panelBg || "#0D0D0D",
    color: colorScheme.textColor || "#FFD700",
    padding: "1rem",
    minHeight: "100vh",
    boxSizing: "border-box",
  };

  // We'll hold plan info + the fetched Firestore book name
  const [localPlanIds, setLocalPlanIds] = useState(planIds);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [plan, setPlan] = useState(null);

  // Book name from Firestore
  const [dbBookName, setDbBookName] = useState("Untitled Book");

  // For tab control
  const [activeTab, setActiveTab] = useState(0);

  // For day selection (session index)
  const [dayDropIdx, setDayDropIdx] = useState(0);

  // For expand/collapse chapters
  const [expandedChapters, setExpandedChapters] = useState([]);

  // PlanFetcher dialog
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [dialogPlanId, setDialogPlanId] = useState("");
  const [dialogInitialActivity, setDialogInitialActivity] = useState(null);

  // ============ 1) Re-sync localPlanIds from props
  useEffect(() => {
    setLocalPlanIds(planIds);
  }, [planIds]);

  // ============ 2) If user/book changes => fetch plan IDs + book name
  useEffect(() => {
    if (!userId || !bookId) {
      setLocalPlanIds([]);
      setSelectedPlanId("");
      setPlan(null);
      setDbBookName("Untitled Book");
      return;
    }

    // fetch plan IDs
    async function fetchPlansForBook() {
      try {
        const url = `${import.meta.env.VITE_BACKEND_URL}/api/adaptive-plan-id`;
        const res = await axios.get(url, { params: { userId, bookId } });
        if (res.data && res.data.planIds) {
          setLocalPlanIds(res.data.planIds);
        } else {
          setLocalPlanIds([]);
        }
      } catch (error) {
        setLocalPlanIds([]);
      }
    }

    // fetch the bookName from Firestore => books_demo/{bookId} => field: "name"
    async function fetchBookName() {
      try {
        const docRef = doc(db, "books_demo", bookId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          setDbBookName(data?.name || "Unnamed Book");
        } else {
          setDbBookName("Unnamed Book");
        }
      } catch (err) {
        console.error("Failed to fetch book name:", err);
        setDbBookName("Unnamed Book");
      }
    }

    fetchPlansForBook();
    fetchBookName();
  }, [userId, bookId]);

  // ============ 3) On localPlanIds => pick first or reset
  useEffect(() => {
    if (localPlanIds.length > 0) {
      setSelectedPlanId(localPlanIds[0]);
    } else {
      setSelectedPlanId("");
      setPlan(null);
    }
  }, [localPlanIds]);

  // ============ 4) Fetch plan doc once we have selectedPlanId
  useEffect(() => {
    if (!selectedPlanId) {
      setPlan(null);
      return;
    }
    async function fetchPlanDoc() {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/adaptive-plan`,
          { params: { planId: selectedPlanId } }
        );
        if (res.data && res.data.planDoc) {
          setPlan(res.data.planDoc);
        } else {
          setPlan(null);
        }
      } catch (err) {
        setPlan(null);
      }
    }
    fetchPlanDoc();
  }, [selectedPlanId]);

  // ============ 5) If plan changes => reset tab/day, etc.
  useEffect(() => {
    setActiveTab(0);
    setDayDropIdx(0);
    setExpandedChapters([]);
  }, [plan]);

  // ---------- Handlers ----------
  function handleChangeTab(e, newVal) {
    setActiveTab(newVal);
  }

  function handleDaySelect(newIdx) {
    setDayDropIdx(newIdx);
  }

  function toggleChapter(chapterKey) {
    setExpandedChapters((prev) =>
      prev.includes(chapterKey)
        ? prev.filter((k) => k !== chapterKey)
        : [...prev, chapterKey]
    );
  }

  // PlanFetcher => "Resume Learning" or activity clicks
  function handleOpenPlanFetcher(planId, activity) {
    setDialogPlanId(planId);
    if (activity) {
      setDialogInitialActivity({
        subChapterId: activity.subChapterId,
        type: activity.type,
        stage: activity.quizStage || null,
      });
    } else {
      setDialogInitialActivity(null);
    }
    setShowPlanDialog(true);
  }

  // ---------- Render
  if (localPlanIds.length === 0 && !plan) {
    return (
      <div style={containerStyle}>
        <h2 style={{ color: colorScheme.heading || "#FFD700", margin: 0 }}>
          No Plans Found
        </h2>
        <p>No plan IDs found for user/book.</p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* ROW => Book Title + "Resume Learning" + "Select Plan" dropdown in one row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "flex-start",
          gap: "1rem",
          marginBottom: "1rem",
        }}
      >
        {/* Book Title */}
        <h2
          style={{
            fontWeight: "bold",
            fontSize: "1.4rem",
            margin: 0,
            color: colorScheme.heading || "#FFD700",
          }}
        >
          {dbBookName}
        </h2>

        {/* "Resume Learning" button => next to the book name */}
        <Button
          variant="contained"
          onClick={() => handleOpenPlanFetcher(selectedPlanId, null)}
          sx={{
            backgroundColor: colorScheme.heading || "#FFD700",
            color: "#000",
            fontWeight: "bold",
            borderRadius: "4px",
            "&:hover": {
              backgroundColor: "#e5c100",
            },
          }}
          disabled={!selectedPlanId}
        >
          Resume Learning
        </Button>

        {/* If multiple plans => show plan dropdown on the far right */}
        {localPlanIds.length > 1 && (
          <div style={{ display: "flex", alignItems: "center" }}>
            <label style={{ marginRight: 6, color: "#fff" }}>
              Select Plan:
            </label>
            <select
              style={{
                marginLeft: 4,
                backgroundColor: "#222",
                color: "#fff",
                border: "1px solid #555",
                borderRadius: "4px",
                padding: "2px 6px",
              }}
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
            >
              {localPlanIds.map((pid) => (
                <option key={pid} value={pid}>
                  {pid}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 2) StatsPanel => includes six tiles: overall progress, daily progress, exam date, daily plan, chapters, sub-chaps */}
      <StatsPanel plan={plan} colorScheme={colorScheme} />

      {/* 4) TABS => Daily Plan (0), Progress (1), Timeline (2), AdminPanel (3), Aggregator (4) */}
      <Tabs
        value={activeTab}
        onChange={handleChangeTab}
        textColor="inherit"
        TabIndicatorProps={{
          style: {
            backgroundColor: colorScheme.heading || "#FFD700",
          },
        }}
        sx={{ marginBottom: "1rem" }}
      >
        <Tab label="Daily Plan" />
        <Tab label="Progress" />
        <Tab label="Timeline" />
        <Tab label="Admin Panel" />
        <Tab label="Aggregator" />
      </Tabs>

      {!selectedPlanId ? (
        <div>No Plan ID selected.</div>
      ) : !plan ? (
        <div>Loading plan data...</div>
      ) : (
        renderTabContent()
      )}

      {/* PlanFetcher dialog */}
      <Dialog
        open={showPlanDialog}
        onClose={() => setShowPlanDialog(false)}
        fullScreen
      >
        <DialogContent
          sx={{
            flex: 1,
            overflowY: "auto",
            p: 0,
            backgroundColor: "#000",
          }}
        >
          {dialogPlanId ? (
            <PlanFetcher
              planId={dialogPlanId}
              initialActivityContext={dialogInitialActivity}
              userId={userId}
              onClose={() => setShowPlanDialog(false)}
            />
          ) : (
            <p style={{ margin: "1rem" }}>No planId found. Cannot load plan.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  function renderTabContent() {
    if (activeTab === 0) {
      // Daily Plan
      return (
        <DailyPlan
          plan={plan}
          planId={selectedPlanId}
          colorScheme={colorScheme}
          dayDropIdx={dayDropIdx}
          onDaySelect={handleDaySelect}
          expandedChapters={expandedChapters}
          onToggleChapter={toggleChapter}
          onOpenPlanFetcher={handleOpenPlanFetcher}
        />
      );
    } else if (activeTab === 1) {
      // Progress
      return (
        <ProgressView
          db={db}
          userId={userId}
          planId={selectedPlanId}
          bookId={bookId}
          colorScheme={colorScheme}
        />
      );
    } else if (activeTab === 2) {
      // Timeline
      return (
        <TimelinePanel
          db={db}
          userId={userId}
          planId={selectedPlanId}
          bookId={bookId}
          colorScheme={colorScheme}
        />
      );
    } else if (activeTab === 3) {
      // Admin Panel
      return (
        <AdminPanel
          db={db}
          plan={plan}
          planId={selectedPlanId}
          bookId={bookId}
          userId={userId}
          colorScheme={colorScheme}
        />
      );
    } else {
      // NEW aggregator tab
      return (
        <AggregatorPanel
          db={db}
          userId={userId}
          planId={selectedPlanId}
          bookId={bookId}
          colorScheme={colorScheme}
        />
      );
    }
  }
}