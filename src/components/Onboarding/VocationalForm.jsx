import React from "react";

function VocationalForm({
  formData,
  handleInputChange,
  handleModuleChange,    // Similar to handleCourseChange/handleSubjectChange in previous forms
  handleUploadPDF,
  addMilestoneDate,      // Similar to addExamDate
  handleMilestoneFieldChange, // Similar to handleExamFieldChange
  addNewModule,
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

  // Tile styles for skill selection
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
          handleInputChange({ target: { value } }, `vocational.${fieldKey}`)
        }
      >
        {emoji} {label}
      </div>
    );
  };

  // Ensure at least one module is always displayed
  const moduleList =
    formData.moduleList && formData.moduleList.length > 0
      ? formData.moduleList
      : [
          {
            moduleName: "",
            pdfFiles: [],
            milestones: [],
          },
        ];

  return (
    <div>
      <h2 style={{ marginBottom: "30px" }}>🔧 Vocational Skills Form</h2>

      {/* SECTION 1: BASIC DETAILS */}
      <div style={sectionContainerStyle}>
        <h3 style={sectionHeadingStyle}>1. Basic Details</h3>
        <span style={helperTextStyle}>
          Please select the skill you are currently learning:
        </span>

        <div style={tileContainerStyle}>
          {renderTile("Coding", "Coding", formData.skill, "skill", "💻")}
          {renderTile("Communication", "Communication", formData.skill, "skill", "🗣")}
          {renderTile("Product Management", "Product Management", formData.skill, "skill", "📋")}
          {renderTile("Design", "Design", formData.skill, "skill", "🎨")}
        </div>
      </div>

      {/* SECTION 2: FOCUS MODULES */}
      <div style={sectionContainerStyle}>
        <h3 style={sectionHeadingStyle}>2. Focus Modules 📚</h3>
        <span style={helperTextStyle}>
          List the specific modules or areas of focus you plan to work on for this skill. 
          You can upload any relevant materials (PDFs, guides, references, etc.) to help the AI build a personalized plan.
        </span>

        {moduleList.map((moduleItem, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              padding: "10px",
              borderRadius: "6px",
              marginBottom: "20px",
            }}
          >
            <label>Module Name:</label>
            <input
              type="text"
              placeholder="e.g. React Basics, UX Principles, etc."
              value={moduleItem.moduleName}
              onChange={(e) => handleModuleChange(e, idx, "moduleName")}
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
              {moduleItem.pdfFiles.map((fileName, fileIdx) => (
                <li key={fileIdx}>{fileName}</li>
              ))}
            </ul>

            {/* Milestones / Deadlines */}
            <h5>Milestones / Deadlines 🗓</h5>
            <span style={helperTextStyle}>
              If you have specific project deadlines or checkpoints for this module, 
              add them here so the AI can plan accordingly.
            </span>
            {moduleItem.milestones.map((milestoneObj, milestoneIdx) => (
              <div
                key={milestoneIdx}
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  padding: "5px",
                  borderRadius: "4px",
                  marginBottom: "5px",
                }}
              >
                <label>Milestone Name:</label>
                <input
                  type="text"
                  placeholder="e.g. Complete Project Outline, Practice Pitch"
                  value={milestoneObj.name}
                  onChange={(e) =>
                    handleMilestoneFieldChange(e, idx, milestoneIdx, "name")
                  }
                  style={{ ...inputStyle, marginBottom: "5px" }}
                />

                <label>Date:</label>
                <input
                  type="date"
                  value={milestoneObj.date}
                  onChange={(e) =>
                    handleMilestoneFieldChange(e, idx, milestoneIdx, "date")
                  }
                  style={{ ...inputStyle, marginBottom: "5px" }}
                />
              </div>
            ))}

            <button
              type="button"
              onClick={() => addMilestoneDate(idx)}
              style={{
                padding: "6px 12px",
                borderRadius: "4px",
                background: "#999",
                cursor: "pointer",
                border: "none",
                marginBottom: "10px",
              }}
            >
              + Add Another Milestone
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addNewModule}
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
          + Add Another Module
        </button>
      </div>

      {/* SECTION 3: TIME COMMITMENT & GOALS */}
      <div style={sectionContainerStyle}>
        <h3 style={sectionHeadingStyle}>3. Time Commitment & Goals</h3>

        {/* Daily Hours */}
        <label>⏰ Daily Hours You Can Commit:</label>
        <span style={helperTextStyle}>
          This helps the AI plan your progress schedule effectively.
        </span>
        <input
          type="number"
          min="0"
          step="0.5"
          placeholder="e.g. 2"
          value={formData.dailyHours}
          onChange={(e) => handleInputChange(e, "vocational.dailyHours")}
          style={inputStyle}
        />

        {/* Overall Preparation Goal */}
        <label>🎯 Overall Learning Goal:</label>
        <span style={helperTextStyle}>
          Please share your main objective or the level of mastery you aim to reach.
        </span>
        <select
          value={formData.learningGoal}
          onChange={(e) => handleInputChange(e, "vocational.learningGoal")}
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
        <h3 style={sectionHeadingStyle}>4. Additional Notes 📝</h3>
        <span style={helperTextStyle}>
          Let us know anything else that might help the AI create a more customized plan for your skill development.
        </span>
        <textarea
          rows={3}
          placeholder="Anything else you'd like us to know?"
          value={formData.additionalNote}
          onChange={(e) => handleInputChange(e, "vocational.additionalNote")}
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

export default VocationalForm;