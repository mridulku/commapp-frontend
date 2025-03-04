import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  LinearProgress,
  IconButton,
  Pagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

/**
 * Helper function for an emoji icon based on the book's name
 */
function getBookIcon(bookName) {
  const lower = (bookName || "").toLowerCase();
  if (lower.includes("math")) return "📐";
  if (lower.includes("science")) return "🔬";
  if (lower.includes("history")) return "🏰";
  if (lower.includes("art")) return "🎨";
  return "📚";
}

/**
 * Child1
 *
 * A panel listing the user's books, with search, sort, and pagination.
 *
 * Props:
 *  - userId (string)
 *  - onBookSelect(bookId, bookName) => void
 *  - onOpenOnboarding() => void   // to trigger the same "upload" modal from parent
 */
export default function Child1({
  userId,
  onBookSelect = () => {},
  onOpenOnboarding = () => {},
}) {
  const [booksData, setBooksData] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  // CHANGED: only 5 books per page now
  const booksPerPage = 5;

  // Search & Sort
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("NEWEST");

  // ----------------
  // 1) Fetch Books
  // ----------------
  useEffect(() => {
    if (!userId) return;

    async function fetchBooks() {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/books-user`,
          { params: { userId } }
        );
        if (res.data && res.data.success) {
          setBooksData(res.data.data);
        } else {
          console.warn("No data or success=false:", res.data);
          setBooksData([]);
        }
      } catch (err) {
        console.error("Error fetching books:", err);
        setBooksData([]);
      }
    }

    fetchBooks();
  }, [userId]);

  // ----------------
  // 2) Filter & Sort
  // ----------------
  const filteredBooks = booksData.filter((book) => {
    const name = book.name || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
    const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);

    const nameA = (a.name || "").toLowerCase();
    const nameB = (b.name || "").toLowerCase();

    switch (sortOption) {
      case "NEWEST":
        return dateB - dateA;
      case "OLDEST":
        return dateA - dateB;
      case "ALPHA_ASC":
        return nameA.localeCompare(nameB);
      case "ALPHA_DESC":
        return nameB.localeCompare(nameA);
      default:
        return 0;
    }
  });

  // ----------------
  // 3) Compute Stats
  // ----------------
  const bookStats = sortedBooks.map((book) => {
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
      bookId: book.id,
      name: book.name || "Untitled Book",
      createdAt: book.createdAt,
      progressPercent,
    };
  });

  // ----------------
  // Pagination
  // ----------------
  const startIndex = (page - 1) * booksPerPage;
  const endIndex = startIndex + booksPerPage;
  const pagedBooks = bookStats.slice(startIndex, endIndex);

  // ----------------
  // 4) Handlers
  // ----------------
  function handleCardClick(bookId, bookName) {
    setSelectedBookId(bookId);
    onBookSelect(bookId, bookName);
  }

  // Search & sort
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };
  const handleSortChange = (e) => {
    setSortOption(e.target.value);
    setPage(1);
  };

  // ----------------
  // 5) Render
  // ----------------
  return (
    <Box
      sx={{
        backgroundColor: "#000",
        color: "#FFF",
        p: 2,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {/* 
         Title row: "My Materials" + plus icon 
         Moved AddIcon here next to "My Materials"
      */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 0 }}>
          My Materials
        </Typography>

        {/* Calls onOpenOnboarding() from parent to trigger the same Upload flow */}
        <IconButton
          onClick={onOpenOnboarding}
          sx={{ color: "#4CAF50" }}
          title="Upload Material"
        >
          <AddIcon />
        </IconButton>
      </Box>

      {/* 
         Row for Search & Sort 
         (the plus button was removed from here and placed above)
      */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search..."
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{
            width: "160px",
            backgroundColor: "rgba(255,255,255,0.1)",
            input: { color: "#FFF" },
            "& .MuiOutlinedInput-root": {
              "& > fieldset": {
                borderColor: "rgba(255,255,255,0.3)",
              },
              "&:hover fieldset": {
                borderColor: "#BB86FC",
              },
            },
            "& .MuiSvgIcon-root": {
              color: "#FFF",
            },
          }}
        />

        <FormControl
          size="small"
          sx={{
            minWidth: 120,
            backgroundColor: "rgba(255,255,255,0.1)",
            "& .MuiOutlinedInput-root": {
              "& > fieldset": {
                borderColor: "rgba(255,255,255,0.3)",
              },
              "&:hover fieldset": {
                borderColor: "#BB86FC",
              },
            },
            "& .MuiSvgIcon-root": {
              color: "#FFF",
            },
          }}
        >
          <InputLabel sx={{ color: "#FFF" }}>Sort</InputLabel>
          <Select
            value={sortOption}
            label="Sort"
            onChange={handleSortChange}
            sx={{ color: "#FFF" }}
          >
            <MenuItem value="NEWEST">Newest</MenuItem>
            <MenuItem value="OLDEST">Oldest</MenuItem>
            <MenuItem value="ALPHA_ASC">A–Z</MenuItem>
            <MenuItem value="ALPHA_DESC">Z–A</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* If no books at all */}
      {bookStats.length === 0 ? (
        <Typography variant="body2">
          No books found for userId="{userId}".
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {pagedBooks.map((bs) => {
            const isSelected = bs.bookId === selectedBookId;
            const icon = getBookIcon(bs.name);

            let creationDateText = "No date";
            if (bs.createdAt) {
              const dateObj = new Date(bs.createdAt);
              if (!isNaN(dateObj.getTime())) {
                creationDateText = dateObj.toLocaleDateString();
              }
            }

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
                onClick={() => handleCardClick(bs.bookId, bs.name)}
              >
                <Box
                  sx={{
                    fontSize: "1.5rem",
                    width: "2rem",
                    textAlign: "center",
                  }}
                >
                  {icon}
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: "bold", lineHeight: 1.2 }}
                  >
                    {bs.name}
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{ display: "block", opacity: 0.8 }}
                  >
                    {creationDateText}
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

      {/* Pagination => only show if total books is more than 1 page */}
      {bookStats.length > booksPerPage && (
        <Box sx={{ mt: 1, display: "flex", justifyContent: "center" }}>
          <Pagination
            count={Math.ceil(bookStats.length / booksPerPage)}
            page={page}
            onChange={(e, value) => setPage(value)}
            sx={{
              "& .MuiPaginationItem-root": {
                color: "#FFF",
                borderColor: "rgba(255,255,255,0.3)",
              },
              "& .MuiPaginationItem-ellipsis": {
                color: "#FFF",
              },
              "& .MuiPaginationItem-root:hover": {
                backgroundColor: "rgba(255,255,255,0.08)",
              },
              "& .MuiPaginationItem-root.Mui-selected": {
                backgroundColor: "#BB86FC",
                color: "#000",
              },
              "& .MuiPaginationItem-root.Mui-selected:hover": {
                backgroundColor: "#BB86FC",
                opacity: 0.9,
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
}