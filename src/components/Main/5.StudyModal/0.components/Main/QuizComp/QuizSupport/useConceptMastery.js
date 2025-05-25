// hooks/useConceptMastery.js
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAggregatorForSubchapter } from "../../../../../../../store/aggregatorSlice";

export default function useConceptMastery(subChapterId, quizStage) {
  const dispatch = useDispatch();

  // ❶ Grab cached slice (may be undefined on first mount)
  const sub = useSelector(
    s => s.aggregator.subchapterMap[subChapterId]
  );

  // ❷ If missing, lazy-load just once
  useEffect(() => {
    if (subChapterId && !sub) {
      dispatch(fetchAggregatorForSubchapter({ subChapterId }));
    }
  }, [subChapterId, sub, dispatch]);

  // ❸ Derive PASS / FAIL / NOT_TESTED
  if (!sub) return { loading: true };

  const stageObj   = sub.quizStagesData?.[quizStage] ?? {};
  const allStats   = stageObj.allAttemptsConceptStats ?? [];

  const statusMap  = new Map();
  const conceptSet = new Set();
  allStats.forEach(att =>
    (att.conceptStats || []).forEach(c => {
      conceptSet.add(c.conceptName);
      if (!statusMap.has(c.conceptName)) statusMap.set(c.conceptName, "NOT_TESTED");
      if (c.passOrFail === "PASS") statusMap.set(c.conceptName, "PASS");
      else if (c.passOrFail === "FAIL" && statusMap.get(c.conceptName) !== "PASS") {
        statusMap.set(c.conceptName, "FAIL");
      }
    })
  );

  const mastered     = [...statusMap.values()].filter(v => v === "PASS").length;
  const inProgress   = [...statusMap.values()].filter(v => v === "FAIL").length;
  const notTested    = conceptSet.size - mastered - inProgress;
  const conceptArray = [...conceptSet].map(c => ({
    conceptName: c,
    status: statusMap.get(c) || "NOT_TESTED",
  }));

  return {
    loading      : false,
    masteredCount: mastered,
    inProgressCount: inProgress,
    notTestedCount : notTested,
    conceptStatuses: conceptArray,
  };
}