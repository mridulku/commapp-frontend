// src/components/DetailedBookViewer/OverviewSidebar.jsx
import React from "react";

function OverviewSidebar({
  categories,
  selectedCategory,
  onCategoryChange,
}) {
  // --------------- Styles ---------------
  const containerStyle = {
    // You can keep or rename this style object
    // and remove the modeToggleContainerStyle if you like
    width: "300px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(8px)",
    padding: "20px",
    borderRight: "2px solid rgba(255,255,255,0.2)",
    overflowY: "auto",
  };

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
    <div style={containerStyle}>
      {/* 1) Category Dropdown */}
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

      {/* 2) Overview Section */}
      <div style={headingStyle}>Overview</div>
      <p style={{ color: "#fff" }}>
        This is where you can display your custom “overview” content on the sidebar.
      </p>
      {/* Possibly add stats, summaries, etc. here */}
    </div>
  );
}

export default OverviewSidebar;