// PlanFetcher.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPlan } from "./0.store/planSlice";

import { setUserId } from "./0.store/authSlice";

import TopBar from "./0.components/TopBar";
import BottomBar from "./0.components/BottomBar";
import LeftPanel from "./0.components/LeftPanel";
import MainContent from "./0.components/Main/MainContent";

export default function PlanFetcher({
  planId,
  initialActivityContext,
  userId = null,
  backendURL = "http://localhost:3001",
  fetchUrl = "/api/adaptive-plan",

  // Additional props for top/bottom bars
  daysUntilExam = 10,
  sessionLength = 30,
  initialSeconds = 1500, // 25 min
  onClose = () => {},
}) {
  const dispatch = useDispatch();

  // Grab plan state from Redux
  const {
    status,
    error,
    planDoc,
    flattenedActivities,
    currentIndex,
  } = useSelector((state) => state.plan);

  // A simple local countdown for session
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  // Collapsible left panel
  const [isCollapsed, setIsCollapsed] = useState(false);

  // ----------------------------
  // 1) Timer effect
  // ----------------------------
  useEffect(() => {
    const timerId = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  // ----------------------------
  // 2) Store userId in Redux
  // ----------------------------
  useEffect(() => {
    if (userId) {
      dispatch(setUserId(userId));
    }
  }, [userId, dispatch]);

  // ----------------------------
  // 3) On mount => fetch plan
  // ----------------------------
  useEffect(() => {
    if (!planId) return;

    dispatch(
      fetchPlan({
        planId,
        backendURL,
        fetchUrl,
        initialActivityContext,
      })
    );
  }, [planId, backendURL, fetchUrl, initialActivityContext, dispatch]);

  // ----------------------------
  // 4) For bottom bar progress
  // ----------------------------
  const totalSteps = flattenedActivities?.length || 0;
  const currentStep = currentIndex >= 0 ? currentIndex + 1 : 0;
  const stepPercent =
    totalSteps > 0 ? Math.floor((currentStep / totalSteps) * 100) : 0;

  // ----------------------------
  // 5) Render
  // ----------------------------
  return (
    <div style={styles.appContainer}>
      <TopBar
        daysUntilExam={daysUntilExam}
        sessionLength={sessionLength}
        secondsLeft={secondsLeft}
        onClose={onClose}
      />

      {status === "loading" && (
        <p style={{ color: "#fff", margin: 8 }}>Loading plan...</p>
      )}
      {error && <p style={{ color: "red", margin: 8 }}>{error}</p>}
      {!planDoc && status !== "loading" && !error && (
        <p style={{ color: "#fff", margin: 8 }}>
          No plan loaded. Pass a valid planId to load content.
        </p>
      )}

      {planDoc && (
        <div style={styles.mainArea}>
          {/* The left side (collapsible) */}
          <div
            style={{
              ...styles.leftPanelContainer,
              width: isCollapsed ? 60 : 300,
            }}
          >
            <LeftPanel
              isCollapsed={isCollapsed}
              onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
            />
          </div>

          {/* The right side (main content) */}
          <div style={styles.rightPanelContainer}>
            {/* Pull examId from planDoc (fallback to "general") */}
            <MainContent examId={planDoc.examId || "general"} />
          </div>
        </div>
      )}

      <BottomBar
        stepPercent={stepPercent}
        currentIndex={currentIndex}
        totalSteps={totalSteps}
      />
    </div>
  );
}

const styles = {
  appContainer: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#000",
    color: "#fff",
    margin: 0,
    padding: 0,
    boxSizing: "border-box",
  },
  mainArea: {
    flex: 1,
    display: "flex",
    overflow: "hidden",
  },
  leftPanelContainer: {
    height: "100%",
    overflowY: "auto",
    backgroundColor: "#000",
    transition: "width 0.3s ease",
  },
  rightPanelContainer: {
    flex: 1,
    height: "100%",
    overflowY: "auto",
    backgroundColor: "#000",
  },
};