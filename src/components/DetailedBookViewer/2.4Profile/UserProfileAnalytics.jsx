// src/components/DetailedBookViewer/UserProfileAnalytics.jsx
import React, { useState, useEffect } from "react";
import { auth } from "../../../firebase"; // Adjust import path as needed

// Import our new child components
import UserHistory from "./UserHistory";

import ProcessingDataView from "./ProcessingDataView";

import ChapterFlowView from "./ChapterFlowView";


import ProcessAnimation from "../ProcessAnimation";





function UserProfileAnalytics({ colorScheme = {} }) {
  // ==============================
  // Step A: Listen to auth state
  // ==============================
  const [userId, setUserId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ==============================
  // Rendering
  // ==============================
  return (
    <div
      style={{
        flex: 1,
        backgroundColor: colorScheme.mainBg || "#121212",
        color: colorScheme.textColor || "#FFFFFF",
        fontFamily: "'Open Sans', sans-serif",
        padding: "20px",
        overflowY: "auto",
      }}
    >
      <h2 style={{ color: colorScheme.heading || "#BB86FC" }}>
        User Profile & Activity
      </h2>

      {authLoading && <p>Checking sign-in status...</p>}

      {/* If no user is logged in, show a message */}
      {!authLoading && !userId && (
        <p style={{ color: colorScheme.errorColor || "#FF5555" }}>
          No user is currently logged in. Please sign in to view profile/activity.
        </p>
      )}

      {/* If user is logged in, show minimal user info and the child components */}
      {!authLoading && userId && (
        <>
          {/* Minimal user info */}
          <div
            style={{
              backgroundColor: colorScheme.cardBg || "#2F2F2F",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "20px",
              border: `1px solid ${colorScheme.borderColor || "#3A3A3A"}`,
            }}
          >
            <h3 style={{ marginTop: 0, color: colorScheme.textColor || "#FFFFFF" }}>
              Global User Profile
            </h3>
            <p>
              <strong>User ID:</strong> {userId}
            </p>
            <p>(Any additional user info here.)</p>
          </div>


          {/* User History component */}
          <UserHistory userId={userId} colorScheme={colorScheme} />
          <ProcessingDataView userId={userId} colorScheme={colorScheme} />
          <ChapterFlowView userId={userId} colorScheme={colorScheme} />
          <ProcessAnimation userId={userId} colorScheme={colorScheme} />
          
          
       
        </>
      )}
    </div>
  );
}

export default UserProfileAnalytics;