import React, { useState, useEffect } from "react";
import Joyride, { STATUS } from "react-joyride";

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

  // ========== Joyride Setup ==========

  const [runTour, setRunTour] = useState(false);

  // Steps referencing IDs in LibraryHome
  const tourSteps = [
    {
      target: "#libraryHomeTitle",
      content: "This is the main title for your library page.",
    },
    {
      target: "#libraryNoBooks",
      content: "This message appears if no books are found in your library.",
    },
    {
      target: "#libraryHomeGrid",
      content: "Here you see a grid of your books.",
    },
  ];

  // Callback
  const handleJoyrideCallback = (data) => {
    console.log("Joyride callback =>", data);
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);
    }
  };

  // **Use an effect to start Joyride only in Library mode with no selected book**:
  useEffect(() => {
    // If we're in library mode and no book is selected, we know LibraryHome is displayed
    if (viewMode === "library" && !selectedBook) {
      console.log(">>> Enabling Joyride for LibraryHome");
      setRunTour(true);
    } else {
      setRunTour(false);
    }
  }, [viewMode, selectedBook]);

  // Filtered data depending on "library", "adaptive", or "overview"
  const displayedBooksData = getFilteredBooksData();

  // Decide main content
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
            <BookSummary book={selectedBook} getBookProgressInfo={getBookProgressInfo} />
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
            <BookSummary book={selectedBook} getBookProgressInfo={getBookProgressInfo} />
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

      {/* Joyride for library home */}
      <Joyride
        steps={tourSteps}
        run={runTour}
        continuous
        showSkipButton
        showProgress
        callback={handleJoyrideCallback}
        spotlightPadding={8}
        styles={{
          options: {
            arrowColor: "#fff",
            backgroundColor: "#fff",
            textColor: "#333",
            overlayColor: "rgba(0,0,0,0.5)",
            primaryColor: "#0084FF",
          },
        }}
      />
    </div>
  );
}

export default BooksViewer2;