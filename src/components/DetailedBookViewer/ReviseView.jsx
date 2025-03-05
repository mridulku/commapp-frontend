import React from "react";

export default function ReviseView({ activity }) {
  return (
    <div style={styles.container}>
      <h3>Revise / Flashcards View</h3>
      <p>SubChapter: {activity.subChapterId || "N/A"}</p>
      <p>Type: {activity.type}</p>
      <div style={styles.placeholder}>
        <em>(Imagine revision tools or flashcards here...)</em>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: "#efe",
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