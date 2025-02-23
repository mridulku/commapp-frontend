// MainContent.jsx

import React, { useState, useEffect } from "react";
import { contentAreaStyle } from "./styles";
import IntroStep from "./steps/IntroStep";
import ReadingStep from "./steps/ReadingStep";
import QuizStep from "./steps/QuizStep";
import BreakStep from "./steps/BreakStep";
import RevisionStep from "./steps/RevisionStep";
import SummaryStep from "./steps/SummaryStep";
import CompletionStep from "./steps/CompletionStep";

/**
 * Renders the “current item” in the main area.
 */
export default function MainContent({
  currentItem,
  currentIndex,
  userName,
  quizAnswers,
  setQuizAnswers,
  onNext,
  onPrev,
}) {
  const [displayIndex, setDisplayIndex] = useState(currentIndex);
  const [direction, setDirection] = useState("forward");

  useEffect(() => {
    if (currentIndex > displayIndex) {
      setDirection("forward");
    } else if (currentIndex < displayIndex) {
      setDirection("backward");
    }
    setDisplayIndex(currentIndex);
  }, [currentIndex, displayIndex]);

  if (!currentItem) return <div style={contentAreaStyle}>Loading...</div>;

  // A helper to handle quiz selections
  const handleQuizOption = (itemId, qIndex, optIndex) => {
    setQuizAnswers((prev) => {
      const updated = { ...(prev[itemId] || {}) };
      updated[qIndex] = optIndex;
      return { ...prev, [itemId]: updated };
    });
  };

  function renderStep() {
    switch (currentItem.type) {
      case "intro":
        return <IntroStep item={currentItem} userName={userName} onNext={onNext} onPrev={onPrev} />;
      case "reading":
        return <ReadingStep item={currentItem} onNext={onNext} onPrev={onPrev} />;
      case "quiz":
        return (
          <QuizStep
            item={currentItem}
            answers={quizAnswers[currentItem.id] || {}}
            onOptionSelect={(qIdx, optIdx) => handleQuizOption(currentItem.id, qIdx, optIdx)}
            onNext={onNext}
            onPrev={onPrev}
          />
        );
      case "break":
        return <BreakStep item={currentItem} onNext={onNext} onPrev={onPrev} />;
      case "revision":
        return <RevisionStep item={currentItem} onNext={onNext} onPrev={onPrev} />;
      case "summary":
        return <SummaryStep item={currentItem} onNext={onNext} onPrev={onPrev} />;
      case "completion":
        return <CompletionStep item={currentItem} onClose={onNext} onPrev={onPrev} />;
      default:
        return (
          <div style={contentAreaStyle}>
            <h2>Unknown Step Type: {currentItem.type}</h2>
            <button onClick={onPrev}>Back</button>
            <button onClick={onNext}>Next</button>
          </div>
        );
    }
  }

  return (
    <div
      style={{
        ...contentAreaStyle,
        transition: "transform 0.4s ease",
        transform: direction === "forward" ? "translateX(0)" : "translateX(0)",
      }}
    >
      {renderStep()}
    </div>
  );
}