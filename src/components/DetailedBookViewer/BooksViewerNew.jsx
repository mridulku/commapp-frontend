// src/components/DetailedBookViewer/BooksViewer2.jsx
import React from "react";
import { useBooksViewer } from "./hooks/useBooksViewer";

// Our new single sidebar:
import UnifiedSidebar from "./UnifiedSidebar";

import BookProgress from "./BookProgress";
import SubchapterContent from "./SubchapterContent";
import DynamicTutorModal from "./DynamicTutorModal";
import OverviewContent from "./OverviewContent"; // optional

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
    viewMode,
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

  // Layout styling
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

  // Filter books data for library/adaptive
  const displayedBooksData = getFilteredBooksData();

  // Decide main content
  let mainContent;
  if (viewMode === "overview") {
    mainContent = <OverviewContent />;
  } else if (viewMode === "profile") {
    mainContent = (
      <div>
        <h2>Profile Section</h2>
        <p>Display user profile details or settings here.</p>
      </div>
    );
  } else {
    // library or adaptive
    mainContent = (
      <>
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

        {selectedBook && (
          <BookProgress
            book={selectedBook}
            selectedChapter={selectedChapter}
            selectedSubChapter={selectedSubChapter}
            getBookProgressInfo={getBookProgressInfo}
          />
        )}

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

        {selectedSubChapter && (
          <SubchapterContent
            subChapter={selectedSubChapter}
            onToggleDone={handleToggleDone}
            userId={userId}
            backendURL={import.meta.env.VITE_BACKEND_URL}
            onRefreshData={fetchAllData}
          />
        )}

        {showTutorModal && (
          <DynamicTutorModal
            book={selectedBook}
            chapter={selectedChapter}
            subChapter={selectedSubChapter}
            onClose={() => setShowTutorModal(false)}
          />
        )}
      </>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <div style={containerStyle}>
        {/* The single unified sidebar with the mode toggles plus content */}
        <UnifiedSidebar
          viewMode={viewMode}
          setViewMode={setViewMode}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          booksData={displayedBooksData}
          expandedBookName={expandedBookName}
          toggleBookExpansion={toggleBookExpansion}
          expandedChapters={expandedChapters}
          toggleChapterExpansion={toggleChapterExpansion}
          handleBookClick={handleBookClick}
          handleChapterClick={handleChapterClick}
          handleSubChapterClick={handleSubChapterClick}
          selectedSubChapter={selectedSubChapter}
        />

        {/* Main content area */}
        <div style={mainContentStyle}>{mainContent}</div>
      </div>
    </div>
  );
}

export default BooksViewer2;