import React, { useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy
} from "firebase/firestore";

/**
 * PlanUsageHistory
 * ----------------
 * Props:
 *  - db (Firebase Firestore instance)
 *  - userId (string)
 *
 * This component:
 *  1) Displays a text input for planId
 *  2) On "Fetch Usage," queries dailyTimeRecords
 *     where userId == props.userId and planId == planId
 *     ordered by dateStr ascending
 *  3) Lists each date + total usage time in a readable format (H M S).
 *
 * NOTE: We rely on the "dateStr" field being stored in Firestore docs
 *       so we can do orderBy("dateStr", "asc").
 *
 * Example doc structure in Firestore "dailyTimeRecords" collection:
 *   {
 *     userId: "...",
 *     planId: "...",
 *     dateStr: "YYYY-MM-DD",
 *     totalSeconds: number
 *   }
 */
export default function PlanUsageHistory({ db, userId }) {
  const [planId, setPlanId] = useState("");
  const [records, setRecords] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Helper: convert total seconds -> "Hh MMm SSs" or "Mm SSs" or "Ss"
  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h}h ${m.toString().padStart(2, "0")}m ${s
        .toString()
        .padStart(2, "0")}s`;
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
    setRecords([]);

    try {
      // Firestore query => dailyTimeRecords
      //   where userId == userId, planId == planId
      //   orderBy("dateStr", "asc")
      const collRef = collection(db, "dailyTimeRecords");
      const qRef = query(
        collRef,
        where("userId", "==", userId),
        where("planId", "==", planId),
        orderBy("dateStr", "asc")
      );

      const snap = await getDocs(qRef);

      const results = snap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          dateStr: data.dateStr || "NoDate",
          totalSeconds: data.totalSeconds || 0,
        };
      });

      setRecords(results);
    } catch (err) {
      console.error("Error fetching plan usage:", err);
      setError(err.message || "Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Plan Usage History</h2>

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

      {records.length > 0 && !loading && (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Total Time</th>
            </tr>
          </thead>
          <tbody>
            {records.map((rec) => (
              <tr key={rec.id}>
                <td style={styles.td}>{rec.dateStr}</td>
                <td style={styles.td}>{formatTime(rec.totalSeconds)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {records.length === 0 && !loading && !error && (
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
    maxWidth: "600px",
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
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    borderBottom: "2px solid #ccc",
    padding: "8px",
    color: "#333",
  },
  td: {
    padding: "8px",
    borderBottom: "1px solid #eee",
    color: "#333",
  },
  infoText: {
    fontSize: "0.95rem",
    color: "#333",
    marginBottom: "1rem",
  },
};