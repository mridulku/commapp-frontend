// src/components/DetailedBookViewer/LeftPanel.jsx

import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentIndex } from "./redux/planSlice";

/**
 * LeftPanel
 * ---------
 * - Single chain expansion
 * - Manual toggles for day/book/ch/subch
 * - Auto sync: if currentIndex changes (via next/prev or initialActivityContext),
 *   it expands the chain to that item.
 *
 * If your Redux code already sets currentIndex to the correct item based on
 * initialActivityContext, this panel will highlight and expand the correct item.
 */
export default function LeftPanel() {
  const dispatch = useDispatch();
  const { planDoc, flattenedActivities, currentIndex, status } = useSelector(
    (state) => state.plan
  );

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Expanded stores the “open” keys:
  // E.g. { "day-2": true, "book-b123": true, "ch-c456": true, "subch-s789": true }
  const [expanded, setExpanded] = useState({});

  // If we haven't finished loading or there's no plan yet
  if (status !== "succeeded" || !planDoc) {
    return <div style={styles.container}>No plan loaded yet.</div>;
  }

  const { planType = "adaptive", sessions = [] } = planDoc;

  // ------------------------------------------------------------------------
  // 1) Whenever currentIndex changes => auto-expand the chain for that item
  // ------------------------------------------------------------------------
  useEffect(() => {
    if (!flattenedActivities?.length) return;
    if (currentIndex < 0 || currentIndex >= flattenedActivities.length) return;

    // The currently selected activity
    const currentItem = flattenedActivities[currentIndex];
    const { dayIndex, bookId, chapterId, subChapterId } = currentItem || {};

    // If planType is "adaptive", auto-switch day selection
    if (planType !== "book") {
      setSelectedDayIndex(dayIndex || 0);
    }

    // Build the chain keys for this item
    const newExpanded = buildChain(dayIndex, bookId, chapterId, subChapterId);
    setExpanded(newExpanded);

  }, [currentIndex, flattenedActivities, planType]);

  // ------------------------------------------------------------------------
  // 2) handleDayChange => user changed day => reset expansions to that day
  // ------------------------------------------------------------------------
  function handleDayChange(e) {
    setSelectedDayIndex(Number(e.target.value));
    // We collapse everything except that day:
    const dayKey = `day-${e.target.value}`;
    setExpanded({ [dayKey]: true });
  }

  // ------------------------------------------------------------------------
  // 3) handleToggleExpand => user manually toggles a node
  // ------------------------------------------------------------------------
  function handleToggleExpand(key, allActivities) {
    const isOpen = expanded[key] === true;
    if (isOpen) {
      // close it (and child expansions)
      const nextExpanded = { ...expanded };
      collapseNodeAndChildren(key, nextExpanded, allActivities);
      setExpanded(nextExpanded);
    } else {
      // open it while preserving the chain for that node
      const nextExpanded = {};

      // Always keep the day open
      const dayKey = `day-${selectedDayIndex}`;
      nextExpanded[dayKey] = true;

      // Then handle the exact node that was clicked
      if (key.startsWith("book-")) {
        nextExpanded[key] = true;
      } else if (key.startsWith("ch-")) {
        nextExpanded[dayKey] = true;
        nextExpanded[key] = true;
        const parentBookKey = findParentBookKey(key, allActivities);
        if (parentBookKey) {
          nextExpanded[parentBookKey] = true;
        }
      } else if (key.startsWith("subch-")) {
        nextExpanded[dayKey] = true;
        nextExpanded[key] = true;
        const { parentBookKey, parentChapterKey } = findParentBookChKey(key, allActivities);
        if (parentBookKey) nextExpanded[parentBookKey] = true;
        if (parentChapterKey) nextExpanded[parentChapterKey] = true;
      }

      setExpanded(nextExpanded);
    }
  }

  // If planType="book", skip day selection
  if (planType === "book") {
    const singleSession = sessions[0] || {};
    return (
      <div style={styles.container}>
        <h3>Book Plan</h3>
        <BookPlanView
          activities={singleSession.activities || []}
          currentIndex={currentIndex}
          onSelectActivity={(flatIndex) => dispatch(setCurrentIndex(flatIndex))}
          expanded={expanded}
          onToggleExpand={handleToggleExpand}
        />
      </div>
    );
  }

  // If "adaptive"
  const currentSession = sessions[selectedDayIndex] || {};
  const { activities = [], sessionLabel } = currentSession;
  const totalTime = activities.reduce((acc, a) => acc + (a.timeNeeded || 0), 0);

  return (
    <div style={styles.container}>
      {/* Day selection */}
      <div style={styles.selectRow}>
        <label style={styles.selectLabel}>Day:</label>
        <select style={styles.select} value={selectedDayIndex} onChange={handleDayChange}>
          {sessions.map((sess, idx) => (
            <option key={idx} value={idx}>
              {sess.sessionLabel ? `Day ${sess.sessionLabel}` : `Day ${idx + 1}`}
            </option>
          ))}
        </select>
      </div>

      <h3 style={styles.header}>
        Day {sessionLabel || selectedDayIndex + 1} ({totalTime}m)
      </h3>

      <BookPlanView
        activities={activities}
        currentIndex={currentIndex}
        onSelectActivity={(flatIndex) => dispatch(setCurrentIndex(flatIndex))}
        expanded={expanded}
        onToggleExpand={handleToggleExpand}
      />
    </div>
  );
}

