/********************************************
 * BookProgress.jsx
 ********************************************/
import React from "react";

function BookProgress({ book, getBookProgressInfo }) {
  const panelStyle = {
    backgroundColor: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(6px)",
    padding: "15px",
    borderRadius: "6px",
    marginBottom: "20px",
  };

  const sectionTitleStyle = {
    marginTop: 0,
    borderBottom: "1px solid rgba(255,255,255,0.3)",
    paddingBottom: "5px",
    marginBottom: "10px",
  };

  const progressBarContainerStyle = {
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: "6px",
    overflow: "hidden",
    height: "10px",
    marginTop: "8px",
  };

  const progressBarFillStyle = (pct) => ({
    width: `${pct}%`,
    height: "100%",
    background: "#FFD700",
    transition: "width 0.3s",
  });

  if (!book) return null;

  const bp = getBookProgressInfo(book.bookName);
  if (!bp) return null;

  const pct = bp.percentageCompleted.toFixed(2);

  return (
    <div style={panelStyle}>
      <h2 style={sectionTitleStyle}>Progress</h2>
      <p style={{ margin: "4px 0" }}>
        <strong>Book:</strong> {book.bookName}
      </p>
      <p style={{ margin: "4px 0" }}>
        <strong>Total Words:</strong> {bp.totalWords}
      </p>
      <p style={{ margin: "4px 0" }}>
        <strong>Words Read:</strong> {bp.totalWordsRead}
      </p>
      <p style={{ margin: "4px 0" }}>
        <strong>Progress:</strong> {pct}%
      </p>
      <div style={progressBarContainerStyle}>
        <div style={progressBarFillStyle(bp.percentageCompleted)} />
      </div>
    </div>
  );
}

export default BookProgress;