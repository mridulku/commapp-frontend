// src/components/DetailedBookViewer/MaterialsDashboard.jsx

import React, { useState } from "react";
import { Box, Typography, Button, LinearProgress } from "@mui/material";
import { useBooksViewer } from "../useBooksViewer";
import UploadMaterialModal from "./UploadMaterialModal";

/**
 * A tile-based dashboard displaying user's books:
 *  - Icons
 *  - Computed progress (chapters + subChapters)
 *  - Mastery level, target date
 *  - "Add to Plan" / "Remove from Plan" toggles
 *  - "Upload Material" button -> opens modal
 */

// Helper function to map a book name (or mastery, category, etc.) to an emoji icon
function getBookIcon(bookName) {
  // Simple examples—expand this mapping as needed
  const lower = (bookName || "").toLowerCase();
  if (lower.includes("math")) return "📐";
  if (lower.includes("science")) return "🔬";
  if (lower.includes("history")) return "🏰";
  if (lower.includes("art")) return "🎨";
  return "📚"; // Default icon
}

export default function MaterialsDashboard() {
  // 1) Grab real data from your custom hook
  const { booksData } = useBooksViewer();

  // 2) Aggregate stats (chapters, subChapters, etc.)
  const bookStats = (booksData || []).map((book) => {
    const chapters = book.chapters || [];
    let subChaptersCount = 0;
    let subChaptersCompleted = 0;

    chapters.forEach((chap) => {
      const subs = chap.subChapters || [];
      subChaptersCount += subs.length;
      subs.forEach((sub) => {
        if (sub.isDone) subChaptersCompleted++;
      });
    });

    // Basic progress calculation
    const totalSubs = subChaptersCount;
    const doneSubs = subChaptersCompleted;
    const progressPercent = totalSubs > 0 ? Math.round((doneSubs / totalSubs) * 100) : 0;

    return {
      bookId: book.bookId || book.id,
      bookName: book.bookName || "Untitled Book",
      chaptersCount: chapters.length,
      subChaptersCount: totalSubs,
      subChaptersCompleted: doneSubs,
      progressPercent,
      mastery: book.mastery || "N/A",
      targetDate: book.targetDate || "",
    };
  });

  // 3) Local "in plan" toggles
  const [planState, setPlanState] = useState({});
  const handleTogglePlan = (bookId) => {
    setPlanState((prev) => ({
      ...prev,
      [bookId]: !prev[bookId],
    }));
  };

  // 4) Upload Material modal
  const [uploadOpen, setUploadOpen] = useState(false);
  const handleOpenUpload = () => setUploadOpen(true);
  const handleCloseUpload = () => setUploadOpen(false);

  const handleUploadMaterial = (data) => {
    // e.g. data = { name: "...", file: ... }
    console.log("Received new upload data =>", data);
    alert("Material uploaded. (Demo, not storing anywhere.)");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#000000",
        color: "#FFFFFF",
        p: 4,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top row: Title + Upload button on the right */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: "bold" }}>
          My Learning Materials
        </Typography>
        <Button variant="contained" sx={{ backgroundColor: "#4CAF50" }} onClick={handleOpenUpload}>
          Upload Material
        </Button>
      </Box>

      {/* If no data, show a simple message */}
      {bookStats.length === 0 ? (
        <Typography variant="body1">
          No books found. Possibly empty or user data not loaded.
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: 3,
          }}
        >
          {bookStats.map((bs) => {
            const isInPlan = !!planState[bs.bookId];
            const icon = getBookIcon(bs.bookName);

            return (
              <Box
                key={bs.bookId}
                sx={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderRadius: 2,
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "200px",
                }}
              >
                {/* Icon + Title */}
                <Box>
                  <Typography sx={{ fontSize: "2rem" }} mb={1}>
                    {icon}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }} gutterBottom>
                    {bs.bookName}
                  </Typography>

                  {/* Progress bar */}
                  <LinearProgress
                    variant="determinate"
                    value={bs.progressPercent}
                    sx={{
                      height: 8,
                      borderRadius: 5,
                      backgroundColor: "rgba(255,255,255,0.3)",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: "#FFD700",
                      },
                    }}
                  />
                  <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                    {bs.progressPercent}% complete
                  </Typography>
                </Box>

                {/* Mastery & Target Date */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    Mastery: <strong>{bs.mastery}</strong>
                  </Typography>
                  <Typography variant="body2">
                    Target Date: {bs.targetDate || "None"}
                  </Typography>
                </Box>

                {/* "Add to Plan" / "Remove from Plan" button */}
                <Box sx={{ textAlign: "right", mt: 2 }}>
                  {isInPlan ? (
                    <Button
                      variant="outlined"
                      sx={{ borderColor: "#BB86FC", color: "#BB86FC" }}
                      onClick={() => handleTogglePlan(bs.bookId)}
                    >
                      Remove from Plan
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      sx={{
                        backgroundColor: "#BB86FC",
                        ":hover": { backgroundColor: "#9f6cd9" },
                      }}
                      onClick={() => handleTogglePlan(bs.bookId)}
                    >
                      Add to Plan
                    </Button>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Upload Modal */}
      <UploadMaterialModal
        open={uploadOpen}
        onClose={handleCloseUpload}
        onUpload={handleUploadMaterial}
      />
    </Box>
  );
}