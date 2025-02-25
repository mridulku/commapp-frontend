// src/components/DetailedBookViewer/BooksViewer2.jsx

import React, { useState } from "react";
import { useBooksViewer } from "./useBooksViewer";
import UnifiedSidebar from "./1.SidePanels/0.UnifiedSidebar";
import ToursManager from "./0.1Tours/ToursManager";

// Existing components...
import BookProgress from "./2.2Library/BookProgress";
import SubchapterContent from "./4.Subchapter Content/0.SubchapterContent";
import OverviewContent from "./2.1Overview/0.OverviewContent";


import UserProfileAnalytics from "./2.4Profile/UserProfileAnalytics";
import PanelA from "./2.1Overview/2.PanelA";
import PanelB from "./2.1Overview/3.PanelB";
import PanelC from "./2.1Overview/4.PanelC";
import PanelD from "./2.1Overview/5.PanelD";
import StatsPanel from "./2.1Overview/1.StatsPanel";
import BookSummary from "./2.2Library/BookSummary";
import LibraryHome from "./2.2Library/LibraryHome";
import AdaptiveHome from "./2.3Adaptive/AdaptiveHome";

// NEW: The cinematic "player" modal
import AdaptivePlayerModal from "./3.AdaptiveModal/AdaptivePlayerModal"; // <-- Adjust path as needed

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

  const [selectedHomeActivity, setSelectedHomeActivity] = useState(null);

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
  } else if (viewMode === "home") {
       if (selectedHomeActivity) {
         // Show filler content for now
         mainContent = (
           <div style={{ fontSize: "1.2rem", color: "lightcyan" }}>
             Filler content for: <strong>{selectedHomeActivity?.subChapterName}</strong>
           </div>
         );
       } else {
         // If no activity has been clicked yet
         mainContent = (
           <div style={{ color: "#FFD700" }}>
             Please select a day/activity in the <em>Home</em> sidebar.
           </div>
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
          homePlanId="wQvYSM1Xzl262djm5rYK" // or whichever doc ID you want
         onHomeSelect={(act) => setSelectedHomeActivity(act)}
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
  userId={userId} 
  planId="11duPwJWXVWT9flhwGCX"
/>
    </div>
  );
}

export default BooksViewer2;