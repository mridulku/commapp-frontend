import React from "react";

export default function QuizView({ activity }) {
  return (
    <div style={styles.container}>
      <h3>Quiz View</h3>
      <p>SubChapter: {activity.subChapterId || "N/A"}</p>
      <p>Type: {activity.type}</p>
      <div style={styles.placeholder}>
        <em>(Insert GPT-based quiz logic here...)</em>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: "#ffe",
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