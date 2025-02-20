// src/components/DetailedBookViewer/hooks/useBooksViewer.js
import { useState, useEffect } from "react";
import axios from "axios";
import { auth } from "../../../firebase"; // Adjust if your Firebase import is different

export function useBooksViewer() {
  const backendURL = import.meta.env.VITE_BACKEND_URL;

  // --------------------------------------------
  // 1) Handle userId via onAuthStateChanged
  // --------------------------------------------
  const [userId, setUserId] = useState(null);
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // ----------------------------- State Variables -----------------------------
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // The raw "books" structure from /api/books
  const [booksData, setBooksData] = useState([]);
  // The aggregator structure from /api/books-aggregated
  const [booksProgressData, setBooksProgressData] = useState([]);

  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedSubChapter, setSelectedSubChapter] = useState(null);

  // Book-level expansion is a single string (only one book can expand at a time).
  const [expandedBookName, setExpandedBookName] = useState(null);

  // Chapters: an array so multiple can be open at once.
  const [expandedChapters, setExpandedChapters] = useState([]);

  // Tutor Modal
  const [showTutorModal, setShowTutorModal] = useState(false);

  // --- NEW: View Mode (library or adaptive) ---
  const [viewMode, setViewMode] = useState("library");

  // --------------------------------------------
  // 2) Fetch categories immediately (no userId needed)
  // --------------------------------------------
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${backendURL}/api/categories`);
        if (res.data.success !== false) {
          const catData = res.data.data || res.data;
          setCategories(catData);

          // If no category is selected, pick the first
          if (catData.length > 0) {
            setSelectedCategory(catData[0].categoryId);
          }
        } else {
          console.error("Failed to fetch categories:", res.data.error);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, [backendURL]);

  // --------------------------------------------
  // 3) Only fetch books/progress if userId + selectedCategory
  // --------------------------------------------
  useEffect(() => {
    if (!userId) return;
    if (!selectedCategory) return;

    // Fetch data with reset when user changes category or logs in
    fetchAllData(true);
    // eslint-disable-next-line
  }, [userId, selectedCategory]);

  // --------------------------------------------
  // 4) Fetch All Data (with optional reset)
  // --------------------------------------------
  const fetchAllData = async (shouldReset = false) => {
    try {
      // 1) /api/books to get raw book/chapter/subchapter structure (including session)
      const booksRes = await axios.get(
        `${backendURL}/api/books?categoryId=${selectedCategory}&userId=${userId}`
      );
      setBooksData(booksRes.data);

      // 2) /api/books-aggregated for aggregator with "read"/"proficient"
      await fetchAggregatedData();

      // 3) Optionally reset subchapter selections
      if (shouldReset) {
        resetSelections();
      }
    } catch (err) {
      console.error("Error in fetchAllData:", err);
    }
  };

  const fetchAggregatedData = async () => {
    try {
      const url = `${backendURL}/api/books-aggregated?userId=${userId}&categoryId=${selectedCategory}`;
      const res = await axios.get(url);
      if (res.data.success) {
        setBooksProgressData(res.data.data);
      } else {
        console.error("Failed aggregator:", res.data.error);
      }
    } catch (err) {
      console.error("Error aggregator:", err);
    }
  };

  // ----------------------------- Reset Selections -----------------------------
  const resetSelections = () => {
    setSelectedBook(null);
    setSelectedChapter(null);
    setSelectedSubChapter(null);
    setExpandedBookName(null);
    setExpandedChapters([]);
  };

  // --------------------------- Sidebar Handlers -------------------------------
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  // Single expanded book
  const toggleBookExpansion = (bookName) => {
    setExpandedBookName((prev) => (prev === bookName ? null : bookName));
  };

  // Multiple expanded chapters
  const toggleChapterExpansion = (chapterKey) => {
    setExpandedChapters((prev) => {
      if (prev.includes(chapterKey)) {
        return prev.filter((item) => item !== chapterKey);
      } else {
        return [...prev, chapterKey];
      }
    });
  };

  const handleBookClick = (book) => {
    setSelectedBook(book);
    setSelectedChapter(null);
    setSelectedSubChapter(null);
  };

  const handleChapterClick = (chapter) => {
    setSelectedChapter(chapter);
    setSelectedSubChapter(null);
  };

  const handleSubChapterClick = async (subChapter) => {
    setSelectedSubChapter(subChapter);
  };

  // If you want to toggle "done" for a subchapter
  const handleToggleDone = async (subChapter) => {
    alert(
      "handleToggleDone: Not implemented. If aggregator uses 'proficiency' in subChapters_demo, you'd update that doc or user_progress_demo here."
    );
  };

  // ------------------------- Book Progress Helper ------------------------------
  // aggregator returns object like { bookName, totalWords, totalWordsReadOrProficient, ... }
  const getBookProgressInfo = (bookName) => {
    return booksProgressData.find((b) => b.bookName === bookName);
  };

  // ------------------------- Adaptive Filtering ------------------------------
  // Helper to filter out subChapters that are not "adaptive: true"
  function filterAdaptiveData(allBooks) {
    return allBooks
      .map((book) => {
        const filteredChapters = book.chapters
          .map((chap) => {
            const filteredSubChapters = chap.subChapters.filter(
              (sub) => sub.adaptive === true
            );
            return { ...chap, subChapters: filteredSubChapters };
          })
          .filter((c) => c.subChapters.length > 0);

        return { ...book, chapters: filteredChapters };
      })
      .filter((b) => b.chapters.length > 0);
  }

  // We'll expose a function that gives either the full booksData or the filtered subset
  const getFilteredBooksData = () => {
    if (viewMode === "library") {
      return booksData;
    } else {
      // "adaptive"
      return filterAdaptiveData(booksData);
    }
  };

  return {
    // states
    userId,
    categories,
    selectedCategory,
    booksData, // raw data if you need it
    booksProgressData,
    selectedBook,
    selectedChapter,
    selectedSubChapter,
    expandedBookName,
    expandedChapters,
    showTutorModal,

    // NEW: mode
    viewMode,
    setViewMode,

    // set-states / toggles
    setShowTutorModal,

    // methods
    handleCategoryChange,
    toggleBookExpansion,
    toggleChapterExpansion,
    handleBookClick,
    handleChapterClick,
    handleSubChapterClick,
    handleToggleDone,
    getBookProgressInfo,

    // main fetch methods
    fetchAllData,
    fetchAggregatedData,

    // new helper for library vs. adaptive
    getFilteredBooksData,
  };
}