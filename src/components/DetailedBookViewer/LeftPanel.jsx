import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentIndex } from "./redux/planSlice"; // Adjust import path as needed

export default function LeftPanel() {
  const dispatch = useDispatch();
  const { planDoc, currentIndex, status } = useSelector((state) => state.plan);

  // If planDoc not yet loaded:
  if (status !== "succeeded" || !planDoc) {
    return <div style={styles.container}>No plan loaded yet.</div>;
  }

  // Extract info from planDoc
  const { planType = "adaptive", sessions = [] } = planDoc;

  // If planType is "book", we skip day selection and show only one session
  if (planType === "book") {
    const singleSession = sessions[0] || {};
    return (
      <div style={styles.container}>
        <h3 style={styles.header}>Book Plan</h3>
        <BookPlanView
          activities={singleSession.activities || []}
          currentIndex={currentIndex}
          onSelectActivity={(flatIndex) => dispatch(setCurrentIndex(flatIndex))}
        />
      </div>
    );
  } else {
    // "adaptive" or anything else => day-based selection
    return <AdaptivePlanView sessions={sessions} currentIndex={currentIndex} />;
  }
}

/**
 * AdaptivePlanView
 * - Provides a dropdown to select which day
 * - Then displays the hierarchical expansions for that day’s activities
 */