/**
 * BookPlanView => group by book => chapters => subchapters => activities
 */
function BookPlanView({
  activities,
  currentIndex,
  onSelectActivity,
  expanded,
  onToggleExpand,
}) {
  // Group by book
  const bookMap = new Map();
  for (const a of activities) {
    const bId = a.bookId || "_noBook";
    if (!bookMap.has(bId)) {
      bookMap.set(bId, { bookId: bId, bookName: a.bookName || bId, items: [] });
    }
    bookMap.get(bId).items.push(a);
  }

  const books = [...bookMap.values()];

  return (
    <div>
      {books.map((bk) => {
        const bkKey = `book-${bk.bookId}`;
        const isBookOpen = expanded[bkKey] === true;
        const totalBookTime = bk.items.reduce((acc, x) => acc + (x.timeNeeded || 0), 0);

        return (
          <div key={bkKey} style={styles.block}>
            <div
              style={styles.blockHeader}
              onClick={() => onToggleExpand(bkKey, activities)}
            >
              {isBookOpen ? "▼" : "▶"} {bk.bookName} ({totalBookTime}m)
            </div>
            {isBookOpen && (
              <div style={styles.blockContent}>
                {renderChapters(bk.items, currentIndex, onSelectActivity, expanded, onToggleExpand)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function renderChapters(
  activities,
  currentIndex,
  onSelectActivity,
  expanded,
  onToggleExpand
) {
  const chMap = new Map();
  for (const act of activities) {
    const cId = act.chapterId || "_noChap";
    if (!chMap.has(cId)) {
      chMap.set(cId, { chapterId: cId, chapterName: act.chapterName || cId, items: [] });
    }
    chMap.get(cId).items.push(act);
  }

  const chapters = [...chMap.values()];

  return chapters.map((ch) => {
    const chKey = `ch-${ch.chapterId}`;
    const isChOpen = expanded[chKey] === true;
    const chTime = ch.items.reduce((acc, x) => acc + (x.timeNeeded || 0), 0);

    return (
      <div key={chKey} style={styles.subBlock}>
        <div
          style={styles.blockHeader}
          onClick={() => onToggleExpand(chKey, activities)}
        >
          {isChOpen ? "▼" : "▶"} {ch.chapterName} ({chTime}m)
        </div>
        {isChOpen && (
          <div style={styles.blockContent}>
            {renderSubChapters(ch.items, currentIndex, onSelectActivity, expanded, onToggleExpand)}
          </div>
        )}
      </div>
    );
  });
}

function renderSubChapters(
  activities,
  currentIndex,
  onSelectActivity,
  expanded,
  onToggleExpand
) {
  const sbMap = new Map();
  for (const act of activities) {
    const sbId = act.subChapterId || "_noSubCh";
    if (!sbMap.has(sbId)) {
      sbMap.set(sbId, {
        subChapterId: sbId,
        subChapterName: act.subChapterName || sbId,
        items: [],
      });
    }
    sbMap.get(sbId).items.push(act);
  }

  const subs = [...sbMap.values()];

  return subs.map((sb) => {
    const sbKey = `subch-${sb.subChapterId}`;
    const isSbOpen = expanded[sbKey] === true;
    const sbTime = sb.items.reduce((acc, x) => acc + (x.timeNeeded || 0), 0);

    return (
      <div key={sb.subChapterId} style={styles.subBlock}>
        <div
          style={styles.blockHeader}
          onClick={() => onToggleExpand(sbKey, activities)}
        >
          {isSbOpen ? "▼" : "▶"} {sb.subChapterName} ({sbTime}m)
        </div>
        {isSbOpen && (
          <div style={styles.blockContent}>
            {sb.items.map((act, idx) => {
              const isSelected = act.flatIndex === currentIndex;
              return (
                <div
                  key={act.flatIndex ?? idx}
                  style={{
                    ...styles.activityRow,
                    backgroundColor: isSelected ? "#ffecb3" : "#fff",
                  }}
                  onClick={() => onSelectActivity && onSelectActivity(act.flatIndex)}
                >
                  <span>
                    {act.type}: {act.subChapterName}
                  </span>
                  <span style={{ marginLeft: "auto" }}>
                    {act.timeNeeded || 0}m
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  });
}

// --------------- HELPER FUNCTIONS ---------------
function buildChain(dayIndex, bookId, chapterId, subChId) {
  const obj = {};
  if (typeof dayIndex === "number") {
    obj[`day-${dayIndex}`] = true;
  }
  if (bookId) obj[`book-${bookId}`] = true;
  if (chapterId) obj[`ch-${chapterId}`] = true;
  if (subChId) obj[`subch-${subChId}`] = true;
  return obj;
}

function collapseNodeAndChildren(key, expandedObj, allActs) {
  if (expandedObj[key]) {
    delete expandedObj[key];
  }
  if (key.startsWith("ch-")) {
    const chId = key.substring(3);
    allActs.forEach((act) => {
      if (act.chapterId === chId && act.subChapterId) {
        const subKey = `subch-${act.subChapterId}`;
        delete expandedObj[subKey];
      }
    });
  } else if (key.startsWith("book-")) {
    const bookId = key.substring(5);
    allActs.forEach((act) => {
      if (act.bookId === bookId) {
        if (act.chapterId) delete expandedObj[`ch-${act.chapterId}`];
        if (act.subChapterId) delete expandedObj[`subch-${act.subChapterId}`];
      }
    });
  } else if (key.startsWith("day-")) {
    const dayIdx = Number(key.substring(4));
    allActs.forEach((act) => {
      if (act.dayIndex === dayIdx) {
        if (act.bookId) delete expandedObj[`book-${act.bookId}`];
        if (act.chapterId) delete expandedObj[`ch-${act.chapterId}`];
        if (act.subChapterId) delete expandedObj[`subch-${act.subChapterId}`];
      }
    });
  }
  // If subch-, no deeper
}

function findParentBookKey(chKey, allActs) {
  const chId = chKey.substring(3);
  const item = allActs.find((a) => a.chapterId === chId);
  if (item?.bookId) {
    return `book-${item.bookId}`;
  }
  return null;
}

function findParentBookChKey(subchKey, allActs) {
  const subId = subchKey.substring(6);
  const item = allActs.find((a) => a.subChapterId === subId);
  if (!item) return {};
  const parentBookKey = item.bookId ? `book-${item.bookId}` : null;
  const parentChapterKey = item.chapterId ? `ch-${item.chapterId}` : null;
  return { parentBookKey, parentChapterKey };
}

// --------------- STYLES ---------------
const styles = {
  container: {
    padding: 10,
    fontSize: "0.9rem",
  },
  selectRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: 6,
  },
  selectLabel: {
    marginRight: 4,
  },
  select: {
    padding: 4,
  },
  header: {
    margin: "6px 0",
  },
  block: {
    border: "1px solid #ccc",
    borderRadius: 4,
    marginBottom: 8,
    overflow: "hidden",
  },
  blockHeader: {
    backgroundColor: "#eee",
    padding: "4px 6px",
    cursor: "pointer",
  },
  blockContent: {
    padding: "4px 8px",
  },
  subBlock: {
    marginTop: 6,
    border: "1px solid #ddd",
    borderRadius: 4,
  },
  activityRow: {
    display: "flex",
    padding: "2px 6px",
    marginBottom: 4,
    border: "1px solid #eee",
    borderRadius: 4,
    cursor: "pointer",
  },
};