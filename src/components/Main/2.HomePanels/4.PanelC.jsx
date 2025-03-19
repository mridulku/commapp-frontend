// src/components/DetailedBookViewer/PanelC.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";

// NEW: import useSelector to read examType from Redux
import { useSelector } from "react-redux";

// Import your Redux-based PlanFetcher
import PlanFetcher from "../5.StudyModal/StudyModal"; // adjust path if needed

// A helper to randomize icons for each book tile
function getRandomIcon() {
  const icons = ["📐", "🔬", "🏰", "🎨", "📚", "📝", "📊", "💻"];
  return icons[Math.floor(Math.random() * icons.length)];
}

/**
 * PanelC
 * Renders a list of the user's books + checks if a plan exists for each.
 * If a plan is found, user can click "Start Learning" => opens PlanFetcher in a dialog.
 *
 * Props:
 *  - userId (string)
 *  - onOpenOnboarding (function): callback to open your OnboardingModal
 *  - onSeeAllCourses (function): callback that changes parent view to "home" (or similar)
 */
function PanelC({
  userId = "demoUser123",
  onOpenOnboarding = () => {},
  onSeeAllCourses = () => {},
}) {
  // --- NEW: read examType from Redux
  const examType = useSelector((state) => state.exam.examType);

  const [books, setBooks] = useState([]);
  // Each book => { loading, error, hasPlan, planId, readCount, quizCount, reviseCount, totalTime }
  const [plansData, setPlansData] = useState({});

  // --------------------------
  // (A) FETCH USER'S BOOKS
  // --------------------------
  useEffect(() => {
    if (!userId) return;

    async function fetchBooks() {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/books-user`,
          {
            params: { userId },
          }
        );
        if (res.data && res.data.success) {
          console.log("Books fetched:", res.data.data);
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

  // ------------------------------------------------
  // (B) For each Book => fetch the MOST RECENT plan
  // ------------------------------------------------
  useEffect(() => {
    async function fetchPlanForBook(bookId) {
      setPlansData((prev) => ({
        ...prev,
        [bookId]: { loading: true, error: null, hasPlan: false },
      }));
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/adaptive-plans`,
          {
            params: { userId, bookId },
          }
        );
        const allPlans = res.data?.plans || [];
        if (!allPlans.length) {
          // No plan for this book
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
            planId: recentPlan.id, // store the actual planId
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

    // For each book => fetch its plan
    books.forEach((b) => {
      if (!b.id) return;
      fetchPlanForBook(b.id);
    });
  }, [books, userId]);

  // ------------------------------------------------
  // (C) PlanFetcher DIALOG STATE
  // ------------------------------------------------
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState(null);

  // If user hits "Start Learning"
  function handleStartLearning(bookId) {
    const planInfo = plansData[bookId];
    if (!planInfo || !planInfo.planId) {
      console.warn("No plan found for this book => cannot open plan fetcher");
      return;
    }
    setCurrentPlanId(planInfo.planId);
    setShowPlanDialog(true);
  }

  // ------------------------------------------------
  // (D) Display logic
  // ------------------------------------------------
  const booksCount = books.length;
  let displayBooks = [];

  if (examType === "TOEFL") {
    // If examType is TOEFL => no "See All Courses" or "X more courses..."
    // Just show up to 4 books, or all if 4 or fewer
    if (booksCount <= 4) {
      // Show all
      displayBooks = books.map((b) => ({
        isSeeAll: false,
        bookId: b.id,
        title: b.name || "Untitled",
        icon: getRandomIcon(),
      }));
    } else {
      // Show only first 4
      displayBooks = books
        .slice(0, 4)
        .map((b) => ({
          isSeeAll: false,
          bookId: b.id,
          title: b.name || "Untitled",
          icon: getRandomIcon(),
        }));
    }
  } else {
    // If examType is NOT TOEFL => original logic with "See All Courses"
    if (booksCount === 0) {
      // Single "See All Courses" card
      displayBooks = [
        {
          isSeeAll: true,
          title: "See All Courses",
          icon: "📚",
          extraCoursesCount: 0,
          bookId: null,
        },
      ];
    } else if (booksCount <= 4) {
      // 1-4 books => show them + "See All Courses"
      displayBooks = books.map((b) => ({
        isSeeAll: false,
        bookId: b.id,
        title: b.name || "Untitled",
        icon: getRandomIcon(),
      }));
      displayBooks.push({
        isSeeAll: true,
        title: "See All Courses",
        icon: "📚",
        extraCoursesCount: 0,
        bookId: null,
      });
    } else {
      // 5+ => show first 4, plus "X more courses available"
      const firstFour = books.slice(0, 4).map((b) => ({
        isSeeAll: false,
        bookId: b.id,
        title: b.name || "Untitled",
        icon: getRandomIcon(),
      }));
      const remaining = booksCount - 4;
      firstFour.push({
        isSeeAll: true,
        title: `${remaining} more courses available`,
        icon: "📚",
        extraCoursesCount: remaining,
        bookId: null,
      });
      displayBooks = firstFour;
    }
  }

  return (
    <div style={panelStyle}>
      {/* Top row: now with a clickable arrow near "My Courses / Books" */}
      <div style={topRowStyle}>
        {/* Container for the title + arrow */}
        <div style={titleArrowContainerStyle}>
          <h2 style={{ margin: 0 }}>My Courses / Books</h2>
          {/* The arrow also calls onSeeAllCourses, unless TOEFL */}
          {examType !== "TOEFL" && (
            <button style={titleArrowButtonStyle} onClick={onSeeAllCourses}>
              &gt;
            </button>
          )}
        </div>

        {/* "Upload New Material" on the right, hidden if TOEFL */}
        <div style={{ display: "flex", gap: "10px" }}>
          {examType !== "TOEFL" && (
            <button style={uploadButtonStyle} onClick={onOpenOnboarding}>
              <span style={{ marginRight: "6px" }}>⬆️</span> Upload New Material
            </button>
          )}
        </div>
      </div>

      {/* Main grid of course/book tiles */}
      <div style={tileContainerStyle}>
        {displayBooks.map((item, idx) => {
          if (item.isSeeAll) {
            // The "See All Courses" or "X more courses" tile
            return (
              <div key={`seeAll-${idx}`} style={tileStyle}>
                <div style={iconStyle}>{item.icon}</div>
                <h3 style={{ margin: "10px 0 5px 0" }}>{item.title}</h3>
                <div style={buttonRowStyle}>
                  <button
                    style={seeAllCoursesButtonStyle}
                    onClick={onSeeAllCourses}
                  >
                    See All Courses
                  </button>
                </div>
              </div>
            );
          } else {
            // A real book/course tile
            const bookId = item.bookId;
            const planInfo = plansData[bookId] || {};
            const {
              loading,
              error,
              hasPlan,
              planId,
              readCount = 0,
              quizCount = 0,
              reviseCount = 0,
              totalTime = 0,
            } = planInfo;

            if (loading) {
              return (
                <div key={`course-${idx}`} style={tileStyle}>
                  <div style={iconStyle}>{item.icon}</div>
                  <h3 style={{ margin: "10px 0 5px 0" }}>{item.title}</h3>
                  <p style={{ fontSize: "0.9rem", opacity: 0.7 }}>
                    Loading plan...
                  </p>
                </div>
              );
            }

            if (error || !hasPlan) {
              return (
                <div key={`course-${idx}`} style={tileStyle}>
                  <div style={iconStyle}>{item.icon}</div>
                  <h3 style={{ margin: "10px 0 5px 0" }}>{item.title}</h3>
                  <p
                    style={{
                      fontSize: "0.9rem",
                      opacity: 0.7,
                      marginTop: "10px",
                    }}
                  >
                    {error
                      ? `Error: ${error}`
                      : "No learning plan found for this course."}
                  </p>
                  <div style={buttonRowStyle}>
                    <button style={noPlanButtonStyle}>
                      Create Learning Plan
                    </button>
                  </div>
                </div>
              );
            }

            // If plan found => show stats + "Start Learning"
            return (
              <div key={`course-${idx}`} style={tileStyle}>
                <div style={iconStyle}>{item.icon}</div>
                <h3 style={{ margin: "10px 0 5px 0" }}>{item.title}</h3>

                <div style={progressBarContainerStyle}>
                  <div style={{ ...progressBarFillStyle, width: "40%" }} />
                </div>
                <p style={progressLabelStyle}>40% complete</p>

                <div style={targetInfoContainerStyle}>
                  <div style={infoLineStyle}>⏰ {totalTime} min total</div>
                  <div style={infoLineStyle}>📖 {readCount} read</div>
                  <div style={infoLineStyle}>❓ {quizCount} quizzes</div>
                  <div style={infoLineStyle}>🔄 {reviseCount} revise</div>
                </div>

                <div style={buttonRowStyle}>
                  <button
                    style={primaryButtonStyle}
                    onClick={() => handleStartLearning(bookId)}
                  >
                    Start Learning
                  </button>
                </div>
              </div>
            );
          }
        })}
      </div>

      {/* PlanFetcher DIALOG */}
      <Dialog
        open={showPlanDialog}
        onClose={() => setShowPlanDialog(false)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>Plan Viewer</DialogTitle>
        <DialogContent>
          {currentPlanId ? (
            <PlanFetcher planId={currentPlanId} userId={userId} />
          ) : (
            <p>No planId found. Cannot load plan.</p>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPlanDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

// ==================== STYLES ====================

const panelStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.1)",
  borderRadius: "8px",
  padding: "20px",
  color: "#fff",
  fontFamily: "'Open Sans', sans-serif",
  overflowY: "auto",
  maxHeight: "100%",
};

const topRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
};

const titleArrowContainerStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const titleArrowButtonStyle = {
  background: "transparent",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  fontSize: "1.5rem",
  lineHeight: "1",
  padding: 0,
};

const tileContainerStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  gap: "20px",
};

const tileStyle = {
  backgroundColor: "rgba(255, 255, 255, 0.2)",
  borderRadius: "6px",
  padding: "15px",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
};

const iconStyle = {
  fontSize: "2rem",
};

const buttonRowStyle = {
  display: "flex",
  gap: "10px",
  marginTop: "10px",
};

const baseButtonStyle = {
  padding: "8px 16px",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: "bold",
};

// "Start Learning" => Purple button
const primaryButtonStyle = {
  ...baseButtonStyle,
  backgroundColor: "#B39DDB",
  color: "#000",
};

// "See All Courses" => Blue button
const seeAllCoursesButtonStyle = {
  ...baseButtonStyle,
  backgroundColor: "#03A9F4",
  color: "#000",
};

// "Upload New Material" => Green button
const uploadButtonStyle = {
  ...baseButtonStyle,
  backgroundColor: "#4CAF50",
  color: "#000",
};

// "Create Learning Plan" => Orange button
const noPlanButtonStyle = {
  ...baseButtonStyle,
  backgroundColor: "#FF9800",
  color: "#000",
};

// Progress bar container
const progressBarContainerStyle = {
  width: "100%",
  height: "8px",
  backgroundColor: "rgba(255,255,255,0.3)",
  borderRadius: "4px",
  marginTop: "10px",
};

// Purple progress fill
const progressBarFillStyle = {
  height: "100%",
  backgroundColor: "#B39DDB",
  borderRadius: "4px",
  transition: "width 0.3s ease",
};

const progressLabelStyle = {
  margin: "5px 0",
  fontSize: "0.85rem",
  opacity: 0.8,
};

const targetInfoContainerStyle = {
  display: "flex",
  flexDirection: "column",
  marginTop: "10px",
};

const infoLineStyle = {
  fontSize: "0.75rem",
  marginBottom: "4px",
  opacity: 0.9,
};

export default PanelC;