

// src/components/LandingPage.jsx

import React from "react";

// Import both landing pages
import TOEFLLandingPage from "./LandingPages/TOEFLLandingPage";
import GenericLandingPage from "./LandingPages/GenericLandingPage";

export default function LandingPage() {
  // HARDCODE WHICH COMPONENT YOU WANT:
  const useTOEFL = true; // set this to false if you want the generic landing

  if (useTOEFL) {
    return <TOEFLLandingPage />;
  } else {
    return <GenericLandingPage />;
  }
}