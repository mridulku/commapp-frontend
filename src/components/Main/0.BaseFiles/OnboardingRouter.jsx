import React from "react";
import PlanFetcher   from "../../Main/5.StudyModal/StudyModal";
import ProblemPicker from "./ProblemPicker";

/**
 * props
 * ─ onboardingType  = "plan" | "pain"
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
            // TODO: persist pains[] then maybe open a next step later
            onClose();          // close the modal for now
          }}
        />
      );

    case "plan":
    default:
      return (
        <PlanFetcher
          {...baseProps}
          planId={baseProps.planId}      /* used only in plan flow */
          fetchUrl="/api/adaptive-plan"
          onClose={onClose}
        />
      );
  }
}