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

  // The raw "books" structure from /api/books
  const [booksData, setBooksData] = useState([]);
  // The aggregator structure from /api/books-aggregated
  const [booksProgressData, setBooksProgressData] = useState([]);

  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedSubChapter, setSelectedSubChapter] = useState(null);

  // Book-level expansion is a single string (only one book can expand at a time).
  const [expandedBookName, setExpandedBookName] = useState(null);

  // CHAPTERS: an array so multiple can be open at once
  const [expandedChapters, setExpandedChapters] = useState([]);

  // quiz states
  const [quizData, setQuizData] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  // Summaries / custom prompts
  const [summaryOutput, setSummaryOutput] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");

  // Doubts chat
  const [doubts, setDoubts] = useState([]);
  const [doubtInput, setDoubtInput] = useState("");

  // Tutor Modal
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
    fetchAllData();
    // eslint-disable-next-line
  }, [userId, selectedCategory]);

  // --------------------------------------------
  // 4) Fetch All Data
  // --------------------------------------------
  const fetchAllData = async () => {
    try {
      // 1) /api/books to get raw book/chapter/subchapter structure
      const booksRes = await axios.get(
        `${backendURL}/api/books?categoryId=${selectedCategory}&userId=${userId}`
      );
      setBooksData(booksRes.data);

      // 2) /api/books-aggregated for aggregator with "read"/"proficient"
      await fetchAggregatedData();

      // 3) Reset subchapter selections
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

  // If you still want to toggle "done" for a subchapter, you can do so,
  // but it won't change the aggregator if aggregator is using proficiency from subChapters_demo
  const handleToggleDone = async (subChapter) => {
    alert("handleToggleDone: Not implemented if aggregator uses 'proficiency' field only.");
    // If you want to POST to /api/complete-subchapter => up to you
  };

  // ------------------------------ Summaries (Old) -----------------------------
  const handleSummarizePreset = (promptName) => {
    let mockResponse = "";
    switch (promptName) {
      case "explainLike5":
        mockResponse = "This is a simple explanation for a 5-year-old level...";
        break;
      case "bulletPoints":
        mockResponse = "- Point 1\n- Point 2\n- Point 3";
        break;
      case "conciseSummary":
        mockResponse = "A concise summary focusing on core ideas...";
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
    const mockResponse = `Mocked AI answer for your prompt:\n"${customPrompt}"`;
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
  // aggregator returns object like { bookName, totalWords, totalWordsReadOrProficient, ... }
  const getBookProgressInfo = (bookName) => {
    return booksProgressData.find((b) => b.bookName === bookName);
  };

  // 5) Return everything the parent might need
  return {
    // states
    userId,
    categories,
    selectedCategory,
    booksData,           // raw structure
    booksProgressData,   // aggregator structure
    selectedBook,
    selectedChapter,
    selectedSubChapter,
    expandedBookName,
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
    handleToggleDone,          // dummy or partial
    handleSummarizePreset,
    handleCustomPromptSubmit,
    handleSendDoubt,
    getBookProgressInfo,
    fetchAllData,
  };
}