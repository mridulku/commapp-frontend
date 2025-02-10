import React, { useState } from "react";

function AcademicForm() {
  // We store the entire form data in state for demonstration.
  // You can replace this with your own formData object if desired.
  const [formData, setFormData] = useState({
    educationLevel: "",
    country: "",
    schoolClass: "",
    collegeName: "",
    department: "",
    courseList: [
      {
        courseName: "",
        pdfFiles: [],       // We'll store uploaded PDF filenames here
        examDates: [
          {
            type: "",
            date: "",
          },
        ],
      },
    ],
    dailyHours: "",
    preparationGoal: "",
    additionalNote: "",
  });

  // Track which step (1–4) the user is on
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  //---- Navigation Handlers ----
  const goNext = () => {
    // If not on the last step, move to the next
    // Otherwise submit form
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const goBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  //---- Final Submit ----
  const handleSubmit = () => {
    // Here you can handle your final form submission
    // For the demo, just log the data and alert
    console.log("Submitting form data:", formData);
    alert("Form submitted! Check console for data.");
  };

  //---- Form Field Handlers ----
  // 1) Generic input change for top-level fields
  const handleInputChange = (event, fieldKey) => {
    setFormData((prev) => ({
      ...prev,
      [fieldKey]: event.target.value,
    }));
  };

  // 2) Tile-based selections (e.g., education level, country)
  const handleTileSelection = (value, fieldKey) => {
    setFormData((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  // 3) Course fields
  const handleCourseChange = (courseIndex, event, courseField) => {
    const newCourses = [...formData.courseList];
    newCourses[courseIndex][courseField] = event.target.value;
    setFormData((prev) => ({ ...prev, courseList: newCourses }));
  };

  // 4) Add new course
  const addNewCourse = () => {
    setFormData((prev) => ({
      ...prev,
      courseList: [
        ...prev.courseList,
        {
          courseName: "",
          pdfFiles: [],
          examDates: [{ type: "", date: "" }],
        },
      ],
    }));
  };

  // 5) Handle PDF upload (demo only: we store just file names)
  const handleUploadPDF = (courseIndex, event) => {
    const file = event.target.files?.[0];
    if (file) {
      const newCourses = [...formData.courseList];
      newCourses[courseIndex].pdfFiles.push(file.name);
      setFormData((prev) => ({ ...prev, courseList: newCourses }));
    }
  };

  // 6) Add new exam date
  const addExamDate = (courseIndex) => {
    const newCourses = [...formData.courseList];
    newCourses[courseIndex].examDates.push({ type: "", date: "" });
    setFormData((prev) => ({ ...prev, courseList: newCourses }));
  };

  // 7) Handle exam field changes
  const handleExamFieldChange = (courseIndex, examIndex, event, fieldKey) => {
    const newCourses = [...formData.courseList];
    newCourses[courseIndex].examDates[examIndex][fieldKey] = event.target.value;
    setFormData((prev) => ({ ...prev, courseList: newCourses }));
  };

  //---- Styling ----
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

  // Helper to render a tile
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

  //---- Render ----
  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "30px" }}>🎓 Academic Learner Form</h2>

      {/* STEP 1: BASIC DETAILS */}
      {currentStep === 1 && (
        <div style={sectionContainerStyle}>
          <h3 style={sectionHeadingStyle}>1. Basic Details</h3>
          <span style={helperTextStyle}>
            Please select your current education level and country.
          </span>

          {/* Education Level: Tile-based */}
          <label style={{ marginBottom: "5px" }}>Education Level:</label>
          <div style={tileContainerStyle}>
            {renderTile(
              "School",
              "school",
              formData.educationLevel,
              "educationLevel",
              "🏫"
            )}
            {renderTile(
              "College",
              "college",
              formData.educationLevel,
              "educationLevel",
              "🏢"
            )}
          </div>

          {/* Country: Tile-based */}
          <label style={{ marginBottom: "5px" }}>Country:</label>
          <div style={tileContainerStyle}>
            {renderTile(
              "India",
              "India",
              formData.country,
              "country",
              "🇮🇳"
            )}
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
                onChange={(e) => handleInputChange(e, "schoolClass")}
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
                onChange={(e) => handleInputChange(e, "collegeName")}
                style={inputStyle}
              />

              <label>Department or Major:</label>
              <input
                type="text"
                placeholder="e.g. Computer Science"
                value={formData.department}
                onChange={(e) => handleInputChange(e, "department")}
                style={inputStyle}
              />
            </>
          )}
        </div>
      )}

      {/* STEP 2: COURSES / SUBJECTS */}
      {currentStep === 2 && (
        <div style={sectionContainerStyle}>
          <h3 style={sectionHeadingStyle}>2. Courses / Subjects 📚</h3>
          <span style={helperTextStyle}>
            Please provide information about the courses/subjects you have this
            year/semester.
          </span>

          {formData.courseList.map((course, courseIndex) => (
            <div
              key={courseIndex}
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
                onChange={(e) =>
                  handleCourseChange(courseIndex, e, "courseName")
                }
                style={inputStyle}
              />

              {/* PDF Upload */}
              <label>Upload Materials (PDFs):</label>
              <span style={helperTextStyle}>
                You can upload all the materials you have for the course so the
                AI can create a personalized plan for you. Feel free to add more
                materials later as they become available.
              </span>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => handleUploadPDF(courseIndex, e)}
                style={{ marginBottom: "10px" }}
              />
              <ul style={{ listStyleType: "circle", marginLeft: "20px" }}>
                {course.pdfFiles.map((fileName, fileIdx) => (
                  <li key={fileIdx}>{fileName}</li>
                ))}
              </ul>

              {/* Exams */}
              <h5>Exam / Test Dates 🗓</h5>
              <span style={helperTextStyle}>
                Add exam or test dates so the AI can plan your content
                effectively. You can add more dates as you get them.
              </span>
              {course.examDates.map((examObj, examIdx) => (
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
                      handleExamFieldChange(courseIndex, examIdx, e, "type")
                    }
                    style={{ ...inputStyle, marginBottom: "5px" }}
                  />

                  <label>Date:</label>
                  <input
                    type="date"
                    value={examObj.date}
                    onChange={(e) =>
                      handleExamFieldChange(courseIndex, examIdx, e, "date")
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
      )}

      {/* STEP 3: TIME COMMITMENT & GOALS */}
      {currentStep === 3 && (
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
            onChange={(e) => handleInputChange(e, "dailyHours")}
            style={inputStyle}
          />

          <label>🎯 Overall Preparation Goal:</label>
          <span style={helperTextStyle}>
            Please share your current level of understanding so the AI can plan
            accordingly.
          </span>
          <select
            value={formData.preparationGoal}
            onChange={(e) => handleInputChange(e, "preparationGoal")}
            style={selectStyle}
          >
            <option value="">Select</option>
            <option value="revise">Revise & Refresh</option>
            <option value="start afresh">Start Afresh</option>
            <option value="deep mastery">Deep Mastery</option>
          </select>
        </div>
      )}

      {/* STEP 4: ADDITIONAL NOTES */}
      {currentStep === 4 && (
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
            onChange={(e) => handleInputChange(e, "additionalNote")}
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
      )}

      {/* NAVIGATION BUTTONS */}
      <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
        {/* Back button (only visible from step 2 onward) */}
        {currentStep > 1 && (
          <button
            type="button"
            onClick={goBack}
            style={{
              padding: "10px 20px",
              borderRadius: "4px",
              background: "#888",
              cursor: "pointer",
              border: "none",
              fontWeight: "bold",
            }}
          >
            ← Back
          </button>
        )}

        {/* One button to either go to the next step or submit on the last step */}
        <button
          type="button"
          onClick={goNext}
          style={{
            padding: "10px 20px",
            borderRadius: "4px",
            background: "#FFD700",
            cursor: "pointer",
            border: "none",
            fontWeight: "bold",
          }}
        >
          {currentStep < totalSteps ? "Next →" : "Submit"}
        </button>
      </div>
    </div>
  );
}

export default AcademicForm;