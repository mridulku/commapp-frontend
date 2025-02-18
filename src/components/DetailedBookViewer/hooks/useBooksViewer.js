// src/components/DetailedBookViewer/hooks/useBooksViewer.js
import { useState, useEffect } from "react";
import axios from "axios";
import { auth } from "../../../firebase";  // Adjust if your Firebase import is different

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
  const [booksData, setBooksData] = useState([]);
  const [booksProgressData, setBooksProgressData] = useState([]);

  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  // subChapter object with subChapterId, subChapterName, etc.
  const [selectedSubChapter, setSelectedSubChapter] = useState(null);

  // Book-level expansion is still a single string (only one book can expand at a time).
  const [expandedBookName, setExpandedBookName] = useState(null);

  // CHAPTERS: now we have an array of expanded chapters (so multiple can be open).
  const [expandedChapters, setExpandedChapters] = useState([]);

  const [quizData, setQuizData] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  const [summaryOutput, setSummaryOutput] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");

  const [doubts, setDoubts] = useState([]);
  const [doubtInput, setDoubtInput] = useState("");

  const [showTutorModal, setShowTutorModal] = useState(false);

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
          // If no category is selected, automatically pick the first
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
  // 3) Only fetch books/progress if we have BOTH userId AND selectedCategory
  // --------------------------------------------
  useEffect(() => {
    if (!userId) return;
    if (!selectedCategory) return;
    fetchAllData();
    // eslint-disable-next-line
  }, [userId, selectedCategory]);

  // --------------------------------------------
  // 4) Fetch All Data
  // --------------------------------------------
  const fetchAllData = async () => {
    try {
      // 1) Fetch Books for selectedCategory & user
      const booksRes = await axios.get(
        `${backendURL}/api/books?categoryId=${selectedCategory}&userId=${userId}`
      );
      const books = booksRes.data;

      // 2) Fetch user progress
      const progRes = await axios.get(
        `${backendURL}/api/user-progress?userId=${userId}`
      );
      const progressData = progRes.data;

      if (!progressData.success) {
        console.error("Failed to fetch user progress:", progressData.error);
        setBooksData(books);
      } else {
        // Merge user progress into books
        const progressMap = new Map();
        progressData.progress.forEach((p) => {
          const key = `${p.bookName}||${p.chapterName}||${p.subChapterName}`;
          progressMap.set(key, p);
        });

        const merged = books.map((book) => {
          return {
            ...book,
            chapters: book.chapters.map((chap) => {
              const updatedSubs = chap.subChapters.map((sc) => {
                const subKey = `${book.bookName}||${chap.chapterName}||${sc.subChapterName}`;
                const p = progressMap.get(subKey) || {};
                return {
                  ...sc,
                  isDone: p.isDone || false,
                  readStartTime: p.readStartTime || null,
                  readEndTime: p.readEndTime || null,
                };
              });
              return { ...chap, subChapters: updatedSubs };
            }),
          };
        });

        setBooksData(merged);
      }

      // 3) Fetch aggregator data
      await fetchAggregatedData();

      // 4) Reset subchapter selections
      resetSelections();
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
    resetQuizState();
    setExpandedBookName(null);
    // Clear out expandedChapters if you want to start fresh
    setExpandedChapters([]);
    setSummaryOutput("");
    setCustomPrompt("");
    setDoubts([]);
    setDoubtInput("");
  };

  const resetQuizState = () => {
    setQuizData([]);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setScore(null);
  };

  // --------------------------- Sidebar Handlers -------------------------------
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const toggleBookExpansion = (bookName) => {
    setExpandedBookName((prev) => (prev === bookName ? null : bookName));
    // If you want multiple books expanded at once, you'd do the same approach
    // as expandedChapters for books. But let's keep the single approach for books.
  };

  // Instead of a single expandedChapterName, we have an array. So we do:
  const toggleChapterExpansion = (chapterKey) => {
    setExpandedChapters((prev) => {
      if (prev.includes(chapterKey)) {
        // remove it
        return prev.filter((item) => item !== chapterKey);
      } else {
        // add it
        return [...prev, chapterKey];
      }
    });
  };

  const handleBookClick = (book) => {
    setSelectedBook(book);
    setSelectedChapter(null);
    setSelectedSubChapter(null);
    resetQuizState();
  };

  const handleChapterClick = (chapter) => {
    setSelectedChapter(chapter);
    setSelectedSubChapter(null);
    resetQuizState();
  };

  const handleSubChapterClick = async (subChapter) => {
    setSelectedSubChapter(subChapter);
    resetQuizState();

    if (selectedBook && selectedChapter && subChapter) {
      await fetchQuiz(
        selectedBook.bookName,
        selectedChapter.chapterName,
        subChapter.subChapterName
      );
    }
  };

  // ------------------------------ Quiz Logic ----------------------------------
  const fetchQuiz = async (bookName, chapterName, subChapterName) => {
    try {
      const url = `${backendURL}/api/quizzes?bookName=${encodeURIComponent(bookName)}&chapterName=${encodeURIComponent(chapterName)}&subChapterName=${encodeURIComponent(subChapterName)}`;
      const res = await axios.get(url);
      if (res.data.success === false) {
        console.error("Quiz fetch error:", res.data.error);
        setQuizData([]);
        resetQuizState();
      } else {
        setQuizData(res.data.data || []);
      }
    } catch (error) {
      console.error("Quiz fetch error:", error);
      setQuizData([]);
      resetQuizState();
    }
  };

  const handleOptionSelect = (questionIndex, optionIndex) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const handleSubmitQuiz = () => {
    let correctCount = 0;
    quizData.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswerIndex) {
        correctCount++;
      }
    });
    setScore(correctCount);
    setQuizSubmitted(true);
  };

  // --------------------------- Subchapter Progress -----------------------------
  const handleToggleDone = async (subChapter) => {
    try {
      const newDoneState = !subChapter.isDone;
      await axios.post(`${backendURL}/api/complete-subchapter`, {
        userId,
        bookName: selectedBook.bookName,
        chapterName: selectedChapter.chapterName,
        subChapterName: subChapter.subChapterName,
        done: newDoneState,
      });
      await fetchAllData();
    } catch (error) {
      console.error("Error toggling done state:", error);
      alert("Failed to update completion status.");
    }
  };

  // ------------------------------ Summaries (Old) -----------------------------
  const handleSummarizePreset = (promptName) => {
    let mockResponse = "";
    switch (promptName) {
      case "explainLike5":
        mockResponse = "This is a simple explanation for a 5-year-old level...";
        break;
      case "bulletPoints":
        mockResponse = "- Point 1\n- Point 2\n- Point 3\nA quick bullet-style summary.";
        break;
      case "conciseSummary":
        mockResponse = "This is a very concise summary, focusing on core ideas...";
        break;
      default:
        mockResponse = "Unknown preset prompt. (Mocked response)";
    }
    setSummaryOutput(mockResponse);
  };

  const handleCustomPromptSubmit = () => {
    if (!customPrompt.trim()) {
      alert("Please enter a custom prompt first.");
      return;
    }
    const mockResponse = `Mocked AI answer for your prompt:\n"${customPrompt}"\n(Replace with real API call logic.)`;
    setSummaryOutput(mockResponse);
  };

  // ------------------------------ Doubts Chat ---------------------------------
  const handleSendDoubt = () => {
    if (!doubtInput.trim()) return;
    const newUserMessage = { role: "user", content: doubtInput };
    const newAssistantMessage = {
      role: "assistant",
      content: `I'm a mock AI. You asked:\n"${doubtInput}".\nHere's a helpful explanation!`,
    };
    setDoubts((prev) => [...prev, newUserMessage, newAssistantMessage]);
    setDoubtInput("");
  };

  // ------------------------- Book Progress Helper ------------------------------
  const getBookProgressInfo = (bookName) => {
    return booksProgressData.find((b) => b.bookName === bookName);
  };

  // 4) Return everything the parent might need
  return {
    // states
    userId,
    categories,
    selectedCategory,
    booksData,
    booksProgressData,
    selectedBook,
    selectedChapter,
    selectedSubChapter,
    expandedBookName,
    // The new array for multiple chapters
    expandedChapters,
    quizData,
    selectedAnswers,
    quizSubmitted,
    score,
    summaryOutput,
    customPrompt,
    doubts,
    doubtInput,
    showTutorModal,

    // set-states or toggles
    setShowTutorModal,
    setCustomPrompt,
    setDoubtInput,

    // methods
    handleCategoryChange,
    toggleBookExpansion,
    toggleChapterExpansion,
    handleBookClick,
    handleChapterClick,
    handleSubChapterClick,
    handleOptionSelect,
    handleSubmitQuiz,
    handleToggleDone,
    handleSummarizePreset,
    handleCustomPromptSubmit,
    handleSendDoubt,
    getBookProgressInfo,
    fetchAllData,
  };
}