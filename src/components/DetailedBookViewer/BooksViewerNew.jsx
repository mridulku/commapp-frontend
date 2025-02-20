/********************************************
 * BookViewer2.jsx (Parent Container)
 ********************************************/
import React from "react";

// Child components
import BooksSidebar from "./BooksSidebar";
import BookProgress from "./BookProgress";
import SubchapterContent from "./SubchapterContent";
import DynamicTutorModal from "./DynamicTutorModal";
import NavigationBar from "./NavigationBar";

// The custom hook with all your logic
import { useBooksViewer } from "./hooks/useBooksViewer";

function BooksViewer2() {
  // Extract state + methods from your hook
  const {
    userId,
    categories,
    selectedCategory,
    // Instead of raw booksData, we will also use a function that returns
    // either the full data or the adaptive subset:
    getFilteredBooksData,

    booksProgressData,
    selectedBook,
    selectedChapter,
    selectedSubChapter,

    expandedBookName,
    expandedChapters,
    showTutorModal,

    viewMode,        // "library" or "adaptive"
    setViewMode,     // function to update viewMode

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

  // Debug logs
  console.log("DEBUG: userId =>", userId);
  console.log("DEBUG: selectedSubChapter =>", selectedSubChapter);

  // Instead of passing raw booksData, 
  // we pass the "filtered" version based on viewMode.
  const displayedBooksData = getFilteredBooksData();

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <NavigationBar />

      <div style={containerStyle}>
        {/* =========== SIDEBAR =========== */}
        <BooksSidebar
          categories={categories}
          selectedCategory={selectedCategory}
          selectedSubChapter={selectedSubChapter}
          onCategoryChange={handleCategoryChange}

          booksData={displayedBooksData} // <--- pass the filtered data
          expandedBookName={expandedBookName}
          toggleBookExpansion={toggleBookExpansion}
          expandedChapters={expandedChapters}
          toggleChapterExpansion={toggleChapterExpansion}
          handleBookClick={handleBookClick}
          handleChapterClick={handleChapterClick}
          handleSubChapterClick={handleSubChapterClick}

          // Pass down the mode state + setter if you want the sidebar to show toggle buttons
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        {/* =========== MAIN CONTENT =========== */}
        <div style={mainContentStyle}>
          {/* Tutor Modal button */}
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

          {/* If no subchapter is selected, show placeholder */}
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
        </div>
      </div>
    </div>
  );
}

export default BooksViewer2;