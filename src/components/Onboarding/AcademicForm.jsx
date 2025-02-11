import React from "react";

function AcademicForm({
  // props passed from the parent (LearnerPersonaForm)
  subStep,
  formData,
  handleInputChange,
  handleCourseChange,
  handleUploadPDF,
  addExamDate,
  handleExamFieldChange,
  addNewCourse,
}) {
  //---- Styling constants (same as before) ----
  const sectionContainerStyle = {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: "20px",
    borderRadius: "6px",
    marginBottom: "20px",
  };

  const sectionHeadingStyle = {
    marginBottom: "10px",
    fontWeight: "bold",
  };

  const helperTextStyle = {
    fontStyle: "italic",
    color: "#eee",
    marginBottom: "10px",
    display: "block",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    borderRadius: "4px",
    border: "none",
    marginBottom: "15px",
    fontSize: "1rem",
  };

  const selectStyle = {
    width: "100%",
    padding: "10px",
    borderRadius: "4px",
    border: "none",
    fontSize: "1rem",
    marginBottom: "15px",
  };

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

  // Helper to choose tile
  const handleTileSelection = (value, fieldKey) => {
    // We'll re-use the parent's handleInputChange, which requires a "path"
    // like "academic.educationLevel". So we can do:
    const path = `academic.${fieldKey}`;
    // Mock an event object
    const mockEvent = { target: { value } };
    handleInputChange(mockEvent, path);
  };

  const renderTile = (label, value, currentValue, fieldKey, emoji = "") => {
    const isSelected = currentValue === value;
    return (
      <div
        style={{
          ...tileStyle,
          ...(isSelected ? tileSelectedStyle : {}),
        }}
        onClick={() => handleTileSelection(value, fieldKey)}
      >
        {emoji} {label}
      </div>
    );
  };

  // ---- RENDER the correct sub-section based on subStep ----

  // STEP 1 content
  const Step1_BasicDetails = () => (
    <div style={sectionContainerStyle}>
      <h3 style={sectionHeadingStyle}>1. Basic Details</h3>
      <span style={helperTextStyle}>
        Please select your current education level and country.
      </span>

      {/* Education Level: Tile-based */}
      <label style={{ marginBottom: "5px" }}>Education Level:</label>
      <div style={tileContainerStyle}>
        {renderTile("School", "school", formData.educationLevel, "educationLevel", "🏫")}
        {renderTile("College", "college", formData.educationLevel, "educationLevel", "🏢")}
      </div>

      {/* Country: Tile-based */}
      <label style={{ marginBottom: "5px" }}>Country:</label>
      <div style={tileContainerStyle}>
        {renderTile("India", "India", formData.country, "country", "🇮🇳")}
        {renderTile("US", "US", formData.country, "country", "🇺🇸")}
      </div>

      {/* If School is selected */}
      {formData.educationLevel === "school" && (
        <>
          <label>Which Class/Grade:</label>
          <input
            type="text"
            placeholder="e.g. 9th grade, 12th grade..."
            value={formData.schoolClass}
            onChange={(e) => handleInputChange(e, "academic.schoolClass")}
            style={inputStyle}
          />
        </>
      )}

      {/* If College is selected */}
      {formData.educationLevel === "college" && (
        <>
          <label>College Name:</label>
          <input
            type="text"
            placeholder="e.g. XYZ University"
            value={formData.collegeName}
            onChange={(e) => handleInputChange(e, "academic.collegeName")}
            style={inputStyle}
          />

          <label>Department or Major:</label>
          <input
            type="text"
            placeholder="e.g. Computer Science"
            value={formData.department}
            onChange={(e) => handleInputChange(e, "academic.department")}
            style={inputStyle}
          />
        </>
      )}
    </div>
  );

  // STEP 2 content
  const Step2_Courses = () => (
    <div style={sectionContainerStyle}>
      <h3 style={sectionHeadingStyle}>2. Courses / Subjects 📚</h3>
      <span style={helperTextStyle}>
        Please provide information about the courses/subjects you have this
        year/semester.
      </span>

      {formData.courseList && formData.courseList.map((course, courseIndex) => (
        <div
          // Use a stable, unique id for each course
          key={course.id} 
          style={{
            backgroundColor: "rgba(255,255,255,0.1)",
            padding: "10px",
            borderRadius: "6px",
            marginBottom: "20px",
          }}
        >
          <label>Course Name:</label>
          <input
            type="text"
            placeholder="e.g. Math 101"
            value={course.courseName}
            onChange={(e) => handleCourseChange(e, courseIndex, "courseName")}
            style={inputStyle}
          />

          {/* PDF Upload */}
          <label>Upload Materials (PDFs):</label>
          <span style={helperTextStyle}>
            You can upload all the materials you have for the course so the
            AI can create a personalized plan for you.
          </span>
          {/* In a real app, you'd use onChange for <input type="file"> */}
          <button
            type="button"
            onClick={() => handleUploadPDF(courseIndex)}
            style={{
              padding: "6px 12px",
              borderRadius: "4px",
              background: "#999",
              cursor: "pointer",
              border: "none",
              marginBottom: "10px",
            }}
          >
            Simulate PDF Upload
          </button>
          <ul style={{ listStyleType: "circle", marginLeft: "20px" }}>
            {course.pdfFiles?.map((fileName, fileIdx) => (
              <li key={fileIdx}>{fileName}</li>
            ))}
          </ul>

          {/* Exams */}
          <h5>Exam / Test Dates 🗓</h5>
          <span style={helperTextStyle}>
            Add exam or test dates so the AI can plan your content effectively.
          </span>
          {course.examDates?.map((examObj, examIdx) => (
            <div
              key={examIdx}
              style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                padding: "5px",
                borderRadius: "4px",
                marginBottom: "5px",
              }}
            >
              <label>Type of Exam:</label>
              <input
                type="text"
                placeholder="e.g. Final, Quiz"
                value={examObj.type}
                onChange={(e) =>
                  handleExamFieldChange(e, courseIndex, examIdx, "type")
                }
                style={{ ...inputStyle, marginBottom: "5px" }}
              />

              <label>Date:</label>
              <input
                type="date"
                value={examObj.date}
                onChange={(e) =>
                  handleExamFieldChange(e, courseIndex, examIdx, "date")
                }
                style={{ ...inputStyle, marginBottom: "5px" }}
              />
            </div>
          ))}

          <button
            type="button"
            onClick={() => addExamDate(courseIndex)}
            style={{
              padding: "6px 12px",
              borderRadius: "4px",
              background: "#999",
              cursor: "pointer",
              border: "none",
              marginBottom: "10px",
            }}
          >
            + Add Another Exam
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addNewCourse}
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
        + Add Another Course
      </button>
    </div>
  );

  // STEP 3 content
  const Step3_TimeGoals = () => (
    <div style={sectionContainerStyle}>
      <h3 style={sectionHeadingStyle}>3. Time Commitment & Goals</h3>

      <label>⏰ Daily Hours You Can Commit:</label>
      <span style={helperTextStyle}>
        This information helps the AI plan your study schedule effectively.
      </span>
      <input
        type="number"
        min="0"
        step="0.5"
        placeholder="e.g. 2"
        value={formData.dailyHours}
        onChange={(e) => handleInputChange(e, "academic.dailyHours")}
        style={inputStyle}
      />

      <label>🎯 Overall Preparation Goal:</label>
      <span style={helperTextStyle}>
        Please share your goal so the AI can plan accordingly.
      </span>
      <select
        value={formData.preparationGoal}
        onChange={(e) => handleInputChange(e, "academic.preparationGoal")}
        style={selectStyle}
      >
        <option value="">Select</option>
        <option value="revise">Revise & Refresh</option>
        <option value="start afresh">Start Afresh</option>
        <option value="deep mastery">Deep Mastery</option>
      </select>
    </div>
  );

  // STEP 4 content
  const Step4_AdditionalNotes = () => (
    <div style={sectionContainerStyle}>
      <h3 style={sectionHeadingStyle}>4. Additional Notes 📝</h3>
      <span style={helperTextStyle}>
        Let us know anything else that might help the AI create a more
        personalized plan for you.
      </span>
      <textarea
        rows={3}
        placeholder="Anything else you'd like us to know?"
        value={formData.additionalNote}
        onChange={(e) => handleInputChange(e, "academic.additionalNote")}
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
  );

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "30px" }}>🎓 Academic Learner Form</h2>

      {/* Render whichever sub-step is active */}
      {subStep === 1 && <Step1_BasicDetails />}
      {subStep === 2 && <Step2_Courses />}
      {subStep === 3 && <Step3_TimeGoals />}
      {subStep === 4 && <Step4_AdditionalNotes />}

      {/* No buttons here! 
          The parent LearnerPersonaForm handles Next/Back/Submit */}
    </div>
  );
}

export default AcademicForm;