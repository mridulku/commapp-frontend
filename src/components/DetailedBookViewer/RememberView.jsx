// RememberView.jsx
import React from "react";

export default function RememberView({ activity }) {
  return (
    <div style={styles.outerContainer}>
      <div style={styles.quizContentArea}>
        <h2 style={{ marginBottom: "1rem" }}>
          [Remember View] SubChapter ID: {activity.subChapterId}
        </h2>
        <p>
          This is placeholder content for the <strong>Remember</strong> stage. 
          You can place GPT quiz logic here or in a shared helper.
        </p>
      </div>
    </div>
  );
}

const styles = {
  outerContainer: {
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    padding: "20px",
    fontFamily: `'Inter', 'Roboto', sans-serif`,
  },
  quizContentArea: {
    flex: 1,
    overflowY: "auto",
    maxWidth: "60ch",
    margin: "0 auto",
    lineHeight: 1.6,
    fontSize: "1rem",
  },
};