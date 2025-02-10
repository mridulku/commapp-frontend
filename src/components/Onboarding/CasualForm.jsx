import React from "react";

function CasualForm({
  formData,
  handleInputChange,
  handleBookChange,
  handleUploadPDF,
  addNewBook,
}) {
  // Common input/select styles
  const selectStyle = {
    width: "100%",
    padding: "10px",
    borderRadius: "4px",
    border: "none",
    outline: "none",
    fontSize: "1rem",
    marginBottom: "15px",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    borderRadius: "4px",
    border: "none",
    marginBottom: "15px",
    fontSize: "1rem",
  };

  // Section container style
  const sectionContainerStyle = {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: "20px",
    borderRadius: "6px",
    marginBottom: "20px",
  };

  // Section heading style
  const sectionHeadingStyle = {
    marginBottom: "10px",
    fontWeight: "bold",
  };

  // Helper text style
  const helperTextStyle = {
    fontStyle: "italic",
    color: "#eee",
    marginBottom: "10px",
    display: "block",
  };

  // Tile styles
  const tileContainerStyle = {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    flexWrap: "wrap",
  };

  const tileStyle = {
    display: "inline-block",
    padding: "10px 20px",
    borderRadius: "8px",
    backgroundColor: "rgba(255,255,255,0.1)",
    cursor: "pointer",
    textAlign: "center",
    transition: "background-color 0.2s ease-in-out",
    userSelect: "none",
  };

  const tileSelectedStyle = {
    backgroundColor: "#FFD700",
    color: "#333",
    fontWeight: "bold",
  };

  // Helper function for tile selection
  const renderTile = (label, value, currentValue, fieldKey, emoji = "") => {
    const isSelected = currentValue === value;
    return (
      <div
        style={{
          ...tileStyle,
          ...(isSelected ? tileSelectedStyle : {}),
        }}
        onClick={() =>
          handleInputChange({ target: { value } }, `casual.${fieldKey}`)
        }
      >
        {emoji} {label}
      </div>
    );
  };

  // Ensure at least one book/material is displayed
  const bookList =
    formData.bookList && formData.bookList.length > 0
      ? formData.bookList
      : [
          {
            title: "",
            pdfFiles: [],
          },
        ];

  return (
    <div>
      <h2 style={{ marginBottom: "30px" }}>🌱 Casual Learning Form</h2>

      {/* SECTION 1: BASIC DETAILS */}
      <div style={sectionContainerStyle}>
        <h3 style={sectionHeadingStyle}>1. Basic Details</h3>
        <span style={helperTextStyle}>
          What kind of topics are you interested in exploring?
        </span>

        <div style={tileContainerStyle}>
          {renderTile("Time Management", "Time Management", formData.topic, "topic", "⏰")}
          {renderTile("Productivity", "Productivity", formData.topic, "topic", "💡")}
          {renderTile("Mindfulness", "Mindfulness", formData.topic, "topic", "🧘")}
          {renderTile("Career Guidance", "Career Guidance", formData.topic, "topic", "🏢")}
          {renderTile("Personal Finance", "Personal Finance", formData.topic, "topic", "💰")}
          {renderTile("Other", "Other", formData.topic, "topic", "❓")}
        </div>

        {/* If 'Other' is selected */}
        {formData.topic === "Other" && (
          <div>
            <label>Other Topic:</label>
            <input
              type="text"
              placeholder="Please specify your interest"
              value={formData.otherTopic}
              onChange={(e) => handleInputChange(e, "casual.otherTopic")}
              style={inputStyle}
            />
          </div>
        )}
      </div>

      {/* SECTION 2: BOOKS / MATERIALS */}
      <div style={sectionContainerStyle}>
        <h3 style={sectionHeadingStyle}>2. Books / Materials 📚</h3>
        <span style={helperTextStyle}>
          Let us know which books or materials you're currently reading or plan
          to read. You can also upload related PDFs for the AI to personalize
          your learning journey.
        </span>

        {bookList.map((bookItem, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              padding: "10px",
              borderRadius: "6px",
              marginBottom: "20px",
            }}
          >
            <label>Book / Material Title:</label>
            <input
              type="text"
              placeholder="e.g. Atomic Habits, The Power of Habit..."
              value={bookItem.title}
              onChange={(e) => handleBookChange(e, idx, "title")}
              style={inputStyle}
            />

            {/* Upload Materials */}
            <label>Upload Materials (PDFs):</label>
            <button
              type="button"
              style={{
                marginBottom: "10px",
                display: "block",
                padding: "10px 20px",
                borderRadius: "4px",
                background: "#FFD700",
                cursor: "pointer",
                border: "none",
                fontWeight: "bold",
              }}
              onClick={() => handleUploadPDF(idx)}
            >
              📁 Upload PDF
            </button>
            <ul style={{ listStyleType: "circle", marginLeft: "20px" }}>
              {bookItem.pdfFiles.map((fileName, fileIdx) => (
                <li key={fileIdx}>{fileName}</li>
              ))}
            </ul>
          </div>
        ))}

        <button
          type="button"
          onClick={addNewBook}
          style={{
            marginBottom: "20px",
            display: "block",
            padding: "10px 20px",
            borderRadius: "4px",
            background: "#FFD700",
            cursor: "pointer",
            border: "none",
            fontWeight: "bold",
          }}
        >
          + Add Another Book/Material
        </button>
      </div>

      {/* SECTION 3: TIME COMMITMENT & GOALS */}
      <div style={sectionContainerStyle}>
        <h3 style={sectionHeadingStyle}>3. Time Commitment & Goals</h3>

        {/* Daily Hours */}
        <label>⏰ Daily Hours You Can Commit:</label>
        <span style={helperTextStyle}>
          Let us know how much time you can dedicate each day so the AI can
          tailor recommendations accordingly.
        </span>
        <input
          type="number"
          min="0"
          step="0.5"
          placeholder="e.g. 1"
          value={formData.dailyHours}
          onChange={(e) => handleInputChange(e, "casual.dailyHours")}
          style={inputStyle}
        />

        {/* Overall Personal Goal */}
        <label>🎯 Overall Personal Goal:</label>
        <span style={helperTextStyle}>
          What do you hope to achieve through these readings or activities?
        </span>
        <select
          value={formData.personalGoal}
          onChange={(e) => handleInputChange(e, "casual.personalGoal")}
          style={selectStyle}
        >
          <option value="">Select</option>
          <option value="improveKnowledge">Improve Knowledge</option>
          <option value="buildHabit">Build a Daily Habit</option>
          <option value="selfMastery">Self Mastery</option>
        </select>
      </div>

      {/* SECTION 4: ADDITIONAL NOTES */}
      <div style={sectionContainerStyle}>
        <h3 style={sectionHeadingStyle}>4. Additional Notes 📝</h3>
        <span style={helperTextStyle}>
          Any other details or personal preferences the AI should be aware of?
        </span>
        <textarea
          rows={3}
          placeholder="Anything else you'd like us to know?"
          value={formData.additionalNote}
          onChange={(e) => handleInputChange(e, "casual.additionalNote")}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "4px",
            marginBottom: "20px",
            border: "none",
            fontSize: "1rem",
          }}
        />
      </div>
    </div>
  );
}

export default CasualForm;