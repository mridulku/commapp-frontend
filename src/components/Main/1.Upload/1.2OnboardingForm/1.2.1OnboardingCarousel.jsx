// src/components/DetailedBookViewer/OnboardingCarouselParent.jsx

import React from "react";
import TOEFLOnboardingCarousel from "./TOEFLOnboardingCarousel";
import GeneralOnboardingCarousel from "./GeneralOnboardingCarousel";

export default function OnboardingCarousel({ onFinish }) {
  // Hardcode or conditionally pick which to render
  const useTOEFL = true; // if you flip this to false => the general version

  if (useTOEFL) {
    return <TOEFLOnboardingCarousel onFinish={onFinish} />;
  } else {
    return <GeneralOnboardingCarousel onFinish={onFinish} />;
  }
}