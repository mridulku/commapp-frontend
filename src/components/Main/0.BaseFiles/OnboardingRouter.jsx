import React from "react";
import PlanFetcher        from "../../Main/5.StudyModal/StudyModal";
import ProblemPicker      from "./ProblemPicker";      // new flow A
import ToolSelectorModal  from "./ToolSelectorModal";  // new flow B

/**
 * props
 * ─ onboardingType  = "plan" | "pain" | "toolkit"
 * ─ baseProps       = shared props (userId, examType …)
 * ─ onClose()       = parent callback
 */
export default function OnboardingRouter({
  onboardingType = "plan",
  onClose,
  ...baseProps
}) {
  switch (onboardingType) {
    case "pain":
      return (
        <ProblemPicker
          {...baseProps}
          onContinue={(pains) => {
            // save pains, then maybe open toolkit selector …
            onClose();             // close for now
          }}
        />
      );

    case "toolkit":
      return (
        <ToolSelectorModal
          open={true}
          {...baseProps}
          onClose={() => onClose()}
        />
      );

    case "plan":
    default:
      return (
        <PlanFetcher
          {...baseProps}
          planId={baseProps.planId}   /* required for legacy flow */
          fetchUrl="/api/adaptive-plan"
          onClose={onClose}
        />
      );
  }
}