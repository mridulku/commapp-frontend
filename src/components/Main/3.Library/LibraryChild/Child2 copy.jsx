import React, { useState } from "react";

// We'll re-use your colorScheme approach for styling:
const defaultColorScheme = {
  panelBg: "#0D0D0D",
  textColor: "#FFD700",
  heading: "#FFD700",
  borderColor: "#FFD700",
};

/**
 * The mock "daysData" representing the day-by-day plan with
 * chapter/subchapter tasks, time estimates, actual times, statuses, etc.
 * Each day can have a "planReadjustment" note, a "summary", and an "isFuture" flag.
 */
const mockDaysData = [
  {
    dayNumber: 1,
    isFuture: false,
    planReadjustment:
      "Concept B (Understand) failed => scheduled revision on Day 2, partial reading leftover from Day 2 was done on Day 1.",
    tasks: [
      {
        chapter: "Chapter 1",
        subchapter: "1.1",
        stage: "Reading",
        estimatedTime: 30,
        actualTime: 45,
        status: "Completed",
      },
      {
        chapter: "Chapter 1",
        subchapter: "1.1",
        stage: "Understand",
        estimatedTime: 20,
        actualTime: 25,
        status: "Failed",
      },
      {
        chapter: "Chapter 1",
        subchapter: "1.2",
        stage: "Reading",
        estimatedTime: 20,
        actualTime: 15,
        status: "Partial",
      },
    ],
    summary: {
      plannedTime: 70,
      actualTime: 85,
      progress: "70%",
    },
  },
  {
    dayNumber: 2,
    isFuture: false,
    planReadjustment:
      "Analyze stage partial fail => next revision scheduled Day 3. Reading leftover done for 1.2",
    tasks: [
      {
        chapter: "Chapter 1",
        subchapter: "1.1",
        stage: "Revision (Concept B)",
        estimatedTime: 15,
        actualTime: 15,
        status: "Completed",
      },
      {
        chapter: "Chapter 1",
        subchapter: "1.1",
        stage: "Understand (Quiz retry)",
        estimatedTime: 10,
        actualTime: 10,
        status: "Completed",
      },
      {
        chapter: "Chapter 1",
        subchapter: "1.1",
        stage: "Analyze",
        estimatedTime: 20,
        actualTime: 25,
        status: "Failed",
      },
      {
        chapter: "Chapter 1",
        subchapter: "1.2",
        stage: "Reading leftover",
        estimatedTime: 15,
        actualTime: 15,
        status: "Completed",
      },
    ],
    summary: {
      plannedTime: 60,
      actualTime: 65,
      progress: "80%",
    },
  },
  {
    dayNumber: 3,
    isFuture: false,
    planReadjustment:
      "Analyze stage incomplete => new revision tomorrow for Concept X. Reading for Chapter 2 => push to Day 4.",
    tasks: [
      {
        chapter: "Chapter 1",
        subchapter: "1.1",
        stage: "Revision (Concept X)",
        estimatedTime: 20,
        actualTime: 10,
        status: "Partial",
      },
      {
        chapter: "Chapter 1",
        subchapter: "1.1",
        stage: "Analyze (Quiz)",
        estimatedTime: 20,
        actualTime: 20,
        status: "Failed",
      },
      {
        chapter: "Chapter 2",
        subchapter: "2.1",
        stage: "Reading",
        estimatedTime: 30,
        actualTime: null,
        status: "NotStarted",
      },
    ],
    summary: {
      plannedTime: 70,
      actualTime: 30,
      progress: "42%",
    },
  },
  {
    dayNumber: 4,
    isFuture: false,
    planReadjustment: null,
    tasks: [
      {
        chapter: "Chapter 1",
        subchapter: "1.1",
        stage: "Revision (Concept X)",
        estimatedTime: 15,
        actualTime: null,
        status: "NotStarted",
      },
      {
        chapter: "Chapter 2",
        subchapter: "2.1",
        stage: "Reading",
        estimatedTime: 30,
        actualTime: null,
        status: "NotStarted",
      },
      {
        chapter: "Chapter 2",
        subchapter: "2.2",
        stage: "Reading",
        estimatedTime: 20,
        actualTime: null,
        status: "NotStarted",
      },
    ],
    summary: {
      plannedTime: 65,
      actualTime: 0,
      progress: "0%",
    },
  },
  {
    dayNumber: 5,
    isFuture: true,
    planReadjustment: null,
    tasks: [
      {
        chapter: "Chapter 1",
        subchapter: "1.1",
        stage: "Apply (If Analyze pass)",
        estimatedTime: 20,
        actualTime: null,
        status: "NotStarted",
      },
      {
        chapter: "Chapter 1",
        subchapter: "1.1",
        stage: "Revision (Concept X) if still fail",
        estimatedTime: 15,
        actualTime: null,
        status: "NotStarted",
      },
      {
        chapter: "Chapter 2",
        subchapter: "2.2",
        stage: "Reading leftover",
        estimatedTime: 15,
        actualTime: null,
        status: "NotStarted",
      },
    ],
    summary: {
      plannedTime: 50,
      actualTime: 0,
      progress: "0%",
    },
  },
  {
    dayNumber: 6,
    isFuture: true,
    planReadjustment: null,
    tasks: [
      {
        chapter: "Chapter 2",
        subchapter: "2.1",
        stage: "Analyze",
        estimatedTime: 20,
        actualTime: null,
        status: "NotStarted",
      },
      {
        chapter: "Chapter 2",
        subchapter: "2.2",
        stage: "Remember stage (if time allows)",
        estimatedTime: 10,
        actualTime: null,
        status: "NotStarted",
      },
    ],
    summary: {
      plannedTime: 30,
      actualTime: 0,
      progress: "0%",
    },
  },
];

