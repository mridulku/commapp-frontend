import React, { useEffect, useState } from "react";
import NavigationBar from "../DetailedBookViewer/NavigationBar";

const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

/** ============================= Utility Functions ============================= **/

/**
 * Parse leading numeric sections (e.g., "10.2.1 Subchapter" => [10, 2, 1])
 */
function parseLeadingSections(str) {
  const parts = str.split(".").map((p) => p.trim());
  const result = [];
  for (let i = 0; i < parts.length; i++) {
    const maybeNum = parseInt(parts[i], 10);
    if (!isNaN(maybeNum)) {
      result.push(maybeNum);
    } else {
      break;
    }
  }
  if (result.length === 0) return [Infinity];
  return result;
}

/** Compare arrays of numeric segments lexicographically. */
function compareSections(aSections, bSections) {
  const len = Math.max(aSections.length, bSections.length);
  for (let i = 0; i < len; i++) {
    const aVal = aSections[i] ?? 0;
    const bVal = bSections[i] ?? 0;
    if (aVal !== bVal) {
      return aVal - bVal;
    }
  }
  return 0;
}

/** Sort array of objects by numeric segments in obj.name. */
function sortByNameWithNumericAware(items) {
  return items.sort((a, b) => {
    if (!a.name && !b.name) return 0;
    if (!a.name) return 1;
    if (!b.name) return -1;

    const aSections = parseLeadingSections(a.name);
    const bSections = parseLeadingSections(b.name);

    const sectionCompare = compareSections(aSections, bSections);
    if (sectionCompare !== 0) {
      return sectionCompare;
    } else {
      return a.name.localeCompare(b.name);
    }
  });
}

/** Compute word counts for read/proficient progress bars. */
function getBookProgressStats(book) {
  let totalWords = 0;
  let readOrProficientWords = 0;
  let proficientWords = 0;

  if (book.chapters) {
    book.chapters.forEach((ch) => {
      if (!ch.subchapters) return;
      ch.subchapters.forEach((sub) => {
        const wc = sub.wordCount || 0;
        totalWords += wc;
        if (sub.proficiency === "read" || sub.proficiency === "proficient") {
          readOrProficientWords += wc;
        }
        if (sub.proficiency === "proficient") {
          proficientWords += wc;
        }
      });
    });
  }

  return { totalWords, readOrProficientWords, proficientWords };
}

/** ============================= AcademicHomePage ============================= **/

