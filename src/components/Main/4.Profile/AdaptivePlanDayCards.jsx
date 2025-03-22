import React, { useState } from "react";

// We'll re-use your colorScheme approach for styling:
const defaultColorScheme = {
  panelBg: "#0D0D0D",
  textColor: "#FFD700",
  heading: "#FFD700",
  borderColor: "#FFD700",
};

/**
 * We'll define a mock "daysData" representing the day-by-day plan with
 * chapter/subchapter tasks, time estimates, actual times, and a stage (Reading/Understand/Analyze/Apply).
 * Each "day" can also have a "planReadjustment" note, and "isFuture" flag to differentiate upcoming days.
 * Each day has a summary too.
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
      progress: "70%", // e.g. can be derived
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

export default function AdaptivePlanDayCards({
  userId,
  colorScheme = defaultColorScheme,
}) {
  const [daysData] = useState(mockDaysData);

  // We might have day1..N, day4 is "today", day5..N are future, etc.
  // We'll display them in ascending order, each day in an expandable card.

  return (
    <div style={containerStyle(colorScheme)}>
      <h2 style={headingStyle(colorScheme)}>Adaptive Plan — Day by Day</h2>
      <p style={{ marginBottom: "1.5rem", color: colorScheme.textColor }}>
        This schedule updates daily based on your progress, leftover tasks, and quiz results.
      </p>

      {daysData.map((day) => (
        <DayCard key={day.dayNumber} day={day} colorScheme={colorScheme} />
      ))}
    </div>
  );
}

// -----------------------------
// DayCard
// -----------------------------
function DayCard({ day, colorScheme }) {
  const [expanded, setExpanded] = useState(!day.isFuture);

  function toggleExpand() {
    setExpanded(!expanded);
  }

  const cardBg = day.isFuture ? "#2c3e50" : "#1a1a1a";

  return (
    <div style={cardStyle(cardBg, colorScheme)}>
      <div
        style={cardHeaderStyle(colorScheme)}
        onClick={toggleExpand}
      >
        <div>
          <strong>Day {day.dayNumber}</strong>{" "}
          {day.isFuture && (
            <span style={upcomingBadgeStyle()}>Upcoming</span>
          )}
        </div>
        <div style={{ cursor: "pointer" }}>
          {expanded ? "▼" : "▶"}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "0.5rem 1rem" }}>
          {/* tasks grouped by chapter => subchapter */}
          {renderDayTasks(day, colorScheme)}

          {/* summary row */}
          <div style={summaryBoxStyle(colorScheme)}>
            <div>Planned Time: {day.summary?.plannedTime || 0} min</div>
            <div>Actual Time: {day.summary?.actualTime || 0} min</div>
            <div>Progress: {day.summary?.progress || "0%"}</div>
          </div>

          {/* Plan readjustment note */}
          {day.planReadjustment && (
            <div
              style={{
                marginTop: "0.5rem",
                backgroundColor: "#333",
                padding: "8px",
                borderRadius: "4px",
                fontStyle: "italic",
              }}
            >
              {day.planReadjustment}
            </div>
          )}

          {day.isFuture && (
            <div style={{ marginTop: "0.5rem", fontStyle: "italic", color: "#ccc" }}>
              These tasks may change tomorrow based on performance.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function renderDayTasks(day, colorScheme) {
  // group tasks by chapter->subchapter
  const tasks = day.tasks || [];
  const chapterMap = {};

  tasks.forEach((t) => {
    const chKey = t.chapter || "UnknownChapter";
    if (!chapterMap[chKey]) {
      chapterMap[chKey] = {};
    }
    const subKey = t.subchapter || "UnknownSubchapter";
    if (!chapterMap[chKey][subKey]) {
      chapterMap[chKey][subKey] = [];
    }
    chapterMap[chKey][subKey].push(t);
  });

  return Object.keys(chapterMap).map((chapterName) => {
    const subMap = chapterMap[chapterName];
    return (
      <div key={chapterName} style={{ marginBottom: "1rem" }}>
        <div style={chapterHeaderStyle2(colorScheme)}>
          {chapterName}
        </div>
        {Object.keys(subMap).map((subName) => {
          const subActs = subMap[subName];
          return (
            <div key={subName} style={subchapterContainerStyle()}>
              <div style={subchapterTitleStyle(colorScheme)}>
                {subName}
              </div>
              <div style={{ marginLeft: "1rem" }}>
                {subActs.map((task, idx) => (
                  <div key={idx} style={activityRowStyle(colorScheme)}>
                    <div>{task.stage}</div>
                    <div style={{ marginLeft: "auto", marginRight: "12px" }}>
                      Est: {task.estimatedTime || 0}m
                    </div>
                    <div style={{ marginRight: "12px" }}>
                      {task.actualTime != null
                        ? `Actual: ${task.actualTime}m`
                        : "Actual: --"}
                    </div>
                    <div>{renderStatus(task.status)}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  });
}

// small helper for status
function renderStatus(status) {
  switch (status) {
    case "Completed":
      return <span style={{ color: "#00ff00" }}>Completed</span>;
    case "Failed":
      return <span style={{ color: "#ff4444" }}>Failed</span>;
    case "Partial":
      return <span style={{ color: "#ffa500" }}>Partial</span>;
    case "NotStarted":
      return <span style={{ color: "#ccc" }}>Not Started</span>;
    default:
      return <span style={{ color: "#999" }}>{status}</span>;
  }
}

// -----------------------------
// Styles
// -----------------------------
function containerStyle(cs) {
  return {
    backgroundColor: cs.panelBg || "#0D0D0D",
    color: cs.textColor || "#FFD700",
    minHeight: "100vh",
    padding: "1rem",
  };
}

function headingStyle(cs) {
  return {
    fontWeight: "bold",
    marginBottom: "15px",
    fontSize: "1.25rem",
    color: cs.heading || "#FFD700",
  };
}

function cardStyle(bg, cs) {
  return {
    backgroundColor: bg,
    marginBottom: "1rem",
    borderRadius: "6px",
    border: `1px solid ${cs.borderColor || "#FFD700"}`,
    overflow: "hidden",
  };
}

function cardHeaderStyle(cs) {
  return {
    backgroundColor: cs.heading || "#FFD700",
    color: "#000",
    padding: "0.5rem 1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
    fontWeight: "bold",
  };
}

function upcomingBadgeStyle() {
  return {
    backgroundColor: "#f1c40f",
    color: "#000",
    borderRadius: "4px",
    padding: "2px 6px",
    marginLeft: "8px",
    fontSize: "0.8rem",
  };
}

function chapterHeaderStyle2(cs) {
  return {
    backgroundColor: "#222",
    borderRadius: "4px",
    padding: "6px 10px",
    fontWeight: "bold",
    marginBottom: "4px",
    border: `1px solid ${cs.borderColor || "#FFD700"}`,
  };
}

function subchapterContainerStyle() {
  return {
    margin: "8px 0",
    marginLeft: "1rem",
    paddingLeft: "0.5rem",
    borderLeft: "1px dashed #888",
  };
}

function subchapterTitleStyle(cs) {
  return {
    fontWeight: "bold",
    marginBottom: "4px",
    color: cs.textColor || "#FFD700",
  };
}

function activityRowStyle(cs) {
  return {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#2F2F2F",
    borderRadius: "4px",
    margin: "2px 0",
    padding: "4px 6px",
  };
}

function summaryBoxStyle(cs) {
  return {
    backgroundColor: "#333",
    padding: "6px 8px",
    borderRadius: "4px",
    marginTop: "0.5rem",
    display: "flex",
    justifyContent: "space-around",
  };
}