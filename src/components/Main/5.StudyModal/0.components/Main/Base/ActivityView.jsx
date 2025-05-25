// File: ActivityView.jsx
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentIndex } from "../../../../../../store/planSlice";

import QuizComponent from "../QuizComp/QuizComponent";
import LastAttemptPanel from "../QuizComp/QuizSupport/LastAttemptPanel";
import ReviseComponent from "../RevComp/ReviseComponent";

/**
 * ActivityView
 * ------------
 * Decides which child component (Quiz, Revision, or Success stub) to show
 * for the current stage.
 */
export default function ActivityView({
  activity,
  mode,                // "NO_QUIZ_YET" | "QUIZ_COMPLETED" | ...
  quizStage,
  examId,
  subChapterId,
  planId,
  userId,
  lastQuizAttempt,
  onQuizComplete,
  onQuizFail,
  onRevisionDone,
}) {
  const dispatch      = useDispatch();
  const currentIndex  = useSelector(s => s.plan?.currentIndex ?? 0);

  if (mode === "LOADING") {
    return (
      <div style={styles.loaderBox}>
        <span style={{ color: "#ccc" }}>Loading…</span>
      </div>
    );
  }

  /* ----------------------------------------------------------------
     Helper: renders a success / pass-screen identical to QuizView's
  ---------------------------------------------------------------- */
  function renderSuccessBox() {
    const pct = lastQuizAttempt?.score ?? "";
    return (
      <div style={styles.successBox}>
        <h3 style={{ margin: 0, marginBottom: 6 }}>
          All concepts mastered&nbsp;🎉
        </h3>

        <p style={{ margin: 0, marginBottom: 6 }}>
          Your final score: <b>{pct}</b>
        </p>

        <p style={{ color: "#4caf50", margin: 0, marginBottom: 10 }}>
          You passed the <b>{quizStage}</b> stage.
        </p>

        {/* accordion with last submission */}
        <LastAttemptPanel attempt={lastQuizAttempt} />

        <button
          style={styles.continueBtn}
          onClick={() => dispatch(setCurrentIndex(currentIndex + 1))}
        >
          Go to Next Activity
        </button>
      </div>
    );
  }

  /* ----------------------------------------------------------------
     Render branches
  ---------------------------------------------------------------- */
  return (
    <div style={styles.container}>

      {/* 1) No previous quiz – show first attempt in read-only mode */}
      {mode === "NO_QUIZ_YET" && (
        <QuizComponent
          activity={activity}
          userId={userId}
          planId={planId}
          quizStage={quizStage}
          examId={examId}
          subChapterId={subChapterId}
          attemptNumber={1}
          readOnly
          onQuizComplete={onQuizComplete}
          onQuizFail={onQuizFail}
        />
      )}

      {/* 2) Stage passed – success stub */}
      {mode === "QUIZ_COMPLETED" && renderSuccessBox()}

      {/* 3) Fail → need revision */}
      {mode === "NEED_REVISION" && lastQuizAttempt && (
        <ReviseComponent
          activity={activity}
          userId={userId}
          planId={planId}
          quizStage={quizStage}
          examId={examId}
          subChapterId={subChapterId}
          revisionNumber={lastQuizAttempt.attemptNumber}
          onRevisionDone={onRevisionDone}
        />
      )}

      {/* 4) Revision done → next quiz attempt */}
      {mode === "CAN_TAKE_NEXT_QUIZ" && lastQuizAttempt && (
        <QuizComponent
          activity={activity}
          userId={userId}
          planId={planId}
          quizStage={quizStage}
          examId={examId}
          subChapterId={subChapterId}
          attemptNumber={lastQuizAttempt.attemptNumber + 1}
          onQuizComplete={onQuizComplete}
          onQuizFail={onQuizFail}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   Inline styles identical to what QuizView already uses
------------------------------------------------------------------ */
const styles = {
  container:   { padding: 16 },
  loaderBox:   { display: "flex", justifyContent: "center", padding: 32 },
  successBox:  {
    background: "#222",
    border: "1px solid #444",
    borderRadius: 6,
    padding: "1rem",
    textAlign: "center",
    color: "#fff",
    maxWidth: 480,
    margin: "0 auto",
  },
  continueBtn: {
    marginTop: 12,
    background: "#28a745",
    border: "none",
    padding: "8px 16px",
    borderRadius: 4,
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },
};