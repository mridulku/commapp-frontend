// src/components/DetailedBookViewer/AdaptiveHome.jsx
import React from "react";

function AdaptiveHome({ booksData = [] }) {
  return (
    <div style={homeContainerStyle}>
      <h2 style={{ marginTop: 0 }}>Adaptive Sessions</h2>
      <p style={{ fontStyle: "italic", opacity: 0.8 }}>
        Select a book from the sidebar to explore adaptive sessions or subchapters.
      </p>

      {booksData.length === 0 ? (
        <div style={noBooksStyle}>No adaptive books found.</div>
      ) : (
        <div style={booksGridStyle}>
          {booksData.map((book) => (
            <div key={book.bookName} style={bookCardStyle}>
              <span role="img" aria-label="book" style={bookIconStyle}>
                🔖
              </span>
              <div style={bookTitleStyle}>{book.bookName}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Styles
const homeContainerStyle = {
  backgroundColor: "rgba(255,255,255,0.1)",
  backdropFilter: "blur(6px)",
  padding: "20px",
  borderRadius: "8px",
  color: "#fff",
  fontFamily: "'Open Sans', sans-serif",
};

const noBooksStyle = {
  marginTop: "20px",
  padding: "10px",
  backgroundColor: "rgba(255,255,255,0.2)",
  borderRadius: "6px",
  textAlign: "center",
};

const booksGridStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "15px",
  marginTop: "20px",
};

const bookCardStyle = {
  backgroundColor: "rgba(255,255,255,0.2)",
  padding: "10px 15px",
  borderRadius: "6px",
  minWidth: "150px",
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const bookIconStyle = {
  fontSize: "2rem",
  marginBottom: "5px",
};

const bookTitleStyle = {
  fontWeight: "bold",
  color: "#FFD700",
};

export default AdaptiveHome;