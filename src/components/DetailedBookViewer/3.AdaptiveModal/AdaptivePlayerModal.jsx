// AdaptiveSessionRoot.jsx

import React, { useState, useEffect, useRef } from "react";
import TopBar from "./TopBar";
import LeftPanel from "./LeftPanel";   // The new self-fetching LeftPanel
import MainContent from "./MainContent";
import BottomBar from "./BottomBar";
import ChatPanel from "./ChatPanel";

// For demonstration, a no-op refreshData:
function handleRefreshData() {
  console.log("Refreshing data...");
  // You could call an API or do setState as needed
}

// Example styles (unchanged)
import {
  overlayStyle,
  modalStyle,
  mainAreaStyle,
  bottomBarStyle,
} from "./styles";

/**
 * AdaptiveSessionRoot
 * 
 * (Exported as AdaptivePlayerModal)
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
 *   - planId: string (the Firestore doc ID to fetch from 'adaptive_demo')
 *   - userName, sessionLength, daysUntilExam, etc.
 */
export default function AdaptivePlayerModal({
  isOpen,
  onClose,
  planId,
  userId,
  sessionLength = 45,
  daysUntilExam = 7,
}) {
  // 1) We don’t store a big "sessionItems" array. Instead,
  //    the LeftPanel fetches the plan (by planId).
  //    We just track the "selectedActivity" from that plan.
  const [selectedActivity, setSelectedActivity] = useState(null);

  // 2) Timer logic (for the top bar countdown)
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

  // If not open, return nothing
  if (!isOpen) return null;

  // A local handleClose for the top bar “X” button
  const handleClose = () => {
    if (onClose) onClose();
  };

  // 4) The user clicked an activity in the left panel
  //    We store it in selectedActivity, so MainContent can render it
  const handleActivitySelect = (index, activity) => {
    console.log("Clicked index=", index, "activity=", activity);
    setSelectedActivity(activity);
  };

  // 5) Chat sending (just a small chat state)
  const handleChatSend = () => {
    if (!newMessage.trim()) return;
    setChatMessages((msgs) => [...msgs, { sender: "user", text: newMessage }]);
    setNewMessage("");
  };

  // 6) stepPercent = for bottom bar (placeholder logic)
  const stepPercent = selectedActivity ? 50 : 0;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        {/* TOP BAR */}
        <TopBar
          daysUntilExam={daysUntilExam}
          sessionLength={sessionLength}
          secondsLeft={secondsLeft}
          onClose={handleClose}
        />

        {/* MAIN AREA => LeftPanel + MainContent */}
        <div style={mainAreaStyle}>
          {/* The plan-based left panel */}
          <LeftPanel
            planId={planId}          // the doc ID for your plan
            onActivitySelect={handleActivitySelect}
            backendURL={import.meta.env.VITE_BACKEND_URL} // or another default
          />

          {/* The right side => show the currently selected activity */}
          <MainContent
            currentItem={selectedActivity}
            userId={userId}
            backendURL={import.meta.env.VITE_BACKEND_URL}
            onRefreshData={handleRefreshData}
            // If you had quizAnswers, etc., pass them here
          />
        </div>

        {/* BOTTOM BAR */}
        <div style={bottomBarStyle}>
          <BottomBar
            stepPercent={stepPercent}
            currentIndex={0}
            totalSteps={1}
          />
        </div>

        {/* CHAT PANEL */}
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