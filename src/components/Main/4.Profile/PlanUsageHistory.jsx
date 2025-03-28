import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy
} from "firebase/firestore";

/**
 * PlanUsageHistory
 * ----------------
 * Enhanced UI:
 *   1) We load dailyRecords + subActivities as before.
 *   2) We gather subChapterId -> subChapterName from "subchapters_demo".
 *   3) We show a SELECT for all dateStrs from dailyRecords.
 *   4) On pick => show that date's usage:
 *       - dailyRecords => find that date's daily usage
 *       - subActivities => filter lumps with matching dateStr
 *         -> separate them into reading, quiz, revision
 *         -> show subChapterName for each (via subChapterMap)
 */
export default function PlanUsageHistory({ db, userId }) {
  const [planId, setPlanId] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [dailyRecords, setDailyRecords] = useState([]);
  const [subActivities, setSubActivities] = useState([]);

  // subChapterMap: { subChapterId: subChapterName or "Untitled" }
  const [subChapterMap, setSubChapterMap] = useState({});

  // Selected date from the dropdown
  const [selectedDate, setSelectedDate] = useState("");

  // Helper to format totalSeconds => e.g. "1h 05m 30s"
  function formatTime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) {
      return `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
    } else if (m > 0) {
      return `${m}m ${s.toString().padStart(2, "0")}s`;
    } else {
      return `${s}s`;
    }
  }

  async function handleFetch() {
    if (!planId || !userId) {
      setError("Please provide both userId and planId.");
      return;
    }
    setError(null);
    setLoading(true);

    // Clear old data
    setDailyRecords([]);
    setSubActivities([]);
    setSubChapterMap({});
    setSelectedDate("");

    try {
      // 1) dailyTimeRecords => day-level usage
      const dailyColl = collection(db, "dailyTimeRecords");
      const dailyQ = query(
        dailyColl,
        where("userId", "==", userId),
        where("planId", "==", planId),
        orderBy("dateStr", "asc")
      );
      const dailySnap = await getDocs(dailyQ);
      const dailyRes = dailySnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          dateStr: data.dateStr || "NoDate",
          totalSeconds: data.totalSeconds || 0,
        };
      });
      setDailyRecords(dailyRes);

      // 2) readingSubActivity => lumps for reading
      const readColl = collection(db, "readingSubActivity");
      const readQ = query(
        readColl,
        where("userId", "==", userId),
        where("planId", "==", planId),
        orderBy("dateStr", "asc")
      );
      const readingSnap = await getDocs(readQ);
      const readingRes = readingSnap.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          docId: docSnap.id,
          type: "Reading",
          dateStr: d.dateStr || "UnknownDate",
          subChapterId: d.subChapterId || "",
          quizStage: "",
          attemptNumber: null,
          totalSeconds: d.totalSeconds || 0,
        };
      });

      // 3) quizTimeSubActivity => lumps for quiz
      const quizColl = collection(db, "quizTimeSubActivity");
      const quizQ = query(
        quizColl,
        where("userId", "==", userId),
        where("planId", "==", planId),
        orderBy("dateStr", "asc")
      );
      const quizSnap = await getDocs(quizQ);
      const quizRes = quizSnap.docs.map((docSnap) => {
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

      // 4) reviseTimeSubActivity => lumps for revision
      const revColl = collection(db, "reviseTimeSubActivity");
      const revQ = query(
        revColl,
        where("userId", "==", userId),
        where("planId", "==", planId),
        orderBy("dateStr", "asc")
      );
      const revSnap = await getDocs(revQ);
      const revRes = revSnap.docs.map((docSnap) => {
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

      // Merge reading + quiz + revise lumps
      let combined = [ ...readingRes, ...quizRes, ...revRes ];

      // Sort sub-activities by dateStr
      combined.sort((a, b) => (a.dateStr || "").localeCompare(b.dateStr || ""));

      setSubActivities(combined);

      // Now gather all subChapterIds
      const uniqueSubChIds = new Set(combined.map((item) => item.subChapterId).filter(Boolean));
      // fetch each from "subchapters_demo"
      const chMap = {};
      for (let scId of uniqueSubChIds) {
        // scId might be "", skip
        if (!scId) continue;
        const scRef = doc(db, "subchapters_demo", scId);
        const scSnap = await getDoc(scRef);
        if (scSnap.exists()) {
          const sdata = scSnap.data();
          chMap[scId] = sdata?.title || sdata?.name || ("SubCh " + scId);
        } else {
          chMap[scId] = "Unknown SubCh";
        }
      }
      setSubChapterMap(chMap);

      // If there's at least one daily record => pick the earliest date by default
      if (dailyRes.length > 0) {
        setSelectedDate(dailyRes[0].dateStr);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error fetching usage data:", err);
      setError(err.message || "Failed to fetch data.");
      setLoading(false);
    }
  }

  // Filter dailyRecords => find this selected date's record
  const chosenDailyRecord = dailyRecords.find((dr) => dr.dateStr === selectedDate) || null;

  // For subActivities => filter only items matching selectedDate
  const todaysSubActs = subActivities.filter((act) => act.dateStr === selectedDate);

  // Then separate them => reading, quiz, revision
  const readingActs = todaysSubActs.filter((a) => a.type === "Reading");
  const quizActs = todaysSubActs.filter((a) => a.type === "Quiz");
  const revisionActs = todaysSubActs.filter((a) => a.type === "Revision");

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Plan Usage History (Refined by Date)</h2>

      <div style={styles.inputRow}>
        <label style={styles.label}>Plan ID:</label>
        <input
          type="text"
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
          style={styles.textInput}
          placeholder="Enter plan ID"
        />
        <button onClick={handleFetch} style={styles.btn}>
          Fetch Usage
        </button>
      </div>

      {loading && <p style={styles.infoText}>Loading...</p>}
      {error && <p style={{ ...styles.infoText, color: "red" }}>{error}</p>}

      {dailyRecords.length > 0 && !loading && (
        <>
          {/* Date Selector */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ marginRight: "8px", color: "#333" }}>
              Select Date:
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={styles.selectDropdown}
            >
              {dailyRecords.map((dr) => (
                <option key={dr.id} value={dr.dateStr}>
                  {dr.dateStr}
                </option>
              ))}
            </select>
          </div>

          {/* Overall daily usage for that date */}
          {chosenDailyRecord && (
            <div style={styles.dailyCard}>
              <h3 style={styles.sectionTitle}>
                {chosenDailyRecord.dateStr} – Overall Usage
              </h3>
              <p style={{ margin: "0.5rem 0", fontWeight: "bold", color: "#111" }}>
                Total: {formatTime(chosenDailyRecord.totalSeconds)}
              </p>
            </div>
          )}

          {/* Reading Section */}
          {readingActs.length > 0 && (
            <div style={styles.activitySection}>
              <h4 style={styles.activityTitle}>Reading Activities</h4>
              {readingActs.map((ra) => (
                <div key={ra.docId} style={styles.activityCard}>
                  <p style={styles.activityLabel}>
                    <strong>Sub-chapter:</strong> {subChapterMap[ra.subChapterId] || ra.subChapterId}
                  </p>
                  <p style={styles.activityLabel}>
                    <strong>Time:</strong> {formatTime(ra.totalSeconds)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Quiz Section */}
          {quizActs.length > 0 && (
            <div style={styles.activitySection}>
              <h4 style={styles.activityTitle}>Quiz Attempts</h4>
              {quizActs.map((qa) => (
                <div key={qa.docId} style={styles.activityCard}>
                  <p style={styles.activityLabel}>
                    <strong>Sub-chapter:</strong> {subChapterMap[qa.subChapterId] || qa.subChapterId}
                  </p>
                  <p style={styles.activityLabel}>
                    <strong>Stage:</strong> {qa.quizStage}
                  </p>
                  <p style={styles.activityLabel}>
                    <strong>Attempt #:</strong> {qa.attemptNumber || "—"}
                  </p>
                  <p style={styles.activityLabel}>
                    <strong>Time:</strong> {formatTime(qa.totalSeconds)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Revision Section */}
          {revisionActs.length > 0 && (
            <div style={styles.activitySection}>
              <h4 style={styles.activityTitle}>Revision Attempts</h4>
              {revisionActs.map((rv) => (
                <div key={rv.docId} style={styles.activityCard}>
                  <p style={styles.activityLabel}>
                    <strong>Sub-chapter:</strong> {subChapterMap[rv.subChapterId] || rv.subChapterId}
                  </p>
                  <p style={styles.activityLabel}>
                    <strong>Stage:</strong> {rv.quizStage}
                  </p>
                  <p style={styles.activityLabel}>
                    <strong>Revision #:</strong> {rv.attemptNumber || "—"}
                  </p>
                  <p style={styles.activityLabel}>
                    <strong>Time:</strong> {formatTime(rv.totalSeconds)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* If no lumps for that date => show a message */}
          {readingActs.length === 0 && quizActs.length === 0 && revisionActs.length === 0 && (
            <p style={styles.infoText}>No sub-activities for {selectedDate}.</p>
          )}
        </>
      )}

      {/* If no data at all */}
      {!loading && !error && dailyRecords.length === 0 && subActivities.length === 0 && (
        <p style={styles.infoText}>No records found for this plan.</p>
      )}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: "#fff",
    padding: "16px",
    borderRadius: "6px",
    maxWidth: "900px",
    margin: "40px auto",
    fontFamily: "'Roboto', sans-serif",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  },
  title: {
    marginTop: 0,
    marginBottom: "1rem",
    color: "#333",
    textAlign: "center",
  },
  sectionTitle: {
    margin: "0.5rem 0",
    color: "#333",
    fontSize: "1.05rem",
    fontWeight: 600,
    borderBottom: "1px solid #ccc",
    paddingBottom: "0.3rem",
  },
  inputRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "1rem",
  },
  label: {
    color: "#333",
    fontSize: "1rem",
    fontWeight: 500,
  },
  textInput: {
    flex: 1,
    padding: "6px 8px",
    fontSize: "1rem",
    border: "1px solid #ccc",
    borderRadius: "4px",
    color: "#333",
  },
  btn: {
    padding: "8px 14px",
    fontSize: "1rem",
    backgroundColor: "#4FC3F7",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  },
  infoText: {
    fontSize: "0.95rem",
    color: "#333",
    marginBottom: "1rem",
  },
  selectDropdown: {
    padding: "6px 8px",
    fontSize: "1rem",
    borderRadius: "4px",
    border: "1px solid #ccc",
    color: "#333",
  },
  dailyCard: {
    backgroundColor: "#fafafa",
    border: "1px solid #ddd",
    padding: "1rem",
    borderRadius: "6px",
    marginBottom: "1rem",
  },
  activitySection: {
    marginBottom: "1.5rem",
  },
  activityTitle: {
    fontSize: "1rem",
    margin: "0.5rem 0",
    color: "#444",
    fontWeight: 600,
    borderBottom: "1px solid #ccc",
    paddingBottom: "0.3rem",
  },
  activityCard: {
    backgroundColor: "#fdfdfd",
    border: "1px solid #eee",
    padding: "0.5rem 1rem",
    borderRadius: "4px",
    margin: "0.5rem 0",
  },
  activityLabel: {
    margin: "4px 0",
    fontSize: "0.9rem",
    color: "#444",
  },
};