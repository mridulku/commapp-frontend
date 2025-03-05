import React from "react";

export default function ReviseView({ activity }) {
  return (
    <div style={styles.container}>
      <h3 style={{ margin: 0, marginBottom: "8px" }}>Revise / Flashcards View</h3>
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
    // Full dark background, white text
    width: "100%",
    height: "100%",
    backgroundColor: "#000", 
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    padding: "20px",
    boxSizing: "border-box",
  },
  placeholder: {
    marginTop: 10,
    backgroundColor: "#222",
    padding: 8,
    borderRadius: 4,
  },
};