// AcademicForm.jsx

import React, { useState } from "react";
// Import the necessary firebase storage methods
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase"; // <-- your firebase.js file

function AcademicForm({
  subStep,
  formData,
  handleInputChange,
  handleCourseChange,
  addExamDate,
  handleExamFieldChange,
  addNewCourse,
  storePdfLinkInState,
}) {
  //---- STYLES (same as before) ----
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
    const path = `academic.${fieldKey}`;
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

  // ---------------------------------------------
  // PDF Upload Handler
  // ---------------------------------------------
  const handlePdfUpload = async (file, courseIdx) => {
    try {
      if (!file) return;

      const categoryValue = "Academic"; // or from formData, e.g. formData.category


      // Create a unique storage path (e.g. using the course ID + file name)
      const courseId = formData.courseList[courseIdx].id;
      const storagePath = `pdfUploads/${courseId}/${file.name}`;

      // Create a reference in Storage
      const storageRef = ref(storage, storagePath);

      // ADD METADATA HERE:
      const metadata = {
        customMetadata: {
          category: categoryValue
        }
      };

      // Start upload
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      // You can also track progress here if desired:
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // progress function (optional)
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        (error) => {
          // error function
          console.error("Error uploading PDF:", error);
          alert("Failed to upload PDF. See console for details.");
        },
        async () => {
          // complete function
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log("File available at:", downloadURL);

          // Now store this URL in the parent state
          storePdfLinkInState(courseIdx, downloadURL);
          alert("PDF uploaded successfully!");
        }
      );
    } catch (err) {
      console.error("handlePdfUpload error:", err);
      alert("Failed to upload PDF file");
    }
  };

  // ---- Sub-step 1: Basic Details ----
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

  // ---- Sub-step 2: Courses ----
  const Step2_Courses = () => (
    <div style={sectionContainerStyle}>
      <h3 style={sectionHeadingStyle}>2. Courses / Subjects 📚</h3>
      <span style={helperTextStyle}>
        Currently, only 1 course is supported in this MVP.
      </span>

      {formData.courseList &&
        formData.courseList.map((course, courseIndex) => (
          <div
            key={course.id}
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              padding: "10px",
              borderRadius: "6px",
              marginBottom: "20px",
            }}
          >
            {/* Course Name */}
            <label>Course Name:</label>
            <input
              type="text"
              placeholder="e.g. Math 101"
              value={course.courseName}
              onChange={(e) => handleCourseChange(e, courseIndex, "courseName")}
              style={inputStyle}
            />

            {/* PDF Upload */}
            <label>Upload One PDF (Materials/Notes):</label>
            <span style={helperTextStyle}>
              Currently limited to 1 PDF. Feature to add more coming soon!
            </span>
            <input
              type="file"
              accept="application/pdf"
              disabled={!!course.pdfLink} 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handlePdfUpload(file, courseIndex);
                }
              }}
              style={{
                marginBottom: "10px",
                display: "block",
              }}
            />

            {/* Show uploaded PDF link if we have one */}
            {course.pdfLink && (
              <p>
                Uploaded PDF:{" "}
                <a
                  href={course.pdfLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#FFD700" }}
                >
                  View PDF
                </a>
              </p>
            )}

            {/* Exams */}
            <h5>Exam / Test Dates 🗓</h5>
            <span style={helperTextStyle}>
              Add exam or test dates for the AI to plan your content.
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
        disabled={formData.courseList.length >= 1}
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

  // ---- Sub-step 3: Time & Goals ----
  const Step3_TimeGoals = () => (
    <div style={sectionContainerStyle}>
      <h3 style={sectionHeadingStyle}>3. Time Commitment & Goals</h3>

      <label>⏰ Daily Hours:</label>
      <span style={helperTextStyle}>
        Helps the AI plan your study schedule effectively.
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

      <label>🎯 Preparation Goal:</label>
      <span style={helperTextStyle}>
        Share your goal so the AI can plan accordingly.
      </span>
      <select
        value={formData.preparationGoal}
        onChange={(e) => handleInputChange(e, "academic.preparationGoal")}
        style={selectStyle}
      >
        <option value="">Select</option>
        <option value="revise">Revise &amp; Refresh</option>
        <option value="start afresh">Start Afresh</option>
        <option value="deep mastery">Deep Mastery</option>
      </select>
    </div>
  );

  // ---- Sub-step 4: Additional Notes ----
  const Step4_AdditionalNotes = () => (
    <div style={sectionContainerStyle}>
      <h3 style={sectionHeadingStyle}>4. Additional Notes 📝</h3>
      <span style={helperTextStyle}>
        Let us know anything else that might help us personalize your plan.
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

      {subStep === 1 && <Step1_BasicDetails />}
      {subStep === 2 && <Step2_Courses />}
      {subStep === 3 && <Step3_TimeGoals />}
      {subStep === 4 && <Step4_AdditionalNotes />}

      {/* Navigation buttons are in the parent (LearnerPersonaForm). */}
    </div>
  );
}

export default AcademicForm;