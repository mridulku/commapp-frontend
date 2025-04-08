// File: src/components/DetailedBookViewer/PanelC.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Dialog } from "@mui/material";
import { useSelector } from "react-redux";

// Firestore imports:
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";

import PanelTOEFL from "./PanelTOEFL";
import PanelGeneral from "./PanelGeneral";
import PlanFetcher from "../5.StudyModal/StudyModal"; // adjust path if needed

// ------------- HELPERS -------------
function isStageDone(stageValue) {
  if (!stageValue) return false;
  const val = stageValue.toString().toLowerCase();
  return (
    val.includes("done") ||
    val.includes("complete") ||
    val.includes("pass")
  );
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

    const subChPercent = (doneCount / 5) * 100;
    sumPercent += subChPercent;
  });
  // Average across all subchapters
  return sumPercent / subChIds.length;
}

/**
 * Calls your Cloud Function to generate/refresh the aggregator doc in Firestore.
 * Make sure this endpoint is correct (the one that actually creates the aggregator doc).
 */
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

/**
 * Fetches the latest aggregator doc from Firestore for (userId, planId, bookId)
 * Returns a numeric progress between 0 and 100.
 */
async function fetchAggregatorDoc(db, userId, planId, bookId) {
  if (!db) {
    console.log("No Firestore instance found => returning 0");
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
    console.log("No aggregator doc found => returning 0% progress");
    return 0;
  }

  // We have at least one document
  const docSnap = snap.docs[0];
  const data = docSnap.data() || {};
  console.log("Aggregator doc found =>", data);

  const aggregatorResult = data.aggregatorResult || {};
  const overall = computeOverallProgress(aggregatorResult);
  console.log("Computed aggregator progress =", overall);
  return overall;
}

// ------------- MAIN COMPONENT -------------
export default function PanelC({
  db, // we pass this in from the parent
  userId = "demoUser123",
  onOpenOnboarding = () => {},
  onSeeAllCourses = () => {},
}) {
  const examType = useSelector((state) => state.exam.examType);

  const [books, setBooks] = useState([]);
  const [plansData, setPlansData] = useState({});
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState(null);

  // 1) Fetch user's books
  useEffect(() => {
    if (!userId) return;

    async function fetchBooks() {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/books-user`,
          { params: { userId } }
        );
        if (res.data && res.data.success) {
          setBooks(res.data.data);
        } else {
          console.warn("No data or success=false fetching books:", res.data);
          setBooks([]);
        }
      } catch (err) {
        console.error("Error fetching books:", err);
        setBooks([]);
      }
    }

    fetchBooks();
  }, [userId]);

  // 2) For each Book => fetch the latest plan => fetch aggregator => generate aggregator => fetch aggregator again
  useEffect(() => {
    if (!books.length) return;

    async function fetchPlanThenAggregator(bookId) {
      setPlansData((prev) => ({
        ...prev,
        [bookId]: { loading: true, error: null, hasPlan: false },
      }));

      try {
        // (A) Fetch the plan from your API
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/adaptive-plans`,
          { params: { userId, bookId } }
        );
        const allPlans = res.data?.plans || [];
        if (!allPlans.length) {
          // No plan => store "no plan" in state
          setPlansData((prev) => ({
            ...prev,
            [bookId]: {
              loading: false,
              error: null,
              hasPlan: false,
              aggregatorProgress: 0,
            },
          }));
          return;
        }

        // pick most recent plan
        allPlans.sort((a, b) => {
          return (
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime()
          );
        });
        const recentPlan = allPlans[0];

        // Summarize day1’s activities (optional, like your code does)
        let readCount = 0;
        let quizCount = 0;
        let reviseCount = 0;
        let totalTime = 0;
        if (recentPlan.sessions?.length > 0) {
          const day1Acts = recentPlan.sessions[0].activities || [];
          day1Acts.forEach((act) => {
            if (act.type === "READ") readCount++;
            else if (act.type === "QUIZ") quizCount++;
            else if (act.type === "REVISE") reviseCount++;
            if (act.timeNeeded) totalTime += act.timeNeeded;
          });
        }

        // (B) Immediately fetch any existing aggregator doc => old aggregator data
        const oldAggregatorProgress = await fetchAggregatorDoc(
          db,
          userId,
          recentPlan.id,
          bookId
        );

        // Update state with the *old* aggregator doc
        setPlansData((prev) => ({
          ...prev,
          [bookId]: {
            loading: false,
            error: null,
            hasPlan: true,
            planId: recentPlan.id,
            readCount,
            quizCount,
            reviseCount,
            totalTime,
            aggregatorProgress: oldAggregatorProgress,
          },
        }));

        // (C) Generate a fresh aggregator doc => always get up-to-date data
        await generateAggregatorDoc(userId, recentPlan.id, bookId);

        // (D) Re-fetch aggregator doc => updated aggregator data
        const newAggregatorProgress = await fetchAggregatorDoc(
          db,
          userId,
          recentPlan.id,
          bookId
        );

        // Update state with the *new* aggregator doc
        setPlansData((prev) => ({
          ...prev,
          [bookId]: {
            ...prev[bookId],
            aggregatorProgress: newAggregatorProgress,
          },
        }));
      } catch (err) {
        console.error("Error fetching plan/aggregator for book:", bookId, err);
        setPlansData((prev) => ({
          ...prev,
          [bookId]: {
            loading: false,
            error: err.message,
            hasPlan: false,
            aggregatorProgress: 0,
          },
        }));
      }
    }

    // Loop over each book => run the aggregator logic
    books.forEach((b) => {
      if (!b.id) return;
      fetchPlanThenAggregator(b.id);
    });
  }, [books, db, userId]);

  // 3) If user hits "Start Learning" => open Plan dialog
  function handleStartLearning(bookId) {
    const planInfo = plansData[bookId];
    if (!planInfo || !planInfo.planId) {
      console.warn("No plan found => cannot open PlanFetcher");
      return;
    }
    setCurrentPlanId(planInfo.planId);
    setShowPlanDialog(true);
  }

  // 4) Render either TOEFL or General child component
  return (
    <div style={styles.parentContainer}>
      {examType === "TOEFL" ? (
        <PanelTOEFL
          books={books}
          plansData={plansData}
          handleStartLearning={handleStartLearning}
          onOpenOnboarding={onOpenOnboarding}
          onSeeAllCourses={onSeeAllCourses}
        />
      ) : (
        <PanelGeneral
          books={books}
          plansData={plansData}
          handleStartLearning={handleStartLearning}
          onOpenOnboarding={onOpenOnboarding}
          onSeeAllCourses={onSeeAllCourses}
        />
      )}

      <Dialog
        open={showPlanDialog}
        onClose={() => setShowPlanDialog(false)}
        fullScreen
        PaperProps={{
          sx: {
            margin: 0,
            borderRadius: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "#000",
          },
        }}
      >
        {currentPlanId ? (
          <PlanFetcher
            planId={currentPlanId}
            userId={userId}
            onClose={() => setShowPlanDialog(false)}
          />
        ) : (
          <p style={{ color: "#fff" }}>No planId found. Cannot load plan.</p>
        )}
      </Dialog>
    </div>
  );
}

// Basic container styling
const styles = {
  parentContainer: {
    padding: 20,
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
    backgroundColor: "#000",
    color: "#fff",
  },
};