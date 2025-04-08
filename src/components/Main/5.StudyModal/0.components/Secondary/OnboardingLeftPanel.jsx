// File: OnboardingLeftPanel.jsx
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentIndex } from "../../../../../store/planSlice";
import {
  Box,
  Typography,
  List,
  ListItemButton,
  IconButton,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LockIcon from "@mui/icons-material/Lock";

export default function OnboardingLeftPanel({
  isCollapsed = false,
  onToggleCollapse = () => {},
}) {
  const dispatch = useDispatch();
  const { planDoc, flattenedActivities, currentIndex, status } = useSelector(
    (state) => state.plan
  );

  if (status !== "succeeded" || !planDoc) {
    return (
      <Box sx={containerSx}>
        <Typography variant="body2">No plan loaded yet.</Typography>
      </Box>
    );
  }

  // All activities
  const allActs = flattenedActivities || [];

  // Calculate completion % for entire onboarding plan
  const total = allActs.length;
  let doneCount = 0;
  allActs.forEach((act) => {
    const cs = (act.completionStatus || "").toLowerCase();
    if (cs === "deferred" || cs === "complete") {
      doneCount++;
    }
  });
  const progressPct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <Box sx={containerSx}>
      {/* Collapsible button row */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 1,
          position: "relative",
          height: 32,
        }}
      >
        <IconButton
          size="small"
          onClick={onToggleCollapse}
          sx={{
            color: "#fff",
            marginRight: 1,
            zIndex: 2,
          }}
        >
          <MenuIcon />
        </IconButton>
        {!isCollapsed && (
          <Typography
            variant="body2"
            sx={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}
          >
            Onboarding Plan
          </Typography>
        )}
      </Box>

      {!isCollapsed && (
        <>
          {/* Onboarding progress bar */}
          <Box sx={{ color: "#fff", mb: 2, ml: 1 }}>
            <Typography variant="body2" sx={{ fontSize: "0.75rem", mb: 0.5 }}>
              <strong>Onboarding Progress</strong>
            </Typography>
            <Box
              sx={{
                position: "relative",
                width: "80%",
                height: "8px",
                bgcolor: "#444",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: `${progressPct}%`,
                  bgcolor: "#66BB6A",
                  borderRadius: "4px",
                }}
              />
            </Box>
            <Typography variant="body2" sx={{ fontSize: "0.75rem", mt: 0.5 }}>
              {progressPct}%
            </Typography>
          </Box>

          {/* Step list */}
          <Box sx={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
            <List dense sx={{ p: 0 }}>
              {allActs.map((act, idx) => {
                const isSelected = act.flatIndex === currentIndex;
                const { bgColor, textColor } = getActivityStyle(isSelected);

                const stepNumber = `Step ${idx + 1}`;
                const guideType = act.guideType || null; // e.g. 'reading', 'remember', etc.
                const aggregatorStatus = (act.aggregatorStatus || "").toLowerCase();
                const locked = aggregatorStatus === "locked";

                return (
                  <Box
                    key={idx}
                    sx={{
                      position: "relative",
                      mb: 0.8,
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <ListItemButton
                      sx={{
                        flexDirection: "column",
                        alignItems: "flex-start",
                        bgcolor: bgColor,
                        color: textColor,
                        py: 1,
                        px: 1,
                        "&:hover": { bgcolor: "#444" },
                      }}
                      onClick={() => dispatch(setCurrentIndex(act.flatIndex))}
                    >
                      {/* Step label: e.g. "Step 1" */}
                      <Typography sx={{ fontSize: "0.8rem", fontWeight: 600 }}>
                        {stepNumber}
                      </Typography>

                      {/* If guideType is present, show it on the next line */}
                      {guideType && (
                        <Typography sx={{ fontSize: "0.75rem", mt: 0.3 }}>
                          Guide Type: {guideType}
                        </Typography>
                      )}
                    </ListItemButton>

                    {/* If locked => overlay */}
                    {locked && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          bottom: 0,
                          left: 0,
                          bgcolor: "rgba(0,0,0,0.4)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "4px",
                          pointerEvents: "none",
                        }}
                      >
                        <LockIcon sx={{ color: "#fff", opacity: 0.8, fontSize: 30 }} />
                      </Box>
                    )}
                  </Box>
                );
              })}
            </List>
          </Box>
        </>
      )}
    </Box>
  );
}

// ----------------------------------------
// Helpers
// ----------------------------------------
function getActivityStyle(isSelected) {
  if (isSelected) {
    return {
      bgColor: "#EF5350",
      textColor: "#fff",
    };
  }
  return {
    bgColor: "#555",
    textColor: "#fff",
  };
}

const containerSx = {
  height: "100%",
  bgcolor: "#1A1A1A",
  color: "#fff",
  display: "flex",
  flexDirection: "column",
  p: 1,
  boxSizing: "border-box",
};