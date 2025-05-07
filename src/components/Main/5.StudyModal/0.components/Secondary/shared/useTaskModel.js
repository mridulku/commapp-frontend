import { useMemo } from "react";

/* ---------- icon / colour map copied verbatim from PG-2 ---------- */
const STAGE_META = {
  READ:       { icon: "📖", color: "#BB86FC", label: "Read" },
  REMEMBER:   { icon: "🧠", color: "#80DEEA", label: "Remember" },
  UNDERSTAND: { icon: "🤔", color: "#FFD54F", label: "Understand" },
  APPLY:      { icon: "🔧", color: "#AED581", label: "Apply" },
  ANALYSE:    { icon: "🔬", color: "#F48FB1", label: "Analyse" },
  CUMULATIVEQUIZ:     { icon: "📊", color: "#FF7043", label: "Cumulative Quiz" },
  CUMULATIVEREVISION: { icon: "🔁", color: "#64B5F6", label: "Cumulative Rev." },
};

/* ---------- utilities ---------- */
const tsMs = (t) =>
  t?._seconds ? t._seconds * 1e3 :
  t?.seconds  ? t.seconds  * 1e3 :
  0;

function buildConceptStats(arr = []) {
  const map = new Map();
  arr.forEach((att) =>
    (att.conceptStats || []).forEach((c) => {
      if (!map.has(c.conceptName) || map.get(c.conceptName) !== "PASS") {
        map.set(c.conceptName, c.passOrFail);
      }
    }),
  );
  return map;
}

/* --------------------------------------------------------------- */
export default function useTaskModel(
  activities = [],
  subchapterStatusMap = {},
  timeMap = {},
  sessionDateISO = null,
) {
  return useMemo(
    () =>
      activities.map((act, idx) => {
        /* ---------- stage meta ---------- */
        let stageKey;
        if ((act.type || "").toLowerCase() === "read") {
          stageKey = "read";
        } else {
          stageKey = (act.quizStage || "")
            .replace(/[\s_]+/g, "")
            .toLowerCase();                                  // "cumulativequiz"
        }
        const meta =
          STAGE_META[(stageKey || "").toUpperCase()] || {
            icon: "❓",
            color: "#888",
            label: stageKey,
          };

        /* ---------- slices from aggregator ---------- */
        const subObj   = subchapterStatusMap?.[act.subChapterId];
        const stageObj = subObj?.quizStagesData?.[stageKey] ?? {};
        const statsArr = stageObj.allAttemptsConceptStats ?? [];

        /* ---------- concept mastery ---------- */
        const conceptMap   = buildConceptStats(statsArr);
        const totalConcept = conceptMap.size;
        const mastered     = [...conceptMap.values()].filter((v) => v === "PASS")
          .length;
        const quizPct = totalConcept ? Math.round((mastered / totalConcept) * 100) : 0;

        /* ---------- reading progress ---------- */
        const readSum  = subObj?.readingSummary || {};
        const readingPct = act.completed
          ? 100
          : typeof readSum.percent === "number"
          ? Math.round(readSum.percent)
          : 0;

        const pct = meta.label === "Read" ? readingPct : quizPct;

        /* ---------- attempts and buckets (quiz only) ---------- */
        let attemptsSoFar = [];
        let nextActivity  = null;
        let attBefore=[] , attToday=[] , attAfter=[];

        if (meta.label !== "Read") {
          const q = stageObj.quizAttempts ?? [];
          const r = stageObj.revisionAttempts ?? [];
          const all = [
            ...q.map((o) => ({ ...o, type: "quiz" })),
            ...r.map((o) => ({ ...o, type: "revision" })),
          ].sort((a, b) => tsMs(a.timestamp) - tsMs(b.timestamp));

          const tag = (at) =>
            `${at.type === "quiz" ? "Q" : "R"}${
              at.attemptNumber || at.revisionNumber || 1
            }`;
          attemptsSoFar = all.map(tag);

          /* next activity */
          if (pct < 100) {
            const qCnt = q.length, rCnt = r.length;
            if (qCnt === 0 && rCnt === 0)       nextActivity = "Q1";
            else if (qCnt === rCnt)             nextActivity = `Q${qCnt + 1}`;
            else if (qCnt === rCnt + 1)         nextActivity = `R${qCnt}`;
          }

          /* bucket by date */
          if (sessionDateISO) {
            all.forEach((at) => {
              const dISO = new Date(tsMs(at.timestamp)).toISOString().slice(0,10);
              const lb   = tag(at);
              if      (dISO <  sessionDateISO) attBefore.push(lb);
              else if (dISO === sessionDateISO) attToday .push(lb);
              else                               attAfter .push(lb);
            });
          }
        }

        /* ---------- status + loading flag ---------- */
        const hasAggregatorData =
          meta.label === "Read"
            ? true                                       // we rely on planDoc
            : !!subObj && timeMap[act.activityId] != null;

        let status;
        if (!hasAggregatorData)   status = "loading";
        else if (pct === 100)     status = "completed";
        else if (pct > 0)         status = "partial";
        else                      status = "notstarted";

        return {
          /* navigation */
          flatIndex: act.flatIndex ?? idx,
          id: act.activityId,

          /* flags */
          meta,
          status,                      // now includes "loading"
          locked:   (act.aggregatorStatus || "").toLowerCase() === "locked",
          deferred: !!act.deferred,

          /* labels */
          subch:   act.subChapterName || act.subChapterId,
          book:    act.bookName       || "—",
          chapter: act.chapterName    || "—",

          /* timing */
          spentMin: Math.round((timeMap[act.activityId] || 0) / 60),
          expMin:   act.timeNeeded || 0,

          /* progress + concepts */
          pct,
          mastered,
          total: totalConcept,
          conceptList: [...conceptMap.entries()].map(([name, res]) => ({
            name,
            ok: res === "PASS",
          })),

          /* attempts */
          attemptsSoFar,
          nextActivity,
          attBefore,
          attToday,
          attAfter,
        };
      }),
    [activities, subchapterStatusMap, timeMap, sessionDateISO]
  );
}