function AdaptivePlanView({ sessions, currentIndex }) {
  const dispatch = useDispatch();
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Expand/collapse states (keys like 'book-xxx', 'ch-xxx', 'subch-xxx', etc.)
  const [expanded, setExpanded] = useState({});

  const handleExpandToggle = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // The user picks a day from the dropdown
  const handleDayChange = (e) => {
    setSelectedDayIndex(Number(e.target.value));
  };

  const currentSession = sessions[selectedDayIndex] || {};
  const { activities = [], sessionLabel } = currentSession;

  // Summaries
  const dayLabel = sessionLabel || `Day ${selectedDayIndex + 1}`;
  const totalTime = activities.reduce((acc, a) => acc + (a.timeNeeded || 0), 0);

  return (
    <div style={styles.container}>
      <div style={styles.selectRow}>
        <label style={styles.selectLabel}>Day:</label>
        <select
          style={styles.select}
          value={selectedDayIndex}
          onChange={handleDayChange}
        >
          {sessions.map((sess, idx) => (
            <option key={idx} value={idx}>
              {sess.sessionLabel ? `Day ${sess.sessionLabel}` : `Day ${idx + 1}`}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.dayHeader}>
        <h3 style={styles.header}>
          {dayLabel} (Total: {totalTime}m)
        </h3>
      </div>

      {/* Now show the hierarchical expansions: Book -> Chapter -> SubChapter -> Activities */}
      <BookPlanView
        activities={activities}
        currentIndex={currentIndex}
        onSelectActivity={(flatIndex) => dispatch(setCurrentIndex(flatIndex))}
        expanded={expanded}
        onToggleExpand={handleExpandToggle}
      />
    </div>
  );
}

/**
 * BookPlanView
 * - Group activities by book
 * - For each book => Chapter => Subchapter => Activities
 * - Expand/collapse is controlled via `expanded` and `onToggleExpand` if provided
 */
function BookPlanView({
  activities,
  currentIndex,
  onSelectActivity,
  expanded,
  onToggleExpand,
}) {
  // If expand/collapse not provided, we set up default local states
  const [localExpanded, setLocalExpanded] = useState({});
  const finalExpanded = expanded || localExpanded;
  const toggleExpand = onToggleExpand
    ? onToggleExpand
    : (key) =>
        setLocalExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  // Group by bookId
  const bookMap = new Map();
  for (const a of activities) {
    const bId = a.bookId || "_noBook";
    if (!bookMap.has(bId)) {
      bookMap.set(bId, {
        bookId: bId,
        bookName: a.bookName || bId,
        items: [],
      });
    }
    bookMap.get(bId).items.push(a);
  }

  const books = Array.from(bookMap.values());

  return (
    <div style={styles.innerContainer}>
      {books.map((bk) => {
        const bookKey = `book-${bk.bookId}`;
        const isBookOpen = !!finalExpanded[bookKey];
        const totalBookTime = bk.items.reduce((acc, x) => acc + (x.timeNeeded || 0), 0);

        return (
          <div key={bookKey} style={styles.block}>
            {/* Book header */}
            <div style={styles.blockHeader} onClick={() => toggleExpand(bookKey)}>
              <span style={styles.chevron}>{isBookOpen ? "▼" : "▶"}</span>
              <strong>{bk.bookName}</strong>
              <span style={styles.timeBadge}>{totalBookTime}m</span>
            </div>

            {isBookOpen && (
              <div style={styles.blockContent}>
                {renderChapters(bk.items, finalExpanded, toggleExpand, currentIndex, onSelectActivity)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Render the chapters
function renderChapters(activities, expanded, toggleExpand, currentIndex, onSelectActivity) {
  // Group by chapterId
  const chapterMap = new Map();
  for (const a of activities) {
    const cId = a.chapterId || "_noChap";
    if (!chapterMap.has(cId)) {
      chapterMap.set(cId, {
        chapterId: cId,
        chapterName: a.chapterName || cId,
        items: [],
      });
    }
    chapterMap.get(cId).items.push(a);
  }

  const chapters = Array.from(chapterMap.values());

  return chapters.map((ch) => {
    const chKey = `ch-${ch.chapterId}`;
    const isChOpen = !!expanded[chKey];
    const totalChTime = ch.items.reduce((acc, x) => acc + (x.timeNeeded || 0), 0);

    return (
      <div key={chKey} style={styles.subBlock}>
        <div style={styles.blockHeader} onClick={() => toggleExpand(chKey)}>
          <span style={styles.chevron}>{isChOpen ? "▼" : "▶"}</span>
          <strong>{ch.chapterName}</strong>
          <span style={styles.timeBadge}>{totalChTime}m</span>
        </div>

        {isChOpen && (
          <div style={styles.blockContent}>
            {renderSubChapters(ch.items, expanded, toggleExpand, currentIndex, onSelectActivity)}
          </div>
        )}
      </div>
    );
  });
}

// Render the subChapters
function renderSubChapters(activities, expanded, toggleExpand, currentIndex, onSelectActivity) {
  // Group by subChapterId
  const subMap = new Map();
  for (const a of activities) {
    const sId = a.subChapterId || "_noSubChap";
    if (!subMap.has(sId)) {
      subMap.set(sId, {
        subChapterId: sId,
        subChapterName: a.subChapterName || sId,
        items: [],
      });
    }
    subMap.get(sId).items.push(a);
  }

  const subs = Array.from(subMap.values());

  return subs.map((sb) => {
    const sbKey = `subch-${sb.subChapterId}`;
    const isSbOpen = !!expanded[sbKey];
    const totalSbTime = sb.items.reduce((acc, x) => acc + (x.timeNeeded || 0), 0);

    return (
      <div key={sbKey} style={styles.subBlock}>
        <div style={styles.blockHeader} onClick={() => toggleExpand(sbKey)}>
          <span style={styles.chevron}>{isSbOpen ? "▼" : "▶"}</span>
          <strong>{sb.subChapterName}</strong>
          <span style={styles.timeBadge}>{totalSbTime}m</span>
        </div>

        {isSbOpen && (
          <div style={styles.blockContent}>
            {sb.items.map((act, idx) => {
              // Check if this activity is currently selected
              const isSelected = act.flatIndex === currentIndex;

              return (
                <div
                  key={act.flatIndex ?? idx}
                  style={{
                    ...styles.activityRow,
                    backgroundColor: isSelected ? "#ffecb3" : "#fff",
                  }}
                  onClick={() =>
                    onSelectActivity && onSelectActivity(act.flatIndex)
                  }
                >
                  <span style={{ marginRight: "auto" }}>
                    {act.type}: {act.subChapterName}
                  </span>
                  <span>{act.timeNeeded || 0}m</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  });
}

//
// Styles
//
const styles = {
  container: {
    width: "100%",
    padding: 10,
    boxSizing: "border-box",
    fontSize: "0.9rem",
  },
  selectRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: 8,
  },
  selectLabel: {
    marginRight: 6,
  },
  select: {
    padding: 4,
  },
  dayHeader: {
    marginBottom: 8,
  },
  header: {
    marginTop: 0,
    marginBottom: 6,
  },

  innerContainer: {
    paddingLeft: 6,
  },

  block: {
    border: "1px solid #ccc",
    borderRadius: 4,
    marginBottom: 8,
  },
  blockHeader: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#eee",
    padding: "4px 6px",
    cursor: "pointer",
  },
  blockContent: {
    padding: 6,
    paddingLeft: 12,
  },
  subBlock: {
    marginTop: 6,
    border: "1px solid #ddd",
    borderRadius: 4,
  },
  activityRow: {
    display: "flex",
    alignItems: "center",
    marginTop: 2,
    padding: "2px 6px",
    borderRadius: 4,
    cursor: "pointer",
    border: "1px solid #eee",
  },
  chevron: {
    marginRight: 4,
  },
  timeBadge: {
    marginLeft: "auto",
    padding: "2px 4px",
    backgroundColor: "#333",
    color: "#fff",
    borderRadius: 4,
    fontSize: "0.8rem",
  },
};