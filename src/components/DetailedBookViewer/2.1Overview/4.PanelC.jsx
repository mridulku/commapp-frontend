// src/components/DetailedBookViewer/PanelC.jsx

import React, { useState, useEffect } from "react";
import axios from "axios";

// A helper to randomize icons for each book tile
function getRandomIcon() {
  const icons = ["📐", "🔬", "🏰", "🎨", "📚", "📝", "📊", "💻"];
  return icons[Math.floor(Math.random() * icons.length)];
}

/**
 * PanelC
 * Renders a list of the user's books, plus their "Day 1" plan data if it exists.
 *
 * Props:
 *  - userId (string): The user's ID
 *  - onOpenOnboarding (function): Callback to open the "OnboardingModal" from parent
 */
function PanelC({ userId = "demoUser123", onOpenOnboarding = () => {} }) {
  const [books, setBooks] = useState([]);
  // We'll store plan info for each book in an object keyed by the book's doc.id
  // e.g. plansData[bookId] = { loading, error, hasPlan, readCount, quizCount, reviseCount, totalTime }
  const [plansData, setPlansData] = useState({});

  // ------------------------------------------------
  // 1) FETCH THE BOOKS
  // ------------------------------------------------
  useEffect(() => {
    if (!userId) return;

    async function fetchBooks() {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/books-user`, {
          params: { userId },
        });

        if (res.data && res.data.success) {
          console.log("Books fetched from the server:", res.data.data);
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
  // 2) WHEN BOOKS ARRIVE, FETCH THE PLAN FOR EACH
  // ------------------------------------------------
  useEffect(() => {
    async function fetchPlanForBook(bookId) {
      // Mark the plan as loading
      setPlansData((prev) => ({
        ...prev,
        [bookId]: { loading: true, error: null, hasPlan: false },
      }));

      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/adaptive-plans`, {
          params: {
            userId,
            bookId, // same approach as your EditAdaptivePlanModal
          },
        });

        const allPlans = res.data?.plans || [];
        if (allPlans.length === 0) {
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

        // Sort by createdAt descending
        allPlans.sort((a, b) => {
          const tA = new Date(a.createdAt).getTime();
          const tB = new Date(b.createdAt).getTime();
          return tB - tA;
        });
        const recentPlan = allPlans[0];

        // Grab "Day 1" (session[0]) data if available
        let readCount = 0;
        let quizCount = 0;
        let reviseCount = 0;
        let totalTime = 0;

        if (recentPlan.sessions && recentPlan.sessions.length > 0) {
          const day1Activities = recentPlan.sessions[0].activities || [];
          day1Activities.forEach((act) => {
            if (act.type === "READ") {
              readCount += 1;
            } else if (act.type === "QUIZ") {
              quizCount += 1;
            } else if (act.type === "REVISE") {
              reviseCount += 1;
            }
            // If timeNeeded is on each activity, sum it to totalTime
            if (act.timeNeeded) {
              totalTime += act.timeNeeded;
            }
          });
        }

        // Save plan data
        setPlansData((prev) => ({
          ...prev,
          [bookId]: {
            loading: false,
            error: null,
            hasPlan: true,
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
          [bookId]: { loading: false, error: err.message, hasPlan: false },
        }));
      }
    }

    // For each book, call fetchPlanForBook
    books.forEach((book) => {
      if (!book.id) return; // if missing doc id for some reason
      fetchPlanForBook(book.id);
    });
  }, [books, userId]);

  // ------------------------------------------------
  // Display logic
  // ------------------------------------------------
  const booksCount = books.length;
  let displayBooks = [];

  if (booksCount === 0) {
    // No books => single "See All Courses" card
    displayBooks = [
      {
        isSeeAll: true,
        title: "See All Courses",
        icon: "📚",
        extraCoursesCount: 0,
        bookId: null,
      },
    ];
  } else if (booksCount < 4) {
    // 1-3 books => show them + "See All Courses"
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
    // 4+ => show first 3, plus "X more courses"
    const firstThree = books.slice(0, 3).map((b) => ({
      isSeeAll: false,
      bookId: b.id,
      title: b.name || "Untitled",
      icon: getRandomIcon(),
    }));
    const remaining = booksCount - 3;
    firstThree.push({
      isSeeAll: true,
      title: `${remaining} more courses available`,
      icon: "📚",
      extraCoursesCount: remaining,
      bookId: null,
    });
    displayBooks = firstThree;
  }

  return (
    <div style={panelStyle}>
      {/* Top row: Title + "Upload New Material" button */}
      <div style={topRowStyle}>
        <h2 style={{ margin: 0 }}>My Courses / Books</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          {/*
            Updated: We call onOpenOnboarding() from the parent
            to show the same "OnboardingModal" used by the red floating button
          */}
          <button style={uploadButtonStyle} onClick={onOpenOnboarding}>
            <span style={{ marginRight: "6px" }}>⬆️</span> Upload New Material
          </button>
        </div>
      </div>

      {/* Main grid of course/book tiles */}
      <div style={tileContainerStyle}>
        {displayBooks.map((item, idx) => {
          if (item.isSeeAll) {
            // "See All Courses" or "X more courses" tile
            return (
              <div key={`seeAll-${idx}`} style={tileStyle}>
                <div style={iconStyle}>{item.icon}</div>
                <h3 style={{ margin: "10px 0 5px 0" }}>{item.title}</h3>

                <div style={buttonRowStyle}>
                  <button style={seeAllCoursesButtonStyle}>
                    See All Courses
                  </button>
                </div>
              </div>
            );
          } else {
            // Normal course tile => check plan data in plansData[item.bookId]
            const planInfo = plansData[item.bookId] || {};
            const {
              loading,
              error,
              hasPlan,
              readCount = 0,
              quizCount = 0,
              reviseCount = 0,
              totalTime = 0,
            } = planInfo;

            // If still loading plan data
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

            // If error or no plan found
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

            // If we do have a plan => show progress bar (40% placeholder) + stats
            return (
              <div key={`course-${idx}`} style={tileStyle}>
                <div style={iconStyle}>{item.icon}</div>
                <h3 style={{ margin: "10px 0 5px 0" }}>{item.title}</h3>

                {/* Progress bar (purple) */}
                <div style={progressBarContainerStyle}>
                  <div
                    style={{
                      ...progressBarFillStyle,
                      width: "40%", // placeholder for now
                    }}
                  />
                </div>
                <p style={progressLabelStyle}>40% complete</p>

                {/* Each item on its own line, small text */}
                <div style={targetInfoContainerStyle}>
                  <div style={infoLineStyle}>⏰ {totalTime} min total</div>
                  <div style={infoLineStyle}>📖 {readCount} read</div>
                  <div style={infoLineStyle}>❓ {quizCount} quizzes</div>
                  <div style={infoLineStyle}>🔄 {reviseCount} revise</div>
                </div>

                <div style={buttonRowStyle}>
                  <button style={primaryButtonStyle}>Start Learning</button>
                </div>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}

// ==================== Styles ====================

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

// Container for line-by-line stats
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