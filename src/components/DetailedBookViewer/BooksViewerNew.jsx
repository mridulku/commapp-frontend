// src/components/DetailedBookViewer/BooksViewer2.jsx

import React, { useState } from "react";
import { useBooksViewer } from "./hooks/useBooksViewer";
import UnifiedSidebar from "./UnifiedSidebar";
import ToursManager from "./ToursManager";

// Existing components...
import BookProgress from "./BookProgress";
import SubchapterContent from "./SubchapterContent";
import OverviewContent from "./OverviewContent";
import UserProfileAnalytics from "./UserProfileAnalytics";
import PanelA from "./PanelA";
import PanelB from "./PanelB";
import PanelC from "./PanelC";
import PanelD from "./PanelD";
import StatsPanel from "./StatsPanel";
import BookSummary from "./BookSummary";
import LibraryHome from "./LibraryHome";
import AdaptiveHome from "./AdaptiveHome";

// NEW: The cinematic "player" modal
import AdaptivePlayerModal from "./AdaptivePlayerModal"; // <-- Adjust path as needed

function BooksViewer2() {
  const {
    userId,
    isOnboarded,
    categories,
    selectedCategory,
    getFilteredBooksData,
    selectedBook,
    selectedChapter,
    selectedSubChapter,
    expandedBookName,
    expandedChapters,
    viewMode,
    setViewMode,
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

  // For the Joyride-based tour:
  const [triggerTour, setTriggerTour] = useState(false);

  // For the cinematic "player" modal:
  const [showPlayer, setShowPlayer] = useState(false);

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

  // Floating question-mark button (bottom-left)
  const floatTourButtonStyle = {
    position: "fixed",
    bottom: "20px",
    left: "20px",
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    backgroundColor: "#444",
    color: "#fff",
    fontSize: "1.5rem",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999, // ensure it floats on top
  };

  // NEW: Floating “player” button (bottom-right)
  const floatPlayerButtonStyle = {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    backgroundColor: "#ee4444",
    color: "#fff",
    fontSize: "1.3rem",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  };

  // Filter the data based on library/adaptive/overview mode
  const displayedBooksData = getFilteredBooksData();

  // Decide main content for each viewMode
  let mainContent;
  if (viewMode === "overview") {
    if (!isOnboarded) {
      mainContent = <OverviewContent />;
    } else {
      mainContent = (
        <>
          <StatsPanel />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <PanelB />
            <PanelA />
            <PanelC />
            <PanelD
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
              booksData={displayedBooksData}
              handleSubChapterClick={handleSubChapterClick}
              selectedSubChapter={selectedSubChapter}
            />
          </div>
        </>
      );
    }
  } else if (viewMode === "profile") {
    mainContent = <UserProfileAnalytics />;
  } else if (viewMode === "library") {
    if (!selectedBook) {
      mainContent = <LibraryHome booksData={displayedBooksData} />;
    } else {
      mainContent = (
        <>
          {selectedSubChapter && (
            <BookProgress
              book={selectedBook}
              selectedChapter={selectedChapter}
              selectedSubChapter={selectedSubChapter}
              getBookProgressInfo={getBookProgressInfo}
            />
          )}
          {selectedBook && !selectedSubChapter && (
            <BookSummary
              book={selectedBook}
              getBookProgressInfo={getBookProgressInfo}
            />
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
        </>
      );
    }
  } else if (viewMode === "adaptive") {
    if (!selectedBook) {
      mainContent = <AdaptiveHome booksData={displayedBooksData} />;
    } else {
      mainContent = (
        <>
          {selectedSubChapter && (
            <BookProgress
              book={selectedBook}
              selectedChapter={selectedChapter}
              selectedSubChapter={selectedSubChapter}
              getBookProgressInfo={getBookProgressInfo}
            />
          )}
          {selectedBook && !selectedSubChapter && (
            <BookSummary
              book={selectedBook}
              getBookProgressInfo={getBookProgressInfo}
            />
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
        </>
      );
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <div style={containerStyle}>
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

        <div style={mainContentStyle}>{mainContent}</div>
      </div>

      {/* Floating "?" button to start the Joyride tour */}
      <button
        style={floatTourButtonStyle}
        onClick={() => setTriggerTour(true)}
        title="Start Tour"
      >
        ?
      </button>

      {/* NEW Floating "player" button to open the cinematic learning modal */}
      <button
        style={floatPlayerButtonStyle}
        onClick={() => setShowPlayer(true)}
        title="Start Player"
      >
        ►
      </button>

      {/* ToursManager for Joyride-based tours */}
      <ToursManager
        viewMode={viewMode}
        selectedBook={selectedBook}
        selectedSubChapter={selectedSubChapter}
        triggerTour={triggerTour}
        onTourDone={() => setTriggerTour(false)}
      />

      {/* The cinematic "player" modal */}
      <AdaptivePlayerModal
        isOpen={showPlayer}
        onClose={() => setShowPlayer(false)}
        userName="Jane Doe" // or pass dynamic name from context
      />
    </div>
  );
}

export default BooksViewer2;