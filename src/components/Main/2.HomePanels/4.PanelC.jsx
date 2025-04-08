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

// Helper function to check if a stage is done
function isStageDone(stageValue) {
  if (!stageValue) return false;
  const val = stageValue.toString().toLowerCase();
  return (
    val.includes("done") || val.includes("complete") || val.includes("pass")
  );
}

// Compute overall progress for an aggregatorResult object
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

export default function PanelC({
  db, // <-- Make sure you pass the Firestore instance here
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

  // 2) For each Book => fetch the latest plan, THEN fetch aggregator progress
  useEffect(() => {
    // We define these helpers *inside* the effect so we can reference db, userId, etc.

    async function fetchPlanForBook(bookId) {
      setPlansData((prev) => ({
        ...prev,
        [bookId]: { loading: true, error: null, hasPlan: false },
      }));

      try {
        // 2.1) Fetch the plan
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/adaptive-plans`,
          { params: { userId, bookId } }
        );
        const allPlans = res.data?.plans || [];
        if (!allPlans.length) {
          // No plan
          setPlansData((prev) => ({
            ...prev,
            [bookId]: {
              loading: false,
              error: null,
              hasPlan: false,
            },
          }));
          return;
        }
        // Sort by createdAt desc => pick the first
        allPlans.sort((a, b) => {
          const tA = new Date(a.createdAt).getTime();
          const tB = new Date(b.createdAt).getTime();
          return tB - tA;
        });
        const recentPlan = allPlans[0];

        // Summarize day1’s activities (just as in your original code)
        let readCount = 0;
        let quizCount = 0;
        let reviseCount = 0;
        let totalTime = 0;
        if (recentPlan.sessions && recentPlan.sessions.length > 0) {
          const day1Acts = recentPlan.sessions[0].activities || [];
          day1Acts.forEach((act) => {
            if (act.type === "READ") readCount++;
            else if (act.type === "QUIZ") quizCount++;
            else if (act.type === "REVISE") reviseCount++;
            if (act.timeNeeded) {
              totalTime += act.timeNeeded;
            }
          });
        }

        // 2.2) Fetch aggregator doc => aggregator_v2
        const aggregatorProgress = await fetchAggregatorDoc(bookId, recentPlan.id);

        // 2.3) Update state
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
            // Store aggregator progress here
            aggregatorProgress,
          },
        }));
      } catch (err) {
        console.error("Error fetching plan for book:", bookId, err);
        setPlansData((prev) => ({
          ...prev,
          [bookId]: {
            loading: false,
            error: err.message,
            hasPlan: false,
          },
        }));
      }
    }

    // 2.2) Helper that queries aggregator_v2 for the latest aggregator doc
    async function fetchAggregatorDoc(bookId, planId) {
      if (!db) return 0; // If no Firestore instance, skip

      try {
        const colRef = collection(db, "aggregator_v2");
        console.log("Querying aggregator_v2 for:", { userId, planId, bookId });

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
          console.log("No aggregator doc found for these fields");
        } else {
          snap.forEach((d) => console.log("Aggregator doc found =>", d.data()));
        }
        const docSnap = snap.docs[0];
        const data = docSnap.data() || {};
        const aggregatorResult = data.aggregatorResult || {};
        return computeOverallProgress(aggregatorResult);
      } catch (err) {
        console.error("Error fetching aggregator doc:", err);
        return 0; // fallback
      }
    }

    if (books.length === 0) return;

    // For each book => fetch plan => aggregator
    books.forEach((b) => {
      if (!b.id) return;
      fetchPlanForBook(b.id);
    });
  }, [books, db, userId]); // re-run if books change or db/userId change

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
          // If you have other needed props, pass them here:
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

      {/* Full-screen dialog with NO title/actions */}
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
            backgroundColor: "#000", // optional
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