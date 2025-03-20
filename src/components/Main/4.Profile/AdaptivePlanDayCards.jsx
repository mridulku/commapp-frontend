import React, { useState } from "react";

/**
 * Mock data to illustrate the day-by-day plan logic. 
 * Each day has:
 *  - dayNumber (1,2,3,...)
 *  - planned: array of tasks that were initially proposed for that day
 *  - actual: array of tasks the user really did
 *  - updatedPlan => what changed going into the next day 
 *  - isFuture => whether this day is "theoretical" (if day is after the current day)
 */
const mockDaysData = [
  {
    dayNumber: 1,
    planned: [
      "Read Chapter 1.1 & 1.2",
      "Understand Stage (Quiz) for Chapter 1.1",
    ],
    actual: [
      "Read Chapter 1.1 (took 45 min)",
      "Quiz for Chapter 1.1 => FAIL on Concept B",
      "Did partial reading for Chapter 1.2 (unplanned)",
    ],
    updatedPlan: [
      "Scheduled revision for Chapter 1.1 => Concept B tomorrow",
      "Moved reading for Chapter 1.2 from Day 2 to Day 1 leftover => might impact Day 2 tasks",
    ],
    isFuture: false,
  },
  {
    dayNumber: 2,
    planned: [
      "Revision for Chapter 1.1 => Concept B",
      "Retake Quiz for Chapter 1.1 => Expect pass",
      "Start 'Analyze' Stage for Chapter 1.1 if pass",
    ],
    actual: [
      "Revision for Concept B => DONE",
      "Retake Quiz => PASS for Chapter 1.1",
      "Analyze Stage => Quiz 1 => FAIL Concept X",
    ],
    updatedPlan: [
      "Analyze for Chapter 1.1 => partial pass => new revision needed tomorrow for Concept X",
      "Reading leftover for Chapter 1.2 => finished",
    ],
    isFuture: false,
  },
  {
    dayNumber: 3,
    planned: [
      "Revision for Chapter 1.1 => Concept X",
      "Retake Analyze quiz for Chapter 1.1 => hopefully pass",
      "Read Chapter 2.1",
    ],
    actual: [
      "User only had 20 minutes => partial revision done",
      "Analyze quiz => FAIL again on Concept X",
    ],
    updatedPlan: [
      "Analyze stage incomplete => new revision tomorrow for Concept X",
      "Reading for Chapter 2.1 => not started => push to Day 4",
    ],
    isFuture: false,
  },
  {
    dayNumber: 4,
    planned: [
      "Finish revision for Concept X (Analyze Stage, Chapter 1.1)",
      "Quiz => pass => move to 'Apply' stage for Chapter 1.1",
      "Start reading Chapter 2.1 & 2.2",
    ],
    actual: [],
    updatedPlan: [],
    isFuture: false,
  },
  {
    dayNumber: 5,
    planned: [
      "Potentially continue 'Apply' for Chapter 1.1 if pass on Analyze",
      "Revision for Chapter 1.1 if still fail",
      "Reading leftover for Chapter 2.2",
    ],
    actual: [],
    updatedPlan: [],
    isFuture: true, // It's upcoming
  },
  {
    dayNumber: 6,
    planned: [
      "Analyze Chapter 2.1 if reading done",
      "Remember stage Chapter 2.2 if time allows",
    ],
    actual: [],
    updatedPlan: [],
    isFuture: true,
  },
];

export default function AdaptivePlanDayCards() {
  // In real usage, you'd fetch or generate day-based plan data from your backend
  const [daysData] = useState(mockDaysData);

  // Let's assume the "current day" is Day 4 for demonstration – 
  // so days 1..3 are past, day4 is "today", day5..6 are future
  // (We've already set isFuture in the mock data, but you might compute it dynamically.)

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Adaptive Plan: Day-by-Day</h1>
      <p style={styles.subtitle}>
        A dynamic schedule that evolves based on daily performance.
      </p>

      <div style={styles.cardList}>
        {daysData.map((day) => (
          <DayCard key={day.dayNumber} day={day} />
        ))}
      </div>
    </div>
  );
}

/**
 * DayCard => Renders a "card" for a single day, showing:
 *   - Day # 
 *   - (If future => "Upcoming" badge)
 *   - Planned tasks
 *   - Actual tasks (if day is not future, or day has ended)
 *   - Updated Plan => how tomorrow changed
 */
