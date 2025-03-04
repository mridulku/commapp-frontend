// src/components/HIDDIT/AdaptivePlayerModal.jsx

import React, { useState, useEffect, useRef } from "react";
import TopBar from "./TopBar";
import LeftPanel from "./LeftPanel";
import MainContent from "./MainContent";
import BottomBar from "./BottomBar";
import ChatPanel from "./ChatPanel";

// Example minimal styling
const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0,0,0,0.8)",
  zIndex: 2000,
};
const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  width: "90%",
  height: "90%",
  transform: "translate(-50%,-50%)",
  backgroundColor: "#000",
  display: "flex",
  flexDirection: "column",
  color: "#fff",
  borderRadius: "8px",
};
const mainAreaStyle = {
  flex: 1,
  display: "flex",
};
const bottomBarStyle = {
  height: "40px",
};

/**
 * AdaptivePlayerModal
 *
 * Props:
 *  - isOpen (bool)
 *  - onClose (func)
 *  - planId (string)
 *  - userId (string)
 *  - initialActivityContext (object, optional)
 *  - sessionLength (number, optional, default=45)
 *  - daysUntilExam (number, optional, default=7)
 *  - fetchUrl (string, optional, default="/api/adaptive-plan")
 */
export default function AdaptivePlayerModal({
  isOpen,
  onClose,
  planId,
  userId,
  initialActivityContext = null,
  sessionLength = 45,
  daysUntilExam = 7,
  fetchUrl = "/api/adaptive-plan",
}) {
  // 1) Timer
  const [secondsLeft, setSecondsLeft] = useState(sessionLength * 60);
  const timerRef = useRef(null);

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

  // 2) Flattened activities
  const [allActivities, setAllActivities] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [selectedActivity, setSelectedActivity] = useState(null);

  function handlePlanFlattened(flatList) {
    setAllActivities(flatList || []);
    if (flatList && flatList.length > 0) {
      setCurrentIndex(0);
    } else {
      setCurrentIndex(-1);
    }
    setSelectedActivity(null);
  }

  function handleActivitySelect(activity) {
    setSelectedActivity(activity);
    if (activity && allActivities.length) {
      const i = allActivities.findIndex(
        (a) => a.subChapterId === activity.subChapterId && a.type === activity.type
      );
      setCurrentIndex(i >= 0 ? i : -1);
    }
  }

  // Which item to show in MainContent
  const currentFlowItem =
    currentIndex >= 0 && currentIndex < allActivities.length
      ? allActivities[currentIndex]
      : null;
  const activityToShow = currentFlowItem || selectedActivity;

  // Next/Prev
  function handleNext() {
    if (currentIndex < allActivities.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setSelectedActivity(allActivities[newIndex]);
    }
  }
  function handlePrev() {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setSelectedActivity(allActivities[newIndex]);
    }
  }

  // 3) Chat
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: "system", text: "Hello! Need help?" },
  ]);
  const [newMessage, setNewMessage] = useState("");
  function handleChatSend() {
    if (!newMessage.trim()) return;
    setChatMessages((msgs) => [...msgs, { sender: "user", text: newMessage }]);
    setNewMessage("");
  }

  // 4) If not open, return null
  if (!isOpen) return null;

  // 5) Render the big overlay
  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <TopBar
          daysUntilExam={daysUntilExam}
          sessionLength={sessionLength}
          secondsLeft={secondsLeft}
          onClose={onClose}
        />

        <div style={mainAreaStyle}>
          <LeftPanel
            planId={planId}
            fetchUrl={fetchUrl}
            initialActivityContext={initialActivityContext}
            onPlanFlattened={handlePlanFlattened}
            onActivitySelect={handleActivitySelect}
          />

          <div style={{ position: "relative", flex: 1 }}>
            <MainContent
              currentItem={activityToShow}
              userId={userId}
              onRefreshData={() => console.log("Refresh data...")}
            />

            {allActivities.length > 1 && (
              <>
                <button
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "10px",
                    transform: "translateY(-50%)",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    border: "none",
                    backgroundColor: "rgba(255,255,255,0.2)",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                  onClick={handlePrev}
                  disabled={currentIndex <= 0}
                >
                  ◀
                </button>
                <button
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: "10px",
                    transform: "translateY(-50%)",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    border: "none",
                    backgroundColor: "rgba(255,255,255,0.2)",
                    color: "#fff",
                    cursor: "pointer",
                  }}
                  onClick={handleNext}
                  disabled={currentIndex >= allActivities.length - 1}
                >
                  ▶
                </button>
              </>
            )}
          </div>
        </div>

        <div style={bottomBarStyle}>
          <BottomBar
            stepPercent={allActivities.length ? (currentIndex / allActivities.length) * 100 : 0}
            currentIndex={currentIndex}
            totalSteps={allActivities.length}
          />
        </div>

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