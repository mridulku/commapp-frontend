// src/components/DetailedBookViewer/BooksViewer2.jsx
import React from "react";
import { useBooksViewer } from "./hooks/useBooksViewer";

// Our single unified sidebar:
import UnifiedSidebar from "./UnifiedSidebar";

// Existing components
import BookProgress from "./BookProgress";
import SubchapterContent from "./SubchapterContent";
import OverviewContent from "./OverviewContent";
import UserProfileAnalytics from "./UserProfileAnalytics";

// 2x2 grid panels
import PanelA from "./PanelA";
import PanelB from "./PanelB";
import PanelC from "./PanelC";
import PanelD from "./PanelD";

// Stats & Summaries
import StatsPanel from "./StatsPanel";
import BookSummary from "./BookSummary";

// NEW: Separate library & adaptive home components
import LibraryHome from "./LibraryHome";
import AdaptiveHome from "./AdaptiveHome";

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

  // Filtered data depending on "library", "adaptive", or "overview"
  const displayedBooksData = getFilteredBooksData();

  // Decide main content
  let mainContent;
  if (viewMode === "overview") {
    // 1) If not onboarded, show onboarding
    if (!isOnboarded) {
      mainContent = <OverviewContent />;
    } else {
      // 2) Otherwise, show stats panel + 2x2 grid
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
    // If in library mode:
    if (!selectedBook) {
      // No book => show LibraryHome
      mainContent = <LibraryHome booksData={displayedBooksData} />;
    } else {
      // Show BookSummary or SubchapterContent
      mainContent = (
        <>
          {/* Show BookProgress only if a subchapter is selected */}
          {selectedSubChapter && (
            <BookProgress
              book={selectedBook}
              selectedChapter={selectedChapter}
              selectedSubChapter={selectedSubChapter}
              getBookProgressInfo={getBookProgressInfo}
            />
          )}

          {/* BookSummary if we have a book but no subchapter */}
          {selectedBook && !selectedSubChapter && (
            <BookSummary
              book={selectedBook}
              getBookProgressInfo={getBookProgressInfo}
            />
          )}

          {/* If a subchapter is selected => subchapter content */}
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
    // If in adaptive mode:
    if (!selectedBook) {
      // No book => show AdaptiveHome
      mainContent = <AdaptiveHome booksData={displayedBooksData} />;
    } else {
      // Show BookSummary or SubchapterContent
      mainContent = (
        <>
          {/* Show BookProgress only if a subchapter is selected */}
          {selectedSubChapter && (
            <BookProgress
              book={selectedBook}
              selectedChapter={selectedChapter}
              selectedSubChapter={selectedSubChapter}
              getBookProgressInfo={getBookProgressInfo}
            />
          )}

          {/* BookSummary if we have a book but no subchapter */}
          {selectedBook && !selectedSubChapter && (
            <BookSummary
              book={selectedBook}
              getBookProgressInfo={getBookProgressInfo}
            />
          )}

          {/* If a subchapter is selected => subchapter content */}
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