import React from "react";

export default function ReadingView({ activity }) {
  if (!activity) return null;

  return (
    <div style={styles.container}>
      <h3>Reading View</h3>
      <p>SubChapter: {activity.subChapterId || "N/A"}</p>
      <p>TimeNeeded: {activity.timeNeeded || 0}m</p>
      {/* Possibly fetch the subchapter text from server, etc. */}
      <div style={styles.placeholder}>
        <em>(Imagine the reading text displayed here...)</em>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: "#eef",
    padding: 10,
    borderRadius: 4,
  },
  placeholder: {
    marginTop: 10,
    backgroundColor: "#ccc",
    padding: 8,
    borderRadius: 4,
  },
};