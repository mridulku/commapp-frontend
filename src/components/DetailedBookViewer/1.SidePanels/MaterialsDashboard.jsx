// src/components/DetailedBookViewer/MaterialsDashboard.jsx
import React from "react";
import Child1 from "./Child1";
import Child2 from "./Child2";
import Child3 from "./Child3";

/**
 * Parent component that renders three children:
 *  - Child1 => Original materials/books logic
 *  - Child2 => OverviewSidebar-like logic (sorted plan from planIds)
 *  - Child3 => HomeSidebar-like logic (single planId)
 *
 * Props can be passed down from a parent, e.g.:
 *   planIds (string[]) -> used by Child2
 *   homePlanId (string) -> used by Child3
 *   onHomeSelect, onOpenPlayer, themeColors, etc.
 */
export default function MaterialsDashboard({
  // Example props (adjust as needed):
  userId,
  planIds = [],
  homePlanId = "",
  backendURL = import.meta.env.VITE_BACKEND_URL,
  onHomeSelect = () => {},
  onOpenPlayer = () => {},
  themeColors = {},
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Child1 => "books" logic / progress bars */}
      <Child1 />

      {/* Child2 => "overview" logic using array of planIds */}
      <Child2
        planIds={planIds}
        userId={userId}
        // If Child2 needs a backendURL prop:
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

      {/* Child3 => "home" logic using single planId */}
      <Child3
        userId={userId}
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
    </div>
  );
}