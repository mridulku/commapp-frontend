// AdaptiveSessionRoot.jsx

import React, { useState, useEffect, useRef } from "react";
import TopBar from "./TopBar";
import LeftPanel from "./LeftPanel";
import MainContent from "./MainContent";
import BottomBar from "./BottomBar";
import ChatPanel from "./ChatPanel";

// For demonstration, a no-op refreshData:
function handleRefreshData() {
  console.log("Refreshing data...");
}

// Styles (unchanged)
import {
  overlayStyle,
  modalStyle,
  mainAreaStyle,
  bottomBarStyle,
} from "./styles";

/**
 * AdaptivePlayerModal
 *
 * A modal-like component that shows:
 *   - A top bar with timer/info
 *   - A left panel that fetches the plan & displays sessions/activities
 *   - A main content area for the selected activity (READ, QUIZ, etc.)
 *   - A bottom bar for progress
 *   - An optional chat panel
 *
 * Props:
 *   - isOpen: boolean (whether to show)
 *   - onClose: function (close callback)
 *   - planId: string (the Firestore doc ID)
 *   - userId: string (optional)
 *   - initialActivityContext: { subChapterId, type } to auto-expand in LeftPanel
 *   - sessionLength: number of minutes for the session timer (default 45)
 *   - daysUntilExam: number for display (default 7)
 *   - fetchUrl: optional string route for LeftPanel to fetch from
 */
export default function AdaptivePlayerModal({
  isOpen,
  onClose,
  planId,
  userId,
  initialActivityContext = null,
  sessionLength = 45,
  daysUntilExam = 7,
  // NEW: pass a fetchUrl so LeftPanel can use it (default to "/api/adaptive-plan-total" or your choice)
  fetchUrl = "/api/adaptive-plan",
}) {
  // 1) Track the currently selected activity (READ/QUIZ/etc.)
  const [selectedActivity, setSelectedActivity] = useState(null);

  // 2) Timer logic
  const [secondsLeft, setSecondsLeft] = useState(sessionLength * 60);
  const timerRef = useRef(null);

  // 3) Chat states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: "system", text: "Hello! Need help? Just ask me here." },
  ]);
  const [newMessage, setNewMessage] = useState("");

  // Start/stop timer when the modal opens
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

  // Don’t render anything if modal is not open
  if (!isOpen) return null;

  // Close button in the top bar
  const handleClose = () => {
    if (onClose) onClose();
  };

  // Called whenever the user selects an activity from LeftPanel
  const handleActivitySelect = (index, activity) => {
    console.log("Clicked index=", index, "activity=", activity);
    setSelectedActivity(activity);
  };

  // Simple chat send
  const handleChatSend = () => {
    if (!newMessage.trim()) return;
    setChatMessages((msgs) => [...msgs, { sender: "user", text: newMessage }]);
    setNewMessage("");
  };

  // Simple stepPercent for bottom bar
  const stepPercent = selectedActivity ? 50 : 0;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* === TOP BAR === */}
        <TopBar
          daysUntilExam={daysUntilExam}
          sessionLength={sessionLength}
          secondsLeft={secondsLeft}
          onClose={handleClose}
        />

        {/* === MAIN AREA (LeftPanel + MainContent) === */}
        <div style={mainAreaStyle}>
          {/* The plan-based left panel */}
          <LeftPanel
            planId={planId}
            // If your left panel needs to fetch from a specific route:
            fetchUrl={fetchUrl} 
            backendURL={import.meta.env.VITE_BACKEND_URL}
            onActivitySelect={handleActivitySelect}
            initialActivityContext={initialActivityContext}
          />

          {/* The right side => show the currently selected activity */}
          <MainContent
            currentItem={selectedActivity}
            userId={userId}
            backendURL={import.meta.env.VITE_BACKEND_URL}
            onRefreshData={handleRefreshData}
          />
        </div>

        {/* === BOTTOM BAR === */}
        <div style={bottomBarStyle}>
          <BottomBar
            stepPercent={stepPercent}
            currentIndex={0}
            totalSteps={1}
          />
        </div>

        {/* === CHAT PANEL === */}
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