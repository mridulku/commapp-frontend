/********************************************
 * BookProgress.jsx (Stacked Bars + Colored Subchapter Label)
 ********************************************/
import React from "react";

/**
 * Renders a single stacked bar that shows:
 * - Proficient portion (blue)
 * - Read-but-not-proficient portion (green)
 * - Unread portion (gray)
 */
function CombinedProgressBar({
  label,
  readOrProficientWords,
  proficientWords,
  totalWords,
}) {
  // Avoid divide-by-zero
  const total = totalWords || 0;
  const rp = readOrProficientWords || 0;
  const prof = proficientWords || 0;

  // Ensure we don't exceed total
  const proficientSegment = Math.min(prof, total);
  const readOnlySegment = Math.min(rp - prof, total - prof); // read portion excluding proficient
  const unreadSegment = Math.max(total - rp, 0);

  // Convert to percentages
  const profPct = total > 0 ? (proficientSegment / total) * 100 : 0;
  const readPct = total > 0 ? (readOnlySegment / total) * 100 : 0;
  const unreadPct = total > 0 ? (unreadSegment / total) * 100 : 0;

  // A simple container style for the stacked bar
  const containerStyle = {
    display: "flex",
    width: "100%",
    height: "10px",
    borderRadius: "6px",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.3)",
    marginBottom: "8px",
  };

  // Each segment gets a flex-basis based on the fraction
  const proficientStyle = {
    width: `${profPct}%`,
    backgroundColor: "blue",
    transition: "width 0.3s",
  };

  const readStyle = {
    width: `${readPct}%`,
    backgroundColor: "green",
    transition: "width 0.3s",
  };

  const unreadStyle = {
    width: `${unreadPct}%`,
    backgroundColor: "gray",
    transition: "width 0.3s",
  };

  // We'll also show text for “Read: X% Proficient: Y%”
  const readPercent = total > 0 ? (rp / total) * 100 : 0;
  const profPercent = total > 0 ? (prof / total) * 100 : 0;

  return (
    <div style={{ marginBottom: "12px" }}>
      {/* The textual label */}
      <p style={{ margin: "4px 0" }}>
        <strong>{label}: </strong>
        {`Read: ${readPercent.toFixed(2)}%, Proficient: ${profPercent.toFixed(2)}%`}
      </p>
      {/* The stacked bar */}
      <div style={containerStyle}>
        <div style={proficientStyle} />
        <div style={readStyle} />
        <div style={unreadStyle} />
      </div>
    </div>
  );
}

function BookProgress({
  book,
  selectedChapter,
  selectedSubChapter,
  getBookProgressInfo,
}) {
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

  if (!book) return null;

  // 1) Aggregator for entire book
  const bp = getBookProgressInfo(book.bookName);
  if (!bp) return null; // no aggregator found

  // 2) Attempt to find aggregator for the selected chapter
  let cp = null;
  if (selectedChapter && bp.chapters) {
    cp = bp.chapters.find((c) => c.chapterName === selectedChapter.chapterName);
  }

  // 3) If we haven't found cp, but we do have a subchapter selected, auto-detect
  if (!cp && selectedSubChapter && bp.chapters) {
    for (const chapterAgg of bp.chapters) {
      const foundSub = chapterAgg.subChapters.find(
        (sub) => sub.subChapterName === selectedSubChapter.subChapterName
      );
      if (foundSub) {
        cp = chapterAgg;
        break;
      }
    }
  }

  // 4) Determine subchapter proficiency => show just "Proficiency:" in color
  let subChapterLabel = "";
  let subChapterColor = "red";
  if (selectedSubChapter) {
    if (selectedSubChapter.proficiency === "proficient") {
      subChapterLabel = "Read and Proficient";
      subChapterColor = "blue";
    } else if (selectedSubChapter.proficiency === "read") {
      subChapterLabel = "Just Read";
      subChapterColor = "green";
    } else {
      subChapterLabel = "Not Read";
      subChapterColor = "red";
    }
  }

  return (
    <div style={panelStyle}>
      <h2 style={sectionTitleStyle}>Progress</h2>

      {/* ===== Book-Level Combined Bar ===== */}
      <h3 style={{ marginTop: "0.5rem" }}>Book: {book.bookName}</h3>
      <CombinedProgressBar
        label="Combined Progress"
        readOrProficientWords={bp.totalWordsReadOrProficient}
        proficientWords={bp.totalWordsProficient}
        totalWords={bp.totalWords}
      />

      {/* ===== Chapter-Level Combined Bar (if found) ===== */}
      {cp && (
        <>
          <h3 style={{ marginTop: "1.5rem" }}>Chapter: {cp.chapterName}</h3>
          <CombinedProgressBar
            label="Combined Progress"
            readOrProficientWords={cp.totalWordsReadOrProficient}
            proficientWords={cp.totalWordsProficient}
            totalWords={cp.totalWords}
          />
        </>
      )}

      {/* ===== Subchapter-Level Proficiency ===== */}
      {selectedSubChapter && (
        <div style={{ marginTop: "1rem" }}>
          <strong>Proficiency:</strong>{" "}
          <span style={{ color: subChapterColor }}>{subChapterLabel}</span>
        </div>
      )}
    </div>
  );
}

export default BookProgress;