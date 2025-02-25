// src/components/DetailedBookViewer/ProfileSidebar.jsx
import React from "react";

function ProfileSidebar() {
  const containerStyle = {
    width: "300px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(8px)",
    padding: "20px",
    borderRight: "2px solid rgba(255,255,255,0.2)",
    overflowY: "auto",
    color: "#fff",
  };

  return (
    <div style={containerStyle}>
      <h2>Profile</h2>
      <p>Here is where user profile info or settings could go.</p>
    </div>
  );
}

export default ProfileSidebar;