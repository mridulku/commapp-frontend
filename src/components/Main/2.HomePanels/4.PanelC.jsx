// File: src/components/DetailedBookViewer/PanelC.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Dialog } from "@mui/material";
import { useSelector } from "react-redux";

import PanelTOEFL from "./PanelTOEFL";
import PanelGeneral from "./PanelGeneral";
import PlanFetcher from "../5.StudyModal/StudyModal"; // adjust path if needed

export default function PanelC({
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

  // 2) For each Book => fetch the latest plan
  useEffect(() => {
    async function fetchPlanForBook(bookId) {
      setPlansData((prev) => ({
        ...prev,
        [bookId]: { loading: true, error: null, hasPlan: false },
      }));

      try {
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

        // Summarize day1’s activities
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

    books.forEach((b) => {
      if (!b.id) return;
      fetchPlanForBook(b.id);
    });
  }, [books, userId]);

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
          onOpenOnboarding={onOpenOnboarding}
          onSeeAllCourses={onSeeAllCourses}
          handleStartLearning={handleStartLearning}
        />
      ) : (
        <PanelGeneral
          books={books}
          plansData={plansData}
          onOpenOnboarding={onOpenOnboarding}
          onSeeAllCourses={onSeeAllCourses}
          handleStartLearning={handleStartLearning}
        />
      )}

      {/* Full-screen dialog with NO title/actions */}
      <Dialog
        open={showPlanDialog}
        onClose={() => setShowPlanDialog(false)}
        fullScreen
        // Remove default Paper margins, corners
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
        {/* 
          We rely on PlanFetcher to handle its own top bar 
          with a close button. 
          If you want an extra "Close" button outside, 
          you can re-add <DialogActions> or something similar.
        */}
        {currentPlanId ? (
          <PlanFetcher
            planId={currentPlanId}
            userId={userId}
            // Let PlanFetcher call onClose => we close the dialog
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