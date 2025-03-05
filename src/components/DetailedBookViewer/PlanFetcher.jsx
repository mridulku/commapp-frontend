import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPlan } from "./store/planSlice";
import LeftPanel from "./LeftPanel";
import MainContent from "./MainContent";

/**
 * PlanFetcher
 * -----------
 * A Redux-based component that:
 *  - Accepts `planId` as a prop
 *  - Dispatches fetchPlan when planId changes
 *  - If `initialActivityContext` is provided (subChapterId, type),
 *    it passes that to the plan slice so we can jump to the right activity.
 *  - Renders LeftPanel and MainContent side-by-side
 *
 * PROPS:
 *  - planId (string): The plan ID to fetch from the server
 *  - initialActivityContext (object): { subChapterId, type } optional
 *  - backendURL (string): optional override for the server base
 *  - fetchUrl (string): optional override for the fetch endpoint
 */
export default function PlanFetcher({
  planId,
  initialActivityContext,
  backendURL = "http://localhost:3001",
  fetchUrl = "/api/adaptive-plan",
}) {
  const dispatch = useDispatch();
  const { status, error, planDoc } = useSelector((state) => state.plan);

  // Whenever planId or initialActivityContext changes => dispatch fetchPlan
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

  return (
    <div style={styles.appContainer}>
      {status === "loading" && <p style={{ color: "#fff" }}>Loading plan...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!planDoc && status !== "loading" && !error && (
        <p style={{ color: "#fff" }}>No plan loaded. Pass a valid planId to load content.</p>
      )}

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
    </div>
  );
}

const styles = {
  appContainer: {
    // Transparent or black to blend with the modal
    backgroundColor: "transparent",
    border: "none",
    padding: 0,
    margin: 0,
    // If you want it entirely black, use backgroundColor: "#000"
    // Otherwise 'transparent' if the parent is black
  },
  mainArea: {
    display: "flex",
    marginTop: 0,
    minHeight: 400,
    border: "none",
    borderRadius: 0,
    overflow: "hidden",
    // Also let parent handle sizing if you prefer
  },
  leftPanelContainer: {
    // If you want the left panel black, override the left panel's own styling
    // or remove these lines:
    width: 300,
    borderRight: "none", // or "1px solid #444"
    backgroundColor: "transparent", // or "#000"
  },
  rightPanelContainer: {
    flex: 1,
    backgroundColor: "transparent", // or "#000"
  },
};