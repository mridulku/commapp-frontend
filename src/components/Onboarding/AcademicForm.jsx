import React, { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage,auth } from "../../firebase"; // your firebase.js file


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
  // ---------- STYLES (unchanged) ----------
  const sectionContainerStyle = {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: "20px",
    borderRadius: "6px",
    marginBottom: "20px",
  };
  const sectionHeadingStyle = { marginBottom: "10px", fontWeight: "bold" };
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

  // ---------- STATE for selected files ----------
  // We'll store the PDF files in an array that parallels your courseList
  // e.g. selectedFiles[courseIndex] = File object
  const [selectedFiles, setSelectedFiles] = useState([]);

  // ---------- TILES Helper (unchanged) ----------
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

  // ---------- PDF Upload on *final submission* ----------
  // Instead of uploading onChange, we'll do the actual upload here
  // passing metadata like "category" and "courseName".
  const uploadPDFwithMetadata = async (file, courseName, categoryValue) => {
    return new Promise((resolve, reject) => {
      try {
        // Unique path
        const storagePath = `pdfUploads/${courseName}/${file.name}`;
        const storageRef = ref(storage, storagePath);
//        const currentUser = auth.currentUser;


        const user = auth.currentUser;


        // Metadata example
        const metadata = {
          customMetadata: {
            category: categoryValue,
            courseName: courseName,
            userId: user?.uid, // directly use the user's UID

//            userid: currentUser,
          },
        };

        const uploadTask = uploadBytesResumable(storageRef, file, metadata);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`${courseName} PDF upload is ${progress}% done`);
          },
          (error) => {
            console.error("Error uploading PDF:", error);
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log(`${courseName} PDF available at:`, downloadURL);
            resolve(downloadURL);
          }
        );
      } catch (err) {
        reject(err);
      }
    });
  };

  // ---------- Final Submission Handler ----------
  // This is an example of how you might do a "submit" that:
  // 1) Uploads PDFs for each course that has a selected file
  // 2) Then calls storePdfLinkInState or does final form logic
  const handleFinalSubmit = async () => {
    try {
      // Example: We'll assume "academic" is the categoryValue
      // (or you can read from formData if you have a specific field)
      const categoryValue = "Academic";

      for (let i = 0; i < formData.courseList.length; i++) {
        const course = formData.courseList[i];
        const file = selectedFiles[i]; // The file the user picked for this course
        if (file) {
          // Do the upload
          const dlURL = await uploadPDFwithMetadata(
            file,
            course.courseName || `Course${i + 1}`,
            categoryValue
          );
          // Once uploaded, store the link in your parent state
          storePdfLinkInState(i, dlURL);
        }
      }

      alert("All PDFs uploaded (if any) and final form submission done!");
      // Next, you might do more logic: e.g. save the entire form to Firestore or call an API.

    } catch (err) {
      console.error("handleFinalSubmit error:", err);
      alert("Error in final submission. Check console.");
    }
  };

  // ---------- onFileSelect (instead of immediate upload) ----------
  const handleFileSelect = (file, courseIndex) => {
    if (!file) return;
    // Store the file in local state so we can upload later
    setSelectedFiles((prev) => {
      const updated = [...prev];
      updated[courseIndex] = file;
      return updated;
    });
  };

  // ---------- Steps: Basic, Courses, etc. (unchanged except for the file input) ----------
  const Step1_BasicDetails = () => (
    <div style={sectionContainerStyle}>
      <h3 style={sectionHeadingStyle}>1. Basic Details</h3>
      <span style={helperTextStyle}>
        Please select your current education level and country.
      </span>

      <label style={{ marginBottom: "5px" }}>Education Level:</label>
      <div style={tileContainerStyle}>
        {renderTile("School", "school", formData.educationLevel, "educationLevel", "🏫")}
        {renderTile("College", "college", formData.educationLevel, "educationLevel", "🏢")}
      </div>

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
            <label>Course Name:</label>
            <input
              type="text"
              placeholder="e.g. Math 101"
              value={course.courseName}
              onChange={(e) => handleCourseChange(e, courseIndex, "courseName")}
              style={inputStyle}
            />

            <label>Attach One PDF (Materials/Notes):</label>
            <span style={helperTextStyle}>
              Will be uploaded on final form submission.
            </span>
            <input
              type="file"
              accept="application/pdf"
              disabled={!!course.pdfLink} // if we already have a link, disable
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Instead of uploading immediately, we just store the file
                  handleFileSelect(file, courseIndex);
                }
              }}
              style={{
                marginBottom: "10px",
                display: "block",
              }}
            />

            {/* Show "File selected" or "Uploaded link" */}
            {selectedFiles[courseIndex] && !course.pdfLink && (
              <p style={{ color: "#FFD700" }}>
                File selected: {selectedFiles[courseIndex].name}
              </p>
            )}
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

      {/* Example "Finalize" button here to show how you'd do it:
          (In your real code, you might have it in the parent component or after subStep=4) */}
      {subStep === 4 && (
        <button
          type="button"
          onClick={handleFinalSubmit}
          style={{
            display: "block",
            margin: "20px 0",
            padding: "10px 20px",
            background: "#FFD700",
            border: "none",
            borderRadius: "4px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Submit All (Upload PDFs + Save Form)
        </button>
      )}
    </div>
  );
}

export default AcademicForm;