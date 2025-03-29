import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs
} from "firebase/firestore";

import RawView from "./RawView";
import TimelineView from "./TimelineView";
import PlanView from "./PlanView";  // <-- We'll pass readingStats to this

/**
 * buildReadingStats
 * -----------------
 * Creates a map: readingStats[subChapterId] = {
 *   totalTimeSpentMinutes: number,
 *   completionDate: Date | null,
 * }
 *
 * 'readActsArr' = array from readingSubActivity
 * 'readCompArr' = array from reading_demo
 */
function buildReadingStats(readActsArr, readCompArr) {
  const stats = {};

  // 1) Summation of time lumps (readingSubActivity)
  //    Each item => { subChapterId, totalSeconds }
  for (const ra of readActsArr) {
    const subId = ra.subChapterId;
    if (!subId) continue;

    if (!stats[subId]) {
      stats[subId] = { totalTimeSpentMinutes: 0, completionDate: null };
    }
    // Convert seconds => minutes
    stats[subId].totalTimeSpentMinutes += (ra.totalSeconds || 0) / 60;
  }

  // 2) The latest readingEndTime from reading_demo
  //    Each item => { subChapterId, readingEndTime }
  for (const rc of readCompArr) {
    const subId = rc.subChapterId;
    if (!subId) continue;

    if (rc.readingEndTime && typeof rc.readingEndTime.toDate === "function") {
      const endDate = rc.readingEndTime.toDate();

      if (!stats[subId]) {
        stats[subId] = { totalTimeSpentMinutes: 0, completionDate: endDate };
      } else {
        const existingDate = stats[subId].completionDate;
        // If none yet or this is a later date, store it
        if (!existingDate || endDate > existingDate) {
          stats[subId].completionDate = endDate;
        }
      }
    }
  }

  return stats;
}

/**
 * PlanUsageHistory
 * ----------------
 * A parent component with 3 tabs:
 *   1) RAW (time lumps + completions),
 *   2) TIMELINE (chronological listing),
 *   3) PLAN => now passes readingStats + planData to PlanView
 *
 * Props:
 *   - db: Firestore instance
 *   - userId
 *   - planId
 *   - planData (the plan doc fetched in Child2)
 *   - colorScheme
 */
