import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPlan } from "./redux/planSlice"; // adjust path if needed
import LeftPanel from "./LeftPanel";
import MainContent from "./MainContent";

/**
 * PlanFetcher
 * -----------
 * A Redux-based component that:
 *  - Accepts `planId` as a prop
 *  - Dispatches fetchPlan when planId changes
 *  - If an `initialActivityContext` is provided (subChapterId, type),
 *    it passes that to the plan slice, so we can jump to the right activity.
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
  initialActivityContext, // optional prop
  backendURL = "http://localhost:3001",
  fetchUrl = "/api/adaptive-plan",
}) {
  const dispatch = useDispatch();
  const { status, error, planDoc } = useSelector((state) => state.plan);

  // useEffect: whenever planId or initialActivityContext changes => dispatch fetchPlan
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
      <h2 style={{ marginTop: 0 }}>Redux Plan Viewer</h2>

      {status === "loading" && <p>Loading plan...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!planDoc && status !== "loading" && !error && (
        <p>No plan loaded. Enter or pass a planId above.</p>
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
    border: "1px solid #ccc",
    borderRadius: 8,
    backgroundColor: "#fafafa",
    padding: 16,
    marginTop: 16,
    maxWidth: 1000,
    margin: "0 auto",
  },
  mainArea: {
    display: "flex",
    marginTop: 20,
    minHeight: 400,
    border: "1px solid #ccc",
    borderRadius: 8,
    overflow: "hidden",
  },
  leftPanelContainer: {
    width: 300,
    borderRight: "1px solid #ccc",
    backgroundColor: "#f5f5f5",
  },
  rightPanelContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
};