import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPlan } from "./0.store/planSlice";

import TopBar from "./0.components/TopBar";
import BottomBar from "./0.components/BottomBar";
import LeftPanel from "./0.components/LeftPanel";
import MainContent from "./0.components/MainContent";

export default function PlanFetcher({
  planId,
  initialActivityContext,
  backendURL = "http://localhost:3001",
  fetchUrl = "/api/adaptive-plan",

  // Additional props for top/bottom bars
  daysUntilExam = 10,
  sessionLength = 30,
  initialSeconds = 1500, // 25 min
  onClose = () => {},
}) {
  const dispatch = useDispatch();

  // Grab plan state
  const {
    status,
    error,
    planDoc,
    flattenedActivities,
    currentIndex
  } = useSelector((state) => state.plan);

  // A simple local countdown for session
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  // 1) We store "collapsed" here => so we can style the left panel
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Timer effect
  useEffect(() => {
    const timerId = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  // On mount or planId change => fetchPlan
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

  // for bottom bar progress
  const totalSteps = flattenedActivities?.length || 0;
  const currentStep = currentIndex >= 0 ? currentIndex + 1 : 0;
  const stepPercent =
    totalSteps > 0 ? Math.floor((currentStep / totalSteps) * 100) : 0;

  return (
    <div style={styles.appContainer}>
      <TopBar
        daysUntilExam={daysUntilExam}
        sessionLength={sessionLength}
        secondsLeft={secondsLeft}
        onClose={onClose}
        // pass currentAct if needed
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
          {/* LeftPanel => pass isCollapsed + onToggle */}
          <div
            style={{
              ...styles.leftPanelContainer,
              width: isCollapsed ? 60 : 300, // toggle width
            }}
          >
            <LeftPanel
              isCollapsed={isCollapsed}
              onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
            />
          </div>

          <div style={styles.rightPanelContainer}>
            <MainContent />
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
    height: "80vh",
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
    transition: "width 0.3s ease", // animate the collapse
  },
  rightPanelContainer: {
    flex: 1,
    height: "100%",
    overflowY: "auto",
    backgroundColor: "#000",
  },
};