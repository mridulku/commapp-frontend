// src/components/DetailedBookViewer/UserProfileAnalytics.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../../firebase"; // Adjust path if needed
import { signOut } from "firebase/auth";

import { Box, Button } from "@mui/material";

import UserHistory from "./UserHistory";
import UserProgress from "./UserProgress";


export default function UserProfileAnalytics({ colorScheme = {} }) {
  const [userId, setUserId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();

  // -------------------------------------------
  // 1) onAuthStateChanged => set userId
  //    Add console logs for debugging
  // -------------------------------------------
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log("[onAuthStateChanged] user logged in:", user.uid);
        setUserId(user.uid);
      } else {
        console.log("[onAuthStateChanged] user logged out or not logged in at all");
        setUserId(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // -------------------------------------------
  // 2) If userId becomes null => navigate
  //    This forcibly removes user from page
  // -------------------------------------------
  useEffect(() => {
    if (!authLoading && !userId) {
      console.log("No user => redirecting to /");
      navigate("/");
    }
  }, [authLoading, userId, navigate]);

  // -------------------------------------------
  // 3) handleLogout => signOut + localStorage removal
  // -------------------------------------------
  const handleLogout = async () => {
    console.log("Logout button clicked");
    try {
      await signOut(auth);
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      console.log("Sign-out succeeded, user should become null in onAuthStateChanged");
      // Optionally also do navigate("/") here to *instantly* move away
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // -------------------------------------------
  // 4) Render
  // -------------------------------------------
  return (
    <div
      style={{
        flex: 1,
        position: "relative",
        backgroundColor: colorScheme.mainBg || "#121212",
        color: colorScheme.textColor || "#FFFFFF",
        fontFamily: "'Open Sans', sans-serif",
        padding: "20px",
        overflowY: "auto",
      }}
    >
      {/* Logout Button top-right */}
      <Box
        sx={{
          position: "absolute",
          top: 20,
          right: 20,
          zIndex: 999,
        }}
      >
        <Button
          variant="contained"
          color="secondary"
          onClick={handleLogout}
          sx={{ fontWeight: "bold" }}
        >
          Logout
        </Button>
      </Box>

      <h2 style={{ color: colorScheme.heading || "#BB86FC" }}>
        User Profile &amp; Activity
      </h2>

      {authLoading && <p>Checking sign-in status...</p>}

      {/* If user logged out => fallback 
          (Though the effect above also does navigate("/")) */}
      {!authLoading && !userId && (
        <p style={{ color: colorScheme.errorColor || "#FF5555" }}>
          No user is currently logged in. Please sign in to view profile/activity.
        </p>
      )}

      {/* If user is logged in => show everything */}
      {!authLoading && userId && (
        <>
          <div
            style={{
              backgroundColor: colorScheme.cardBg || "#2F2F2F",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "20px",
              border: `1px solid ${colorScheme.borderColor || "#3A3A3A"}`,
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Global User Profile
            </h3>
            <p>
              <strong>User ID:</strong> {userId}
            </p>
            <p>(Additional user info here)</p>
          </div>

          {/* Child components */}
          <UserHistory userId={userId} colorScheme={colorScheme} />
          <UserProgress userId={userId} colorScheme={colorScheme} />




          
        </>
      )}
    </div>
  );
}