// src/components/DetailedBookViewer/Child2.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import HistoryTab from "./HistoryTab";
import PlanFetcher from "../../PlanFetcher"; // Adjust path if needed

/**
 * Child2
 *  - Renders "Adaptive Plan" heading
 *  - Has a "History" tab plus sessions as tabs
 *  - On user click of "Read"/"Quiz"/"Revise", opens a MUI Dialog with PlanFetcher
 *    passing initialActivityContext (subChapterId, type).
 *
 * Props:
 *  - userId: string
 *  - bookId: string
 *  - planIds: string[]
 *  - onOverviewSelect: function(activity) => void  (unused, left in for compatibility)
 *  - colorScheme: { panelBg, textColor, borderColor, heading }
 */
export default function Child2({
  userId = null,
  bookId = "",
  planIds = [],
  onOverviewSelect = () => {},
  colorScheme = {},
}) {
  // ------------------------------------------
  // STYLES & HELPER
  // ------------------------------------------
  function activityButtonStyle(isEnabled) {
    return {
      backgroundColor: isEnabled ? (colorScheme.heading || "#FFD700") : "#777777",
      color: isEnabled ? "#000" : "#ccc",
      border: "none",
      borderRadius: "4px",
      padding: "6px 10px",
      cursor: isEnabled ? "pointer" : "not-allowed",
      fontWeight: "bold",
      fontSize: "0.9rem",
      minWidth: "75px",
    };
  }

  // ------------------------------------------
  // 1) localPlanIds
  // ------------------------------------------
  const [localPlanIds, setLocalPlanIds] = useState(planIds);

  useEffect(() => {
    setLocalPlanIds(planIds);
  }, [planIds]);

  // ------------------------------------------
  // 2) Fetch plan IDs whenever bookId changes
  // ------------------------------------------
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    async function fetchPlansForBook() {
      if (!userId || !bookId) {
        console.log("[Child2] fetchPlansForBook => missing userId or bookId");
        setLocalPlanIds([]);
        setSelectedPlanId("");
        setPlan(null);
        return;
      }

      console.log(
        `[Child2] fetching plan IDs for userId="${userId}" bookId="${bookId}"...`
      );

      try {
        const url = `${import.meta.env.VITE_BACKEND_URL}/api/adaptive-plan-id`;
        const res = await axios.get(url, { params: { userId, bookId } });
        if (res.data && res.data.planIds) {
          console.log("[Child2] planIds returned =>", res.data.planIds);
          setLocalPlanIds(res.data.planIds);
        } else {
          console.warn("[Child2] No planIds returned =>", res.data);
          setLocalPlanIds([]);
        }
      } catch (error) {
        console.error("[Child2] Error fetching plan IDs by bookId =>", error);
        setLocalPlanIds([]);
      }
    }

    fetchPlansForBook();
  }, [userId, bookId]);

  // Whenever localPlanIds changes => pick the first or reset
  useEffect(() => {
    if (localPlanIds.length > 0) {
      console.log("[Child2] localPlanIds changed => picking first =>", localPlanIds[0]);
      setSelectedPlanId(localPlanIds[0]);
    } else {
      console.log("[Child2] localPlanIds empty => clearing planId");
      setSelectedPlanId("");
      setPlan(null);
    }
  }, [localPlanIds]);

  // ------------------------------------------
  // 3) Fetched Plan (in local state) – for local display/tabs
  // ------------------------------------------
  useEffect(() => {
    if (!selectedPlanId) {
      setPlan(null);
      return;
    }

    async function fetchPlanDoc() {
      console.log("[Child2] fetching planDoc => planId:", selectedPlanId);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/adaptive-plan`,
          { params: { planId: selectedPlanId } }
        );
        if (res.data && res.data.planDoc) {
          console.log("[Child2] planDoc fetched =>", res.data.planDoc);
          setPlan(res.data.planDoc);
        } else {
          console.error("[Child2] No planDoc in response =>", res.data);
          setPlan(null);
        }
      } catch (err) {
        console.error("[Child2] Error fetching planDoc =>", err);
        setPlan(null);
      }
    }

    fetchPlanDoc();
  }, [selectedPlanId]);

  // ------------------------------------------
  // 4) Session Tab
  // ------------------------------------------
  const [activeSessionIndex, setActiveSessionIndex] = useState(0);

  // Reset the active tab if plan changes
  useEffect(() => {
    setActiveSessionIndex(0);
  }, [plan]);

  // Expand/Collapse
  const [expandedChapters, setExpandedChapters] = useState([]);
  useEffect(() => {
    setExpandedChapters([]);
  }, [plan]);

  function toggleChapter(key) {
    setExpandedChapters((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  // ------------------------------------------
  // 5) PlanFetcher Dialog
  // ------------------------------------------
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [dialogPlanId, setDialogPlanId] = useState("");
  const [dialogInitialActivity, setDialogInitialActivity] = useState(null);

  // This function is triggered on "Read"/"Quiz"/"Revise" click
  function handleOpenPlanFetcher(planId, activity) {
    console.log("[Child2] handleOpenPlanFetcher => planId:", planId, "activity:", activity);

    setDialogPlanId(planId);
    if (!activity) {
      console.warn("[Child2] handleOpenPlanFetcher => no activity provided");
      setDialogInitialActivity(null);
    } else {
      const subChId = activity.subChapterId;
      const actType = activity.type;
      console.log("[Child2] Setting dialogInitialActivity =>", {
        subChapterId: subChId,
        type: actType,
      });
      setDialogInitialActivity({
        subChapterId: subChId,
        type: actType,
      });
    }

    setShowPlanDialog(true);
  }

  // ------------------------------------------
  // RENDER
  // ------------------------------------------
  // Basic container
  const containerStyle = {
    backgroundColor: colorScheme.panelBg || "#0D0D0D",
    color: colorScheme.textColor || "#FFD700",
    padding: "1rem",
    minHeight: "100vh",
  };

  const headingStyle = {
    fontWeight: "bold",
    marginBottom: "15px",
    fontSize: "1.25rem",
    color: colorScheme.heading || "#FFD700",
  };

  if (localPlanIds.length === 0 && !plan) {
    return (
      <div style={containerStyle}>
        <h2 style={headingStyle}>Adaptive Plan</h2>
        <div>
          No plan IDs found for userId="{userId}" and bookId="{bookId}".
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>Adaptive Plan</h2>

      {/* If there's more than 1 plan ID => show a dropdown */}
      {localPlanIds.length > 1 && (
        <div style={{ marginBottom: "1rem" }}>
          <label>Select Plan:</label>
          <select
            style={{ marginLeft: 10 }}
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

      {!selectedPlanId ? (
        <div>No Plan ID selected.</div>
      ) : !plan ? (
        <div>Loading plan data...</div>
      ) : (
        renderPlan(plan)
      )}

      {/* The new Redux-based PlanFetcher dialog */}
      <Dialog
        open={showPlanDialog}
        onClose={() => setShowPlanDialog(false)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>Adaptive Plan Viewer</DialogTitle>
        <DialogContent>
          <p style={{ fontSize: "0.85rem", color: "#888" }}>
            {`[Child2 -> PlanFetcher] planId: ${dialogPlanId}`}
            <br />
            {`initialActivityContext: ${JSON.stringify(dialogInitialActivity, null, 2)}`}
          </p>

          {dialogPlanId ? (
            <PlanFetcher
              planId={dialogPlanId}
              // pass the initialActivityContext to help jump to the correct subchapter
              initialActivityContext={dialogInitialActivity}
            />
          ) : (
            <p>No planId found. Cannot load plan.</p>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPlanDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );

  // ------------------------------------------
  // renderPlan => Show local plan's sessions
  // ------------------------------------------
  function renderPlan(planObj) {
    const { sessions = [] } = planObj;
    if (sessions.length === 0) {
      return <div>No sessions found in this plan.</div>;
    }

    return (
      <>
        {/* TABS container */}
        <div style={{ display: "flex", marginBottom: "1rem" }}>
          {/* Tab 0 => History */}
          <div
            style={tabStyle(activeSessionIndex === 0)}
            onClick={() => setActiveSessionIndex(0)}
          >
            History
          </div>

          {sessions.map((sess, index) => {
            const tabIndex = index + 1;
            let sessionDisplayName;
            const sLabel = Number(sess.sessionLabel);
            if (sLabel === 1) sessionDisplayName = "Today";
            else if (sLabel === 2) sessionDisplayName = "Tomorrow";
            else sessionDisplayName = `Day ${sLabel}`;

            const totalTime = (sess.activities || []).reduce(
              (acc, a) => acc + (a.timeNeeded || 0),
              0
            );
            const label = `${sessionDisplayName} (${totalTime} min)`;

            return (
              <div
                key={sess.sessionLabel}
                style={tabStyle(activeSessionIndex === tabIndex)}
                onClick={() => setActiveSessionIndex(tabIndex)}
              >
                {label}
              </div>
            );
          })}
        </div>

        {activeSessionIndex === 0
          ? <HistoryTab />
          : renderSessionContent(sessions[activeSessionIndex - 1])}
      </>
    );
  }

  // Style for each tab
  function tabStyle(isActive) {
    return {
      padding: "0.5rem 1rem",
      cursor: "pointer",
      border: `1px solid ${colorScheme.borderColor || "#FFD700"}`,
      borderBottom: isActive
        ? "none"
        : `1px solid ${colorScheme.borderColor || "#FFD700"}`,
      borderRadius: "8px 8px 0 0",
      marginRight: "5px",
      backgroundColor: isActive ? "#2F2F2F" : "#3D3D3D",
      color: colorScheme.textColor || "#FFD700",
    };
  }

  function renderSessionContent(session) {
    if (!session) return null;
    const { activities = [] } = session;

    // Group by book
    const bookMap = new Map();
    for (const act of activities) {
      if (!bookMap.has(act.bookId)) {
        bookMap.set(act.bookId, []);
      }
      bookMap.get(act.bookId).push(act);
    }
    const uniqueBooks = [...bookMap.keys()];

    if (uniqueBooks.length === 1) {
      const singleBookId = uniqueBooks[0];
      const singleBookActivities = bookMap.get(singleBookId) || [];
      return renderChaptersLayer(singleBookActivities, singleBookId, true);
    }

    return (
      <div style={{ marginTop: "1rem" }}>
        {uniqueBooks.map((bId) => {
          const acts = bookMap.get(bId) || [];
          const bookName = acts[0]?.bookName || `Book (${bId})`;
          const totalBookTime = acts.reduce((acc, a) => acc + (a.timeNeeded || 0), 0);

          return (
            <div key={bId} style={{ marginBottom: "1rem" }}>
              <h3 style={{ fontWeight: "bold", margin: "0.75rem 0 0.25rem" }}>
                {bookName} ({totalBookTime} min)
              </h3>
              {renderChaptersLayer(acts, bId, false)}
            </div>
          );
        })}
      </div>
    );
  }

  function renderChaptersLayer(activities, bookId, skipBookLayer) {
    const chapterMap = new Map();
    for (const act of activities) {
      if (!chapterMap.has(act.chapterId)) {
        chapterMap.set(act.chapterId, []);
      }
      chapterMap.get(act.chapterId).push(act);
    }

    return (
      <div style={{ marginLeft: skipBookLayer ? 0 : "1rem" }}>
        {[...chapterMap.entries()].map(([chapterId, cActs]) => {
          const chapterKey = `book${bookId}-chap${chapterId}`;
          const isChapterOpen = expandedChapters.includes(chapterKey);

          const chapterName = cActs[0]?.chapterName || `Chapter (${chapterId})`;
          const totalChapterTime = cActs.reduce(
            (acc, a) => acc + (a.timeNeeded || 0),
            0
          );
          const chapterLabel = `${chapterName} (${totalChapterTime} min)`;

          return (
            <div key={chapterId} style={{ marginBottom: "1rem" }}>
              <div
                style={{
                  cursor: "pointer",
                  padding: "8px 12px",
                  margin: "6px 0",
                  backgroundColor: "#2F2F2F",
                  borderRadius: "4px",
                  border: `1px solid ${colorScheme.borderColor || "#FFD700"}`,
                  fontWeight: "bold",
                }}
                onClick={() => toggleChapter(chapterKey)}
              >
                {isChapterOpen ? "▾" : "▸"}{" "}
                <span style={{ marginLeft: 5 }}>{chapterLabel}</span>
              </div>
              {isChapterOpen && renderSubChapterCards(cActs)}
            </div>
          );
        })}
      </div>
    );
  }

  function renderSubChapterCards(chapterActivities) {
    const subMap = new Map();
    for (const act of chapterActivities) {
      if (!subMap.has(act.subChapterId)) {
        subMap.set(act.subChapterId, []);
      }
      subMap.get(act.subChapterId).push(act);
    }

    return (
      <div style={{ marginTop: "0.5rem", marginLeft: "1.5rem" }}>
        {[...subMap.entries()].map(([subId, subActs]) => {
          const readAct = subActs.find((a) => a.type === "READ");
          const quizAct = subActs.find((a) => a.type === "QUIZ");
          const reviseAct = subActs.find((a) => a.type === "REVISE");
          const subName = subActs[0]?.subChapterName || `Sub-Chapter (${subId})`;

          return (
            <div
              key={subId}
              style={{
                backgroundColor: "#3D3D3D",
                border: `1px solid ${colorScheme.borderColor || "#FFD700"}`,
                borderRadius: "6px",
                padding: "1rem",
                margin: "0.5rem 0",
              }}
            >
              <div
                style={{
                  fontSize: "0.95rem",
                  fontWeight: "bold",
                  marginBottom: "0.5rem",
                }}
              >
                {subName}
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                {/* READ */}
                <button
                  style={activityButtonStyle(!!readAct)}
                  disabled={!readAct}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (readAct) {
                      console.log("[Child2] 'READ' clicked =>", readAct);
                      handleOpenPlanFetcher(selectedPlanId, readAct);
                    }
                  }}
                >
                  {readAct ? `Read (${readAct.timeNeeded || 0}m)` : "Read"}
                </button>

                {/* QUIZ */}
                <button
                  style={activityButtonStyle(!!quizAct)}
                  disabled={!quizAct}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (quizAct) {
                      console.log("[Child2] 'QUIZ' clicked =>", quizAct);
                      handleOpenPlanFetcher(selectedPlanId, quizAct);
                    }
                  }}
                >
                  {quizAct ? `Quiz (${quizAct.timeNeeded || 0}m)` : "Quiz"}
                </button>

                {/* REVISE */}
                <button
                  style={activityButtonStyle(!!reviseAct)}
                  disabled={!reviseAct}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (reviseAct) {
                      console.log("[Child2] 'REVISE' clicked =>", reviseAct);
                      handleOpenPlanFetcher(selectedPlanId, reviseAct);
                    }
                  }}
                >
                  {reviseAct ? `Revise (${reviseAct.timeNeeded || 0}m)` : "Revise"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
}