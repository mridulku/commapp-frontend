/********************************************
 * BooksViewer2.jsx (Parent Container)
 ********************************************/
import React, { useState, useEffect } from "react";
import axios from "axios";
// Import your Firebase Auth instance
import { auth } from "../../firebase";

import BooksSidebar from "./BooksSidebar";
import BookProgress from "./BookProgress";
import SubchapterContent from "./SubchapterContent";
import SummarizeSection from "./SummarizeSection";
import QuizSection from "./QuizSection";
import DoubtsSection from "./DoubtsSection";
import DynamicTutorModal from "./DynamicTutorModal"; // adjust path if needed

function BooksViewer2() {
  const backendURL = import.meta.env.VITE_BACKEND_URL;

  // Categories & Books
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [booksData, setBooksData] = useState([]);
  const [booksProgressData, setBooksProgressData] = useState([]);

  // Selection states
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [selectedSubChapter, setSelectedSubChapter] = useState(null);

  // Expand/collapse states for sidebar
  const [expandedBookName, setExpandedBookName] = useState(null);
  const [expandedChapterName, setExpandedChapterName] = useState(null);

  // Quiz states
  const [quizData, setQuizData] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  // Summaries
  const [summaryOutput, setSummaryOutput] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");

  // Doubts chat
  const [doubts, setDoubts] = useState([]);
  const [doubtInput, setDoubtInput] = useState("");

  // Dynamic Tutor modal
  const [showTutorModal, setShowTutorModal] = useState(false);

  // Use the current Firebase Auth user, or fall back
  // This ensures we pass the real UID if logged in, otherwise "testUser123"
  const userId = auth.currentUser?.uid;

  /********************************************************
   * 1) Fetch categories on mount
   ********************************************************/
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
    // eslint-disable-next-line
  }, []);

  /********************************************************
   * 2) Whenever selectedCategory changes -> fetch books & progress
   ********************************************************/
  useEffect(() => {
    if (!selectedCategory) return;
    fetchAllData();
    // eslint-disable-next-line
  }, [selectedCategory]);

  const fetchAllData = async () => {
    try {
      // 1) Get books for this category, pass userId so backend can filter if needed
      const booksRes = await axios.get(
        `${backendURL}/api/books?categoryId=${selectedCategory}&userId=${userId}`
      );
      const books = booksRes.data;

      // 2) Get user progress
      const progRes = await axios.get(
        `${backendURL}/api/user-progress?userId=${userId}`
      );
      const progressData = progRes.data;

      if (!progressData.success) {
        console.error("Failed to fetch user progress:", progressData.error);
        setBooksData(books);
      } else {
        // Merge done status
        const doneSet = new Set(
          progressData.progress
            .filter((p) => p.isDone)
            .map((p) => `${p.bookName}||${p.chapterName}||${p.subChapterName}`)
        );

        const merged = books.map((book) => {
          return {
            ...book,
            chapters: book.chapters.map((chap) => {
              const updatedSubs = chap.subChapters.map((sc) => {
                const key = `${book.bookName}||${chap.chapterName}||${sc.subChapterName}`;
                return { ...sc, isDone: doneSet.has(key) };
              });
              return { ...chap, subChapters: updatedSubs };
            }),
          };
        });
        setBooksData(merged);
      }

      // 3) Fetch aggregator data (progress with total words, etc.)
      await fetchAggregatedData();

      // Reset selections
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

  /********************************************************
   * Reset selections & quiz states
   ********************************************************/
  const resetSelections = () => {
    setSelectedBook(null);
    setSelectedChapter(null);
    setSelectedSubChapter(null);
    resetQuizState();

    setExpandedBookName(null);
    setExpandedChapterName(null);

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

  /********************************************************
   * Handlers for sidebar selections
   ********************************************************/
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const toggleBookExpansion = (bookName) => {
    setExpandedBookName((prev) => (prev === bookName ? null : bookName));
    setExpandedChapterName(null);
  };

  const toggleChapterExpansion = (chapterName) => {
    setExpandedChapterName((prev) => (prev === chapterName ? null : chapterName));
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

    // If we have selectedBook + selectedChapter, fetch the quiz
    if (selectedBook && selectedChapter && subChapter) {
      await fetchQuiz(
        selectedBook.bookName,
        selectedChapter.chapterName,
        subChapter.subChapterName
      );
    }
  };

  /********************************************************
   * Quiz logic
   ********************************************************/
  const fetchQuiz = async (bookName, chapterName, subChapterName) => {
    try {
      const url = `${backendURL}/api/quizzes?bookName=${encodeURIComponent(
        bookName
      )}&chapterName=${encodeURIComponent(
        chapterName
      )}&subChapterName=${encodeURIComponent(subChapterName)}`;
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

  /********************************************************
   * Mark subchapter done
   ********************************************************/
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

  /********************************************************
   * Summaries (mocked)
   ********************************************************/
  const handleSummarizePreset = (promptName) => {
    let mockResponse = "";
    switch (promptName) {
      case "explainLike5":
        mockResponse =
          "This is a simple explanation for a 5-year-old level. It's short and uses easy words!";
        break;
      case "bulletPoints":
        mockResponse =
          "- Point 1\n- Point 2\n- Point 3\nA quick bullet-style summary.";
        break;
      case "conciseSummary":
        mockResponse =
          "This is a very concise summary, focusing on core ideas in a short paragraph.";
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

  /********************************************************
   * Doubts chat (mock)
   ********************************************************/
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

  /********************************************************
   * Helper: get progress data for selected book
   ********************************************************/
  const getBookProgressInfo = (bookName) => {
    return booksProgressData.find((b) => b.bookName === bookName);
  };

  /********************************************************
   * Styles
   ********************************************************/
  const containerStyle = {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "row",
    background: "linear-gradient(135deg, #0F2027, #203A43, #2C5364)",
    fontFamily: "'Open Sans', sans-serif",
    color: "#fff",
  };

  const mainContentStyle = {
    flex: 1,
    padding: "20px",
    position: "relative",
  };

  const buttonStyle = {
    padding: "10px 20px",
    borderRadius: "4px",
    border: "none",
    background: "#FFD700",
    color: "#000",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "opacity 0.3s",
    marginTop: "10px",
  };

  return (
    <div style={containerStyle}>
      {/* =========== SIDEBAR =========== */}
      <BooksSidebar
        categories={categories}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        booksData={booksData}
        expandedBookName={expandedBookName}
        expandedChapterName={expandedChapterName}
        toggleBookExpansion={toggleBookExpansion}
        toggleChapterExpansion={toggleChapterExpansion}
        handleBookClick={handleBookClick}
        handleChapterClick={handleChapterClick}
        handleSubChapterClick={handleSubChapterClick}
      />

      {/* =========== MAIN CONTENT =========== */}
      <div style={mainContentStyle}>
        {selectedBook && (
          <button
            style={{
              ...buttonStyle,
              position: "absolute",
              top: "20px",
              right: "20px",
              zIndex: 10,
            }}
            onClick={() => setShowTutorModal(true)}
          >
            Learn Through Dynamic Tutor
          </button>
        )}

        {/* 1) PROGRESS SECTION */}
        {selectedBook && (
          <BookProgress
            book={selectedBook}
            getBookProgressInfo={getBookProgressInfo}
          />
        )}

        {/* If no subchapter selected, show fallback */}
        {!selectedSubChapter && (
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(6px)",
              padding: "15px",
              borderRadius: "6px",
              marginBottom: "20px",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                borderBottom: "1px solid rgba(255,255,255,0.3)",
                paddingBottom: "5px",
                marginBottom: "10px",
              }}
            >
              No Subchapter Selected
            </h2>
            <p>Please select a subchapter from the sidebar to see its content.</p>
          </div>
        )}

        {/* 2) If subchapter is selected: show content, summary, quiz, doubts */}
        {selectedSubChapter && (
          <>
            <SubchapterContent
              subChapter={selectedSubChapter}
              onToggleDone={handleToggleDone}
            />

            <SummarizeSection
              summaryOutput={summaryOutput}
              customPrompt={customPrompt}
              setCustomPrompt={setCustomPrompt}
              handleSummarizePreset={handleSummarizePreset}
              handleCustomPromptSubmit={handleCustomPromptSubmit}
            />

            <QuizSection
              quizData={quizData}
              selectedAnswers={selectedAnswers}
              quizSubmitted={quizSubmitted}
              score={score}
              handleOptionSelect={handleOptionSelect}
              handleSubmitQuiz={handleSubmitQuiz}
            />

            <DoubtsSection
              doubts={doubts}
              doubtInput={doubtInput}
              setDoubtInput={setDoubtInput}
              handleSendDoubt={handleSendDoubt}
            />
          </>
        )}

        {/* =========== Dynamic Tutor Modal =========== */}
        {showTutorModal && (
          <DynamicTutorModal
            book={selectedBook}
            chapter={selectedChapter}
            subChapter={selectedSubChapter}
            onClose={() => setShowTutorModal(false)}
          />
        )}
      </div>
    </div>
  );
}

export default BooksViewer2;