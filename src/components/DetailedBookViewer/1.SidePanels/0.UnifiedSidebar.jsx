// src/components/DetailedBookViewer/UnifiedSidebar.jsx
import React from "react";

// Keep only the sidebars we actually use:
import OverviewSidebar from "./1.OverviewSidebar";
import ProfileSidebar from "./4.ProfileSidebar";
import HomeSidebar from "./HomeSidebar";

function UnifiedSidebar({
  // Theming
  themeColors = {},

  // Props needed by OverviewSidebar
  categories,
  selectedCategory,
  onCategoryChange,
  planIds = [],   // Now an array

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
    width: "280px",
    backgroundColor: themeColors.sidebarBg || "#1E1E1E",
    padding: "20px",
    borderRight: `1px solid ${themeColors.borderColor || "#3A3A3A"}`,
    overflowY: "auto",
  };

  const modeToggleContainerStyle = {
    display: "flex",
    gap: "8px",
    marginBottom: "20px",
    flexWrap: "wrap",
    alignItems: "center",
  };

  const toggleButtonStyle = (active) => ({
    padding: "8px 12px",
    borderRadius: "4px",
    border: `1px solid ${themeColors.borderColor || "#3A3A3A"}`,
    cursor: "pointer",
    fontWeight: "bold",
    backgroundColor: active ? themeColors.accent || "#BB86FC" : "transparent",
    color: active ? "#000000" : themeColors.textPrimary || "#FFFFFF",
    transition: "background-color 0.3s, color 0.3s",
  });

  // If user clicks "Play" in the OverviewSidebar, we want to pass planId, activity, and a custom fetchUrl
  function handleOpenPlayerLocally(planId, activity, fetchUrl) {
    console.log("UnifiedSidebar: handleOpenPlayerLocally =>", planId, activity, fetchUrl);
    // Call the parent's function
    onOpenPlayer(planId, activity, fetchUrl);
  }

  // Decide which specialized sidebar to render
  let content;
  if (viewMode === "overview") {
    content = (
      <OverviewSidebar
      planIds={planIds} // pass the array
      backendURL={import.meta.env.VITE_BACKEND_URL}
        onOverviewSelect={onHomeSelect}
        onOpenPlayer={handleOpenPlayerLocally}
        // pass in the same theme
        colorScheme={{
          panelBg: themeColors.sidebarBg,
          textColor: themeColors.textPrimary,
          borderColor: themeColors.borderColor,
          heading: themeColors.accent,
        }}
      />
    );
  } else if (viewMode === "home") {
    content = (
      <HomeSidebar
        planId={homePlanId}
        backendURL={import.meta.env.VITE_BACKEND_URL}
        onHomeSelect={onHomeSelect}
        // Force a certain fetchUrl or let the child do default
        onOpenPlayer={(pId, act) =>
          onOpenPlayer(pId, act, "/api/adaptive-plan")
        }
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

      {/* Example: If you have additional toggles for "library" or "adaptive" modes, add them here:
      
      <button
        style={toggleButtonStyle(viewMode === "library")}
        onClick={() => switchMode("library")}
      >
        Library
      </button>
      
      <button
        style={toggleButtonStyle(viewMode === "adaptive")}
        onClick={() => switchMode("adaptive")}
      >
        Adaptive
      </button>
      
      */}

      {content}
    </div>
  );
}

export default UnifiedSidebar;