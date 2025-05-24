import { useMemo } from "react";

/* ------------------------------------------------------------------ */
/*  1.  CONSTANTS — per-stage icons / colours / labels                 */
/* ------------------------------------------------------------------ */
const STAGE_META = {
  READ:       { icon: "📖", color: "#BB86FC", label: "Read" },
  REMEMBER:   { icon: "🧠", color: "#80DEEA", label: "Remember" },
  UNDERSTAND: { icon: "🤔", color: "#FFD54F", label: "Understand" },
  APPLY:      { icon: "🔧", color: "#AED581", label: "Apply" },
  ANALYSE:    { icon: "🔬", color: "#F48FB1", label: "Analyse" },
  CUMULATIVEQUIZ:     { icon: "📊", color: "#FF7043", label: "Cumulative Quiz" },
  CUMULATIVEREVISION: { icon: "🔁", color: "#64B5F6", label: "Cumulative Rev." },
};

/* ------------------------------------------------------------------ */
/*  2.  SMALL HELPERS                                                  */
/* ------------------------------------------------------------------ */
const tsMs = (t) =>
  t?._seconds ? t._seconds * 1e3 :
  t?.seconds  ? t.seconds  * 1e3 :
  0;

/* merge concept stats from all attempts – keep first PASS            */
function buildConceptStats(arr = []) {
  const map = new Map();
  arr.forEach((att) =>
    (att.conceptStats || []).forEach((c) => {
      if (!map.has(c.conceptName) || map.get(c.conceptName) !== "PASS") {
        map.set(c.conceptName, c.passOrFail);
      }
    })
  );
  return map;
}

/* ------------------------------------------------------------------ */
/*  3.  HOOK  –  useTaskModel                                          */
/* ------------------------------------------------------------------ */
export default function useTaskModel(
  activities          = [],     // raw session.activities
  subchapterStatusMap = {},     // aggregator slice
  timeMap             = {},     // activityId => seconds
  sessionDateISO      = null    // e.g. "2024-05-24"
) {
  return useMemo(
    () =>
      activities.map((act, idx) => {
        /* 3-A.  STAGE META & FLAGS ----------------------------------- */
        let stageKey =
          (act.type || "").toLowerCase() === "read"
            ? "read"
            : (act.quizStage || "").replace(/[\s_]+/g, "").toLowerCase();

        const meta = STAGE_META[stageKey.toUpperCase()] ?? {
          icon: "❓", color: "#888", label: stageKey,
        };

        const isCum =
          stageKey === "cumulativequiz" || stageKey === "cumulativerevision";

        /* --- LOCKED?  (via aggregator.taskInfo) --------------------- */
        let lockedFlag = false;
        if (!isCum) {
          const tiArr = subchapterStatusMap?.[act.subChapterId]?.taskInfo || [];
          const needLabel = stageKey === "read" ? "Reading" : meta.label;
          const hit = tiArr.find(
            (t) => (t.stageLabel || "").toLowerCase() === needLabel.toLowerCase()
          );
          lockedFlag = hit?.locked === true;
        }

        /* 3-B.  AGGREGATOR SLICES ------------------------------------ */
        let subObj   = null;
        let stageObj = {};
        let statsArr = [];

        if (!isCum) {
          subObj   = subchapterStatusMap?.[act.subChapterId];
          stageObj = subObj?.quizStagesData?.[stageKey] ?? {};
          statsArr = stageObj.allAttemptsConceptStats ?? [];
        }

        /* 3-C.  CONCEPT MASTERY & PROGRESS --------------------------- */
        const conceptMap   = isCum ? new Map() : buildConceptStats(statsArr);
        const totalConcept = conceptMap.size;
        const mastered     = [...conceptMap.values()].filter((v) => v === "PASS").length;
        const quizPct      = totalConcept ? Math.round((mastered / totalConcept) * 100) : 0;

        const readPct = (() => {
          if (act.completed) return 100;
          const v = subObj?.readingSummary?.percent;
          return typeof v === "number" ? Math.round(v) : 0;
        })();

        const pct =
          meta.label === "Read"
            ? readPct
            : isCum
            ? act.completed ? 100 : 0
            : quizPct;

        /* 3-D.  ATTEMPTS / NEXT-TASK / DATE BUCKETS ------------------ */
        const spentMin = Math.round((timeMap[act.activityId] || 0) / 60);

        let attemptsSoFar = [];
        let nextActivity  = null;
        let attBefore = [], attToday = [], attAfter = [];

        if (!isCum && meta.label !== "Read") {
          const quizzes   = stageObj.quizAttempts     ?? [];
          const revisions = stageObj.revisionAttempts ?? [];
          const all = [
            ...quizzes  .map((o) => ({ ...o, type: "quiz"     })),
            ...revisions.map((o) => ({ ...o, type: "revision" })),
          ].sort((a, b) => tsMs(a.timestamp) - tsMs(b.timestamp));

          const tag = (o) =>
            `${o.type === "quiz" ? "Q" : "R"}${o.attemptNumber || o.revisionNumber || 1}`;
          attemptsSoFar = all.map(tag);

          if (pct < 100) {
            const qCnt = quizzes.length, rCnt = revisions.length;
            if (qCnt === 0 && rCnt === 0) nextActivity = "Q1";
            else if (qCnt === rCnt)       nextActivity = `Q${qCnt + 1}`;
            else if (qCnt === rCnt + 1)   nextActivity = `R${qCnt}`;
          }

          if (sessionDateISO) {
            all.forEach((o) => {
              const dISO = new Date(tsMs(o.timestamp)).toISOString().slice(0, 10);
              const lb   = tag(o);
              if (dISO <  sessionDateISO) attBefore.push(lb);
              if (dISO === sessionDateISO) attToday .push(lb);
              if (dISO >  sessionDateISO) attAfter .push(lb);
            });
          }
        }

        /* 3-E.  STATUS CLASSIFICATION (single source of truth) ------- */
          /* ---------- overall status ---------- */
  const hasAgg =
    isCum
      ? true                                 // cumulative tasks need no aggregator
      : meta.label === "Read"
      ? true                                 // reading needs only readingSummary
      : !!subObj && timeMap[act.activityId] !== undefined;

  let status;
  if (!hasAgg)          status = "loading";   // waiting for aggregator/time
  else if (lockedFlag)  status = "locked";    // RED  ← highest priority
  else if (pct === 100) status = "completed"; // GREEN
  else                  status = "active";    // YELLOW – every unlocked, incomplete stage

        /* 3-F.  RETURN RENDER-READY OBJECT --------------------------- */
        return {
          /* navigation */
          flatIndex: act.flatIndex ?? idx,
          id       : act.activityId,

          /* flags */
          meta,
          status,                // "loading" | "completed" | "active" | "notstarted"
          isCumulative : isCum,
          locked       : lockedFlag,
          deferred     : !!act.deferred,

          /* labels */
          subch  : act.subChapterName || act.subChapterId,
          book   : act.bookName       || "—",
          chapter: act.chapterName    || "—",

          /* timing */
          spentMin,
          expMin  : act.timeNeeded || (isCum ? 5 : 0),

          /* progress & concepts */
          pct,
          mastered,
          total      : totalConcept,
          conceptList: [...conceptMap.entries()].map(([name, res]) => ({
            name, ok: res === "PASS",
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