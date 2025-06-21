// src/components/DetailedBookViewer/UnifiedSidebar.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../../firebase";             // adjust path if required

function UnifiedSidebar({
  // Theming
  themeColors = {},
  // Possibly still pass in any other props you need:
  viewMode,
  setViewMode,
  isAdmin,
}) {
  // 1) Start collapsed by default
  const [collapsed, setCollapsed] = useState(true);

  const navigate = useNavigate(); // NEW

  // 2) Toggle collapse
  const handleToggleCollapse = () => {
    setCollapsed((prev) => !prev);
  };

  /* ─── Logout helper ─── */
  const handleLogout = async () => {
    try {
      await signOut(auth);    // kill Firebase session
      localStorage.clear();   // app-side caches
      navigate("/");          // back to landing / login
    } catch (err) {
      console.error(err);
    }
  };

  // 3) Container style
  const sidebarContainerStyle = {
    // If collapsed => 60px, else => 140px (adjust if you need a bit more room)
    width: collapsed ? "60px" : "140px",
    backgroundColor: themeColors.sidebarBg || "#1E1E1E",
    padding: "20px",
    borderRight: `1px solid ${themeColors.borderColor || "#3A3A3A"}`,
    overflowY: "auto",
    transition: "width 0.3s ease",
    // So items stack top to bottom
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  };

  // 4) The collapse/expand button style
  const collapseButtonStyle = {
    marginBottom: "10px",
    padding: "6px 10px",
    fontSize: "0.9rem",
    borderRadius: "4px",
    border: `1px solid ${themeColors.borderColor || "#3A3A3A"}`,
    cursor: "pointer",
    backgroundColor: themeColors.accent || "#BB86FC",
    color: "#000000",
    // If collapsed => 40px wide, else => fill container width
    width: collapsed ? "40px" : "100%",
    transition: "width 0.3s, background-color 0.3s",
  };

  // 5) Container for the mode-toggle buttons
  //    Always stack vertically => flexDirection: "column"
  const modeToggleContainerStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    width: "100%",
    marginTop: "20px",
  };

  // 6) Each button style
  const toggleButtonStyle = (active) => ({
    // Let each button fill the available width
    width: "100%",
    padding: "8px 12px",
    borderRadius: "4px",
    border: `1px solid ${themeColors.borderColor || "#3A3A3A"}`,
    cursor: "pointer",
    fontWeight: "bold",
    backgroundColor: active ? themeColors.accent || "#BB86FC" : "transparent",
    color: active ? "#000000" : themeColors.textPrimary || "#FFFFFF",
    transition: "background-color 0.3s, color 0.3s",
    display: "flex",
    alignItems: "center",
    justifyContent: collapsed ? "center" : "flex-start",
    // Prevent text from wrapping
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  });

  // 7) Helper to switch mode
  function switchMode(mode) {
    setViewMode && setViewMode(mode);
  }

  return (
    <div style={sidebarContainerStyle}>
      {/* Collapse/expand button */}
      <button
        style={collapseButtonStyle}
        onClick={handleToggleCollapse}
        title="Toggle Sidebar"
      >
        {/* If collapsed, show » else « */}
        {collapsed ? "»" : "«"}
      </button>

      {/* Mode toggle buttons stacked vertically */}
      <div style={modeToggleContainerStyle}>
        {/* Duplicate overview button (#1) */}
        <button
          style={toggleButtonStyle(viewMode === "overview")}
          onClick={() => switchMode("overview")}
          title="Home"
        >
          {collapsed ? "🏠" : <>🏠 Home</>}
        </button>

        {/* Home → Study Plans */}
        <button
          style={toggleButtonStyle(viewMode === "home")}
          onClick={() => switchMode("home")}
          title="Study Plans"
        >
          {collapsed ? "📚" : <>📚 Study Plans</>}
        </button>

        {/* Study Tools */}
        <button
          style={toggleButtonStyle(viewMode === "newHome2")}
          onClick={() => switchMode("newHome2")}
          title="Study Tools"
        >
          {collapsed ? "🧰" : <>🧰 Study Tools</>}
        </button>

        {/* Profile */}
        <button
          style={toggleButtonStyle(viewMode === "profile")}
          onClick={() => switchMode("profile")}
          title="Profile"
        >
          {collapsed ? "🧑‍💻" : <>🧑‍💻 Profile</>}
        </button>

        {/* Admin buttons (visible only to admins) */}
        {isAdmin && (
          <button
            style={toggleButtonStyle(viewMode === "admin")}
            onClick={() => switchMode("admin")}
            title="Admin"
          >
            {collapsed ? "🛠️" : <>🛠️ Admin</>}
          </button>
        )}

       
        {/* Concept Graph */}
        <button
          style={toggleButtonStyle(viewMode === "newHome")}
          onClick={() => switchMode("newHome")}
          title="Concept Graph"
        >
          {collapsed ? "🌐" : <>🌐 Concept Graph</>}
        </button>
      </div>

      {/* Logout button anchored at the bottom */}
      <div style={{ marginTop: "auto", width: "100%" }}>
        <button
          style={toggleButtonStyle(false)} // never "active"
          onClick={handleLogout}
          title="Logout"
        >
          {collapsed ? "🚪" : <>🚪 Logout</>}
        </button>
      </div>

      {/* 
        If you do not want any specialized sidebars to show, 
        simply do NOT render them here even if expanded. 
      */}
    </div>
  );
}

export default UnifiedSidebar;