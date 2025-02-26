// src/components/DetailedBookViewer/UnifiedSidebar.jsx
import React from "react";

// Keep only the sidebars we actually use:
import OverviewSidebar from "./1.OverviewSidebar";
import ProfileSidebar from "./4.ProfileSidebar";
import HomeSidebar from "./HomeSidebar";

function UnifiedSidebar({
  // Props needed by OverviewSidebar
  categories,
  selectedCategory,
  onCategoryChange,
  planId,

  // Props needed by HomeSidebar
  homePlanId,
  onHomeSelect,

  // State management from parent
  viewMode,
  setViewMode,

  // The parent's real callback: handleOpenPlayer(planId, activity, fetchUrl)
  onOpenPlayer,
}) {
  // Container style
  const sidebarContainerStyle = {
    width: "300px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(8px)",
    padding: "20px",
    borderRight: "2px solid rgba(255,255,255,0.2)",
    overflowY: "auto",
    position: "relative",
  };

  // If user clicks "Play" in the OverviewSidebar, we want to pass planId, activity, and a custom fetchUrl
  function handleOpenPlayerLocally(planId, activity, fetchUrl) {
    console.log("UnifiedSidebar: handleOpenPlayerLocally =>", planId, activity, fetchUrl);
    // Call the parent's function
    onOpenPlayer(planId, activity, fetchUrl);
  }

  const modeToggleContainerStyle = {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    flexWrap: "wrap",
    alignItems: "center",
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

  // Decide which specialized sidebar to render
  let content;
  if (viewMode === "overview") {
    content = (
      <OverviewSidebar
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
        planId={planId}
        backendURL={import.meta.env.VITE_BACKEND_URL}
        onHomeSelect={onHomeSelect}
        // Use the local wrapper so we can pass a custom fetchUrl if desired
        onOpenPlayer={handleOpenPlayerLocally}
      />
    );
  } else if (viewMode === "home") {
    content = (
      <HomeSidebar
        planId={homePlanId}
        backendURL={import.meta.env.VITE_BACKEND_URL}
        onHomeSelect={onHomeSelect}
        // Force a certain fetchUrl or let the child do default
        // We'll pass a short arrow function that adds the third argument:
        onOpenPlayer={(pId, act) => onOpenPlayer(pId, act, "/api/adaptive-plan")}
      />
    );
  } else if (viewMode === "profile") {
    content = <ProfileSidebar />;
  }

  function switchMode(mode) {
    setViewMode(mode);
  }

  return (
    <div style={sidebarContainerStyle}>
      {/* TOP: Three buttons => OVERVIEW, HOME, PROFILE */}
      <div style={modeToggleContainerStyle}>
        <button
          style={toggleButtonStyle(viewMode === "overview")}
          onClick={() => switchMode("overview")}
        >
          Overview
        </button>

        <button
          style={toggleButtonStyle(viewMode === "home")}
          onClick={() => switchMode("home")}
        >
          Home
        </button>

        <button
          style={toggleButtonStyle(viewMode === "profile")}
          onClick={() => switchMode("profile")}
        >
          Profile
        </button>
      </div>

      {/* Render the corresponding sidebar content */}
      {content}
    </div>
  );
}

export default UnifiedSidebar;