import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCurrentIndex } from "./redux/planSlice";

/**
 * LeftPanel
 * ---------
 * - Single chain expansion
 * - Manual toggle: user can open any day/book/ch/subch, which collapses previous chain
 * - Auto sync: if currentIndex changes (via next/prev arrows in MainContent), we open that chain
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

  if (status !== "succeeded" || !planDoc) {
    return <div style={styles.container}>No plan loaded yet.</div>;
  }

  const { planType = "adaptive", sessions = [] } = planDoc;

  // ------------------------------------------------------------
  // 1) Whenever currentIndex changes => auto-expand that chain
  // ------------------------------------------------------------
  useEffect(() => {
    if (!flattenedActivities?.length) return;
    if (currentIndex < 0 || currentIndex >= flattenedActivities.length) return;

    const currentItem = flattenedActivities[currentIndex];
    const { dayIndex, bookId, chapterId, subChapterId } = currentItem || {};

    // If planType is "adaptive", auto-switch day selection
    if (planType !== "book") {
      setSelectedDayIndex(dayIndex || 0);
    }

    // Build the chain keys for this item
    // e.g. { "day-2": true, "book-xyz": true, "ch-abc": true, "subch-123": true }
    const newExpanded = buildChain(dayIndex, bookId, chapterId, subChapterId);

    setExpanded(newExpanded);
  }, [currentIndex, flattenedActivities, planType]);

  // ------------------------------------------------------------
  // 2) If user changes day from dropdown, just set selectedDayIndex
  // ------------------------------------------------------------
  function handleDayChange(e) {
    setSelectedDayIndex(Number(e.target.value));
    // We might optionally collapse everything or auto-open that day:
    // If you want day to be auto expanded, do it here, e.g.:
    const dayKey = `day-${e.target.value}`;
    setExpanded({ [dayKey]: true });
  }

  // ------------------------------------------------------------
  // 3) handleToggleExpand => user clicked a day/book/chapter/subch header
  //    If user is "opening" that node => close all others, open that chain
  //    If user is "closing" that node => simply close that node (and children).
  // ------------------------------------------------------------
  function handleToggleExpand(key, allActivities) {
    const isCurrentlyOpen = expanded[key] === true;

    if (isCurrentlyOpen) {
      // Closing => just turn off this node and any deeper children
      const nextExpanded = { ...expanded };
      collapseNodeAndChildren(key, nextExpanded, allActivities);
      setExpanded(nextExpanded);
    } else {
      // Opening => we want a single chain approach
      //  1) figure out day/book/chapter/subch from 'key'
      //  2) build a new object with only that chain open
      //  3) preserve any ancestors (like day-2 if we are opening a book)

      // If it's a day key => "day-2"
      // If it's a book key => "book-xxx"
      // etc. We'll parse them and open from root to that node.

      const nextExpanded = {};

      // If user clicked a day => open that day, collapse all else
      // If user clicked a book => keep day open & that book, close others
      // If user clicked a chapter => keep day & book open, open this chapter
      // If user clicked a subch => keep day & book & chapter open, open subCh

      // We'll find the "chain" from day -> book -> chapter -> subChapter
      // If you have the associated dayIndex/bookId, etc. we can open them
      // But we only know the 'key' that was clicked. So we parse and do partial logic.

      // We'll do a simpler approach: we find dayIndex from selectedDayIndex (assuming user is in that day)
      const dayKey = `day-${selectedDayIndex}`;
      nextExpanded[dayKey] = true;

      // If they clicked a "book-xxx"
      if (key.startsWith("book-")) {
        nextExpanded[key] = true;
      }
      // If they clicked "ch-xxx" => we want the parent's book open as well if we can find it
      else if (key.startsWith("ch-")) {
        // We can't know which book it's under unless we map. We'll do it below by searching.
        nextExpanded[dayKey] = true;
        nextExpanded[key] = true;
        // We'll fill in the parent's "book-xxx" if we discover it
        const parentBookKey = findParentBookKey(key, allActivities);
        if (parentBookKey) {
          nextExpanded[parentBookKey] = true;
        }
      }
      // If they clicked subch => open day, open parent book, open parent chapter, open subch
      else if (key.startsWith("subch-")) {
        nextExpanded[dayKey] = true;
        nextExpanded[key] = true;
        const { parentBookKey, parentChapterKey } = findParentBookChKey(key, allActivities);
        if (parentBookKey) nextExpanded[parentBookKey] = true;
        if (parentChapterKey) nextExpanded[parentChapterKey] = true;
      }

      setExpanded(nextExpanded);
    }
  }

  // For planType=book => skip day selection
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
  // We'll group by book
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

function renderChapters(activities, currentIndex, onSelectActivity, expanded, onToggleExpand) {
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

function renderSubChapters(activities, currentIndex, onSelectActivity, expanded, onToggleExpand) {
  const sbMap = new Map();
  for (const act of activities) {
    const sbId = act.subChapterId || "_noSubCh";
    if (!sbMap.has(sbId)) {
      sbMap.set(sbId, { subChapterId: sbId, subChapterName: act.subChapterName || sbId, items: [] });
    }
    sbMap.get(sbId).items.push(act);
  }

  const subs = [...sbMap.values()];

  return subs.map((sb) => {
    const sbKey = `subch-${sb.subChapterId}`;
    const isSbOpen = expanded[sbKey] === true;
    const sbTime = sb.items.reduce((acc, x) => acc + (x.timeNeeded || 0), 0);

    return (
      <div key={sbKey} style={styles.subBlock}>
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
                  <span style={{ marginLeft: "auto" }}>{act.timeNeeded || 0}m</span>
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
// HELPER FUNCTIONS
//

/**
 * buildChain(dayIndex, bookId, chapterId, subChId)
 * Returns an expanded object for that single chain.
 */
