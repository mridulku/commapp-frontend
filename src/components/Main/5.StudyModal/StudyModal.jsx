import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPlan } from "../../../store/planSlice";
import { setUserId } from "../../../store/authSlice";
import { fetchDailyTime, incrementDailyTime } from "../../../store/timeTrackingSlice";

import TopBar from "./0.components/Secondary/TopBar";
import BottomBar from "./0.components/Secondary/BottomBar";
import LeftPanel from "./0.components/Secondary/LeftPanel";
import MainContent from "./0.components/Main/Base/MainContent";

// Constants
const HEARTBEAT_INTERVAL = 15; // in seconds

/**
 * PlanFetcher:
 *  - Fetches a plan from the backend (based on planId/userId).
 *  - Tracks dailyTime (auto-incrementing in 1s intervals).
 *  - Renders the plan within a pseudo-modal layout (TopBar, LeftPanel, MainContent, etc.).
 *  - Calls `onClose` when the user clicks the close icon in TopBar.
 */
export default function PlanFetcher({
  planId,
  initialActivityContext,
  userId = null,

  backendURL = import.meta.env.VITE_BACKEND_URL,
  fetchUrl = "/api/adaptive-plan",

  daysUntilExam = 10,
  sessionLength = 30,

  // IMPORTANT: The parent must pass a real onClose function to hide PlanFetcher.
  // If this remains () => {}, the close button won't do anything.
  onClose = () => {},
}) {
  const dispatch = useDispatch();

  // ==============================
  // 1) Redux data (plan + time)
  // ==============================
  const {
    status,
    error,
    planDoc,
    flattenedActivities,
    currentIndex,
  } = useSelector((state) => state.plan);

  const { dailyTime } = useSelector((state) => state.timeTracking);

  // ==============================
  // 2) Local time tracking state
  // ==============================
  // displayTime => increments every second
  const [displayTime, setDisplayTime] = useState(0);

  // lastHeartbeatTime => tracks when we last sent an increment to the server
  const [lastHeartbeatTime, setLastHeartbeatTime] = useState(null);

  // ==============================
  // 3) On mount => store userId in Redux
  // ==============================
  useEffect(() => {
    if (userId) {
      dispatch(setUserId(userId));
    }
  }, [userId, dispatch]);

  // ==============================
  // 4) Fetch the plan on mount
  // ==============================
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

  // ==============================
  // 5) Fetch today's total time on mount
  // ==============================
  useEffect(() => {
    if (planId && userId) {
      dispatch(fetchDailyTime({ planId, userId }));
    }
  }, [planId, userId, dispatch]);

  // ==============================
  // 6) When Redux dailyTime changes => sync with local state
  // ==============================
  useEffect(() => {
    if (dailyTime != null) {
      setDisplayTime(dailyTime);
      if (!lastHeartbeatTime) {
        setLastHeartbeatTime(Date.now());
      }
    }
  }, [dailyTime, lastHeartbeatTime]);

  // ==============================
  // 7) local "tick" every 1s => increment displayTime,
  //    send increments to server every HEARTBEAT_INTERVAL seconds
  // ==============================
  useEffect(() => {
    const intervalId = setInterval(async () => {
      // 1) Increment local displayTime
      setDisplayTime((prev) => prev + 1);

      // If we have enough info, check for heartbeat intervals
      if (!lastHeartbeatTime || !planId || !userId) {
        return;
      }

      const nowMs = Date.now();
      const diffSec = Math.floor((nowMs - lastHeartbeatTime) / 1000);

      // If we've crossed the threshold => send chunk to server
      if (diffSec >= HEARTBEAT_INTERVAL) {
        const chunk = diffSec;

        // Dispatch thunk to increment daily time
        const actionResult = await dispatch(
          incrementDailyTime({
            planId,
            userId,
            increment: chunk,
          })
        );

        // If it succeeded => update local references
        if (incrementDailyTime.fulfilled.match(actionResult)) {
          const newTotal = actionResult.payload;
          if (typeof newTotal === "number") {
            setDisplayTime(newTotal); // server says "this is your new total"
          } else {
            // fallback => just add chunk
            setDisplayTime((prev) => prev + chunk);
          }
          setLastHeartbeatTime(Date.now());
        } else {
          console.error("incrementDailyTime failed:", actionResult.payload);
        }
      }
    }, 1000);

    // Cleanup
    return () => clearInterval(intervalId);
  }, [lastHeartbeatTime, planId, userId, dispatch]);

  // ==============================
  // 8) Plan progress
  // ==============================
  const totalSteps = flattenedActivities?.length || 0;
  const currentStep = currentIndex >= 0 ? currentIndex + 1 : 0;
  const stepPercent = totalSteps
    ? Math.floor((currentStep / totalSteps) * 100)
    : 0;

  // ==============================
  // 9) Render
  // ==============================
  return (
    <div style={styles.appContainer}>
      {/* Top bar => includes close button that calls onClose */}
      <TopBar
        daysUntilExam={daysUntilExam}
        sessionLength={sessionLength}
        dailyTime={displayTime}
        onClose={onClose}
      />

      {status === "loading" && (
        <p style={{ color: "#fff", margin: 8 }}>Loading plan...</p>
      )}
      {error && (
        <p style={{ color: "red", margin: 8 }}>{error}</p>
      )}
      {!planDoc && status !== "loading" && !error && (
        <p style={{ color: "#fff", margin: 8 }}>
          No plan loaded. Pass a valid planId to load content.
        </p>
      )}

      {/* If planDoc is loaded => show the main interface */}
      {planDoc && (
        <div style={styles.mainArea}>
          {/* Left panel */}
          <div style={{ ...styles.leftPanelContainer, width: 300 }}>
            <LeftPanel />
          </div>

          {/* Right side content */}
          <div style={styles.rightPanelContainer}>
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

// Basic styling
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
  },
  rightPanelContainer: {
    flex: 1,
    height: "100%",
    overflowY: "auto",
    backgroundColor: "#000",
  },
};