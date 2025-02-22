// src/components/DetailedBookViewer/BooksViewer2.jsx
import React from "react";

// Child components
import BooksSidebar from "./BooksSidebar";
import AdaptiveSidebar from "./AdaptiveSidebar";
import OverviewSidebar from "./OverviewSidebar"; // NEW

import BookProgress from "./BookProgress";
import SubchapterContent from "./SubchapterContent";
import DynamicTutorModal from "./DynamicTutorModal";

// Removed the NavigationBar import
// import NavigationBar from "./NavigationBar";

// The custom hook with all your logic
import { useBooksViewer } from "./hooks/useBooksViewer";
import OverviewContent from "./OverviewContent"; // NEW

function BooksViewer2() {
  const {
    userId,
    categories,
    selectedCategory,
    getFilteredBooksData,
    selectedBook,
    selectedChapter,
    selectedSubChapter,
    expandedBookName,
    expandedChapters,
    showTutorModal,
    viewMode, // "library" or "adaptive" or "overview"
    setViewMode,
    setShowTutorModal,
    handleCategoryChange,
    toggleBookExpansion,
    toggleChapterExpansion,
    handleBookClick,
    handleChapterClick,
    handleSubChapterClick,
    handleToggleDone,
    getBookProgressInfo,
    fetchAllData,
  } = useBooksViewer();

  // ====== Styles ======
  const containerStyle = {
    display: "flex",
    flexDirection: "row",
    flex: 1,
    background: "linear-gradient(135deg, #0F2027, #203A43, #2C5364)",
    color: "#fff",
  };

  const mainContentStyle = {
    flex: 1,
    padding: "20px",
    position: "relative",
  };

  const buttonStyle = {
    padding: "10px 20px",
    borderRadius: "4px",
    border: "none",
    background: "#FFD700",
    color: "#000",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "opacity 0.3s",
    marginTop: "10px",
  };

  // Depending on "library" or "adaptive" or "overview", we filter or not:
  const displayedBooksData = getFilteredBooksData();

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* NavigationBar removed */}

      <div style={containerStyle}>
        {/* =========== SIDEBAR =========== */}
        {viewMode === "library" ? (
          <BooksSidebar
            categories={categories}
            selectedCategory={selectedCategory}
            selectedSubChapter={selectedSubChapter}
            onCategoryChange={handleCategoryChange}
            booksData={displayedBooksData}
            expandedBookName={expandedBookName}
            toggleBookExpansion={toggleBookExpansion}
            expandedChapters={expandedChapters}
            toggleChapterExpansion={toggleChapterExpansion}
            handleBookClick={handleBookClick}
            handleChapterClick={handleChapterClick}
            handleSubChapterClick={handleSubChapterClick}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        ) : viewMode === "adaptive" ? (
          <AdaptiveSidebar
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            booksData={displayedBooksData}
            selectedSubChapter={selectedSubChapter}
            handleSubChapterClick={handleSubChapterClick}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        ) : (
          // ================= OVERVIEW ====================
          <OverviewSidebar
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />
        )}

        {/* =========== MAIN CONTENT =========== */}
        <div style={mainContentStyle}>
          {viewMode === "overview" ? (
            // If in OVERVIEW mode, display the new component
            <OverviewContent />
          ) : (
            // Otherwise, keep the existing logic for library/adaptive
            <>
              {/* Tutor Modal button (only if a book is selected) */}
              {selectedBook && (
                <button
                  style={{
                    ...buttonStyle,
                    position: "absolute",
                    top: "20px",
                    right: "20px",
                    zIndex: 10,
                  }}
                  onClick={() => setShowTutorModal(true)}
                >
                  Learn Through Dynamic Tutor
                </button>
              )}

              {/* Book Progress */}
              {selectedBook && (
                <BookProgress
                  book={selectedBook}
                  selectedChapter={selectedChapter}
                  selectedSubChapter={selectedSubChapter}
                  getBookProgressInfo={getBookProgressInfo}
                />
              )}

              {/* If no subchapter is selected, show a placeholder */}
              {!selectedSubChapter && (
                <div
                  style={{
                    backgroundColor: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(6px)",
                    padding: "15px",
                    borderRadius: "6px",
                    marginBottom: "20px",
                  }}
                >
                  <h2
                    style={{
                      marginTop: 0,
                      borderBottom: "1px solid rgba(255,255,255,0.3)",
                      paddingBottom: "5px",
                      marginBottom: "10px",
                    }}
                  >
                    No Subchapter Selected
                  </h2>
                  <p>Please select a subchapter from the sidebar to see its content.</p>
                </div>
              )}

              {/* If a subchapter is selected, show its content */}
              {selectedSubChapter && (
                <SubchapterContent
                  subChapter={selectedSubChapter}
                  onToggleDone={handleToggleDone}
                  userId={userId}
                  backendURL={import.meta.env.VITE_BACKEND_URL}
                  onRefreshData={fetchAllData}
                />
              )}

              {/* Dynamic Tutor Modal */}
              {showTutorModal && (
                <DynamicTutorModal
                  book={selectedBook}
                  chapter={selectedChapter}
                  subChapter={selectedSubChapter}
                  onClose={() => setShowTutorModal(false)}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default BooksViewer2;