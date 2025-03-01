import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  IconButton,
  Pagination,
} from "@mui/material";
import UploadMaterialModal from "./UploadMaterialModal";
import AddIcon from "@mui/icons-material/Add"; // or any small icon for upload

/**
 * Child1
 * A compact vertical list of books with:
 *  - Icon
 *  - Book title
 *  - Small progress bar
 *  - Pagination if there are more than 10 books
 *
 * Props:
 *   - userId (string): the user's ID
 *   - onBookSelect (function): callback(bookId)
 */

// optional helper function for icon-emoji
function getBookIcon(bookName) {
  const lower = (bookName || "").toLowerCase();
  if (lower.includes("math")) return "📐";
  if (lower.includes("science")) return "🔬";
  if (lower.includes("history")) return "🏰";
  if (lower.includes("art")) return "🎨";
  return "📚"; // Default
}

export default function Child1({ userId, onBookSelect = () => {} }) {
  // Book data from /api/books-user
  const [booksData, setBooksData] = useState([]);
  // Which book is selected
  const [selectedBookId, setSelectedBookId] = useState(null);
  // Upload modal
  const [uploadOpen, setUploadOpen] = useState(false);
  // Pagination
  const [page, setPage] = useState(1);
  const booksPerPage = 10;

  useEffect(() => {
    if (!userId) return;
    async function fetchBooks() {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/books-user`, {
          params: { userId },
        });
        if (res.data && res.data.success) {
          setBooksData(res.data.data); // array of books
        } else {
          console.warn("No data or success=false fetching books:", res.data);
          setBooksData([]);
        }
      } catch (err) {
        console.error("Error fetching books:", err);
        setBooksData([]);
      }
    }
    fetchBooks();
  }, [userId]);

  // Transform data => stats for rendering
  const bookStats = booksData.map((book) => {
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

    const totalSubs = subChaptersCount;
    const doneSubs = subChaptersCompleted;
    const progressPercent =
      totalSubs > 0 ? Math.round((doneSubs / totalSubs) * 100) : 0;

    return {
      bookId: book.bookId || book.id,
      bookName: book.bookName || "Untitled Book",
      progressPercent,
    };
  });

  // Pagination slice
  const startIndex = (page - 1) * booksPerPage;
  const endIndex = startIndex + booksPerPage;
  const pagedBooks = bookStats.slice(startIndex, endIndex);

  // Handlers
  const handleCardClick = (bookId) => {
    setSelectedBookId(bookId);
    onBookSelect(bookId);
  };

  const handleOpenUpload = () => setUploadOpen(true);
  const handleCloseUpload = () => setUploadOpen(false);

  const handleUploadMaterial = (data) => {
    console.log("Received new upload data =>", data);
    alert("Material uploaded. (Demo, not storing anywhere.)");
  };

  // Render
  return (
    <Box
      sx={{
        // Remove large "minHeight" so it fits the parent's layout
        backgroundColor: "#000",
        color: "#FFF",
        p: 2,
        display: "flex",
        flexDirection: "column",
        gap: 2, // small spacing between sections
      }}
    >
      {/* Top Row: Title + small Upload button */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          My Materials
        </Typography>
        <IconButton
          onClick={handleOpenUpload}
          sx={{ color: "#4CAF50" }}
          title="Upload Material"
        >
          <AddIcon />
        </IconButton>
      </Box>

      {/* Book List */}
      {bookStats.length === 0 ? (
        <Typography variant="body2">
          No books found for userId="{userId}".
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {pagedBooks.map((bs) => {
            const isSelected = bs.bookId === selectedBookId;
            const icon = getBookIcon(bs.bookName);

            // List-item style
            const itemStyles = {
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 1.5,
              p: 1,
              borderRadius: 1,
              cursor: "pointer",
              backgroundColor: isSelected
                ? "rgba(187,134,252, 0.3)"
                : "rgba(255,255,255,0.06)",
              border: isSelected
                ? "2px solid #BB86FC"
                : "1px solid rgba(255,255,255,0.15)",
              transition: "background-color 0.3s",
            };

            return (
              <Box
                key={bs.bookId}
                sx={itemStyles}
                onClick={() => handleCardClick(bs.bookId)}
              >
                {/* Left: Icon */}
                <Box
                  sx={{
                    fontSize: "1.5rem",
                    width: "2rem",
                    textAlign: "center",
                  }}
                >
                  {icon}
                </Box>

                {/* Middle: Book Name & Progress bar */}
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: "bold", lineHeight: 1.2 }}
                  >
                    {bs.bookName}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={bs.progressPercent}
                    sx={{
                      height: 6,
                      borderRadius: 1,
                      backgroundColor: "rgba(255,255,255,0.3)",
                      mt: 0.5,
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: "#FFD700",
                      },
                    }}
                  />
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {bs.progressPercent}% complete
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Pagination (only show if more books than page size) */}
      {bookStats.length > booksPerPage && (
        <Box sx={{ mt: 1, display: "flex", justifyContent: "center" }}>
          <Pagination
            count={Math.ceil(bookStats.length / booksPerPage)}
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
          />
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