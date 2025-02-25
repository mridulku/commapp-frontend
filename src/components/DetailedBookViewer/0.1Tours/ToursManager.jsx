// src/components/DetailedBookViewer/ToursManager.jsx
import React, { useState, useEffect } from "react";
import Tour from "reactour";

function ToursManager({
  viewMode,
  selectedBook,
  selectedSubChapter,
  triggerTour,
  onTourDone,
}) {
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [steps, setSteps] = useState([]);

  // Step arrays for OVERVIEW
  const overviewSteps = [
    { selector: "#panelA", content: "Panel A in overview." },
    { selector: "#panelB", content: "Panel B in overview." },
    // ...
  ];

  // Step arrays for LIBRARY (three states)
  const libraryNoBookSteps = [
    { selector: "#libraryNoBookStart", content: "Welcome to Library (no book selected)." },
    { selector: "#libraryNoBookGrid", content: "Here’s the grid of available books." },
  ];

  const libraryBookSelectedSteps = [
    { selector: "#libraryBookSelectedTitle", content: "You have selected a book." },
    { selector: "#libraryBookOverview", content: "Check out the book details here." },
  ];

  const librarySubchapterSteps = [
    { selector: "#summarizebutton", content: "Click here to get a summary of this subchapter's content." },
    { selector: "#askdoubtbutton", content: "Have questions or doubts? Ask them here!" },
    { selector: "#dynamictutorbutton", content: "Open the dynamic tutor for interactive learning and Q&A." },
    { selector: "#fontsizebutton", content: "Adjust the font size for a comfortable reading experience." },
    { selector: "#startreadingbutton", content: "If not yet reading, click here to start reading mode." },
    { selector: "#stopreadingbutton", content: "Already reading? Use this to stop when you're done." },
    { selector: "#takequizbutton", content: "Take a quiz to test your knowledge of this subchapter." },
    { selector: "#takeanotherquizbutton", content: "You can retake or try another quiz for further practice." },
  ];

  // -------------------------------------------------------
  // 1) Main effect: build steps array & open/close the tour
  // -------------------------------------------------------
  useEffect(() => {
    let newSteps = [];

    // Decide which base steps to load
    if (viewMode === "overview") {
      newSteps = overviewSteps;
    } else if (viewMode === "library") {
      // No book selected
      if (!selectedBook) {
        newSteps = libraryNoBookSteps;

      // Book selected but NO subchapter
      } else if (selectedBook && !selectedSubChapter) {
        newSteps = libraryBookSelectedSteps;

      // Subchapter selected
      } else if (selectedSubChapter) {
        newSteps = librarySubchapterSteps;
      }
    } else {
      // e.g. if mode=adaptive or profile => skip
      newSteps = [];
    }

    // If user clicked the "?" button, filter out steps for missing DOM elements
    let finalSteps = newSteps;
    if (triggerTour) {
      finalSteps = newSteps.filter((step) => {
        const el = document.querySelector(step.selector);
        return Boolean(el);
      });
    }

    setSteps(finalSteps);

    // Open tour if we have some steps left
    if (triggerTour && finalSteps.length > 0) {
      setIsTourOpen(true);
    } else {
      setIsTourOpen(false);
    }
  }, [
    viewMode,
    selectedBook,
    selectedSubChapter,
    triggerTour,
    overviewSteps,
    libraryNoBookSteps,
    libraryBookSelectedSteps,
    librarySubchapterSteps,
  ]);

  // ------------------------------------------------------------------------
  // 2) Additional effect: force-close the tour if user changes viewMode
  // ------------------------------------------------------------------------
  // This ensures we don't keep old steps while UI transitions,
  // avoiding "roundedStep" errors if the DOM changes drastically
  useEffect(() => {
    setIsTourOpen(false);
    // If you need to reset triggerTour as well, you can do so from the parent or here:
    // onTourDone && onTourDone();
  }, [viewMode]);

  // If the user manually closes the tour:
  function handleClose() {
    setIsTourOpen(false);
    if (onTourDone) onTourDone();
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