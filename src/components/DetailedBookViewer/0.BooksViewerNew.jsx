// src/components/DetailedBookViewer/BooksViewer2.jsx

import React, { useState, useEffect } from "react";
import { useBooksViewer } from "./useBooksViewer";
import OnboardingModal from "./OnboardingModal";

import MaterialsDashboard from "./1.SidePanels/MaterialsDashboard"; // Example
import UnifiedSidebar from "./1.SidePanels/0.UnifiedSidebar";
import ToursManager from "./0.1Tours/ToursManager";

// Existing components...
import BookProgress from "../Archive/2.2Library/BookProgress";
import SubchapterContent from "./4.Subchapter Content/0.SubchapterContent";
import UserProfileAnalytics from "./2.4Profile/UserProfileAnalytics";
import PanelC from "./2.1Overview/4.PanelC";
import PanelAdaptiveProcess from "./2.1Overview/PanelAdaptiveProcess";
import PanelE from "./2.1Overview/PanelE"; // Example new component
import StatsPanel from "./2.1Overview/1.StatsPanel";
import BookSummary from "../Archive/2.2Library/BookSummary";
import LibraryHome from "../Archive/2.2Library/LibraryHome";
import AdaptiveHome from "./2.3Adaptive/AdaptiveHome";

// The cinematic "player" modal
import AdaptivePlayerModal from "./3.AdaptiveModal/AdaptivePlayerModal"; // Adjust path if needed

function BooksViewer2() {
  const {
    userId,
    isOnboarded,
    homePlanId,
    planIds,
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

  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // For Joyride tours
  const [triggerTour, setTriggerTour] = useState(false);

  // For the cinematic player modal
  const [showPlayer, setShowPlayer] = useState(false);
  const [currentModalPlanId, setCurrentModalPlanId] = useState(null);
  const [initialActivityContext, setInitialActivityContext] = useState(null);
  const [modalFetchUrl, setModalFetchUrl] = useState("/api/adaptive-plan-total");

  // For “Home” filler content
  const [selectedHomeActivity, setSelectedHomeActivity] = useState(null);

  /**
   * handleOpenPlayer => called by sidebars
   * Accepts up to 3 arguments: planId, activity, fetchUrl
   */
  const handleOpenPlayer = (pId, activity, fetchUrl) => {
    console.log("PARENT handleOpenPlayer =>", pId, activity, fetchUrl);

    // 1) Plan ID for the modal
    setCurrentModalPlanId(pId);

    // 2) Subchapter context for auto-expansion
    setInitialActivityContext({
      subChapterId: activity?.subChapterId,
      type: activity?.type,
    });

    // 3) If given, store a custom fetchUrl
    if (fetchUrl) {
      setModalFetchUrl(fetchUrl);
    } else {
      setModalFetchUrl("/api/adaptive-plan");
    }

    // 4) Show the modal
    setShowPlayer(true);
  };

  // -------------- THEME & STYLES --------------
  const themeColors = {
    background: "#121212",
    sidebarBg: "#1E1E1E",
    accent: "#BB86FC",
    textPrimary: "#FFFFFF",
    textSecondary: "#CCCCCC",
    borderColor: "#3A3A3A",
  };

  const outerContainerStyle = {
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    backgroundColor: themeColors.background,
    color: themeColors.textPrimary,
    fontFamily: "sans-serif",
  };

  const innerContentWrapper = {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  };

  const mainContentStyle = {
    flex: 1,
    padding: "20px",
    overflowY: "auto",
    backgroundColor: themeColors.background,
  };

  // Common base for floating buttons
  const floatBtnBase = {
    position: "fixed",
    bottom: "20px",
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    color: "#FFFFFF",
    fontSize: "1.5rem",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    transition: "background-color 0.3s ease",
  };

  const floatTourButtonStyle = {
    ...floatBtnBase,
    left: "20px",
    backgroundColor: themeColors.accent,
  };

  // Filter the data based on library/adaptive/overview
  const displayedBooksData = getFilteredBooksData();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  useEffect(() => {
    // Only open the modal if we *know* isOnboarded = false
    if (isOnboarded === false) {
      setShowOnboardingModal(true);
    } else {
      setShowOnboardingModal(false);
    }
  }, [isOnboarded]);

  // Decide main content for each viewMode
  let mainContent;
  if (viewMode === "overview") {
    mainContent = (
      <>
        <StatsPanel />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
          }}
        >
          <PanelC
            userId={userId}
            onOpenOnboarding={() => setShowOnboardingModal(true)}
          />
          <PanelAdaptiveProcess />
        </div>
      </>
    );
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
    // Show some home panel content or MaterialsDashboard
    mainContent = (
      <MaterialsDashboard
        onOpenOnboarding={() => setShowOnboardingModal(true)}
        isCollapsed={isSidebarCollapsed}
        userId={userId}
        onToggleCollapse={handleToggleSidebar}
        themeColors={themeColors}
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
        homePlanId={homePlanId}
        planIds={planIds}
        onHomeSelect={(act) => setSelectedHomeActivity(act)}
        onOpenPlayer={handleOpenPlayer}
      />
    );
  }

  return (
    <div style={outerContainerStyle}>
      {/* Middle area => Sidebar + Main Content */}
      <div style={innerContentWrapper}>
        <UnifiedSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          themeColors={themeColors}
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
          homePlanId={homePlanId}
          planIds={planIds}
          onHomeSelect={(act) => setSelectedHomeActivity(act)}
          onOpenPlayer={handleOpenPlayer}
        />

        <div style={mainContentStyle}>{mainContent}</div>
      </div>

      {/* Floating "?" button => Start Joyride Tour */}
      <button
        style={floatTourButtonStyle}
        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#9852e8")}
        onMouseOut={(e) =>
          (e.currentTarget.style.backgroundColor = themeColors.accent)
        }
        onClick={() => setTriggerTour(true)}
        title="Start Tour"
      >
        ?
      </button>

      {/* Joyride-based tours */}
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
        planId={currentModalPlanId}
        initialActivityContext={initialActivityContext}
        fetchUrl={modalFetchUrl}
      />

      {/* The Onboarding Modal (only shows if showOnboardingModal = true) */}
      <OnboardingModal
        open={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
      />
    </div>
  );
}

export default BooksViewer2;