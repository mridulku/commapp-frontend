// AdaptiveSessionRoot.jsx

import React, { useState, useEffect, useRef } from "react";
import TopBar from "./TopBar";
import LeftPanel from "./LeftPanel";
import MainContent from "./MainContent";
import BottomBar from "./BottomBar";
import ChatPanel from "./ChatPanel";

import {
  overlayStyle,
  modalStyle,
  mainAreaStyle,
  bottomBarStyle,
} from "./styles";

export default function AdaptiveSessionRoot({
  isOpen,
  onClose,
  userName = "John Doe",
  sessionLength = 45,
  daysUntilExam = 7,
}) {
  // 1) “sessionItems” can come from your DB (adaptive_demo) or an API call.
  //    For now, we do a mock array. Eventually, you'll do:
  //    useEffect(() => { fetchPlanFromDB().then(plan => setSessionItems(plan.items))}, [])
  const [sessionItems, setSessionItems] = useState([
    {
      id: "intro",
      label: "Welcome & Overview",
      type: "intro",
      estimatedTime: 3,
    },
    {
      id: "reading1",
      label: "Reading: Subchapter 1",
      type: "reading",
      estimatedTime: 10,
      subChapterId: "sc_101", // later used to fetch text from your DB
    },
    {
      id: "quiz1",
      label: "Quiz: Quick Check #1",
      type: "quiz",
      estimatedTime: 5,
      quizQuestions: [
        {
          question: "What is the main idea of subchapter 1?",
          options: ["It’s about advanced topics", "It’s about traveling to Mars", "It's filler text", "No idea"],
          correctIndex: 0,
        },
      ],
    },
    {
      id: "break1",
      label: "Break Time!",
      type: "break",
      estimatedTime: 5,
    },
    {
      id: "reading2",
      label: "Reading: Subchapter 2",
      type: "reading",
      estimatedTime: 12,
      subChapterId: "sc_102",
    },
    {
      id: "revision1",
      label: "Revision / Flashcards",
      type: "revision",
      estimatedTime: 5,
      revisionOf: ["reading1"],
    },
    {
      id: "quiz2",
      label: "Quiz: Check #2",
      type: "quiz",
      estimatedTime: 7,
      quizQuestions: [
        {
          question: "Which statement is correct about subchapter 2?",
          options: ["It's short", "It’s about AI", "It references prior topics", "No clue yet"],
          correctIndex: 2,
        },
      ],
    },
    {
      id: "summary",
      label: "Session Summary",
      type: "summary",
      estimatedTime: 3,
    },
    {
      id: "done",
      label: "Completion",
      type: "completion",
      estimatedTime: 0,
    },
  ]);

  // 2) Track the current step index
  const [currentIndex, setCurrentIndex] = useState(0);

  // 3) Timer logic
  const [secondsLeft, setSecondsLeft] = useState(sessionLength * 60);
  const timerRef = useRef(null);

  // 4) Chat states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: "system", text: "Hello! Need help? Just ask me here." },
  ]);
  const [newMessage, setNewMessage] = useState("");

  // 5) Quiz answers stored in an object
  const [quizAnswers, setQuizAnswers] = useState({});

  // Start/stop timer when isOpen changes
  useEffect(() => {
    if (isOpen) {
      setSecondsLeft(sessionLength * 60);
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, sessionLength]);

  // If not open, no UI
  if (!isOpen) return null;

  // Current item
  const currentItem = sessionItems[currentIndex];

  // Step-based progress
  const stepPercent = Math.round(((currentIndex + 1) / sessionItems.length) * 100);

  const handleClose = () => {
    if (onClose) onClose();
  };

  // Navigation
  const goNext = () => {
    if (currentIndex < sessionItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleClose();
    }
  };
  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Chat sending
  const handleChatSend = () => {
    if (!newMessage.trim()) return;
    setChatMessages((msgs) => [...msgs, { sender: "user", text: newMessage }]);
    setNewMessage("");
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* 1) TOP BAR */}
        <TopBar
          daysUntilExam={daysUntilExam}
          sessionLength={sessionLength}
          secondsLeft={secondsLeft}
          onClose={handleClose}
        />

        {/* 2) MAIN AREA */}
        <div style={mainAreaStyle}>
          <LeftPanel
            items={sessionItems}
            currentIndex={currentIndex}
            setCurrentIndex={setCurrentIndex}
          />

          <MainContent
            currentItem={currentItem}
            currentIndex={currentIndex}
            userName={userName}
            quizAnswers={quizAnswers}
            setQuizAnswers={setQuizAnswers}
            onNext={goNext}
            onPrev={goPrev}
          />
        </div>

        {/* 3) BOTTOM BAR */}
        <div style={bottomBarStyle}>
          <BottomBar
            stepPercent={stepPercent}
            currentIndex={currentIndex}
            totalSteps={sessionItems.length}
          />
        </div>

        {/* 4) CHAT */}
        <ChatPanel
          open={chatOpen}
          onToggle={() => setChatOpen((o) => !o)}
          messages={chatMessages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          onSend={handleChatSend}
        />
      </div>
    </div>
  );
}