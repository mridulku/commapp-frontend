// src/components/DetailedBookViewer/MaterialsDashboard.jsx

import React, { useState } from "react";
import { Grid, Box, Tabs, Tab } from "@mui/material";
import Child1 from "./LibraryChild/Child1";
import Child2 from "./LibraryChild/Child2";
import Child3 from "./LibraryChild/Child3";
// Import your new stats component
import ChildStats from "./LibraryChild/ChildStats";


export default function MaterialsDashboard({
  userId,
  planIds = [],
  homePlanId = "",
  backendURL = import.meta.env.VITE_BACKEND_URL,
  onHomeSelect = () => {},
  onOpenPlayer = () => {},
  themeColors = {},
}) {
  // Book selected in Child1
  const [selectedBookId, setSelectedBookId] = useState("");

  // Which tab is active? (0 => Child2, 1 => Child3)
  const [activeTab, setActiveTab] = useState(0);

  // When Child1 selects a book
  const handleBookSelect = (bookId) => {
    console.log("MaterialsDashboard -> handleBookSelect =>", bookId);
    setSelectedBookId(bookId);
  };

  return (
    <Grid container style={{ width: "100%" }}>
      {/* LEFT COLUMN (Child1) */}
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
        <Child1 
          userId={userId} 
          onBookSelect={handleBookSelect}
        />
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
        {/* The container for stats + the tabs area */}
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          {/* 
            1) Stats Section on top 
            - Occupies ~25-30% vertical space if you want 
            - Or simply let it size naturally
          */}
          <Box 
            sx={{ 
              // If you really want a forced height ratio, you can do:
              // height: "25vh", // or 30vh, etc.
              // Otherwise, let it auto-size:
              mb: 2, 
              p: 2 
            }}
          >
            <ChildStats
              userId={userId}
              bookId={selectedBookId}
              themeColors={themeColors}
            />
          </Box>

          {/* 2) Tabs (Overview / Home Plan) */}
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