function DayCard({ day }) {
  const { dayNumber, planned, actual, updatedPlan, isFuture } = day;

  // For visual flair, we'll color the card differently if it's future or past
  let cardBg = isFuture ? "#2c3e50" : "#3f3f3f";

  // If there's no actual data but not future => might be "today"
  // We won't differentiate that in the mock, but you could if you wanted.

  // Collapsible approach if you'd like
  const [expanded, setExpanded] = useState(!isFuture);

  const handleToggle = () => setExpanded(!expanded);

  return (
    <div style={{ ...styles.dayCard, backgroundColor: cardBg }}>
      <div style={styles.dayHeader}>
        <div style={styles.dayHeaderLeft}>
          <h2 style={styles.dayTitle}>Day {dayNumber}</h2>
          {isFuture && <span style={styles.upcomingBadge}>Upcoming</span>}
        </div>
        <button style={styles.toggleBtn} onClick={handleToggle}>
          {expanded ? "−" : "+"}
        </button>
      </div>

      {expanded && (
        <div style={styles.dayContent}>
          <SectionBlock
            title="Planned Tasks"
            items={planned}
            placeholder="(No planned tasks)"
          />

          {/* If not future, show "Actual" or "Day Incomplete" */}
          {!isFuture && (
            <SectionBlock
              title="What Actually Happened"
              items={actual}
              placeholder="(No data recorded yet)"
            />
          )}

          {/* If not future and we have updatedPlan, show that */}
          {!isFuture && updatedPlan && updatedPlan.length > 0 && (
            <SectionBlock
              title="Plan Adjustments for Next Day"
              items={updatedPlan}
              placeholder="(No updates or changes)"
            />
          )}

          {/* 
            If day is future => we can mention "this plan might change 
            once the system re-runs tomorrow" 
          */}
          {isFuture && (
            <div style={styles.futureNote}>
              <em>These tasks are subject to change tomorrow, based on performance.</em>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * SectionBlock => Renders a small sub-section with a title and bullet items
 */
function SectionBlock({ title, items, placeholder }) {
  return (
    <div style={styles.sectionBlock}>
      <h4 style={styles.sectionTitle}>{title}</h4>
      {items && items.length > 0 ? (
        <ul style={styles.ul}>
          {items.map((txt, i) => (
            <li key={i} style={styles.li}>{txt}</li>
          ))}
        </ul>
      ) : (
        <div style={styles.noItems}>{placeholder}</div>
      )}
    </div>
  );
}

// ===========================
// Inline Styles
// ===========================
const styles = {
  container: {
    backgroundColor: "#222",
    color: "#fff",
    minHeight: "100vh",
    padding: "1rem",
    fontFamily: "Arial, sans-serif",
  },
  title: {
    marginBottom: "0.5rem",
  },
  subtitle: {
    marginBottom: "2rem",
    color: "#aaa",
  },
  cardList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  dayCard: {
    borderRadius: "8px",
    padding: "1rem",
    backgroundColor: "#3f3f3f",
    boxShadow: "0 2px 5px rgba(0,0,0,0.4)",
    transition: "background-color 0.3s ease",
  },
  dayHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.5rem",
  },
  dayHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  dayTitle: {
    margin: 0,
    fontSize: "1.25rem",
  },
  upcomingBadge: {
    backgroundColor: "#f1c40f",
    color: "#000",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "0.85rem",
  },
  toggleBtn: {
    backgroundColor: "#444",
    color: "#fff",
    border: "none",
    padding: "4px 8px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "1.2rem",
    lineHeight: "1",
  },
  dayContent: {
    marginTop: "0.5rem",
  },
  sectionBlock: {
    marginBottom: "1rem",
  },
  sectionTitle: {
    fontSize: "1rem",
    margin: "0 0 0.25rem 0",
    color: "#fff",
    borderBottom: "1px solid #555",
    paddingBottom: "4px",
  },
  ul: {
    margin: 0,
    paddingLeft: "1.25rem",
    listStyle: "disc",
  },
  li: {
    marginBottom: "0.25rem",
  },
  noItems: {
    fontStyle: "italic",
    color: "#aaa",
  },
  futureNote: {
    backgroundColor: "#444",
    padding: "8px",
    borderRadius: "4px",
    marginTop: "0.5rem",
  },
};