function AcademicHomePage() {
  // Hardcoded reading parameters
  const wpm = 200;
  const dailyTime = 10; 
  const wordsPerDay = wpm * dailyTime;

  // State for fetched books data
  const [books, setBooks] = useState([]);
  const [readingPlan, setReadingPlan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch book data on mount
  useEffect(() => {
    fetch(`${backendURL}/api/books-structure`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch book data");
        }
        return res.json();
      })
      .then((data) => {
        // Sort chapters/subchapters numerically
        const sortedBooks = data.map((book) => {
          if (!book.chapters) return book;
          // Sort chapters
          const sortedChapters = sortByNameWithNumericAware([...book.chapters]).map((chapter) => {
            if (!chapter.subchapters) return chapter;
            // Sort subchapters
            const sortedSubs = sortByNameWithNumericAware([...chapter.subchapters]);
            return { ...chapter, subchapters: sortedSubs };
          });
          return { ...book, chapters: sortedChapters };
        });
        setBooks(sortedBooks);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Generate the reading plan whenever we get our sorted books
  useEffect(() => {
    if (books.length === 0) return;
    const newPlan = books.map((book) => {
      const days = [];
      let currentDaySubchapters = [];
      let currentDayWordCount = 0;
      let dayIndex = 1;

      if (!book.chapters) {
        return {
          bookName: book.name || "Untitled Book",
          days: [],
          bookData: book,
        };
      }

      // Build day-by-day distribution
      for (const chapter of book.chapters) {
        if (!chapter.subchapters) continue;
        for (const sub of chapter.subchapters) {
          const subWordCount = sub.wordCount || 0;
          // If adding this subchapter exceeds daily limit, start a new day
          if (
            currentDayWordCount + subWordCount > wordsPerDay &&
            currentDayWordCount > 0
          ) {
            days.push({
              dayNumber: dayIndex,
              subchapters: currentDaySubchapters,
              totalWords: currentDayWordCount,
            });
            dayIndex += 1;
            currentDaySubchapters = [];
            currentDayWordCount = 0;
          }
          currentDaySubchapters.push({
            chapterName: chapter.name,
            subchapterName: sub.name,
            wordCount: subWordCount,
            proficiency: sub.proficiency || null,
          });
          currentDayWordCount += subWordCount;
        }
      }

      // leftover subchapters for the last day
      if (currentDaySubchapters.length > 0) {
        days.push({
          dayNumber: dayIndex,
          subchapters: currentDaySubchapters,
          totalWords: currentDayWordCount,
        });
      }

      return {
        bookName: book.name || "Untitled Book",
        bookData: book,
        days,
      };
    });

    setReadingPlan(newPlan);
  }, [books, wordsPerDay]);

  /** ========== Rendering Helpers ========== **/

  // Returns background color for row based on subchapter proficiency
  const getRowStyle = (proficiency) => {
    if (proficiency === "proficient") {
      return { backgroundColor: "rgba(0,255,0,0.3)" }; // Light green overlay
    }
    if (proficiency === "read") {
      return { backgroundColor: "rgba(255,255,0,0.3)" }; // Light yellow overlay
    }
    return {}; // default
  };

  // Simple progress bar
  function ProgressBar({ percentage, color }) {
    return (
      <div
        style={{
          width: "100%",
          backgroundColor: "#444",
          height: "12px",
          borderRadius: "4px",
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            height: "100%",
            borderRadius: "4px",
            transition: "width 0.4s ease",
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      {/* === Top NavBar === */}
      <NavigationBar />

      {/* === Main Layout (sidebar + content) === */}
      <div
        style={{
          display: "flex",
          flex: 1,
          background: "linear-gradient(135deg, #0F2027, #203A43, #2C5364)",
          fontFamily: "'Open Sans', sans-serif",
          color: "#fff",
        }}
      >
        {/* ======= Sidebar ======= */}
        <aside
          style={{
            width: "220px",
            backgroundColor: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(8px)",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "15px",
          }}
        >
          <h3 style={{ marginTop: 0 }}>Menu</h3>
          <button
            style={sidebarButtonStyle}
            onClick={() => alert("View All Courses clicked")}
          >
            View All Courses
          </button>
          <button
            style={sidebarButtonStyle}
            onClick={() => alert("Upload Material clicked")}
          >
            Upload Material
          </button>
          <button
            style={sidebarButtonStyle}
            onClick={() => alert("Change Configuration clicked")}
          >
            Change Configuration
          </button>
          <div style={{ marginTop: "auto" }}>
            <button
              style={sidebarButtonStyle}
              onClick={() => alert("Switch to Light Mode toggled!")}
            >
              Switch to Light Mode
            </button>
          </div>
        </aside>

        {/* ======= Main Content: Reading Plan ======= */}
        <main style={{ flex: 1, padding: "30px" }}>
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: "10px",
              padding: "20px",
            }}
          >
            <h1 style={{ marginTop: 0, marginBottom: "1rem" }}>Reading Plan</h1>

            {/* Auto-generated plan info */}
            <p style={{ marginBottom: "1rem" }}>
              Reading Rate: <strong>{wpm} words/min</strong> &nbsp;|&nbsp; Daily
              Reading Time: <strong>{dailyTime} min</strong>
            </p>

            {loading && <p>Loading data…</p>}
            {error && <p style={{ color: "red" }}>Error: {error}</p>}

            {!loading && !error && readingPlan.length === 0 && (
              <p>No books found.</p>
            )}

            {!loading &&
              !error &&
              readingPlan.map((bookPlan, idx) => {
                // Compute reading & proficiency progress for each book
                const { totalWords, readOrProficientWords, proficientWords } =
                  getBookProgressStats(bookPlan.bookData);
                const readingPercent =
                  totalWords > 0
                    ? (readOrProficientWords / totalWords) * 100
                    : 0;
                const proficiencyPercent =
                  totalWords > 0 ? (proficientWords / totalWords) * 100 : 0;

                return (
                  <div key={idx} style={{ marginBottom: "2rem" }}>
                    <h2 style={{ marginBottom: "0.5rem" }}>
                      {bookPlan.bookName}
                    </h2>

                    {/* Progress bars */}
                    <div style={{ marginBottom: "0.5rem" }}>
                      <p style={{ margin: "0 0 4px 0" }}>
                        Reading Progress: {readOrProficientWords} / {totalWords}{" "}
                        words
                      </p>
                      <ProgressBar percentage={readingPercent} color="#FFD700" />
                    </div>
                    <div style={{ marginBottom: "1rem" }}>
                      <p style={{ margin: "0 0 4px 0" }}>
                        Proficiency Progress: {proficientWords} / {totalWords}{" "}
                        words
                      </p>
                      <ProgressBar percentage={proficiencyPercent} color="lime" />
                    </div>

                    {/* Day-by-Day Plan */}
                    {bookPlan.days.length === 0 ? (
                      <p>No chapters/subchapters in this book.</p>
                    ) : (
                      bookPlan.days.map((day) => (
                        <div
                          key={day.dayNumber}
                          style={{
                            border: "1px solid rgba(255,255,255,0.3)",
                            padding: "1rem",
                            marginBottom: "1rem",
                            borderRadius: "8px",
                          }}
                        >
                          <h3 style={{ marginTop: 0 }}>Day {day.dayNumber}</h3>
                          <p style={{ marginBottom: "0.5rem" }}>
                            Total Words: {day.totalWords}
                          </p>

                          <table
                            style={{
                              width: "100%",
                              borderCollapse: "collapse",
                              color: "#fff",
                            }}
                          >
                            <thead>
                              <tr
                                style={{
                                  borderBottom: "1px solid #666",
                                  textAlign: "left",
                                }}
                              >
                                <th style={{ width: "40%" }}>Chapter</th>
                                <th style={{ width: "40%" }}>Subchapter</th>
                                <th>Word Count</th>
                              </tr>
                            </thead>
                            <tbody>
                              {day.subchapters.map((sc, index) => (
                                <tr
                                  key={index}
                                  style={{
                                    borderBottom: "1px solid rgba(255,255,255,0.2)",
                                    ...getRowStyle(sc.proficiency),
                                  }}
                                >
                                  <td style={{ padding: "4px 8px" }}>
                                    {sc.chapterName}
                                  </td>
                                  <td style={{ padding: "4px 8px" }}>
                                    {sc.subchapterName}
                                  </td>
                                  <td style={{ padding: "4px 8px" }}>
                                    {sc.wordCount}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
          </div>
        </main>
      </div>
    </div>
  );
}

/** ====== Reusable sidebar button style ====== **/
const sidebarButtonStyle = {
  background: "none",
  border: "1px solid #FFD700",
  borderRadius: "4px",
  padding: "10px",
  color: "#FFD700",
  fontWeight: "bold",
  cursor: "pointer",
  marginBottom: "5px",
};

export default AcademicHomePage;
