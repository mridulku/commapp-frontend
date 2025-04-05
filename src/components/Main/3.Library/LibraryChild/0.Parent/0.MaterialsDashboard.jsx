// File: MaterialsDashboard.jsx

import React, { useState } from "react";
import { Grid, Box } from "@mui/material";

import Child1 from "../1.SelectionPanel/Child1";
import Child2 from "../3.AdaptivePlanView/0.Parent/0.Parent";
import ChildStats from "../2.CreateNewPlan/CreatePlanButton";

export default function MaterialsDashboard({
  userId,
  planIds = [],
  onOpenOnboarding = () => {},
  backendURL = import.meta.env.VITE_BACKEND_URL,
  onHomeSelect = () => {},
  onOpenPlayer = () => {},
  themeColors = {},
}) {
  // Book selection states
  const [selectedBookId, setSelectedBookId] = useState("");
  const [selectedBookName, setSelectedBookName] = useState("");

  // Called by Child1
  function handleBookSelect(bookId, bookName) {
    console.log("MaterialsDashboard -> handleBookSelect =>", bookId, bookName);
    setSelectedBookId(bookId);
    setSelectedBookName(bookName);
  }

  return (
    <Grid container style={{ width: "100%" }}>
      {/* LEFT COLUMN => Book selection (Child1) */}
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
          onOpenOnboarding={onOpenOnboarding}
        />
      </Grid>

      {/* RIGHT COLUMN => main adaptive plan area (Child2) with pen icon overlaid */}
      <Grid
        item
        xs={12}
        md={8}
        lg={9}
        style={{
          backgroundColor: "#111",
        }}
      >
        {/* 
          A relative container so we can absolutely position the pen (ChildStats)
          at the top-right corner 
        */}
        <Box
          sx={{
            position: "relative",
            flex: 1,
            overflowY: "auto",
            p: 2,
            height: "100%",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* The main adaptive plan content */}
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

          {/* 
            The pen icon (ChildStats) is absolutely placed at top-right.
            It doesn't occupy a separate row. 
          */}
          <Box
            sx={{
              position: "absolute",
              top: 16,
              right: 16,
            }}
          >
            <ChildStats
              userId={userId}
              bookId={selectedBookId}
              colorScheme={themeColors}
              backendURL={backendURL}
            />
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
}