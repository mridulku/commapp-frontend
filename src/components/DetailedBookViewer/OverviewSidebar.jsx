// src/components/DetailedBookViewer/OverviewSidebar.jsx
import React from "react";

function OverviewSidebar({
  categories,
  selectedCategory,
  onCategoryChange,
  viewMode,
  setViewMode,
}) {
  // --------------- Styles ---------------
  const sidebarStyle = {
    width: "300px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(8px)",
    padding: "20px",
    borderRight: "2px solid rgba(255,255,255,0.2)",
    overflowY: "auto",
  };

  const modeToggleContainerStyle = {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
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

  const dropdownContainerStyle = { marginBottom: "20px" };

  const headingStyle = {
    fontWeight: "bold",
    marginBottom: "10px",
    fontSize: "1.2rem",
    borderBottom: "1px solid rgba(255,255,255,0.2)",
    paddingBottom: "5px",
    color: "#fff",
  };

  return (
    <div style={sidebarStyle}>
      {/* 1) Mode Toggle */}
      <div style={modeToggleContainerStyle}>
        <button
          style={toggleButtonStyle(viewMode === "library")}
          onClick={() => setViewMode("library")}
        >
          Library
        </button>
        <button
          style={toggleButtonStyle(viewMode === "adaptive")}
          onClick={() => setViewMode("adaptive")}
        >
          Adaptive
        </button>
        <button
          style={toggleButtonStyle(viewMode === "overview")}
          onClick={() => setViewMode("overview")}
        >
          Overview
        </button>
      </div>

      {/* 2) Category Dropdown */}
      <div style={dropdownContainerStyle}>
        <label htmlFor="categorySelect" style={{ marginRight: "10px", color: "#fff" }}>
          Select Category:
        </label>
        <select
          id="categorySelect"
          onChange={onCategoryChange}
          value={selectedCategory || ""}
          style={{ padding: "5px 10px", borderRadius: "4px", fontSize: "16px" }}
        >
          {categories.map((cat) => (
            <option key={cat.categoryId} value={cat.categoryId}>
              {cat.categoryName}
            </option>
          ))}
        </select>
      </div>

      {/* 3) Some heading for your overview */}
      <div style={headingStyle}>Overview</div>
      <p style={{ color: "#fff" }}>
        This is where you can display your custom “overview” content on the sidebar.
      </p>
      {/* You can expand this to show stats, summaries, etc. */}
    </div>
  );
}

export default OverviewSidebar;