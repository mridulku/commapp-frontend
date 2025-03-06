//
// src/components/DetailedBookViewer/Child2.jsx
//

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  Button,
} from "@mui/material";
import HistoryTab from "./HistoryTab";
import PlanFetcher from "../../PlanFetcher"; // Adjust path if needed

export default function Child2({
  userId = null,
  bookId = "",
  planIds = [],
  onOverviewSelect = () => {},
  colorScheme = {},
}) {
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
      margin: "2px 0", // small vertical spacing
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
        console.log("[Child2] Missing userId or bookId => clearing plan data");
        setLocalPlanIds([]);
        setSelectedPlanId("");
        setPlan(null);
        return;
      }

      console.log(`[Child2] fetching plan IDs for userId="${userId}" bookId="${bookId}"...`);

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
        console.error("[Child2] Error fetching plan IDs =>", error);
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
  // 3) Fetched Plan (in local state)
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

  // Expand/Collapse (only used for local plan display)
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

  function handleOpenPlanFetcher(planId, activity) {
    console.log("[Child2] handleOpenPlanFetcher => planId:", planId, "activity:", activity);

    setDialogPlanId(planId);
    if (!activity) {
      console.warn("[Child2] handleOpenPlanFetcher => no activity provided");
      setDialogInitialActivity(null);
    } else {
      setDialogInitialActivity({
        subChapterId: activity.subChapterId,
        type: activity.type,
        stage: activity.quizStage || activity.reviseStage || null
      });
    }

    setShowPlanDialog(true);
  }

  // UI styling
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
        <div>No plan IDs found for userId="{userId}" and bookId="{bookId}".</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h2 style={headingStyle}>Adaptive Plan</h2>

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
        renderLocalPlan(plan)
      )}

      <Dialog
        open={showPlanDialog}
        onClose={() => setShowPlanDialog(false)}
        fullWidth
        maxWidth="lg"
        BackdropProps={{
          style: { backgroundColor: "rgba(0, 0, 0, 0.8)" },
        }}
        PaperProps={{
          sx: {
            height: "80vh",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#000",
            color: "#fff",
            boxShadow: "none",
            borderRadius: 2,
            overflow: "hidden",
          },
        }}
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
            />
          ) : (
            <p style={{ margin: "1rem" }}>No planId found. Cannot load plan.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  // renderLocalPlan => local plan in Child2
  function renderLocalPlan(planObj) {
    const { sessions = [] } = planObj;
    if (sessions.length === 0) {
      return <div>No sessions found in this plan.</div>;
    }

    return (
      <>
        <div style={{ display: "flex", marginBottom: "1rem" }}>
          <div
            style={tabStyle(activeSessionIndex === 0)}
            onClick={() => setActiveSessionIndex(0)}
          >
            History
          </div>

          {sessions.map((sess, index) => {
            const tabIndex = index + 1;
            const sLabel = Number(sess.sessionLabel);
            let sessionDisplayName;
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

  /**
   * Renders a row for each sub-chapter with 5 "stages":
   *  1) Reading
   *  2) Remember
   *  3) Understand
   *  4) Apply
   *  5) Analyze
   *  - For each of the last 4 stages, we have 2 potential tasks => QUIZ or REVISE
   *  - For Reading stage, 1 potential task => "READ"
   *  If the plan doc doesn't have them, the button is disabled.
   */
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
          const subName = subActs[0]?.subChapterName || `Sub-Chapter (${subId})`;

          // We'll collect any real tasks that exist
          const readActivity = subActs.find((a) => a.type === "READ");
          
          // For Remember
          const quizRemember = subActs.find((a) => a.type === "QUIZ" && a.quizStage === "remember");
          const reviseRemember = subActs.find((a) => a.type === "REVISE" && a.reviseStage === "remember");

          // For Understand
          const quizUnderstand = subActs.find((a) => a.type === "QUIZ" && a.quizStage === "understand");
          const reviseUnderstand = subActs.find((a) => a.type === "REVISE" && a.reviseStage === "understand");

          // For Apply
          const quizApply = subActs.find((a) => a.type === "QUIZ" && a.quizStage === "apply");
          const reviseApply = subActs.find((a) => a.type === "REVISE" && a.reviseStage === "apply");

          // For Analyze
          const quizAnalyze = subActs.find((a) => a.type === "QUIZ" && a.quizStage === "analyze");
          const reviseAnalyze = subActs.find((a) => a.type === "REVISE" && a.reviseStage === "analyze");

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

              {/* The 5-stage row */}
              <div style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "1rem",
                flexWrap: "wrap"
              }}>
                {/* 1) Reading Stage */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div>Reading</div>
                  <button
                    style={activityButtonStyle(!!readActivity)}
                    disabled={!readActivity}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (readActivity) {
                        handleOpenPlanFetcher(selectedPlanId, readActivity);
                      }
                    }}
                  >
                    Read
                  </button>
                </div>

                {/* 2) Remember Stage */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div>Remember</div>
                  {/* Quiz(remember) */}
                  <button
                    style={activityButtonStyle(!!quizRemember)}
                    disabled={!quizRemember}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (quizRemember) {
                        handleOpenPlanFetcher(selectedPlanId, quizRemember);
                      }
                    }}
                  >
                    Quiz
                  </button>
                  {/* Revise(remember) */}
                  <button
                    style={activityButtonStyle(!!reviseRemember)}
                    disabled={!reviseRemember}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (reviseRemember) {
                        handleOpenPlanFetcher(selectedPlanId, reviseRemember);
                      }
                    }}
                  >
                    Revise
                  </button>
                </div>

                {/* 3) Understand Stage */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div>Understand</div>
                  {/* Quiz(understand) */}
                  <button
                    style={activityButtonStyle(!!quizUnderstand)}
                    disabled={!quizUnderstand}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (quizUnderstand) {
                        handleOpenPlanFetcher(selectedPlanId, quizUnderstand);
                      }
                    }}
                  >
                    Quiz
                  </button>
                  {/* Revise(understand) */}
                  <button
                    style={activityButtonStyle(!!reviseUnderstand)}
                    disabled={!reviseUnderstand}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (reviseUnderstand) {
                        handleOpenPlanFetcher(selectedPlanId, reviseUnderstand);
                      }
                    }}
                  >
                    Revise
                  </button>
                </div>

                {/* 4) Apply Stage */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div>Apply</div>
                  {/* Quiz(apply) */}
                  <button
                    style={activityButtonStyle(!!quizApply)}
                    disabled={!quizApply}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (quizApply) {
                        handleOpenPlanFetcher(selectedPlanId, quizApply);
                      }
                    }}
                  >
                    Quiz
                  </button>
                  {/* Revise(apply) */}
                  <button
                    style={activityButtonStyle(!!reviseApply)}
                    disabled={!reviseApply}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (reviseApply) {
                        handleOpenPlanFetcher(selectedPlanId, reviseApply);
                      }
                    }}
                  >
                    Revise
                  </button>
                </div>

                {/* 5) Analyze Stage */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div>Analyze</div>
                  {/* Quiz(analyze) */}
                  <button
                    style={activityButtonStyle(!!quizAnalyze)}
                    disabled={!quizAnalyze}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (quizAnalyze) {
                        handleOpenPlanFetcher(selectedPlanId, quizAnalyze);
                      }
                    }}
                  >
                    Quiz
                  </button>
                  {/* Revise(analyze) */}
                  <button
                    style={activityButtonStyle(!!reviseAnalyze)}
                    disabled={!reviseAnalyze}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (reviseAnalyze) {
                        handleOpenPlanFetcher(selectedPlanId, reviseAnalyze);
                      }
                    }}
                  >
                    Revise
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
}