

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
import PlanFetcher from "../../../5.StudyModal/StudyModal"; // Adjust path if needed

export default function Child2({
  userId = null,
  bookId = "",
  planIds = [],
  onOverviewSelect = () => {},
  colorScheme = {},
}) {
  // ------------------------------------------
  // Basic styles
  // ------------------------------------------
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

  function activityButtonStyle() {
    return {
      backgroundColor: colorScheme.heading || "#FFD700",
      color: "#000",
      border: "none",
      borderRadius: "4px",
      padding: "4px 8px",
      cursor: "pointer",
      fontWeight: "bold",
      fontSize: "0.85rem",
      minWidth: "60px",
      marginLeft: "6px",
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
        setLocalPlanIds([]);
        setSelectedPlanId("");
        setPlan(null);
        return;
      }
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

    fetchPlansForBook();
  }, [userId, bookId]);

  // Whenever localPlanIds changes => pick the first or reset
  useEffect(() => {
    if (localPlanIds.length > 0) {
      setSelectedPlanId(localPlanIds[0]);
    } else {
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

  // ------------------------------------------
  // 4) Also fetch exam stages (once we have plan)
  // ------------------------------------------
  const [stageOrder, setStageOrder] = useState([]);

  useEffect(() => {
    if (!plan) {
      setStageOrder([]);
      return;
    }
    // plan.examId might be empty => default "general"
    const effectiveExamId = plan.examId && plan.examId.trim()
      ? plan.examId.trim()
      : "general";

    fetchExamConfig(effectiveExamId);
  }, [plan]);

  async function fetchExamConfig(examId) {
    try {
      const url = `${import.meta.env.VITE_BACKEND_URL}/api/exam-config`;
      const res = await axios.get(url, { params: { examId } });
      if (res.data && Array.isArray(res.data.stages)) {
        // Transform the array of stages => e.g. "none","remember","..." => "Reading","Remember",...
        const finalStages = res.data.stages.map(transformStage);
        setStageOrder(finalStages);
      } else {
        setStageOrder([]);
      }
    } catch (err) {
      console.error("Failed to fetch exam config:", err);
      setStageOrder([]);
    }
  }

  // Helper: "none" => "Reading", otherwise capitalized
  function transformStage(rawStage) {
    if (rawStage === "none") return "Reading";
    if (!rawStage) return "";
    // Capitalize first letter
    return rawStage.charAt(0).toUpperCase() + rawStage.slice(1);
  }

  // ------------------------------------------
  // 5) Session Tab
  // ------------------------------------------
  const [activeSessionIndex, setActiveSessionIndex] = useState(0);

  useEffect(() => {
    setActiveSessionIndex(0);
  }, [plan]);

  // Expand/Collapse for chapters
  const [expandedChapters, setExpandedChapters] = useState([]);
  useEffect(() => {
    setExpandedChapters([]);
  }, [plan]);

  function toggleChapter(chapterKey) {
    setExpandedChapters((prev) =>
      prev.includes(chapterKey)
        ? prev.filter((k) => k !== chapterKey)
        : [...prev, chapterKey]
    );
  }

  // ------------------------------------------
  // 6) PlanFetcher Dialog
  // ------------------------------------------
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [dialogPlanId, setDialogPlanId] = useState("");
  const [dialogInitialActivity, setDialogInitialActivity] = useState(null);

  function handleOpenPlanFetcher(planId, activity) {
    setDialogPlanId(planId);
    if (!activity) {
      setDialogInitialActivity(null);
    } else {
      setDialogInitialActivity({
        subChapterId: activity.subChapterId,
        type: activity.type, // "READ" or "QUIZ"
        stage: activity.quizStage || null,
      });
    }
    setShowPlanDialog(true);
  }

  // ------------------------------------------
  // Render
  // ------------------------------------------
  if (localPlanIds.length === 0 && !plan) {
    return (
      <div style={containerStyle}>
        <h2 style={headingStyle}>Adaptive Plan</h2>
        <div>No plan IDs found for user/book.</div>
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

      {/* PlanFetcher Dialog */}
      <Dialog
        open={showPlanDialog}
        onClose={() => setShowPlanDialog(false)}
        maxWidth={false}
        fullWidth={false}
        sx={{
          "& .MuiDialog-paper": {
            width: "90vw",
            maxWidth: "90vw",
            height: "90vh",
            maxHeight: "90vh",
            backgroundColor: "#000",
            color: "#fff",
            borderRadius: 2,
            boxShadow: "none",
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
              userId={userId}
            />
          ) : (
            <p style={{ margin: "1rem" }}>No planId found. Cannot load plan.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  // -----------------------------------------------
  // RENDER LOCAL PLAN
  // -----------------------------------------------
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

  // Render a single session => we skip “book name” if there's only 1 book
  function renderSessionContent(session) {
    if (!session) return null;
    const { activities = [] } = session;

    // group by chapter
    const chapterMap = new Map();
    for (const act of activities) {
      if (!chapterMap.has(act.chapterId)) {
        chapterMap.set(act.chapterId, []);
      }
      chapterMap.get(act.chapterId).push(act);
    }

    const chapterIds = [...chapterMap.keys()];

    return (
      <div style={{ marginTop: "1rem" }}>
        {chapterIds.map((chapterId) => {
          const cActs = chapterMap.get(chapterId) || [];
          const chapterName = cActs[0]?.chapterName || `Chapter(${chapterId})`;

          const sumTime = cActs.reduce((acc, x) => acc + (x.timeNeeded || 0), 0);
          const chapterKey = `chap-${chapterId}`;
          const isExpanded = expandedChapters.includes(chapterKey);

          return (
            <div key={chapterId} style={{ marginBottom: "1rem" }}>
              {/* Chapter header row => name + colored time box on right */}
              <div
                style={{
                  cursor: "pointer",
                  padding: "8px 12px",
                  backgroundColor: "#2F2F2F",
                  borderRadius: "4px",
                  border: `1px solid ${colorScheme.borderColor || "#FFD700"}`,
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                onClick={() => toggleChapter(chapterKey)}
              >
                <div>{isExpanded ? "▾ " : "▸ "}{chapterName}</div>
                <div
                  style={{
                    backgroundColor: colorScheme.heading || "#FFD700",
                    color: "#000",
                    borderRadius: "4px",
                    padding: "2px 6px",
                    fontSize: "0.8rem",
                    fontWeight: "bold",
                  }}
                >
                  {sumTime} min
                </div>
              </div>

              {isExpanded && (
                <div style={{ marginLeft: "1.5rem", marginTop: "4px" }}>
                  {renderChapterActivities(cActs)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  function renderChapterActivities(chapterActivities) {
    // group by sub-chapter
    const subMap = new Map();
    for (const a of chapterActivities) {
      if (!subMap.has(a.subChapterId)) {
        subMap.set(a.subChapterId, []);
      }
      subMap.get(a.subChapterId).push(a);
    }

    const subIds = [...subMap.keys()];

    return subIds.map(subId => {
      const sActs = subMap.get(subId) || [];
      const subName = sActs[0]?.subChapterName || `SubCh (${subId})`;

      return (
        <div key={subId} style={{ marginBottom: "8px" }}>
          <div style={{ fontWeight: "bold", margin: "6px 0 4px 0" }}>
            {subName}
          </div>
          {sActs.map((act, index) => (
            <div
              key={`${act.type}-${act.quizStage || ""}-${index}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#2F2F2F",
                borderRadius: "4px",
                margin: "4px 0",
                padding: "6px 8px",
              }}
            >
              {/* Left: show timeNeeded */}
              <div style={{ fontSize: "0.85rem", marginRight: "6px" }}>
                {act.timeNeeded || 0} min
              </div>

              {/* The timeline bar => built from 'stageOrder' */}
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                {renderTimelineStages(act)}
              </div>
            </div>
          ))}
        </div>
      );
    });
  }

  // Renders the timeline stages from our "stageOrder" state.
  function renderTimelineStages(activity) {
    // Figure out which stage is "active"
    // - if type=READ => activeStage="Reading"
    // - if type=QUIZ => activeStage = quizStage (capitalized)
    let activeStage = "";
    if (activity.type === "READ") {
      activeStage = "Reading";
    } else if (activity.type === "QUIZ") {
      if (activity.quizStage) {
        // e.g. "remember" => "Remember"
        activeStage = transformStage(activity.quizStage);
      } else {
        activeStage = "Quiz";
      }
    }

    // if we haven't loaded exam config, stageOrder might be empty
    if (!stageOrder || stageOrder.length === 0) {
      // fallback to show just the active stage as a button
      return (
        <button
          style={activityButtonStyle()}
          onClick={(e) => {
            e.stopPropagation();
            handleOpenPlanFetcher(selectedPlanId, activity);
          }}
        >
          {activeStage || "Activity"}
        </button>
      );
    }

    // Use the stageOrder array. For each stage, if it matches activeStage => button
    return stageOrder.map((stageName, idx) => {
      const isActive =
        stageName.toLowerCase() === activeStage.toLowerCase();

      const stageElem = isActive ? (
        <button
          key={idx}
          style={activityButtonStyle()}
          onClick={(e) => {
            e.stopPropagation();
            handleOpenPlanFetcher(selectedPlanId, activity);
          }}
        >
          {stageName}
        </button>
      ) : (
        <div key={idx} style={{ fontSize: "0.85rem", opacity: 0.6 }}>
          {stageName}
        </div>
      );

      // Insert a small arrow (➔) after each stage except the last
      if (idx < stageOrder.length - 1) {
        return (
          <React.Fragment key={`${stageName}-${idx}`}>
            {stageElem}
            <div style={{ color: "#999", fontSize: "0.7rem" }}>➔</div>
          </React.Fragment>
        );
      }
      return stageElem;
    });
  }
}