import React from "react";
import { Box, Typography } from "@mui/material";

// Collapsible "How it works" strip that already exists on the page
import PlanExplainerPanel from "../AdaptPGComponent/AdaptPG2/ExplainerStrips/SecondaryToolsExplainerStrip";

// The new catalogue component (tabs + grid + modal)
// ⬇️  Adjust the relative path if NewHome2 sits elsewhere
import NewHome2 from "../../../8.NewHome2/NewHome2";

/**
 * Tools.jsx — simplified
 * • Keeps the local page heading and the collapsible explainer strip.
 * • Embeds NewHome2 for the actual Study‑Tools catalogue, but hides
 *   NewHome2's own header and explainer so there is no duplication.
 */
const Tools = ({ userId = "", recentlyUsedIds = [] }) => {
  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", px: 2, py: 4 }}>
      {/* Page title (kept from the original file) */}
      <Typography variant="h4" fontWeight={700} mb={3}>
        Study Tools
      </Typography>

      {/* How‑it‑works collapsible strip */}
      <PlanExplainerPanel sx={{ mb: 3 }} />

      {/* New catalogue (tabs ➜ cards ➜ modal)  */}
      <NewHome2
        userId={userId}
        recentlyUsedIds={recentlyUsedIds}
        showHeader={false}     /* hide duplicate heading */
        showExplainer={false}  /* hide purple explainer block */
      />
    </Box>
  );
};

export default Tools;
