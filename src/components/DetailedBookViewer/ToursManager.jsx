// src/components/DetailedBookViewer/ToursManager.jsx
import React, { useState, useEffect } from "react";
import Tour from "reactour";

function ToursManager({ viewMode, selectedBook, triggerTour, onTourDone }) {
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [steps, setSteps] = useState([]);

  // Step arrays for each mode
  const overviewSteps = [
    { selector: "#panelA", content: "Panel A in overview." },
    { selector: "#panelB", content: "Panel B in overview." },
  ];

  const librarySteps = [
    { selector: "#libraryHomeTitle", content: "Library Title..." },
    { selector: "#libraryNoBooks", content: "No books found" },
    { selector: "#libraryHomeGrid", content: "Books grid" },
  ];

  useEffect(() => {
    // 1) Decide which steps to load for the CURRENT mode
    if (viewMode === "overview") {
      setSteps(overviewSteps);
    } else if (viewMode === "library" && !selectedBook) {
      setSteps(librarySteps);
    } else {
      setSteps([]); 
    }

    // 2) If user clicked the "?" button => open the tour if we have steps
    if (triggerTour && steps.length > 0) {
      setIsTourOpen(true);
    } else {
      setIsTourOpen(false);
    }
  }, [viewMode, selectedBook, triggerTour, steps.length]);

  // Called when the user closes the tour or it finishes
  function handleClose() {
    setIsTourOpen(false);
    if (onTourDone) onTourDone(); // let parent know we're done
  }

  return (
    <Tour
      steps={steps}
      isOpen={isTourOpen}
      onRequestClose={handleClose}
      accentColor="#0084FF"
      rounded={8}
    />
  );
}

export default ToursManager;