export default function Child2({ colorScheme = defaultColorScheme }) {
  const finalColorScheme = { ...defaultColorScheme, ...colorScheme };

  const [days] = useState(mockDaysData);
  const sortedDays = [...days].sort((a, b) => a.dayNumber - b.dayNumber);

  // We'll have a "modern tabs" approach => each day is a "tab"
  const [activeIndex, setActiveIndex] = useState(0);
  const activeDay = sortedDays[activeIndex] || null;

  return (
    <div style={containerStyle(finalColorScheme)}>
      <h2 style={headingStyle(finalColorScheme)}>Adaptive Plan — Day by Day</h2>

      {/* Horizontal modern tabs for days */}
      <div style={tabContainerStyle()}>
        {sortedDays.map((day, idx) => (
          <div
            key={day.dayNumber}
            style={tabStyle(idx === activeIndex, finalColorScheme, day.isFuture)}
            onClick={() => setActiveIndex(idx)}
          >
            Day {day.dayNumber}
          </div>
        ))}
      </div>

      <div style={tabContentStyle(finalColorScheme)}>
        {activeDay ? renderDayView(activeDay, finalColorScheme) : "No Day Data"}
      </div>
    </div>
  );
}

// ------------------ Day View Rendering ------------------

function renderDayView(day, cs) {
  // group tasks by chapter->subchapter
  const chapterMap = {};
  (day.tasks || []).forEach((t) => {
    const chKey = t.chapter || "UnknownChapter";
    if (!chapterMap[chKey]) chapterMap[chKey] = {};
    const subKey = t.subchapter || "UnknownSubchapter";
    if (!chapterMap[chKey][subKey]) chapterMap[chKey][subKey] = [];
    chapterMap[chKey][subKey].push(t);
  });

  const chapters = Object.keys(chapterMap);

  return (
    <div>
      {/* Render plan readjustment *cards* instead of a big text block */}
      {day.planReadjustment && (
        <PlanReadjustmentCards
          readjustment={day.planReadjustment}
          colorScheme={cs}
        />
      )}

      {/* Chapter + Subchapter + tasks */}
      {chapters.map((ch) => {
        const subs = chapterMap[ch];
        return (
          <div key={ch} style={chapterContainerStyle()}>
            <div style={chapterHeaderStyle(cs)}>{ch}</div>
            {Object.keys(subs).map((sub) => {
              const tasks = subs[sub];
              return (
                <div key={sub} style={subchapterContainerStyle()}>
                  <div style={subchapterTitleStyle(cs)}>{sub}</div>
                  {/* We'll place tasks horizontally aligned */}
                  {renderSubchapterTasks(tasks, cs)}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* More visual day summary at bottom */}
      {day.summary && (
        <DaySummary summary={day.summary} colorScheme={cs} />
      )}

      {day.isFuture && (
        <div style={{ fontStyle: "italic", color: "#999", marginTop: "1rem" }}>
          These tasks may still change tomorrow.
        </div>
      )}
    </div>
  );
}

// ------------------ Plan Readjustment Section (Icons + Cards) ------------------

/**
 * Parse the planReadjustment text for any recognized keywords/phrases
 * and produce a small array of "cards" to display visually.
 *
 * Feel free to expand or customize the logic & icon usage as needed.
 */
function parsePlanReadjustment(readjustment) {
  if (!readjustment) return [];

  const lower = readjustment.toLowerCase();

  // A few example "detectors" with icons, titles, and descriptions
  const possibleIndicators = [
    {
      phrase: "failed",
      icon: "❌",
      title: "Failure Identified",
      description: "One or more tasks failed and were rescheduled."
    },
    {
      phrase: "partial",
      icon: "🟡",
      title: "Partial Completion",
      description: "Some tasks were only partially completed or leftover."
    },
    {
      phrase: "reading leftover",
      icon: "📖",
      title: "Reading Leftover",
      description: "Reading tasks carried over from a previous day."
    },
    {
      phrase: "revision",
      icon: "♻️",
      title: "Revision Scheduled",
      description: "A revision or retake is scheduled in the upcoming day(s)."
    },
    {
      phrase: "analyze",
      icon: "🔎",
      title: "Analyze Stage",
      description: "The Analyze stage triggered changes in scheduling."
    },
  ];

  // For each phrase recognized in the text, we create a summary object
  const recognized = [];
  possibleIndicators.forEach((indicator) => {
    if (lower.includes(indicator.phrase)) {
      recognized.push({
        icon: indicator.icon,
        title: indicator.title,
        description: indicator.description,
      });
    }
  });

  // If nothing recognized, fallback to a single "info" card
  if (recognized.length === 0) {
    recognized.push({
      icon: "ℹ️",
      title: "Info",
      description: readjustment,
    });
  }

  return recognized;
}

function PlanReadjustmentCards({ readjustment, colorScheme }) {
  const items = parsePlanReadjustment(readjustment);

  return (
    <div style={readjustCardsContainerStyle()}>
      {items.map((item, idx) => (
        <div key={idx} style={readjustCardStyle(colorScheme)}>
          <div style={iconStyle()}>{item.icon}</div>
          <div>
            <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
              {item.title}
            </div>
            <div style={{ fontSize: "0.85rem" }}>{item.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ------------------ Tasks Rendering ------------------

function renderSubchapterTasks(tasks, cs) {
  return (
    <div style={subchapterTasksRowStyle()}>
      {tasks.map((t, i) => (
        <div key={i} style={activityCardStyle(t.stage)}>
          {/* Top row => stage name in a rectangle, centered */}
          <div style={activityCardHeaderStyle()}>{t.stage}</div>

          {/* Middle row => "Est: X min" + "Act: X min" */}
          <div style={timeRowStyle()}>
            <div style={{ marginRight: "8px" }}>
              <strong>Est</strong>: {t.estimatedTime}m
            </div>
            <div>
              <strong>Act</strong>: {t.actualTime != null ? t.actualTime : "--"}m
            </div>
          </div>

          {/* Bottom row => status label */}
          <div style={statusRowStyle()}>{renderStatus(t.status)}</div>
        </div>
      ))}
    </div>
  );
}

function renderStatus(status) {
  switch (status) {
    case "Completed":
      return <span style={{ color: "#4CAF50" }}>✔ Completed</span>;
    case "Failed":
      return <span style={{ color: "#ff4444" }}>✘ Failed</span>;
    case "Partial":
      return <span style={{ color: "#ffa500" }}>~ Partial</span>;
    case "NotStarted":
      return <span style={{ color: "#999" }}>… NotStarted</span>;
    default:
      return <span style={{ color: "#ccc" }}>{status}</span>;
  }
}

// ------------------ Day Summary (Graphical) ------------------

function DaySummary({ summary, colorScheme }) {
  const plannedTime = summary.plannedTime || 0;
  const actualTime = summary.actualTime || 0;

  // Convert the "progress" string (like "70%") to a numeric value
  const progressNum = parseInt(summary.progress, 10) || 0;

  return (
    <div style={daySummaryStyle()}>
      <div style={{ fontWeight: "bold", marginBottom: "6px" }}>Day Summary</div>

      {/* A horizontal bar to compare Planned vs Actual in a visual way */}
      {renderPlannedActualComparison(plannedTime, actualTime)}

      {/* Progress bar for the overall progress */}
      {renderProgressBar(progressNum, colorScheme)}
    </div>
  );
}

// Renders a small double-bar showing planned vs actual
function renderPlannedActualComparison(planned, actual) {
  const maxVal = Math.max(planned, actual, 1); // to avoid dividing by zero

  // bar widths in px
  const barWidthPx = 200;
  const plannedWidth = (planned / maxVal) * barWidthPx;
  const actualWidth = (actual / maxVal) * barWidthPx;

  return (
    <div style={{ marginBottom: "8px" }}>
      <div style={{ fontSize: "0.9rem", marginBottom: "4px" }}>
        Planned vs. Actual (minutes)
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={barOuterStyle()}>
          <div style={{ ...barInnerStyle("#00BCD4"), width: plannedWidth }}>
            <span style={barLabelStyle()}>{planned}m</span>
          </div>
        </div>
        <div style={barOuterStyle()}>
          <div style={{ ...barInnerStyle("#FFC107"), width: actualWidth }}>
            <span style={barLabelStyle()}>{actual}m</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Renders a single progress bar for the "progress" percentage
function renderProgressBar(progressNum, colorScheme) {
  const widthPx = 200;
  const fillWidth = (progressNum / 100) * widthPx;

  return (
    <div>
      <div style={{ fontSize: "0.9rem", marginBottom: "4px" }}>
        Overall Progress
      </div>
      <div style={barOuterStyle()}>
        <div
          style={{
            ...barInnerStyle(colorScheme.heading),
            width: fillWidth,
          }}
        >
          <span style={barLabelStyle()}>{progressNum}%</span>
        </div>
      </div>
    </div>
  );
}

// ------------------ Styles ------------------

function containerStyle(cs) {
  return {
    backgroundColor: cs.panelBg,
    color: cs.textColor,
    minHeight: "100vh",
    padding: "1rem",
    fontFamily: "sans-serif",
  };
}

function headingStyle(cs) {
  return {
    fontWeight: "bold",
    marginBottom: "1rem",
    fontSize: "1.25rem",
    color: cs.heading,
  };
}

// The "modern tab" row
function tabContainerStyle() {
  return {
    display: "flex",
    gap: "8px",
    marginBottom: "1rem",
    overflowX: "auto",
  };
}

// Each tab style
function tabStyle(isActive, cs, isFuture) {
  return {
    cursor: "pointer",
    padding: "8px 16px",
    borderRadius: "20px",
    backgroundColor: isActive ? "#454545" : "#333",
    color: cs.textColor,
    opacity: isFuture ? 0.8 : 1,
    border: isActive
      ? `2px solid ${cs.borderColor}`
      : "2px solid transparent",
    whiteSpace: "nowrap",
  };
}

// The content panel for the chosen day
function tabContentStyle(cs) {
  return {
    backgroundColor: "#222",
    padding: "1rem",
    borderRadius: "8px",
    border: `1px solid ${cs.borderColor}`,
    minHeight: "250px",
  };
}

// Plan readjustment (card-based) container
function readjustCardsContainerStyle() {
  return {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "1rem",
  };
}

function readjustCardStyle(cs) {
  return {
    backgroundColor: "#333",
    border: `1px solid ${cs.borderColor}`,
    borderRadius: "6px",
    padding: "8px 12px",
    flex: "0 0 auto",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    maxWidth: "250px",
  };
}

function iconStyle() {
  return {
    fontSize: "1.3rem",
  };
}

// Chapter
function chapterContainerStyle() {
  return {
    marginBottom: "1rem",
  };
}

function chapterHeaderStyle(cs) {
  return {
    backgroundColor: "#2F2F2F",
    padding: "6px 10px",
    borderRadius: "4px",
    fontWeight: "bold",
    marginBottom: "4px",
    border: `1px solid ${cs.borderColor}`,
  };
}

// Subchapter
function subchapterContainerStyle() {
  return {
    marginLeft: "1.5rem",
    marginBottom: "8px",
    borderLeft: "1px dashed #555",
    paddingLeft: "0.75rem",
  };
}

function subchapterTitleStyle(cs) {
  return {
    fontWeight: "bold",
    color: cs.textColor,
    marginBottom: "4px",
  };
}

// Horizontal row of tasks
function subchapterTasksRowStyle() {
  return {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "1rem",
  };
}

function activityCardStyle(stageName) {
  // color-coded by stage
  let bg = "#555";
  const s = stageName.toLowerCase();
  if (s.startsWith("reading")) bg = "#1565C0";     // Blue
  else if (s.startsWith("understand")) bg = "#7B1FA2"; // Purple
  else if (s.startsWith("analyze")) bg = "#EF6C00";    // Orange
  else if (s.startsWith("apply")) bg = "#2E7D32";      // Green
  else if (s.startsWith("remember")) bg = "#6D4C41";   // Brown
  else if (s.startsWith("revision")) bg = "#6A1B9A";   // Variation of purple

  return {
    backgroundColor: bg,
    color: "#fff",
    borderRadius: "6px",
    padding: "8px 12px",
    minWidth: "180px",
    display: "flex",
    flexDirection: "column",
  };
}

function activityCardHeaderStyle() {
  return {
    fontWeight: "bold",
    fontSize: "0.9rem",
    marginBottom: "8px",
    textAlign: "center",
  };
}

function timeRowStyle() {
  return {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.85rem",
    marginBottom: "8px",
  };
}

function statusRowStyle() {
  return {
    fontSize: "0.8rem",
    textAlign: "right",
  };
}

// day summary container
function daySummaryStyle() {
  return {
    backgroundColor: "#2F2F2F",
    padding: "12px",
    borderRadius: "4px",
    marginTop: "1rem",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  };
}

// bar outer style
function barOuterStyle() {
  return {
    backgroundColor: "#444",
    borderRadius: "4px",
    overflow: "hidden",
    height: "22px",
    width: "200px",
    position: "relative",
  };
}

// bar inner style
function barInnerStyle(fillColor) {
  return {
    backgroundColor: fillColor,
    height: "100%",
    borderRadius: "4px 0 0 4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingRight: "6px",
  };
}

// label that appears on top of the bar
function barLabelStyle() {
  return {
    fontSize: "0.75rem",
    fontWeight: "bold",
    color: "#FFF",
  };
}
