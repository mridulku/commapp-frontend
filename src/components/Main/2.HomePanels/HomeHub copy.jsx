// src/components/HomeHub/HomeHub.jsx
import React from "react";
import { Box, Grid, Typography } from "@mui/material";
import StatsPanel          from "./TopStatsPanel";      // keep existing file
import ActivePlansBlock    from "./blocks/ActivePlansBlock";
import ToolsBlock          from "./blocks/ToolsBlock";
import ProfileBlock        from "./blocks/ProfileBlock";
import ConceptGraphBlock   from "./blocks/ConceptGraphBlock";

export default function HomeHub({
  userId           = "",
  onOpenOnboarding = () => {},
  onNavigate       = (dest) => console.log("→ navigate to", dest),
  themeColors = {
    background:   "#121212",
    textPrimary:  "#FFFFFF",
  },
}) {
  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100%",
        bgcolor: themeColors.background,
        color:  themeColors.textPrimary,
        p: 2,
        boxSizing: "border-box",
      }}
    >
      {/* 1️⃣ Top strip */}
      <StatsPanel userId={userId} />

      {/* 2️⃣ Blocks grid */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <ActivePlansBlock
            userId={userId}
            onOpenOnboarding={onOpenOnboarding}
            onOpenPlan={() => onNavigate("plans")}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <ToolsBlock
            onOpenTool={(toolId) => onNavigate(`tool/${toolId}`)}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <ProfileBlock
            userId={userId}
            onOpenProfile={() => onNavigate("profile")}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <ConceptGraphBlock
            onOpenGraph={() => onNavigate("concept-graph")}
          />
        </Grid>
      </Grid>
    </Box>
  );
}