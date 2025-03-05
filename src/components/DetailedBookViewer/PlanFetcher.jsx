import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPlan } from "./redux/planSlice"; // adjust path as needed
import LeftPanel from "./LeftPanel";
import MainContent from "./MainContent";

export default function PlanFetcher({
  backendURL = "http://localhost:3001",
  fetchUrl = "/api/adaptive-plan",
}) {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.plan);

  const [planId, setPlanId] = useState("");

  function handleFetch() {
    if (!planId.trim()) {
      alert("Please enter a Plan ID");
      return;
    }
    dispatch(fetchPlan({ planId, backendURL, fetchUrl }));
  }

  return (
    <div style={styles.appContainer}>
      <h1>Redux-Based Plan Fetcher App</h1>

      {/* Input row for planId */}
      <div style={styles.inputRow}>
        <input
          style={styles.input}
          placeholder="Enter Plan ID"
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
        />
        <button style={styles.button} onClick={handleFetch}>
          Fetch Plan
        </button>
      </div>

      {/* Status / error */}
      {status === "loading" && <p>Loading plan...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* Once plan is fetched, show left panel & main content side by side */}
      <div style={styles.mainArea}>
        <div style={styles.leftPanelContainer}>
          <LeftPanel />
        </div>
        <div style={styles.rightPanelContainer}>
          <MainContent />
        </div>
      </div>
    </div>
  );
}

const styles = {
  appContainer: {
    maxWidth: 900,
    margin: "20px auto",
    padding: 20,
    border: "1px solid #ccc",
    borderRadius: 8,
    backgroundColor: "#fafafa",
  },
  inputRow: {
    display: "flex",
    gap: 8,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    padding: 8,
  },
  button: {
    padding: "8px 16px",
    cursor: "pointer",
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