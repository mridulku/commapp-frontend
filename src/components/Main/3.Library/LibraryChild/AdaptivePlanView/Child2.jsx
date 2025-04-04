// File: Child2.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  Button,
  LinearProgress,
  MenuItem,
  Select,
  Tabs,
  Tab,
} from "@mui/material";

import PlanUsageHistory from "./PlanUsageHistory";
import PlanFetcher from "../../../5.StudyModal/StudyModal"; // Adjust path if needed
import { db } from "../../../../../firebase"; // Adjust path if needed

export default function Child2({
  userId = null,
  bookId = "",
  bookName = "Untitled Book",
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
    boxSizing: "border-box",
  };

  const headingStyle = {
    fontWeight: "bold",
    marginBottom: "12px",
    fontSize: "1.4rem",
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
  // Plan state
  // ------------------------------------------
  const [localPlanIds, setLocalPlanIds] = useState(planIds);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [plan, setPlan] = useState(null);

  // Re-sync localPlanIds from props
  useEffect(() => {
    setLocalPlanIds(planIds);
  }, [planIds]);

  // If user/book changes => fetch plan IDs
  useEffect(() => {
    if (!userId || !bookId) {
      setLocalPlanIds([]);
      setSelectedPlanId("");
      setPlan(null);
      return;
    }
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
    fetchPlansForBook();
  }, [userId, bookId]);

  // On localPlanIds => pick the first
  useEffect(() => {
    if (localPlanIds.length > 0) {
      setSelectedPlanId(localPlanIds[0]);
    } else {
      setSelectedPlanId("");
      setPlan(null);
    }
  }, [localPlanIds]);

  // Fetch plan doc
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
  // Stage order
  // ------------------------------------------
  const [stageOrder, setStageOrder] = useState([]);

  useEffect(() => {
    if (!plan) {
      setStageOrder([]);
      return;
    }
    const effectiveExamId = plan.examId?.trim() || "general";
    fetchExamConfig(effectiveExamId);
  }, [plan]);

  async function fetchExamConfig(examId) {
    try {
      const url = `${import.meta.env.VITE_BACKEND_URL}/api/exam-config`;
      const res = await axios.get(url, { params: { examId } });
      if (res.data && Array.isArray(res.data.stages)) {
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

  function transformStage(rawStage) {
    if (rawStage === "none") return "Reading";
    if (!rawStage) return "";
    return rawStage.charAt(0).toUpperCase() + rawStage.slice(1);
  }

  // ------------------------------------------
  // Tabs: 0 => Daily Plan, 1 => Progress, 2 => Admin Panel
  // ------------------------------------------
  const [activeTab, setActiveTab] = useState(0);

  // reset tab if plan changes
  useEffect(() => {
    setActiveTab(0);
  }, [plan]);

  function handleChangeTab(e, newVal) {
    setActiveTab(newVal);
  }

  // ------------------------------------------
  // dayDropIdx => which session is selected
  // ------------------------------------------
  const [dayDropIdx, setDayDropIdx] = useState(0);
  useEffect(() => {
    setDayDropIdx(0);
  }, [plan]);

  function handleDaySelect(e) {
    setDayDropIdx(Number(e.target.value));
  }

  // ------------------------------------------
  // expand/collapse chapters
  // ------------------------------------------
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
  // PlanFetcher dialog
  // ------------------------------------------
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [dialogPlanId, setDialogPlanId] = useState("");
  const [dialogInitialActivity, setDialogInitialActivity] = useState(null);

  function handleOpenPlanFetcher(planId, activity) {
    setDialogPlanId(planId);
    if (activity) {
      setDialogInitialActivity({
        subChapterId: activity.subChapterId,
        type: activity.type, // "READ" or "QUIZ"
        stage: activity.quizStage || null,
      });
    } else {
      setDialogInitialActivity(null);
    }
    setShowPlanDialog(true);
  }

  // ------------------------------------------
  // Stats row => top portion
  //    Book Name, Exam Date, Daily Plan Time, Chapters, SubChapters
  //    Overall Progress bar
  // ------------------------------------------
  function renderTopStats() {
    // Filler data
    const examDate = plan?.targetDate || "2025-12-31"; // renamed from targetDate
    const dailyPlanTime = 30; // filler
    const chaptersCount = 5; // filler
    const subChaptersCount = 12; // filler
    const overallProgress = 65; // filler

    return (
      <div style={{ marginBottom: "1rem" }}>
        {/* Book Name */}
        <h2 style={headingStyle}>{bookName}</h2>

        {/* Row of rectangular cards with icons + text */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1rem",
          }}
        >
          <IconCard
            icon="📅"
            label="Exam Date"
            value={examDate}
            color={colorScheme.heading || "#FFD700"}
          />
          <IconCard
            icon="⏱"
            label="Daily Plan"
            value={`${dailyPlanTime} min`}
            color={colorScheme.heading || "#FFD700"}
          />
          <IconCard
            icon="📖"
            label="Chapters"
            value={chaptersCount}
            color={colorScheme.heading || "#FFD700"}
          />
          <IconCard
            icon="🗂"
            label="SubChaps"
            value={subChaptersCount}
            color={colorScheme.heading || "#FFD700"}
          />
        </div>

        {/* Overall progress bar (wide) */}
        <div
          style={{
            backgroundColor: "#2F2F2F",
            padding: "0.5rem",
            borderRadius: "8px",
            width: "100%",
            maxWidth: "600px",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: 6 }}>
            Overall Progress
          </div>
          <LinearProgress
            variant="determinate"
            value={overallProgress}
            sx={{
              height: 10,
              borderRadius: 2,
              backgroundColor: "rgba(255,255,255,0.2)",
              "& .MuiLinearProgress-bar": {
                backgroundColor: colorScheme.heading || "#FFD700",
              },
            }}
          />
          <div
            style={{
              marginTop: "4px",
              fontWeight: "bold",
              color: colorScheme.heading || "#FFD700",
              textAlign: "right",
            }}
          >
            {overallProgress}%
          </div>
        </div>
      </div>
    );
  }

  // Icon-based rectangular card
  function IconCard({ icon, label, value, color }) {
    return (
      <div
        style={{
          width: 130,
          backgroundColor: "#2F2F2F",
          borderRadius: "8px",
          padding: "0.6rem",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "1.4rem", marginBottom: 4 }}>{icon}</div>
        <div
          style={{
            textTransform: "uppercase",
            fontSize: "0.7rem",
            opacity: 0.8,
            marginBottom: "4px",
          }}
        >
          {label}
        </div>
        <div style={{ fontWeight: "bold", color }}>{value}</div>
      </div>
    );
  }

  // ------------------------------------------
  // Render
  // ------------------------------------------
  if (localPlanIds.length === 0 && !plan) {
    return (
      <div style={containerStyle}>
        <h2 style={headingStyle}>No Plans Found</h2>
        <p>No plan IDs found for user/book.</p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* 1) Stats row => top portion */}
      {renderTopStats()}

      {/* 2) If multiple plans => plan dropdown */}
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

      {/* 3) Tabs => "Daily Plan"(0), "Progress"(1), "Admin Panel"(2) */}
      <Tabs
        value={activeTab}
        onChange={handleChangeTab}
        textColor="inherit"
        TabIndicatorProps={{
          style: { backgroundColor: colorScheme.heading || "#FFD700" },
        }}
        sx={{ marginBottom: "1rem" }}
      >
        <Tab label="Daily Plan" />
        <Tab label="Progress" />
        <Tab label="Admin Panel" />
      </Tabs>

      {/* 4) if no plan => etc. else => tab content */}
      {!selectedPlanId ? (
        <div>No Plan ID selected.</div>
      ) : !plan ? (
        <div>Loading plan data...</div>
      ) : (
        renderTabContent()
      )}

      {/* PlanFetcher => display plan reading/quiz in dialog */}
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

  // Render content based on activeTab
  function renderTabContent() {
    if (activeTab === 0) {
      return renderDailyPlan();
    } else if (activeTab === 1) {
      // "Progress" tab => filler
      return (
        <div style={{ marginTop: "1rem" }}>
          <h3 style={headingStyle}>Progress (Filler)</h3>
          <p style={{ marginBottom: "1rem" }}>
            This is a placeholder content for the new Progress tab.
          </p>
          <p>We will add more progress metrics and charts here soon.</p>
        </div>
      );
    } else {
      // "Admin Panel"
      return (
        <div style={{ marginTop: "1rem" }}>
          <h3 style={headingStyle}>Admin Panel</h3>
          <PlanUsageHistory
            bookId={bookId}
            userId={userId}
            planId={selectedPlanId}
            planData={plan}
            db={db}
            colorScheme={colorScheme}
          />
        </div>
      );
    }
  }

  // "Daily Plan" tab => includes daily progress bar + day dropdown + session content
  function renderDailyPlan() {
    // filler data => daily progress
    const dailyProgress = 20;

    const sessions = plan?.sessions || [];
    if (!sessions.length) {
      return <div>No sessions found in this plan.</div>;
    }

    let safeIdx = dayDropIdx;
    if (dayDropIdx >= sessions.length) {
      safeIdx = 0;
    }
    const currentSession = sessions[safeIdx];

    return (
      <div style={{ marginTop: "1rem" }}>
        {/* Daily Progress bar */}
        <div
          style={{
            backgroundColor: "#2F2F2F",
            padding: "0.5rem",
            borderRadius: "8px",
            width: "100%",
            maxWidth: "600px",
            marginBottom: "1rem",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: 6 }}>
            Daily Progress
          </div>
          <LinearProgress
            variant="determinate"
            value={dailyProgress}
            sx={{
              height: 10,
              borderRadius: 2,
              backgroundColor: "rgba(255,255,255,0.2)",
              "& .MuiLinearProgress-bar": {
                backgroundColor: colorScheme.heading || "#FFD700",
              },
            }}
          />
          <div
            style={{
              marginTop: "4px",
              fontWeight: "bold",
              color: colorScheme.heading || "#FFD700",
              textAlign: "right",
            }}
          >
            {dailyProgress}%
          </div>
        </div>

        {/* "Resume Learning" primary CTA button */}
        <Button
          variant="contained"
          onClick={() => handleOpenPlanFetcher(selectedPlanId, null)}
          sx={{
            backgroundColor: colorScheme.heading || "#FFD700",
            color: "#000",
            fontWeight: "bold",
            borderRadius: "4px",
            marginBottom: "1rem",
            "&:hover": {
              backgroundColor: "#e5c100", // darker shade
            },
          }}
        >
          Resume Learning
        </Button>

        {/* Day dropdown => e.g. Today, Tomorrow, Day X */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ marginRight: 8 }}>Select Day:</label>
          <Select
            value={safeIdx}
            onChange={handleDaySelect}
            sx={{
              minWidth: 120,
              backgroundColor: "#2F2F2F",
              color: colorScheme.textColor || "#FFD700",
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  bgcolor: "#2F2F2F",
                  color: "#fff",
                },
              },
            }}
          >
            {sessions.map((sess, idx) => {
              const sLabel = Number(sess.sessionLabel);
              let displayName = "";
              if (sLabel === 1) displayName = "Today";
              else if (sLabel === 2) displayName = "Tomorrow";
              else displayName = `Day ${sLabel}`;
              return (
                <MenuItem key={sess.sessionLabel} value={idx}>
                  {displayName}
                </MenuItem>
              );
            })}
          </Select>
        </div>

        {/* session content */}
        {renderSessionContent(currentSession)}
      </div>
    );
  }

  function renderSessionContent(session) {
    if (!session) return <div>No session data.</div>;
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
      <div>
        {chapterIds.map((chapterId) => {
          const cActs = chapterMap.get(chapterId) || [];
          const chapterName = cActs[0]?.chapterName || `Chapter(${chapterId})`;

          const sumTime = cActs.reduce((acc, x) => acc + (x.timeNeeded || 0), 0);
          const chapterKey = `chap-${chapterId}`;
          const isExpanded = expandedChapters.includes(chapterKey);

          return (
            <div key={chapterId} style={{ marginBottom: "1rem" }}>
              {/* Chapter header */}
              <div
                style={{
                  cursor: "pointer",
                  padding: "8px 12px",
                  backgroundColor: "#2F2F2F",
                  borderRadius: "4px",
                  border: `1px solid ${
                    colorScheme.borderColor || "#FFD700"
                  }`,
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                onClick={() => toggleChapter(chapterKey)}
              >
                <div>
                  {isExpanded ? "▾ " : "▸ "}
                  {chapterName}
                </div>
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

    return subIds.map((subId) => {
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
              {/* timeNeeded */}
              <div style={{ fontSize: "0.85rem", marginRight: "6px" }}>
                {act.timeNeeded || 0} min
              </div>

              {/* stage timeline */}
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                {renderTimelineStages(act)}
              </div>
            </div>
          ))}
        </div>
      );
    });
  }

  function renderTimelineStages(activity) {
    let activeStage = "";
    if (activity.type === "READ") {
      activeStage = "Reading";
    } else if (activity.type === "QUIZ") {
      if (activity.quizStage) {
        activeStage = transformStage(activity.quizStage);
      } else {
        activeStage = "Quiz";
      }
    }

    // if no stageOrder => single button
    if (!stageOrder?.length) {
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

    // else => show each stage from stageOrder
    return stageOrder.map((stageName, idx) => {
      const isActive = stageName.toLowerCase() === activeStage.toLowerCase();

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

      // Insert arrow except last
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