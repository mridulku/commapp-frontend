// File: src/components/DetailedBookViewer/PanelGeneral.jsx
import React from "react";

// Quick helper for random icons
function getRandomIcon() {
  const icons = ["📐", "🔬", "🏰", "🎨", "📚", "📝", "📊", "💻"];
  return icons[Math.floor(Math.random() * icons.length)];
}

/**
 * PanelGeneral
 * - Original approach: show up to 4 books, plus a "See All Courses" tile if more
 *   than 4 exist. Also includes "Upload New Material" button if you want it.
 */
export default function PanelGeneral({
  books,
  plansData,
  handleStartLearning,
  onOpenOnboarding,
  onSeeAllCourses,
}) {
  const booksCount = books.length;
  let displayBooks = [];

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
    // 5+ => show first 4, plus "X more courses"
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

  return (
    <div style={styles.container}>
      {/* Title row + "Upload New Material" */}
      <div style={styles.topRow}>
        <h2>My Courses / Books</h2>
        <button style={styles.uploadButton} onClick={onOpenOnboarding}>
          <span style={{ marginRight: "6px" }}>⬆️</span> Upload New Material
        </button>
      </div>

      {/* The tiles */}
      <div style={styles.tileContainer}>
        {displayBooks.map((item, idx) => {
          if (item.isSeeAll) {
            // "See All" tile
            return (
              <div key={`seeAll-${idx}`} style={styles.tile}>
                <div style={styles.iconStyle}>{item.icon}</div>
                <h3 style={{ margin: "10px 0 5px 0" }}>{item.title}</h3>
                <div style={styles.buttonRow}>
                  <button style={styles.seeAllButton} onClick={onSeeAllCourses}>
                    See All Courses
                  </button>
                </div>
              </div>
            );
          } else {
            // A real book tile
            const planInfo = plansData[item.bookId] || {};
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

            return (
              <div key={`course-${idx}`} style={styles.tile}>
                <div style={styles.iconStyle}>{item.icon}</div>
                <h3 style={{ margin: "10px 0 5px 0" }}>{item.title}</h3>

                {/* Loading / error / no plan / plan display */}
                {loading && (
                  <p style={{ fontSize: "0.9rem", opacity: 0.7 }}>Loading plan...</p>
                )}
                {!loading && error && (
                  <p style={{ fontSize: "0.9rem", opacity: 0.7, marginTop: "10px" }}>
                    Error: {error}
                  </p>
                )}
                {!loading && !error && !hasPlan && (
                  <p style={{ fontSize: "0.9rem", opacity: 0.7, marginTop: "10px" }}>
                    No learning plan found.
                  </p>
                )}
                {!loading && !error && hasPlan && (
                  <>
                    <div style={styles.progressBarContainer}>
                      <div style={{ ...styles.progressBarFill, width: "40%" }} />
                    </div>
                    <p style={styles.progressLabel}>40% complete</p>

                    <div style={styles.infoContainer}>
                      <div style={styles.infoLine}>⏰ {totalTime} min total</div>
                      <div style={styles.infoLine}>📖 {readCount} read</div>
                      <div style={styles.infoLine}>❓ {quizCount} quizzes</div>
                      <div style={styles.infoLine}>🔄 {reviseCount} revise</div>
                    </div>

                    <div style={styles.buttonRow}>
                      <button
                        style={styles.primaryButton}
                        onClick={() => handleStartLearning(item.bookId)}
                      >
                        Start Learning
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: "#4CAF50",
    color: "#000",
    border: "none",
    borderRadius: 4,
    padding: "8px 16px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  tileContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "20px",
    marginTop: 16,
  },
  tile: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: "6px",
    padding: "15px",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  iconStyle: {
    fontSize: "2rem",
  },
  buttonRow: {
    display: "flex",
    gap: "10px",
    marginTop: "10px",
  },
  seeAllButton: {
    backgroundColor: "#03A9F4",
    color: "#000",
    border: "none",
    borderRadius: 4,
    padding: "8px 16px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  progressBarContainer: {
    width: "100%",
    height: "8px",
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: "4px",
    marginTop: "10px",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#B39DDB",
    borderRadius: "4px",
    transition: "width 0.3s ease",
  },
  progressLabel: {
    margin: "5px 0",
    fontSize: "0.85rem",
    opacity: 0.8,
  },
  infoContainer: {
    display: "flex",
    flexDirection: "column",
    marginTop: "10px",
  },
  infoLine: {
    fontSize: "0.75rem",
    marginBottom: "4px",
    opacity: 0.9,
  },
  primaryButton: {
    backgroundColor: "#B39DDB",
    color: "#000",
    border: "none",
    borderRadius: 4,
    padding: "8px 16px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};