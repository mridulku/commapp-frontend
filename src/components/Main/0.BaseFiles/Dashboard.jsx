// src/components/DetailedBookViewer/BooksViewer2.jsx (Dashboard)

import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux"; // <-- Make sure you have this


import { useBooksViewer } from "./DashboardHooks";

// Import the updated Onboarding modal
import OnboardingModal from "../1.Upload/0.OnboardingModal";

// Import your separate Plan Editor modal
import EditAdaptivePlanModal from "../3.Library/LibraryChild/EditAdaptivePlanModal";

// Existing components
import MaterialsDashboard from "../3.Library/MaterialsDashboard"; 
import UnifiedSidebar from "./UnifiedSidebar";
import ToursManager from "./ToursManager";

import BookProgress from "../../zArchive/2.2Library/BookProgress";
import SubchapterContent from "../../zArchive/4.Subchapter Content/0.SubchapterContent";
import UserProfileAnalytics from "../4.Profile/UserProfileAnalytics";
import PanelC from "../2.HomePanels/4.PanelC";
import PanelAdaptiveProcess from "../2.HomePanels/PanelAdaptiveProcess";
import TOEFLAdaptiveProcess from "../2.HomePanels/TOEFLAdaptiveProcess";
import PanelE from "../2.HomePanels/PanelE";
import StatsPanel from "../2.HomePanels/TopStatsPanel";
import BookSummary from "../../zArchive/2.2Library/BookSummary";
import LibraryHome from "../../zArchive/2.2Library/LibraryHome";
import AdaptiveHome from "../../zArchive/2.3Adaptive/AdaptiveHome";

// The cinematic "player" modal
import AdaptivePlayerModal from "../../zArchive/3.AdaptiveModal/AdaptivePlayerModal"; 

function Dashboard() {
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

  // 1) Controls whether onboarding is shown
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // 2) Controls whether the separate plan editor is shown
  const [showPlanEditor, setShowPlanEditor] = useState(false);

  // 2a) We store which bookId the plan editor should use
  const [planEditorBookId, setPlanEditorBookId] = useState(null);

  // Joyride tours
  const [triggerTour, setTriggerTour] = useState(false);

  // Cinematic player modal
  const [showPlayer, setShowPlayer] = useState(false);
  const [currentModalPlanId, setCurrentModalPlanId] = useState(null);
  const [initialActivityContext, setInitialActivityContext] = useState(null);
  const [modalFetchUrl, setModalFetchUrl] = useState("/api/adaptive-plan-total");

  // Some “Home” filler content
  const [selectedHomeActivity, setSelectedHomeActivity] = useState(null);

  // Decide theme colors
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

  // Floating "?" button style for tours
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

  // Extract the filtered books
  const displayedBooksData = getFilteredBooksData();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  // Monitor onboarding status & open the modal if needed
  useEffect(() => {
    if (isOnboarded === false) {
      setShowOnboardingModal(true);
    } else {
      setShowOnboardingModal(false);
    }
  }, [isOnboarded]);

  /**
   * handleOpenPlanEditor(bookId) => Called by OnboardingModal
   * We store that bookId and show the plan editor
   */
  const handleOpenPlanEditor = (bId) => {
    setPlanEditorBookId(bId || null); // store the book ID
    setShowPlanEditor(true);         // open the plan editor
  };

  const examType = useSelector((state) => state.exam.examType);


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

    // 4) Show the cinematic player modal
    setShowPlayer(true);
  };

  // Decide main content based on viewMode
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
            onSeeAllCourses={() => setViewMode("home")}
          />
          {examType === "TOEFL" || examType === "RELUX" ? (
        <TOEFLAdaptiveProcess />
      ) : (
        <PanelAdaptiveProcess />
      )}
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
      {/* Left Sidebar + Main Content */}
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

      {/* Cinematic Player Modal */}
      <AdaptivePlayerModal
        isOpen={showPlayer}
        onClose={() => setShowPlayer(false)}
        userId={userId}
        planId={currentModalPlanId}
        initialActivityContext={initialActivityContext}
        fetchUrl={modalFetchUrl}
      />

      {/* Onboarding Modal */}
      <OnboardingModal
        open={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        // We'll pass handleOpenPlanEditor(bookId) so we can open the Plan Editor with that ID
        onOpenPlanEditor={handleOpenPlanEditor}
      />

      {/* Plan Editor Modal (separate from onboarding) */}
      <EditAdaptivePlanModal
        open={showPlanEditor}
        onClose={() => setShowPlanEditor(false)}
        userId={userId}
        bookId={planEditorBookId} // pass the chosen book ID here
      />
    </div>
  );
}

export default Dashboard;