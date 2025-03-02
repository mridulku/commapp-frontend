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
 * --------------------
 * A modal-like component that:
 *   - Renders a TopBar (timer)
 *   - A LeftPanel (which fetches & flattens the plan, calls onPlanFlattened)
 *   - A MainContent (displays a selected activity)
 *   - Next/Prev arrows for linear flow
 *   - A BottomBar and optional ChatPanel
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
  // ------------------- (1) Timer (no conditions) -------------------
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

  // ------------------- (2) Flattened activities array -------------------
  // We'll get this from LeftPanel's "onPlanFlattened" callback
  const [allActivities, setAllActivities] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  // We also track the last item the user clicked in the left panel
  const [selectedActivity, setSelectedActivity] = useState(null);

  // Called by LeftPanel once it has fetched + flattened the plan
  function handlePlanFlattened(flatList) {
    console.log("[AdaptivePlayerModal] handlePlanFlattened =>", flatList);
    setAllActivities(flatList || []);
    if (flatList && flatList.length > 0) {
      setCurrentIndex(0);
    } else {
      setCurrentIndex(-1);
    }
    setSelectedActivity(null);
  }

  // Called by LeftPanel whenever user clicks an activity
  function handleActivitySelect(activity) {
    console.log("[AdaptivePlayerModal] handleActivitySelect =>", activity);
    setSelectedActivity(activity);
    // Optionally sync with allActivities
    if (activity && allActivities.length) {
      const i = allActivities.findIndex(
        (a) => a.subChapterId === activity.subChapterId && a.type === activity.type
      );
      if (i >= 0) {
        setCurrentIndex(i);
      } else {
        console.warn("Activity not found in allActivities array!");
        setCurrentIndex(-1);
      }
    }
  }

  // Decide which item to show in the main area
  const currentFlowItem =
    currentIndex >= 0 && currentIndex < allActivities.length
      ? allActivities[currentIndex]
      : null;
  const activityToShow = currentFlowItem || selectedActivity;

  // ------------------- (3) Next/Prev logic -------------------
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

  // ------------------- (4) Chat logic -------------------
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: "system", text: "Hello! Need help? Just ask me here." },
  ]);
  const [newMessage, setNewMessage] = useState("");

  function handleChatSend() {
    if (!newMessage.trim()) return;
    setChatMessages((msgs) => [...msgs, { sender: "user", text: newMessage }]);
    setNewMessage("");
  }

  // Step for bottom bar
  const stepPercent = activityToShow ? 50 : 0;

  // Close callback
  function handleClose() {
    if (onClose) onClose();
  }

  // ------------------- (5) If not open, skip rendering  -------------------
  // (All hooks are already called unconditionally above, so it's safe)
  if (!isOpen) {
    return null;
  }

  // ------------------- (6) Render UI -------------------
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

        {/* === MAIN AREA === */}
        <div style={mainAreaStyle}>
          {/* LEFT PANEL => fetches plan, flattens, calls handlePlanFlattened */}
          <LeftPanel
            planId={planId}
            fetchUrl={fetchUrl}
            backendURL={import.meta.env.VITE_BACKEND_URL}
            initialActivityContext={initialActivityContext}
            onActivitySelect={handleActivitySelect}
            onPlanFlattened={handlePlanFlattened}
          />

          {/* RIGHT SIDE => show the selected/flow item */}
          <div style={{ position: "relative", flex: 1 }}>
            <MainContent
              currentItem={activityToShow}
              userId={userId}
              backendURL={import.meta.env.VITE_BACKEND_URL}
              onRefreshData={handleRefreshData}
            />

            {/* Next/Prev arrows */}
            {allActivities.length > 1 && (
              <>
                {/* LEFT ARROW */}
                <button
                  style={{
                    ...arrowButtonStyle,
                    left: "10px",
                  }}
                  onClick={handlePrev}
                  disabled={currentIndex <= 0}
                >
                  ◀
                </button>

                {/* RIGHT ARROW */}
                <button
                  style={{
                    ...arrowButtonStyle,
                    right: "10px",
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

        {/* === BOTTOM BAR === */}
        <div style={bottomBarStyle}>
          <BottomBar stepPercent={stepPercent} currentIndex={0} totalSteps={1} />
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

// ---------- Style for arrow buttons ----------
const arrowButtonStyle = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  zIndex: 10,
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  border: "none",
  backgroundColor: "rgba(255,255,255,0.2)",
  color: "#fff",
  fontSize: "1.2rem",
  cursor: "pointer",
  transition: "background-color 0.3s",
};