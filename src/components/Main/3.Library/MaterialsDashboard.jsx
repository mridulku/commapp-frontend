// src/components/DetailedBookViewer/MaterialsDashboard.jsx

import React, { useState } from "react";
import { Grid, Box, Tabs, Tab } from "@mui/material";
import Child1 from "./LibraryChild/SelectionPanel/Child1";
import Child2 from "./LibraryChild/AdaptivePlanView/Child2";
import Child3 from "./LibraryChild/FullCourseView/Child3";
import ChildStats from "./LibraryChild/StatsPanel/ChildStats";

export default function MaterialsDashboard({
  userId,
  planIds = [],
  homePlanId = "",
  onOpenOnboarding = () => {},
  backendURL = import.meta.env.VITE_BACKEND_URL,
  onHomeSelect = () => {},
  onOpenPlayer = () => {},
  themeColors = {},
}) {
  // Book selected
  const [selectedBookId, setSelectedBookId] = useState("");
  const [selectedBookName, setSelectedBookName] = useState("");

  // Which tab is active?
  const [activeTab, setActiveTab] = useState(0);

  // Called by Child1
  const handleBookSelect = (bookId, bookName) => {
    console.log("MaterialsDashboard -> handleBookSelect =>", bookId, bookName);
    setSelectedBookId(bookId);
    setSelectedBookName(bookName);
  };

  return (
    <Grid container style={{ width: "100%" }}>
      {/* LEFT COLUMN => Child1 */}
      <Grid
        item
        xs={12}
        md={4}
        lg={3}
        style={{
          borderRight: "1px solid #333",
          backgroundColor: "#000",
        }}
      >
        <Child1 userId={userId} onBookSelect={handleBookSelect} onOpenOnboarding={onOpenOnboarding} />
      </Grid>

      {/* RIGHT COLUMN */}
      <Grid
        item
        xs={12}
        md={8}
        lg={9}
        style={{
          backgroundColor: "#111",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          {/* 1) Stats Section */}
          <Box sx={{ mb: 2, p: 2 }}>
            <ChildStats
              userId={userId}
              bookId={selectedBookId}
              bookName={selectedBookName} 
              themeColors={themeColors}
              backendURL={backendURL}
              // onResume prop if needed => e.g. (id) => console.log("Resume", id)
            />
          </Box>

          {/* 2) Tabs */}
          <Tabs
            value={activeTab}
            onChange={(e, newVal) => setActiveTab(newVal)}
            textColor="inherit"
            TabIndicatorProps={{
              style: { backgroundColor: themeColors.accent || "#BB86FC" },
            }}
          >
            <Tab label="Overview Plan" />
            <Tab label="Home Plan" />
          </Tabs>

          {/* 3) Tab Content */}
          <Box sx={{ padding: "1rem" }}>
            {activeTab === 0 && (
              <Child2
                planIds={planIds}
                bookId={selectedBookId}
                userId={userId}
                backendURL={backendURL}
                onOverviewSelect={onHomeSelect}
                onOpenPlayer={onOpenPlayer}
                colorScheme={{
                  panelBg: themeColors.sidebarBg,
                  textColor: themeColors.textPrimary,
                  borderColor: themeColors.borderColor,
                  heading: themeColors.accent,
                }}
              />
            )}

            {activeTab === 1 && (
              <Child3
                userId={userId}
                bookId={selectedBookId}
                planId={homePlanId}
                backendURL={backendURL}
                onHomeSelect={onHomeSelect}
                onOpenPlayer={onOpenPlayer}
                colorScheme={{
                  panelBg: themeColors.sidebarBg,
                  textColor: themeColors.textPrimary,
                  borderColor: themeColors.borderColor,
                  heading: themeColors.accent,
                }}
              />
            )}
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
}