export default function PlanUsageHistory({
  db,
  userId,
  planId,
  planData = null,    // from Child2
  colorScheme = {},
}) {
  // State: for loading / errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // We'll show usage data by "date"
  const [dateOptions, setDateOptions] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");

  // Time-lump arrays
  const [dailyRecords, setDailyRecords] = useState([]);
  const [readingActs, setReadingActs] = useState([]);    // from readingSubActivity
  const [quizActs, setQuizActs] = useState([]);          // from quizTimeSubActivity
  const [revisionActs, setRevisionActs] = useState([]);  // from reviseTimeSubActivity

  // Completion arrays
  const [readingCompletions, setReadingCompletions] = useState([]);
  const [quizCompletions, setQuizCompletions] = useState([]);
  const [revisionCompletions, setRevisionCompletions] = useState([]);

  // We'll build readingStats => subChapterId => { totalTimeSpentMinutes, completionDate }
  const [readingStats, setReadingStats] = useState({});

  // Tab: "RAW", "TIMELINE", "PLAN"
  const [activeTab, setActiveTab] = useState("RAW");

  // ------------------------------------
  // Convert Firestore timestamp => "YYYY-MM-DD" for date-based usage grouping
  // ------------------------------------
  function toDateStr(timestamp) {
    if (!timestamp || !timestamp.seconds) return "UnknownDate";
    const dateObj = new Date(timestamp.seconds * 1000);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // ------------------------------------
  // On mount / whenever planId changes => fetch lumps + completions
  // ------------------------------------
  useEffect(() => {
    if (!db || !planId || !userId) {
      return;
    }

    setLoading(true);
    setError(null);

    // Clear old data
    setDailyRecords([]);
    setReadingActs([]);
    setQuizActs([]);
    setRevisionActs([]);
    setReadingCompletions([]);
    setQuizCompletions([]);
    setRevisionCompletions([]);
    setReadingStats({});
    setDateOptions([]);
    setSelectedDate("");

    async function fetchAllData() {
      try {
        // 1) dailyTimeRecords
        const dailyQ = query(
          collection(db, "dailyTimeRecords"),
          where("userId", "==", userId),
          where("planId", "==", planId),
          orderBy("dateStr", "asc")
        );
        const dailySnap = await getDocs(dailyQ);
        const dailyArr = dailySnap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            dateStr: d.dateStr || "UnknownDate",
            totalSeconds: d.totalSeconds || 0,
          };
        });
        setDailyRecords(dailyArr);

        // 2) readingSubActivity => lumps for reading
        const readSubQ = query(
          collection(db, "readingSubActivity"),
          where("userId", "==", userId),
          where("planId", "==", planId),
          orderBy("dateStr", "asc")
        );
        const readSubSnap = await getDocs(readSubQ);
        const readActsArr = readSubSnap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            docId: docSnap.id,
            type: "Reading",
            dateStr: d.dateStr || "UnknownDate",
            subChapterId: d.subChapterId || "",
            totalSeconds: d.totalSeconds || 0,
          };
        });
        setReadingActs(readActsArr);

        // 3) quizTimeSubActivity => lumps for quiz
        const quizSubQ = query(
          collection(db, "quizTimeSubActivity"),
          where("userId", "==", userId),
          where("planId", "==", planId),
          orderBy("dateStr", "asc")
        );
        const quizSubSnap = await getDocs(quizSubQ);
        const quizActsArr = quizSubSnap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            docId: docSnap.id,
            type: "Quiz",
            dateStr: d.dateStr || "UnknownDate",
            subChapterId: d.subChapterId || "",
            quizStage: d.quizStage || "",
            attemptNumber: d.attemptNumber || null,
            totalSeconds: d.totalSeconds || 0,
          };
        });
        setQuizActs(quizActsArr);

        // 4) reviseTimeSubActivity => lumps for revision
        const revSubQ = query(
          collection(db, "reviseTimeSubActivity"),
          where("userId", "==", userId),
          where("planId", "==", planId),
          orderBy("dateStr", "asc")
        );
        const revSubSnap = await getDocs(revSubQ);
        const revActsArr = revSubSnap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            docId: docSnap.id,
            type: "Revision",
            dateStr: d.dateStr || "UnknownDate",
            subChapterId: d.subChapterId || "",
            quizStage: d.quizStage || "",
            attemptNumber: d.revisionNumber || null,
            totalSeconds: d.totalSeconds || 0,
          };
        });
        setRevisionActs(revActsArr);

        // ======= COMPLETIONS =======
        // 5) reading_demo => reading completions
        const readDemoQ = query(
          collection(db, "reading_demo"),
          where("userId", "==", userId),
          where("planId", "==", planId),
          orderBy("timestamp", "asc")
        );
        const readDemoSnap = await getDocs(readDemoQ);
        const readCompArr = readDemoSnap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            docId: docSnap.id,
            dateStr: toDateStr(d.timestamp),
            timestamp: d.timestamp || null,
            subChapterId: d.subChapterId || "",
            readingStartTime: d.readingStartTime || null,
            readingEndTime: d.readingEndTime || null,
            productReadingPerformance: d.productReadingPerformance || "",
          };
        });
        setReadingCompletions(readCompArr);

        // 6) quizzes_demo => quiz completions
        const quizDemoQ = query(
          collection(db, "quizzes_demo"),
          where("userId", "==", userId),
          where("planId", "==", planId),
          orderBy("timestamp", "asc")
        );
        const quizDemoSnap = await getDocs(quizDemoQ);
        const quizCompArr = quizDemoSnap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            docId: docSnap.id,
            dateStr: toDateStr(d.timestamp),
            timestamp: d.timestamp || null,
            subChapterId: d.subchapterId || "",
            quizType: d.quizType || "",
            attemptNumber: d.attemptNumber || 1,
            score: d.score || "",
            quizSubmission: d.quizSubmission || [],
          };
        });
        setQuizCompletions(quizCompArr);

        // 7) revisions_demo => revision completions
        const revDemoQ = query(
          collection(db, "revisions_demo"),
          where("userId", "==", userId),
          where("planId", "==", planId),
          orderBy("timestamp", "asc")
        );
        const revDemoSnap = await getDocs(revDemoQ);
        const revCompArr = revDemoSnap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            docId: docSnap.id,
            dateStr: toDateStr(d.timestamp),
            timestamp: d.timestamp || null,
            subChapterId: d.subchapterId || "",
            revisionNumber: d.revisionNumber || null,
            revisionType: d.revisionType || "",
          };
        });
        setRevisionCompletions(revCompArr);

        // --------------------------------------------------
        // unify all possible dateStr => for the day dropdown
        // --------------------------------------------------
        const dateSet = new Set();
        dailyArr.forEach((r) => dateSet.add(r.dateStr));
        readActsArr.forEach((r) => dateSet.add(r.dateStr));
        quizActsArr.forEach((r) => dateSet.add(r.dateStr));
        revActsArr.forEach((r) => dateSet.add(r.dateStr));
        readCompArr.forEach((r) => dateSet.add(r.dateStr));
        quizCompArr.forEach((r) => dateSet.add(r.dateStr));
        revCompArr.forEach((r) => dateSet.add(r.dateStr));

        const finalDates = Array.from(dateSet).sort();
        setDateOptions(finalDates);
        if (finalDates.length > 0) {
          setSelectedDate(finalDates[0]);
        }

        // --------------------------------------------------
        // Build "readingStats" => subChapterId => { timeSpent, completionDate }
        // --------------------------------------------------
        const builtStats = buildReadingStats(readActsArr, readCompArr);
        setReadingStats(builtStats);

      } catch (err) {
        console.error("Error fetching usage data:", err);
        setError(err.message || "Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    }

    fetchAllData();
  }, [db, planId, userId]);

  // --------------------------------------------------
  // Filter lumps & completions by selectedDate
  // --------------------------------------------------
  const chosenDailyRecord = dailyRecords.find((dr) => dr.dateStr === selectedDate) || null;

  const readingActsForDate = readingActs.filter((ra) => ra.dateStr === selectedDate);
  const quizActsForDate   = quizActs.filter((qa) => qa.dateStr === selectedDate);
  const revisionActsForDate = revisionActs.filter((rv) => rv.dateStr === selectedDate);

  const readingCompletionsForDate = readingCompletions.filter((rc) => rc.dateStr === selectedDate);
  const quizCompletionsForDate    = quizCompletions.filter((qc) => qc.dateStr === selectedDate);
  const revisionCompletionsForDate = revisionCompletions.filter((rvc) => rvc.dateStr === selectedDate);

  // --------------------------------------------------
  // Build TIMELINE events
  // --------------------------------------------------
  function buildTimelineEvents() {
    const events = [];

    function toJsDateObj(ts) {
      if (!ts || !ts.seconds) return null;
      return new Date(ts.seconds * 1000);
    }

    // Reading completions
    for (let rc of readingCompletionsForDate) {
      const d = toJsDateObj(rc.timestamp);
      if (d) {
        events.push({
          type: "Reading",
          docId: rc.docId,
          subChapterId: rc.subChapterId,
          eventTime: d,
          detail: `Started reading subchapter ${rc.subChapterId}`,
        });
      }
    }
    // Quiz completions
    for (let qc of quizCompletionsForDate) {
      const d = toJsDateObj(qc.timestamp);
      if (d) {
        events.push({
          type: "Quiz",
          docId: qc.docId,
          subChapterId: qc.subChapterId,
          eventTime: d,
          detail: `Quiz #${qc.attemptNumber}, score=${qc.score}`,
        });
      }
    }
    // Revision completions
    for (let rvc of revisionCompletionsForDate) {
      const d = toJsDateObj(rvc.timestamp);
      if (d) {
        events.push({
          type: "Revision",
          docId: rvc.docId,
          subChapterId: rvc.subChapterId,
          eventTime: d,
          detail: `Revision #${rvc.revisionNumber}, type=${rvc.revisionType}`,
        });
      }
    }

    // Sort by eventTime ascending
    events.sort((a, b) => a.eventTime - b.eventTime);
    return events;
  }

  const timelineEvents = buildTimelineEvents();

  // --------------------------------------------------
  // Rendering
  // --------------------------------------------------
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Plan Usage History</h2>

      {!planId || !userId ? (
        <p style={{ color: "red" }}>No valid userId or planId provided.</p>
      ) : null}

      {loading && <p style={styles.infoText}>Loading...</p>}
      {error && <p style={{ ...styles.infoText, color: "red" }}>{error}</p>}

      {!loading && !error && dateOptions.length === 0 && planId && userId && (
        <p style={styles.infoText}>No records found for this plan.</p>
      )}

      {/* If we do have date options, show the dropdown */}
      {dateOptions.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ marginRight: "8px" }}>Select Date:</label>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={styles.selectDropdown}
          >
            {dateOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 3-tab row */}
      <div style={styles.tabRow}>
        <div
          style={tabStyle(activeTab === "RAW")}
          onClick={() => setActiveTab("RAW")}
        >
          Raw View
        </div>
        <div
          style={tabStyle(activeTab === "TIMELINE")}
          onClick={() => setActiveTab("TIMELINE")}
        >
          Timeline View
        </div>
        <div
          style={tabStyle(activeTab === "PLAN")}
          onClick={() => setActiveTab("PLAN")}
        >
          Plan View
        </div>
      </div>

      {/* If no data for this date => show a small message (only for RAW/TIMELINE) */}
      {activeTab !== "PLAN" && selectedDate &&
        readingActsForDate.length === 0 &&
        quizActsForDate.length === 0 &&
        revisionActsForDate.length === 0 &&
        readingCompletionsForDate.length === 0 &&
        quizCompletionsForDate.length === 0 &&
        revisionCompletionsForDate.length === 0 && (
          <p style={styles.infoText}>
            No activities/completions found for {selectedDate}.
          </p>
        )
      }

      {/* Render child components */}
      {activeTab === "RAW" && (
        <RawView
          selectedDate={selectedDate}
          dailyRecord={chosenDailyRecord}
          readingActsForDate={readingActsForDate}
          quizActsForDate={quizActsForDate}
          revisionActsForDate={revisionActsForDate}
          readingCompletionsForDate={readingCompletionsForDate}
          quizCompletionsForDate={quizCompletionsForDate}
          revisionCompletionsForDate={revisionCompletionsForDate}
        />
      )}

      {activeTab === "TIMELINE" && (
        <TimelineView
          selectedDate={selectedDate}
          timelineEvents={timelineEvents}
        />
      )}

      {activeTab === "PLAN" && (
        // Now we also pass readingStats so PlanView can display
        <PlanView
          planId={planId}
          userId={userId}
          plan={planData}
          readingStats={readingStats}
          colorScheme={colorScheme}
        />
      )}
    </div>
  );

  function tabStyle(isActive) {
    return {
      padding: "0.5rem 1rem",
      cursor: "pointer",
      border: "1px solid #ccc",
      borderBottom: isActive ? "none" : "1px solid #ccc",
      borderRadius: "6px 6px 0 0",
      marginRight: "5px",
      backgroundColor: isActive ? "#eee" : "#f9f9f9",
    };
  }
}

// Styles
const styles = {
  container: {
    padding: "16px",
    borderRadius: "6px",
    maxWidth: "900px",
    margin: "40px auto",
    fontFamily: "'Roboto', sans-serif",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
    backgroundColor: "#fff",
    color: "#000"
  },
  title: {
    marginTop: 0,
    marginBottom: "1rem",
    textAlign: "center",
  },
  infoText: {
    fontSize: "0.95rem",
    marginBottom: "1rem",
  },
  selectDropdown: {
    padding: "6px 8px",
    fontSize: "1rem",
    borderRadius: "4px",
    border: "1px solid #ccc",
  },
  tabRow: {
    display: "flex",
    marginBottom: "1rem",
  },
};