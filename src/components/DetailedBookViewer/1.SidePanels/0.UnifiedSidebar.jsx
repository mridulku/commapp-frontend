// src/components/DetailedBookViewer/UnifiedSidebar.jsx
import React from "react";

// Import the 4 specialized sidebars:
import OverviewSidebar from "./1.OverviewSidebar";
import AdaptiveSidebar from "./3.AdaptiveSidebar";
import BooksSidebar from "./2.BooksSidebar";
import ProfileSidebar from "./4.ProfileSidebar";
import HomeSidebar from "./HomeSidebar"

function UnifiedSidebar({
  // We'll pass in these props from BooksViewer2
  viewMode,
  setViewMode,

  // shared props for the sidebars
  categories,
  selectedCategory,
  onCategoryChange,
  
  homePlanId,
  onHomeSelect,

  // Only needed by some sidebars:
  booksData,
  expandedBookName,
  toggleBookExpansion,
  expandedChapters,
  toggleChapterExpansion,
  handleBookClick,
  handleSubChapterClick,
  selectedSubChapter,
}) {
  // Styling for the top-level container of the entire sidebar
  const sidebarContainerStyle = {
    width: "300px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(8px)",
    padding: "20px",
    borderRight: "2px solid rgba(255,255,255,0.2)",
    overflowY: "auto",
  };

  // We'll create a small section for the mode buttons
  const modeToggleContainerStyle = {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    flexWrap: "wrap",
  };

  const toggleButtonStyle = (active) => ({
    padding: "8px 16px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    fontWeight: "bold",
    background: active ? "#FFD700" : "transparent",
    color: active ? "#000" : "#fff",
    transition: "background-color 0.3s",
  });

  // Decide which specialized content to show below the buttons
  let content;
  if (viewMode === "overview") {
    content = (
      <OverviewSidebar
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
      />
    );
  } else if (viewMode === "adaptive") {
    content = (
      <AdaptiveSidebar
        planId={homePlanId}
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
        booksData={booksData}
        handleSubChapterClick={handleSubChapterClick}
        selectedSubChapter={selectedSubChapter}
      />
    );
  } else if (viewMode === "library") {
    content = (
      <BooksSidebar
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
        booksData={booksData}
        expandedBookName={expandedBookName}
        toggleBookExpansion={toggleBookExpansion}
        expandedChapters={expandedChapters}
        toggleChapterExpansion={toggleChapterExpansion}
        handleBookClick={handleBookClick}
        handleSubChapterClick={handleSubChapterClick}
        selectedSubChapter={selectedSubChapter}
      />
    );
  } else if (viewMode === "profile") {
    content = <ProfileSidebar />;
  } else if (viewMode === "home") {
    content = (
        <HomeSidebar
           planId={homePlanId}
           backendURL={import.meta.env.VITE_BACKEND_URL}  // or your custom URL
           onHomeSelect={onHomeSelect}  // callback for clicks
         />
        );
      
      }


  return (
    <div style={sidebarContainerStyle}>
      {/* 1) Mode Buttons at the top */}
      <div style={modeToggleContainerStyle}>
        <button  id="overviewbutton"
          style={toggleButtonStyle(viewMode === "overview")}
          onClick={() => setViewMode("overview")}
        >
          Overview
        </button>
        <button
             id="adaptivebutton"
          style={toggleButtonStyle(viewMode === "adaptive")}
          onClick={() => setViewMode("adaptive")}
        >
          Adaptive
        </button>
        <button
             id="librarybutton"
          style={toggleButtonStyle(viewMode === "library")}
          onClick={() => setViewMode("library")}
        >
          Library
        </button>
        <button
             id="profilebutton"
          style={toggleButtonStyle(viewMode === "profile")}
          onClick={() => setViewMode("profile")}
        >
          Profile
        </button>

        <button
         style={toggleButtonStyle(viewMode === "home")}
         onClick={() => setViewMode("home")}
       >
         Home
       </button>



      </div>

      {/* 2) Render whichever specialized sidebar is appropriate */}
      {content}
    </div>
  );
}

export default UnifiedSidebar;