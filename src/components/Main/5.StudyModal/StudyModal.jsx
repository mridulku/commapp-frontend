// PlanFetcher.jsx
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

export default function PlanFetcher({
  planId,
  initialActivityContext,
  userId = null,

  backendURL = "http://localhost:3001",
  fetchUrl = "/api/adaptive-plan",

  daysUntilExam = 10,
  sessionLength = 30,

  onClose = () => {},
}) {
  const dispatch = useDispatch();
  const {
    status,
    error,
    planDoc,
    flattenedActivities,
    currentIndex,
  } = useSelector((state) => state.plan);

  // The last known dailyTime from Redux (fetched at mount or after increments).
  const { dailyTime } = useSelector((state) => state.timeTracking);

  // We'll store a local "displayTime" (seconds) that ticks second-by-second
  // plus a real clock-based approach for heartbeat logic.
  const [displayTime, setDisplayTime] = useState(0);

  // Keep track of real "lastHeartbeatTime" in ms since epoch.
  // This is when we last actually posted an increment to the server.
  const [lastHeartbeatTime, setLastHeartbeatTime] = useState(null);

  // =============================
  // 1) On mount => store userId in Redux
  // =============================
  useEffect(() => {
    if (userId) {
      dispatch(setUserId(userId));
    }
  }, [userId, dispatch]);

  // =============================
  // 2) fetchPlan on mount
  // =============================
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

  // =============================
  // 3) fetchDailyTime on mount
  //    => to get today's total from server
  // =============================
  useEffect(() => {
    if (planId && userId) {
      dispatch(fetchDailyTime({ planId, userId }));
    }
  }, [planId, userId, dispatch]);

  // =============================
  // 4) When Redux dailyTime changes => set displayTime to that base,
  //    then we do second-by-second increments locally
  // =============================
  useEffect(() => {
    if (dailyTime != null) {
      // dailyTime is the server total so far
      setDisplayTime(dailyTime);
      // Also set lastHeartbeatTime = now if it's not set
      if (!lastHeartbeatTime) {
        setLastHeartbeatTime(Date.now()); 
      }
    }
  }, [dailyTime, lastHeartbeatTime]);

  // =============================
  // 5) local "tick" every 1s => update displayTime
  //    plus check if we crossed a 15s boundary since lastHeartbeatTime
  // =============================
  useEffect(() => {
    const intervalId = setInterval(async () => {
      // 1) Increment local displayTime by 1 second
      setDisplayTime((prev) => prev + 1);

      if (!lastHeartbeatTime || !planId || !userId) {
        return;
      }

      // 2) Check how many real seconds have passed since the last heartbeat
      const nowMs = Date.now();
      const diffSec = Math.floor((nowMs - lastHeartbeatTime) / 1000); // integer

      // If we've crossed at least HEARTBEAT_INTERVAL seconds => do a big chunk
      if (diffSec >= HEARTBEAT_INTERVAL) {
        // We'll increment by diffSec to reflect all the time that passed
        // or you could do chunk = multiple of 15 if you prefer multiple lumps
        const chunk = diffSec;

        // Dispatch the incrementDailyTime thunk
        const actionResult = await dispatch(
          incrementDailyTime({
            planId,
            userId,
            increment: chunk,
          })
        );

        // If successful => update local references
        if (incrementDailyTime.fulfilled.match(actionResult)) {
          const newTotal = actionResult.payload; 
          // If your thunk returns newTotalSeconds
          if (typeof newTotal === "number") {
            // Set displayTime to newTotal + (some leftover, if needed)
            // but usually we assume displayTime is newTotal because we just posted
            setDisplayTime(newTotal);
            // We do NOT keep adding local increments on top because we included the entire chunk in the post
          } else {
            // fallback: manual approach => displayTime += chunk
            setDisplayTime((prev) => prev + chunk);
          }

          // Update lastHeartbeatTime => now
          setLastHeartbeatTime(Date.now());
        } else {
          console.error("incrementDailyTime failed:", actionResult.payload);
        }
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [lastHeartbeatTime, planId, userId, dispatch]);

  // Now `displayTime` is always showing a second-by-second count in the UI,
  // while the server gets updates whenever we cross each 15-second boundary.

  // For bottom bar progress
  const totalSteps = flattenedActivities?.length || 0;
  const currentStep = currentIndex >= 0 ? currentIndex + 1 : 0;
  const stepPercent =
    totalSteps > 0 ? Math.floor((currentStep / totalSteps) * 100) : 0;

  return (
    <div style={styles.appContainer}>
      <TopBar
        daysUntilExam={daysUntilExam}
        sessionLength={sessionLength}
        dailyTime={displayTime} // pass the second-by-second local time
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