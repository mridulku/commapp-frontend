// src/components/DetailedBookViewer/hooks/useBooksViewer.js
import { useState, useEffect } from "react";
import axios from "axios";
import { auth } from "../../firebase";

export function useBooksViewer() {
  const backendURL = import.meta.env.VITE_BACKEND_URL;

  // -------------------------- 1) userId from Firebase Auth --------------------------
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

  // -------------------------- 2) "isOnboarded" Flag --------------------------
  const [isOnboarded, setIsOnboarded] = useState(false);

  useEffect(() => {
    // If no user, reset isOnboarded => false
    if (!userId) {
      setIsOnboarded(false);
      return;
    }

    // If we have a user, fetch the learnerPersonas doc
    const fetchIsOnboarded = async () => {
      try {
        const res = await axios.get(`${backendURL}/api/learner-personas`, {
          params: { userId },
        });

        if (res.data.success) {
          const { isOnboarded } = res.data.data;
          setIsOnboarded(!!isOnboarded); // ensure boolean
        } else {
          console.error("Failed to fetch isOnboarded:", res.data.error);
          setIsOnboarded(false);
        }
      } catch (err) {
        console.error("Error fetching isOnboarded:", err);
        setIsOnboarded(false);
      }
    };

    fetchIsOnboarded();
  }, [userId, backendURL]);

  // -------------------------- 3) Existing State Variables --------------------------
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [booksData, setBooksData] = useState([]);         // raw
  const [booksProgressData, setBooksProgressData] = useState([]); // aggregator

  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedSubChapter, setSelectedSubChapter] = useState(null);

  const [expandedBookName, setExpandedBookName] = useState(null);
  const [expandedChapters, setExpandedChapters] = useState([]);

  const [showTutorModal, setShowTutorModal] = useState(false);

  // The default viewMode is "overview"
  const [viewMode, setViewMode] = useState("overview");

  // -------------------------- 4) Fetch Categories Immediately --------------------------
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${backendURL}/api/categories`);
        if (res.data.success !== false) {
          const catData = res.data.data || res.data;
          setCategories(catData);
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

  // -------------------------- 5) Fetch Books/Progress if userId + selectedCategory --------------------------
  useEffect(() => {
    if (!userId) return;
    if (!selectedCategory) return;

    fetchAllData(true);
    // eslint-disable-next-line
  }, [userId, selectedCategory]);

  // -------------------------- 6) Fetch All Data --------------------------
  const fetchAllData = async (shouldReset = false) => {
    try {
      // 1) Raw structure
      const booksRes = await axios.get(
        `${backendURL}/api/books?categoryId=${selectedCategory}&userId=${userId}`
      );
      setBooksData(booksRes.data);

      // 2) Aggregated
      await fetchAggregatedData();

      // 3) Optionally reset selections
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

  // -------------------------- 7) Reset Selections --------------------------
  const resetSelections = () => {
    setSelectedBook(null);
    setSelectedChapter(null);
    setSelectedSubChapter(null);
    setExpandedBookName(null);
    setExpandedChapters([]);
  };

  // -------------------------- 8) Handlers --------------------------
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const toggleBookExpansion = (bookName) => {
    setExpandedBookName((prev) => (prev === bookName ? null : bookName));
  };

  const toggleChapterExpansion = (chapterKey) => {
    setExpandedChapters((prev) =>
      prev.includes(chapterKey)
        ? prev.filter((item) => item !== chapterKey)
        : [...prev, chapterKey]
    );
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

  const handleToggleDone = async (subChapter) => {
    alert("handleToggleDone: Not implemented yet.");
  };

  // -------------------------- 9) Book Progress Helper --------------------------
  const getBookProgressInfo = (bookName) => {
    return booksProgressData.find((b) => b.bookName === bookName);
  };

  // -------------------------- 10) Adaptive Filtering --------------------------
  function filterAdaptiveData(allBooks) {
    return allBooks
      .map((book) => {
        const filteredChapters = book.chapters
          .map((chap) => {
            const filteredSubChapters = chap.subChapters.filter((sub) => sub.adaptive === true);
            return { ...chap, subChapters: filteredSubChapters };
          })
          .filter((c) => c.subChapters.length > 0);
        return { ...book, chapters: filteredChapters };
      })
      .filter((b) => b.chapters.length > 0);
  }

  // -------------------------- 11) Filtering by viewMode --------------------------
  const getFilteredBooksData = () => {
    if (viewMode === "library") {
      return booksData;
    } else if (viewMode === "adaptive") {
      return filterAdaptiveData(booksData);
    }
    // For overview/profile/others => return all
    return booksData;
  };

  // Return everything needed by your components
  return {
    // states
    userId,
    isOnboarded, // <-- new flag
    categories,
    selectedCategory,
    booksData,
    booksProgressData,
    selectedBook,
    selectedChapter,
    selectedSubChapter,
    expandedBookName,
    expandedChapters,
    showTutorModal,

    // mode
    viewMode,
    setViewMode,

    // toggles
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

    // fetch
    fetchAllData,
    fetchAggregatedData,

    // library vs. adaptive
    getFilteredBooksData,
  };
}