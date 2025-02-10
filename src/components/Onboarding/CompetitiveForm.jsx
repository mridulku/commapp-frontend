import React from "react";

function CompetitiveForm({
  formData,
  handleInputChange,
  handleSubjectChange,
  handleUploadPDF,
  addExamDate,
  handleExamFieldChange,
  addNewSubject,
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

  // Tile styles for exam selection
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
          handleInputChange({ target: { value } }, `competitive.${fieldKey}`)
        }
      >
        {emoji} {label}
      </div>
    );
  };

  // Ensure at least one subject is always displayed
  const subjectList =
    formData.subjectList && formData.subjectList.length > 0
      ? formData.subjectList
      : [
          {
            subjectName: "",
            pdfFiles: [],
            examDates: [],
          },
        ];

  return (
    <div>
      <h2 style={{ marginBottom: "30px" }}>🏆 Competitive Exam Form</h2>

      {/* SECTION 1: BASIC DETAILS */}
      <div style={sectionContainerStyle}>
        <h3 style={sectionHeadingStyle}>1. Basic Details</h3>
        <span style={helperTextStyle}>
          Please select the exam you are preparing for:
        </span>

        {/* Exam Selection: Tile-based */}
        <div style={tileContainerStyle}>
          {renderTile("UPSC", "UPSC", formData.exam, "exam", "📜")}
          {renderTile("GRE", "GRE", formData.exam, "exam", "✈️")}
          {renderTile("SAT", "SAT", formData.exam, "exam", "🎓")}
          {renderTile("JEE Advanced", "JEE Advanced", formData.exam, "exam", "🧪")}
          {renderTile("Other", "Other", formData.exam, "exam", "❓")}
        </div>

        {/* If 'Other' exam is selected */}
        {formData.exam === "Other" && (
          <div>
            <label>Other Exam Name:</label>
            <input
              type="text"
              placeholder="Please specify the exam"
              value={formData.otherExamName}
              onChange={(e) => handleInputChange(e, "competitive.otherExamName")}
              style={inputStyle}
            />
          </div>
        )}
      </div>

      {/* SECTION 2: SUBJECTS */}
      <div style={sectionContainerStyle}>
        <h3 style={sectionHeadingStyle}>2. Subjects 📚</h3>
        <span style={helperTextStyle}>
          Please list the subjects you need to prepare for this exam. You can
          also upload any study materials (PDFs) you have for each subject to
          help the AI create a personalized plan.
        </span>

        {subjectList.map((subjectItem, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              padding: "10px",
              borderRadius: "6px",
              marginBottom: "20px",
            }}
          >
            <label>Subject Name:</label>
            <input
              type="text"
              placeholder="e.g. Quantitative Aptitude"
              value={subjectItem.subjectName}
              onChange={(e) => handleSubjectChange(e, idx, "subjectName")}
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
              {subjectItem.pdfFiles.map((fileName, fileIdx) => (
                <li key={fileIdx}>{fileName}</li>
              ))}
            </ul>

            {/* Exam / Test Dates */}
            <h5>Exam / Test Dates 🗓</h5>
            <span style={helperTextStyle}>
              If there are any specific test or practice dates for this subject,
              add them here so the AI can plan effectively.
            </span>
            {subjectItem.examDates.map((examObj, examIdx) => (
              <div
                key={examIdx}
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  padding: "5px",
                  borderRadius: "4px",
                  marginBottom: "5px",
                }}
              >
                <label>Type of Test:</label>
                <input
                  type="text"
                  placeholder="e.g. Mock Test, Sectional Test"
                  value={examObj.type}
                  onChange={(e) =>
                    handleExamFieldChange(e, idx, examIdx, "type")
                  }
                  style={{ ...inputStyle, marginBottom: "5px" }}
                />

                <label>Date:</label>
                <input
                  type="date"
                  value={examObj.date}
                  onChange={(e) =>
                    handleExamFieldChange(e, idx, examIdx, "date")
                  }
                  style={{ ...inputStyle, marginBottom: "5px" }}
                />
              </div>
            ))}

            <button
              type="button"
              onClick={() => addExamDate(idx)}
              style={{
                padding: "6px 12px",
                borderRadius: "4px",
                background: "#999",
                cursor: "pointer",
                border: "none",
                marginBottom: "10px",
              }}
            >
              + Add Another Test Date
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addNewSubject}
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
          + Add Another Subject
        </button>
      </div>

      {/* SECTION 3: TIME COMMITMENT & GOALS */}
      <div style={sectionContainerStyle}>
        <h3 style={sectionHeadingStyle}>
          3. Time Commitment & Goals
        </h3>

        {/* Daily Hours */}
        <label>⏰ Daily Hours You Can Commit:</label>
        <span style={helperTextStyle}>
          This helps the AI plan your study schedule effectively.
        </span>
        <input
          type="number"
          min="0"
          step="0.5"
          placeholder="e.g. 2"
          value={formData.dailyHours}
          onChange={(e) => handleInputChange(e, "competitive.dailyHours")}
          style={inputStyle}
        />

        {/* Overall Preparation Goal */}
        <label>🎯 Overall Preparation Goal:</label>
        <span style={helperTextStyle}>
          Please share your current level of understanding or your main focus
          areas so the AI can plan effectively.
        </span>
        <select
          value={formData.preparationGoal}
          onChange={(e) => handleInputChange(e, "competitive.preparationGoal")}
          style={selectStyle}
        >
          <option value="">Select</option>
          <option value="revise">Revise & Refresh</option>
          <option value="start afresh">Start Afresh</option>
          <option value="deep mastery">Deep Mastery</option>
        </select>
      </div>

      {/* SECTION 4: ADDITIONAL NOTES */}
      <div style={sectionContainerStyle}>
        <h3 style={sectionHeadingStyle}>
          4. Additional Notes 📝
        </h3>
        <span style={helperTextStyle}>
          Anything else you'd like to share that might help the AI customize
          your study plan?
        </span>
        <textarea
          rows={3}
          placeholder="Additional information..."
          value={formData.additionalNote}
          onChange={(e) => handleInputChange(e, "competitive.additionalNote")}
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

export default CompetitiveForm;