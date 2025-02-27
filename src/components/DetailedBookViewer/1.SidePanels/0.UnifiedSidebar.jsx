// src/components/DetailedBookViewer/UnifiedSidebar.jsx
import React, { useState } from "react";

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
  planIds = [], // Now an array

  // Props needed by HomeSidebar
  homePlanId,
  onHomeSelect,

  // State management from parent
  viewMode,
  setViewMode,

  // The parent's real callback: handleOpenPlayer(planId, activity, fetchUrl)
  onOpenPlayer,
}) {
  /**
   * Local state for collapsing/expanding the sidebar
   */
  const [collapsed, setCollapsed] = useState(false);

  /**
   * Handler to toggle collapse
   */
  const handleToggleCollapse = () => {
    setCollapsed((prev) => !prev);
  };

  // Decide which specialized sidebar to render
  let content;
  if (viewMode === "overview") {
    content = (
      <OverviewSidebar
        planIds={planIds}
        backendURL={import.meta.env.VITE_BACKEND_URL}
        onOverviewSelect={onHomeSelect}
        onOpenPlayer={onOpenPlayer} // pass it straight through
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
        onOpenPlayer={(pId, act) => onOpenPlayer(pId, act, "/api/adaptive-plan")}
      />
    );
  } else if (viewMode === "profile") {
    content = <ProfileSidebar />;
  }

  /**
   * Sidebar container styling.
   * Note how we switch width and overflow based on `collapsed`.
   */
  const sidebarContainerStyle = {
    // If collapsed, narrower width; if expanded, original 280px.
    width: collapsed ? "60px" : "280px",
    backgroundColor: themeColors.sidebarBg || "#1E1E1E",
    padding: "20px",
    borderRight: `1px solid ${themeColors.borderColor || "#3A3A3A"}`,
    overflowY: "auto",
    transition: "width 0.3s ease",
  };

  /**
   * If collapsed, we might hide the text in the toggle buttons:
   * We'll do that by conditionally rendering the label or using icons.
   */
  const modeToggleContainerStyle = {
    display: "flex",
    flexDirection: collapsed ? "column" : "row",
    gap: "8px",
    marginBottom: "20px",
    flexWrap: "wrap",
    alignItems: "center",
  };

  /**
   * Button styling, highlighting the active view
   */
  const toggleButtonStyle = (active) => ({
    padding: "8px 12px",
    borderRadius: "4px",
    border: `1px solid ${themeColors.borderColor || "#3A3A3A"}`,
    cursor: "pointer",
    fontWeight: "bold",
    backgroundColor: active ? themeColors.accent || "#BB86FC" : "transparent",
    color: active ? "#000000" : themeColors.textPrimary || "#FFFFFF",
    transition: "background-color 0.3s, color 0.3s",
    // If collapsed, reduce width & hide text label
    ...(collapsed ? { width: "40px", textAlign: "center", padding: "8px" } : {}),
  });

  /**
   * A small button to toggle the collapse
   */
  const collapseButtonStyle = {
    marginBottom: "10px",
    padding: "6px 10px",
    fontSize: "0.9rem",
    borderRadius: "4px",
    border: `1px solid ${themeColors.borderColor || "#3A3A3A"}`,
    cursor: "pointer",
    backgroundColor: themeColors.accent || "#BB86FC",
    color: "#000000",
    width: collapsed ? "40px" : "auto",
    transition: "width 0.3s, background-color 0.3s",
  };

  /**
   * Switch view mode (Overview, Home, Profile, etc.)
   */
  function switchMode(mode) {
    setViewMode(mode);
  }

  return (
    <div style={sidebarContainerStyle}>
      {/* Button to collapse/expand the sidebar */}
      <button style={collapseButtonStyle} onClick={handleToggleCollapse} title="Toggle Sidebar">
        {collapsed ? "»" : "«"}
      </button>

      {/* TOP: Three main buttons => OVERVIEW, HOME, PROFILE */}
      <div style={modeToggleContainerStyle}>
        <button
          style={toggleButtonStyle(viewMode === "overview")}
          onClick={() => switchMode("overview")}
        >
          {/* If collapsed, maybe show only an icon, else show full text */}
          {collapsed ? "🏠" : "🏠 Overview"}
        </button>

        <button
          style={toggleButtonStyle(viewMode === "home")}
          onClick={() => switchMode("home")}
        >
          {collapsed ? "📚" : "📚 Home"}
        </button>

        <button
          style={toggleButtonStyle(viewMode === "profile")}
          onClick={() => switchMode("profile")}
        >
          {collapsed ? "👤" : "👤 Profile"}
        </button>
      </div>

      {/* For additional modes, add more buttons here if needed.
         E.g. Library or Adaptive: 
         {!collapsed ? "Library" : "L"} 
      */}

      {/* Render the specialized sidebar content if not collapsed.
          Or if you like, you could still render some minimal icons even when collapsed. */}
      {!collapsed && content}
    </div>
  );
}

export default UnifiedSidebar;