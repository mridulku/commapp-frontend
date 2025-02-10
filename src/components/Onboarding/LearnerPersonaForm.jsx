import React, { useState } from "react";
import axios from "axios"; // or any request library

// Import our new subform components
import AcademicForm from "./AcademicForm";
import CompetitiveForm from "./CompetitiveForm";
import VocationalForm from "./VocationalForm";
import CasualForm from "./CasualForm";

function LearnerPersonaForm() {
  const [step, setStep] = useState(1); // Step 1 = choose category, Step 2 = fill out form
  const [category, setCategory] = useState("");

  // Main form data object
  const [formData, setFormData] = useState({
    academic: {
      educationLevel: "",
      country: "",
      schoolClass: "",
      collegeName: "",
      department: "",
      examOrCourses: [],
      examTimeline: "",
      dailyHours: "",
      preparationGoal: "",
      courseList: [],
      additionalNote: "",
    },
    competitive: {
      country: "",
      examName: "",
      examTimeline: "",
      dailyHours: "",
      preparationGoal: "",
    },
    vocational: {
      skillDomain: "",
      subSkills: [],
      dailyHours: "",
      preparationGoal: "",
    },
    casual: {
      interests: [],
      dailyHours: "",
      preparationGoal: "",
    },
  });

  // ================ HANDLERS ================
  const handleCategorySelect = (selected) => {
    setCategory(selected);
    setStep(2);
  };

  // Helper for simple path-based updates (e.g. "academic.dailyHours")
  const handleInputChange = (e, path) => {
    const [mainKey, subKey] = path.split(".");
    setFormData((prev) => ({
      ...prev,
      [mainKey]: {
        ...prev[mainKey],
        [subKey]: e.target.value,
      },
    }));
  };

  // Multi-select toggles
  const handleMultiSelectChange = (value, path) => {
    const [mainKey, subKey] = path.split(".");
    setFormData((prev) => {
      const currentArray = prev[mainKey][subKey] || [];
      if (currentArray.includes(value)) {
        // remove
        return {
          ...prev,
          [mainKey]: {
            ...prev[mainKey],
            [subKey]: currentArray.filter((item) => item !== value),
          },
        };
      } else {
        // add
        return {
          ...prev,
          [mainKey]: {
            ...prev[mainKey],
            [subKey]: [...currentArray, value],
          },
        };
      }
    });
  };

  // ============ ACADEMIC: Specialized handlers ============
  const addNewCourse = () => {
    setFormData((prev) => ({
      ...prev,
      academic: {
        ...prev.academic,
        courseList: [
          ...prev.academic.courseList,
          { courseName: "", pdfFiles: [], examDates: [{ type: "", date: "" }] },
        ],
      },
    }));
  };

  const handleCourseChange = (e, courseIdx, field) => {
    const newValue = e.target.value;
    setFormData((prev) => {
      const updatedCourses = [...prev.academic.courseList];
      updatedCourses[courseIdx] = {
        ...updatedCourses[courseIdx],
        [field]: newValue,
      };
      return {
        ...prev,
        academic: {
          ...prev.academic,
          courseList: updatedCourses,
        },
      };
    });
  };

  const handleUploadPDF = (courseIdx) => {
    // Here you'd open a file picker or something.
    // For demonstration, we just push a placeholder
    const fakeFileName = "example.pdf";
    setFormData((prev) => {
      const updatedCourses = [...prev.academic.courseList];
      updatedCourses[courseIdx] = {
        ...updatedCourses[courseIdx],
        pdfFiles: [...updatedCourses[courseIdx].pdfFiles, fakeFileName],
      };
      return {
        ...prev,
        academic: {
          ...prev.academic,
          courseList: updatedCourses,
        },
      };
    });
  };

  const addExamDate = (courseIdx) => {
    setFormData((prev) => {
      const updatedCourses = [...prev.academic.courseList];
      updatedCourses[courseIdx] = {
        ...updatedCourses[courseIdx],
        examDates: [...updatedCourses[courseIdx].examDates, { type: "", date: "" }],
      };
      return {
        ...prev,
        academic: {
          ...prev.academic,
          courseList: updatedCourses,
        },
      };
    });
  };

  const handleExamFieldChange = (e, courseIdx, examIdx, field) => {
    const newValue = e.target.value;
    setFormData((prev) => {
      const updatedCourses = [...prev.academic.courseList];
      const updatedExamDates = [...updatedCourses[courseIdx].examDates];

      updatedExamDates[examIdx] = {
        ...updatedExamDates[examIdx],
        [field]: newValue,
      };

      updatedCourses[courseIdx].examDates = updatedExamDates;
      return {
        ...prev,
        academic: {
          ...prev.academic,
          courseList: updatedCourses,
        },
      };
    });
  };

  // ============ Submission ============
  const handleSubmit = async () => {
    try {
      const payload = {
        category,
        answers: formData[category],
      };
      console.log("Submitting payload:", payload);

      // Example (uncomment and change to your backend):
      // await axios.post("https://your-backend.com/api/onboard", payload);

      alert("Form submitted successfully (check console for payload).");
    } catch (err) {
      console.error("Submission error:", err);
      alert("Failed to submit form. Check console for details.");
    }
  };

  // ============ STEP 1: Category selection ============
  if (step === 1) {
    // tileStyle for the selection tiles
    const tileStyle = {
      backgroundColor: "#333",
      borderRadius: "8px",
      padding: "20px",
      cursor: "pointer",
      transition: "transform 0.3s",
      textAlign: "left",
    };

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0F2027, #203A43, #2C5364)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "'Open Sans', sans-serif",
          color: "#fff",
          padding: "20px",
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(8px)",
            borderRadius: "10px",
            padding: "40px",
            maxWidth: "600px",
            width: "100%",
            textAlign: "center",
          }}
        >
          <h1 style={{ marginBottom: "20px" }}>Choose Your Learner Type</h1>
          <p style={{ fontSize: "1.1rem", marginBottom: "30px", lineHeight: 1.6 }}>
            How would you define yourself as a learner?
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div onClick={() => handleCategorySelect("academic")} style={tileStyle}>
              <h2 style={{ margin: 0 }}>Academic Learner</h2>
              <p style={{ margin: 0 }}>
                School or college-based learning, aiming for exams or course mastery.
              </p>
            </div>

            <div onClick={() => handleCategorySelect("competitive")} style={tileStyle}>
              <h2 style={{ margin: 0 }}>Competitive Exam</h2>
              <p style={{ margin: 0 }}>
                Preparing for a standardized test or entrance exam.
              </p>
            </div>

            <div onClick={() => handleCategorySelect("vocational")} style={tileStyle}>
              <h2 style={{ margin: 0 }}>Vocational Learner</h2>
              <p style={{ margin: 0 }}>
                Practical, job-oriented skills (coding, design, etc.).
              </p>
            </div>

            <div onClick={() => handleCategorySelect("casual")} style={tileStyle}>
              <h2 style={{ margin: 0 }}>Casual Learner</h2>
              <p style={{ margin: 0 }}>
                Learning for personal growth or general improvement.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ STEP 2: Render correct subform ============
  const cardStyle = {
    backgroundColor: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(8px)",
    borderRadius: "10px",
    padding: "40px",
    maxWidth: "600px",
    width: "100%",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0F2027, #203A43, #2C5364)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "'Open Sans', sans-serif",
        color: "#fff",
        padding: "20px",
      }}
    >
      <div style={cardStyle}>
        <h2 style={{ textAlign: "center", marginBottom: "30px" }}>
          {category === "academic"
            ? "Academic Learner"
            : category === "competitive"
            ? "Competitive Exam Learner"
            : category === "vocational"
            ? "Vocational Learner"
            : "Casual Learner"}
        </h2>

        {category === "academic" && (
          <AcademicForm
            formData={formData.academic}
            handleInputChange={handleInputChange}
            handleCourseChange={handleCourseChange}
            handleUploadPDF={handleUploadPDF}
            addExamDate={addExamDate}
            handleExamFieldChange={handleExamFieldChange}
            addNewCourse={addNewCourse}
          />
        )}

        {category === "competitive" && (
          <CompetitiveForm
            formData={formData.competitive}
            handleInputChange={handleInputChange}
          />
        )}

        {category === "vocational" && (
          <VocationalForm
            formData={formData.vocational}
            handleInputChange={handleInputChange}
            handleMultiSelectChange={handleMultiSelectChange}
          />
        )}

        {category === "casual" && (
          <CasualForm
            formData={formData.casual}
            handleInputChange={handleInputChange}
            handleMultiSelectChange={handleMultiSelectChange}
          />
        )}

        {/*
          The original "Back" and "Submit" buttons were here.
          They have been removed as requested.
        */}
      </div>
    </div>
  );
}

export default LearnerPersonaForm;