import React, { useState, useEffect } from "react";
import { LinearProgress } from "@mui/material";

// Firestore
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";

/** ------------------------
 *  HELPER FUNCTIONS
 * ------------------------ */
function isStageDone(stageValue) {
  if (!stageValue) return false;
  const val = stageValue.toString().toLowerCase();
  return val.includes("done") || val.includes("complete") || val.includes("pass");
}

function computeOverallProgress(aggregatorResult) {
  const subChIds = Object.keys(aggregatorResult || {});
  if (!subChIds.length) return 0;

  let sumPercent = 0;
  subChIds.forEach((subChId) => {
    const row = aggregatorResult[subChId] || {};
    let doneCount = 0;
    if (isStageDone(row.reading)) doneCount++;
    if (isStageDone(row.remember)) doneCount++;
    if (isStageDone(row.understand)) doneCount++;
    if (isStageDone(row.apply)) doneCount++;
    if (isStageDone(row.analyze)) doneCount++;
    sumPercent += (doneCount / 5) * 100;
  });
  return sumPercent / subChIds.length;
}

/** Calls your Cloud Function to generate or refresh the aggregator doc. */
async function generateAggregatorDoc(userId, planId, bookId) {
  console.log("Generating aggregator doc via Cloud Function...");
  const response = await fetch(
    "https://us-central1-comm-app-ff74b.cloudfunctions.net/generateUserProgressAggregator2",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, planId, bookId }),
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to generate aggregator: ${response.status}`);
  }
  console.log("Aggregator doc generation complete");
}

/** Reads the latest aggregator doc (userId/planId/bookId) => returns 0–100 progress. */
async function fetchAggregatorDoc(db, userId, planId, bookId) {
  if (!db) {
    console.log("No Firestore instance => returning 0 progress");
    return 0;
  }
  console.log("Querying aggregator_v2 for:", { userId, planId, bookId });

  const colRef = collection(db, "aggregator_v2");
  const q = query(
    colRef,
    where("userId", "==", userId),
    where("planId", "==", planId),
    where("bookId", "==", bookId),
    orderBy("createdAt", "desc"),
    limit(1)
  );

  const snap = await getDocs(q);
  if (snap.empty) {
    console.log("No aggregator doc => 0% progress");
    return 0;
  }

  const docSnap = snap.docs[0];
  const data = docSnap.data() || {};
  const aggregatorResult = data.aggregatorResult || {};
  const progress = computeOverallProgress(aggregatorResult);
  console.log("Aggregator doc found => progress:", progress);
  return progress;
}

/** ------------------------
 *  MAIN COMPONENT
 * ------------------------ */
export default function StatsPanel({
  db,
  userId,
  planId,
  bookId,
  colorScheme = {},
}) {
  // =========== State ===========
  const [overallProgress, setOverallProgress] = useState(0);
  const [dailyPlanTime, setDailyPlanTime] = useState("N/A");
  const [examDate, setExamDate] = useState("N/A");
  const [chaptersCount, setChaptersCount] = useState(0);

  // We'll keep the "daily progress" tile as filler for now
  const dailyProgress = 20;

  // =========== 1) Approach B: aggregator doc fetch => generate => fetch again ===========
  useEffect(() => {
    if (!db || !userId || !planId || !bookId) {
      console.log("StatsPanel: missing props => skip aggregator fetch");
      return;
    }

    async function refreshAggregator() {
      try {
        // A) Fetch old aggregator doc
        const oldProgress = await fetchAggregatorDoc(db, userId, planId, bookId);
        setOverallProgress(oldProgress);

        // B) Generate fresh aggregator doc
        await generateAggregatorDoc(userId, planId, bookId);

        // C) Fetch updated aggregator doc
        const newProgress = await fetchAggregatorDoc(db, userId, planId, bookId);
        setOverallProgress(newProgress);
      } catch (err) {
        console.error("StatsPanel aggregator error:", err);
      }
    }

    refreshAggregator();
  }, [db, userId, planId, bookId]);

  // =========== 2) Fetch dailyReadingTimeUsed + targetDate from adaptive_demo/{planId} ===========
  useEffect(() => {
    if (!db || !planId) {
      return;
    }

    async function fetchAdaptiveDoc() {
      try {
        const docRef = doc(db, "adaptive_demo", planId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          console.log("No adaptive_demo doc => dailyPlanTime=N/A, examDate=N/A");
          setDailyPlanTime("N/A");
          setExamDate("N/A");
          return;
        }

        const data = docSnap.data() || {};
        const dailyTime = data.dailyReadingTimeUsed; // might be number or undefined
        const tDate = data.targetDate;               // might be string/date or undefined

        // dailyTime => if not found, "N/A"
        if (typeof dailyTime === "number") {
          setDailyPlanTime(`${dailyTime} min`);
        } else {
          setDailyPlanTime("N/A");
        }

        // examDate => if not found, "N/A"
        if (tDate) {
          setExamDate(tDate);
        } else {
          setExamDate("N/A");
        }
      } catch (err) {
        console.error("Error fetching adaptive_demo doc:", err);
        setDailyPlanTime("N/A");
        setExamDate("N/A");
      }
    }

    fetchAdaptiveDoc();
  }, [db, planId]);

  // =========== 3) Fetch # of chapters from chapters_demo (where bookId==?) ===========
  useEffect(() => {
    if (!db || !bookId) {
      return;
    }

    async function fetchChapters() {
      try {
        console.log("Fetching chapters for bookId:", bookId);
        const chaptersRef = collection(db, "chapters_demo");
        const q = query(chaptersRef, where("bookId", "==", bookId));
        const snap = await getDocs(q);

        // # of docs in snap => # of chapters
        const count = snap.size;
        console.log("Chapters found =>", count);
        setChaptersCount(count);
      } catch (err) {
        console.error("Failed to fetch chapters:", err);
        setChaptersCount(0);
      }
    }

    fetchChapters();
  }, [db, bookId]);

  // =========== RENDER ===========
  return (
    <div style={{ marginBottom: "1rem" }}>
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          width: "100%",
          justifyContent: "space-between",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        {/* 1) Overall Progress tile */}
        <OverallProgressTile
          title="Overall Progress"
          progressValue={overallProgress}
          colorScheme={colorScheme}
        />

        {/* 2) Daily Progress tile => filler */}
        <OverallProgressTile
          title="Daily Progress"
          progressValue={dailyProgress}
          colorScheme={colorScheme}
          daily={true}
        />

        {/* 3) Exam Date => from adaptive_demo => targetDate */}
        <IconCard
          icon="📅"
          label="Exam Date"
          value={examDate}
          color={colorScheme.heading || "#FFD700"}
        />

        {/* 4) Daily Plan => from adaptive_demo => dailyReadingTimeUsed */}
        <IconCard
          icon="⏱"
          label="Daily Plan"
          value={dailyPlanTime}
          color={colorScheme.heading || "#FFD700"}
        />

        {/* 5) Chapters => from chapters_demo */}
        <IconCard
          icon="📖"
          label="Chapters"
          value={chaptersCount}
          color={colorScheme.heading || "#FFD700"}
        />
      </div>
    </div>
  );
}

/** A tile that shows a title, a linear progress bar, and numeric % below it. */
function OverallProgressTile({ title, progressValue, colorScheme, daily = false }) {
  const barColor = daily
    ? colorScheme.dailyBarColor || "#FF9800"
    : colorScheme.heading || "#FFD700";

  const tileStyle = {
    backgroundColor: "#2F2F2F",
    borderRadius: "8px",
    padding: "0.6rem",
    flex: 1,
    minWidth: 130,
    maxWidth: 9999,
    textAlign: "center",
  };

  return (
    <div style={tileStyle}>
      <div style={{ fontWeight: "bold", marginBottom: 6 }}>{title}</div>

      <LinearProgress
        variant="determinate"
        value={progressValue}
        sx={{
          height: 10,
          borderRadius: 2,
          backgroundColor: "rgba(255,255,255,0.2)",
          "& .MuiLinearProgress-bar": {
            backgroundColor: barColor,
          },
        }}
      />

      <div
        style={{
          marginTop: "4px",
          fontWeight: "bold",
          color: barColor,
        }}
      >
        {progressValue.toFixed(1)}%
      </div>
    </div>
  );
}

/** Reusable icon-based card for exam date, daily plan, chapters, etc. */
function IconCard({ icon, label, value, color }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 130,
        maxWidth: 9999,
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