// src/components/LandingPage.jsx

import React from "react";
import { useSelector } from "react-redux";

// Import both landing pages
import TOEFLLandingPage from "./LandingPages/TOEFLLandingPage";
import GenericLandingPage from "./LandingPages/GenericLandingPage";

export default function LandingPage() {
  // read examType from Redux
  const examType = useSelector((state) => state.exam.examType);
  // e.g. examType might be "TOEFL" or "GENERAL" or "IELTS" or anything

  if (examType === "TOEFL") {
    return <TOEFLLandingPage />;
  } else {
    return <GenericLandingPage />;
  }
}