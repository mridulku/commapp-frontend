// src/components/DetailedBookViewer/PanelExam.jsx
import React from "react";

/**
 * PanelExam
 * ----------
 * A lightweight “generic‑but‑exam‑aware” panel.
 * • Shows ALL the learner’s books (no tile‑limit like PanelGeneral).
 * • Uses the same plansData structure that PanelC already prepares.
 */
export default function PanelExam({
  books = [],
  plansData = {},
  handleStartLearning,
  examType = "GENERIC",
}) {
  return (
    <div style={styles.wrapper}>
      <h2 style={{ marginBottom: 12 }}>{examType} Courses</h2>

      {books.length === 0 && (
        <p style={{ opacity: 0.7 }}>No books found for this exam.</p>
      )}

      <div style={styles.grid}>
        {books.map((bk) => {
          const p = plansData[bk.id] || {};
          const percent = p.aggregatorProgress?.toFixed(1) ?? "0.0";

          return (
            <div key={bk.id} style={styles.card}>
              <h3 style={styles.title}>{bk.name}</h3>

              <div style={styles.progressBarOuter}>
                <div
                  style={{
                    ...styles.progressBarFill,
                    width: `${percent}%`,
                  }}
                />
              </div>
              <p style={styles.percent}>{percent}% complete</p>

              {p.hasPlan && (
                <button
                  style={styles.btn}
                  onClick={() => handleStartLearning(bk.id)}
                >
                  Start Learning
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    padding: 16,
    background: "rgba(255,255,255,0.1)",
    borderRadius: 8,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
    gap: 20,
  },
  card: {
    background: "rgba(255,255,255,0.2)",
    borderRadius: 6,
    padding: 14,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
  },
  title: { margin: "0 0 8px 0", fontSize: "1rem" },
  progressBarOuter: {
    width: "100%",
    height: 8,
    background: "rgba(255,255,255,0.3)",
    borderRadius: 4,
  },
  progressBarFill: {
    height: "100%",
    background: "#B39DDB",
    borderRadius: 4,
    transition: "width .3s",
  },
  percent: { margin: "6px 0 10px 0", fontSize: ".8rem", opacity: 0.8 },
  btn: {
    background: "#B39DDB",
    border: "none",
    borderRadius: 4,
    padding: "8px 14px",
    fontWeight: "bold",
    cursor: "pointer",
    color: "#000",
  },
};