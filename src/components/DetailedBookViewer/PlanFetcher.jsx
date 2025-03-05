import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPlan } from "./store/planSlice";
import LeftPanel from "./LeftPanel";
import MainContent from "./MainContent";

// Import your custom bars
import TopBar from "./TopBar";
import BottomBar from "./BottomBar";

/**
 * PlanFetcher
 * -----------
 * - fetchPlan logic
 * - Render: TopBar, mainArea (LeftPanel + MainContent), BottomBar
 * - Example props for TopBar: daysUntilExam, sessionLength, secondsLeft
 * - Example progress calculation for BottomBar from flattenedActivities + currentIndex
 */
export default function PlanFetcher({
  planId,
  initialActivityContext,
  backendURL = "http://localhost:3001",
  fetchUrl = "/api/adaptive-plan",
  // Additional props if needed for top/bottom bars
  daysUntilExam = 10,
  sessionLength = 30,
  initialSeconds = 1500, // 25 min
  onClose = () => {},
}) {
  const dispatch = useDispatch();
  const { status, error, planDoc, flattenedActivities, currentIndex } = useSelector(
    (state) => state.plan
  );

  // Example local state for the countdown timer
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  // Start a simple timer effect to decrement secondsLeft
  useEffect(() => {
    const timerId = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  // Fetch Plan whenever planId changes
  useEffect(() => {
    if (!planId) return;
    console.log("[PlanFetcher] dispatching fetchPlan =>", {
      planId,
      backendURL,
      fetchUrl,
      initialActivityContext,
    });

    dispatch(
      fetchPlan({
        planId,
        backendURL,
        fetchUrl,
        initialActivityContext,
      })
    );
  }, [planId, backendURL, fetchUrl, initialActivityContext, dispatch]);

  // Calculate progress for the BottomBar
  let totalSteps = flattenedActivities?.length || 0;
  let currentStep = currentIndex >= 0 ? currentIndex + 1 : 0;
  let stepPercent =
    totalSteps > 0 ? Math.floor((currentStep / totalSteps) * 100) : 0;

  return (
    <div style={styles.appContainer}>
      {/* If you want to hide the top bar entirely, just remove <TopBar /> */}
      <TopBar
        daysUntilExam={daysUntilExam}
        sessionLength={sessionLength}
        secondsLeft={secondsLeft}
        onClose={onClose}
      />

      {/* If plan is still loading or error */}
      {status === "loading" && <p style={{ color: "#fff", margin: 8 }}>Loading plan...</p>}
      {error && <p style={{ color: "red", margin: 8 }}>{error}</p>}
      {!planDoc && status !== "loading" && !error && (
        <p style={{ color: "#fff", margin: 8 }}>
          No plan loaded. Pass a valid planId to load content.
        </p>
      )}

      {/* The main area => LeftPanel & MainContent side by side */}
      {planDoc && (
        <div style={styles.mainArea}>
          {/* Left panel */}
          <div style={styles.leftPanelContainer}>
            <LeftPanel />
          </div>

          {/* Right panel */}
          <div style={styles.rightPanelContainer}>
            <MainContent />
          </div>
        </div>
      )}

      {/* BottomBar for progress */}
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
    // Fix or % height so it doesn't shrink/grow with content
    height: "80vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#000",
    // Or transparent if parent is black
    color: "#fff",
    // Remove default margins
    margin: 0,
    padding: 0,
    boxSizing: "border-box",
  },
  mainArea: {
    // Occupies all vertical space except top/bottom bars
    flex: 1,
    display: "flex",
    overflow: "hidden",
  },
  leftPanelContainer: {
    width: 300,
    height: "100%",
    overflowY: "auto",
    backgroundColor: "#000", // or transparent
    // optional borderRight
    // borderRight: "1px solid #444"
  },
  rightPanelContainer: {
    flex: 1,
    height: "100%",
    overflowY: "auto",
    backgroundColor: "#000", // or transparent
  },
};