function buildChain(dayIndex, bookId, chapterId, subChId) {
  // e.g. {
  //   "day-2": true,
  //   "book-xyz": true,
  //   "ch-abc": true,
  //   "subch-123": true
  // }
  const obj = {};
  // If dayIndex is present
  if (typeof dayIndex === "number") {
    obj[`day-${dayIndex}`] = true;
  }
  if (bookId) obj[`book-${bookId}`] = true;
  if (chapterId) obj[`ch-${chapterId}`] = true;
  if (subChId) obj[`subch-${subChId}`] = true;
  return obj;
}

/**
 * collapseNodeAndChildren(key, expandedObj, allActivities)
 * Sets expandedObj[key] = false + any children of this node false as well.
 * We only do minimal recursion, because we store expansions by key.
 */
function collapseNodeAndChildren(key, expandedObj, allActs) {
  if (expandedObj[key]) {
    delete expandedObj[key];
  }
  // If user collapsed "ch-ABC", also subch-?? should close
  // We can do a small loop: for each subch that belongs under "ch-ABC", remove it
  // or for each item that belongs under book-??. This can be fairly involved if you want strict recursion.
  // We'll do a quick approach: if "ch-xxx" is collapsed, also remove subch-yyy expansions if they exist in the same set.

  if (key.startsWith("ch-")) {
    // find subch within these activities that belong to this ch
    const chId = key.substring(3);
    allActs.forEach((act) => {
      if (act.chapterId === chId && act.subChapterId) {
        const subKey = `subch-${act.subChapterId}`;
        delete expandedObj[subKey];
      }
    });
  } else if (key.startsWith("book-")) {
    // remove all ch- and subch- expansions under this book
    const bookId = key.substring(5);
    allActs.forEach((act) => {
      if (act.bookId === bookId) {
        if (act.chapterId) delete expandedObj[`ch-${act.chapterId}`];
        if (act.subChapterId) delete expandedObj[`subch-${act.subChapterId}`];
      }
    });
  } else if (key.startsWith("day-")) {
    // remove everything under that day
    const dayIdx = Number(key.substring(4));
    allActs.forEach((act) => {
      if (act.dayIndex === dayIdx) {
        if (act.bookId) delete expandedObj[`book-${act.bookId}`];
        if (act.chapterId) delete expandedObj[`ch-${act.chapterId}`];
        if (act.subChapterId) delete expandedObj[`subch-${act.subChapterId}`];
      }
    });
  }
  else if (key.startsWith("subch-")) {
    // Just remove that subch
    // That is already done above. No deeper level.
  }
}

/**
 * findParentBookKey(chKey, allActivities)
 * If user toggles "ch-xxx", we want to find the parent's book key if it exists.
 */
function findParentBookKey(chKey, allActs) {
  const chId = chKey.substring(3);
  // Find an item with chapterId=chId
  // Then get its bookId => "book-xxx"
  const item = allActs.find((a) => a.chapterId === chId);
  if (item?.bookId) {
    return `book-${item.bookId}`;
  }
  return null;
}

/**
 * findParentBookChKey(subchKey, allActivities)
 * If user toggles "subch-xxx", we want to find the parent's book and chapter if possible.
 */
function findParentBookChKey(subchKey, allActs) {
  const subId = subchKey.substring(6);
  const item = allActs.find((a) => a.subChapterId === subId);
  if (!item) return {};
  const parentBookKey = item.bookId ? `book-${item.bookId}` : null;
  const parentChapterKey = item.chapterId ? `ch-${item.chapterId}` : null;
  return { parentBookKey, parentChapterKey };
}

//
// Styles
//
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