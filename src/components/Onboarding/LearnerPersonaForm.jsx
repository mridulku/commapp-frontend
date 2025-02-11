// LearnerPersonaForm.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

// Import subform components
import AcademicForm from "./AcademicForm";
import CompetitiveForm from "./CompetitiveForm";
import VocationalForm from "./VocationalForm";
import CasualForm from "./CasualForm";

function LearnerPersonaForm() {
  const navigate = useNavigate();

  // -----------------------------
  // MAIN STEPS:
  // step = 1 => Choose category
  // step >= 2 => Sub-steps for the chosen category
  // -----------------------------
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("");

  // For convenience, define how many sub-steps each category has:
  const maxSubSteps = {
    academic: 4, // matches the 4 steps in AcademicForm
    competitive: 1, 
    vocational: 1,
    casual: 1,
  };

  // The sub-step we are on, once a category is chosen
  const subStep = step - 1;

  // -----------------------------
  // MASTER FORM DATA
  // -----------------------------
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
      // Now each course object has an id and we store only 1 course
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

  // -----------------------------
  // HANDLERS
  // -----------------------------
  const handleCategorySelect = (selected) => {
    setCategory(selected);
    // Move to sub-steps
    setStep(2);
  };

  // Show "Coming Soon" pop-up for disabled tiles
  const handleComingSoon = () => {
    alert("Coming Soon!");
  };

  // Generic input handler for simple text fields
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

  // For toggling items in an array (if you need multi-select somewhere)
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

  // ACADEMIC: specialized handlers

  //  Only let the user add 1 course for the MVP
  const addNewCourse = () => {
    // If there's already 1 course, do nothing (or show alert).
    if (formData.academic.courseList.length >= 1) {
      alert("Currently only 1 course can be added. Coming soon!");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      academic: {
        ...prev.academic,
        courseList: [
          ...prev.academic.courseList,
          {
            id: uuidv4(),
            courseName: "",
            // We'll store just ONE PDF link in each course (instead of an array)
            pdfLink: "",
            examDates: [{ type: "", date: "" }],
          },
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

  // We'll handle the actual file upload inside AcademicForm (so we can pass the file input).
  // But we do define a small helper to store the final PDF link in the state:
  const storePdfLinkInState = (courseIdx, url) => {
    setFormData((prev) => {
      const updatedCourses = [...prev.academic.courseList];
      updatedCourses[courseIdx] = {
        ...updatedCourses[courseIdx],
        pdfLink: url,
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
        examDates: [
          ...updatedCourses[courseIdx].examDates,
          { type: "", date: "" },
        ],
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

  // -----------------------------
  // NAVIGATION
  // -----------------------------
  const handleBack = () => {
    if (step > 2) {
      setStep((prev) => prev - 1);
    } else {
      // If step=2 (subStep=1) and user clicks back => go back to category selection
      setStep(1);
      setCategory("");
    }
  };

  const handleNext = () => {
    if (subStep < maxSubSteps[category]) {
      setStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  // -----------------------------
  // SUBMIT
  // -----------------------------
  const handleSubmit = async () => {
    try {
      const payload = {
        category,
        answers: formData[category],
      };

      console.log("Submitting Learner Persona payload:", payload);

      const token = localStorage.getItem("token");
      console.log("Token is:", token);

      const response = await axios.post(
        "http://localhost:3001/api/learnerpersona",
        payload,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      console.log("Request succeeded with response:", response.data);
      navigate("/onboardingassessment");
    } catch (err) {
      console.error("Submission error:", err);
      alert("Failed to submit form. Check console for details.");
    }
  };

  // -----------------------------
  // RENDER
  // -----------------------------
  // STEP 1 => Category selection
  if (step === 1) {
    const tileStyle = {
      backgroundColor: "#333",
      borderRadius: "8px",
      padding: "20px",
      cursor: "pointer",
      transition: "transform 0.3s",
      textAlign: "left",
    };

    const disabledTileStyle = {
      ...tileStyle,
      opacity: 0.5,
      cursor: "not-allowed",
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
            {/* Academic Learner (Enabled) */}
            <div onClick={() => handleCategorySelect("academic")} style={tileStyle}>
              <h2 style={{ margin: 0 }}>Academic Learner</h2>
              <p style={{ margin: 0 }}>
                School or college-based learning, aiming for exams or course mastery.
              </p>
            </div>

            {/* Others disabled */}
            <div onClick={handleComingSoon} style={disabledTileStyle}>
              <h2 style={{ margin: 0 }}>Competitive Exam (Coming Soon)</h2>
              <p style={{ margin: 0 }}>
                Preparing for a standardized test or entrance exam.
              </p>
            </div>
            <div onClick={handleComingSoon} style={disabledTileStyle}>
              <h2 style={{ margin: 0 }}>Vocational Learner (Coming Soon)</h2>
              <p style={{ margin: 0 }}>
                Practical, job-oriented skills (coding, design, etc.).
              </p>
            </div>
            <div onClick={handleComingSoon} style={disabledTileStyle}>
              <h2 style={{ margin: 0 }}>Casual Learner (Coming Soon)</h2>
              <p style={{ margin: 0 }}>
                Learning for personal growth or general improvement.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STEP >= 2 => Show the sub-form
  const cardStyle = {
    backgroundColor: "rgba(255,255,255,0.1)",
    backdropFilter: "blur(8px)",
    borderRadius: "10px",
    padding: "40px",
    maxWidth: "600px",
    width: "100%",
  };

  const isLastSubStep = subStep === maxSubSteps[category];

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
            subStep={subStep}
            formData={formData.academic}
            handleInputChange={handleInputChange}
            handleCourseChange={handleCourseChange}
            addExamDate={addExamDate}
            handleExamFieldChange={handleExamFieldChange}
            addNewCourse={addNewCourse}
            // The function to store the final PDF link in parent state
            storePdfLinkInState={storePdfLinkInState}
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

        {/* NAV BUTTONS */}
        <div style={{ textAlign: "center", marginTop: "30px" }}>
          <button
            type="button"
            onClick={handleBack}
            style={{
              padding: "10px 20px",
              borderRadius: "4px",
              border: "none",
              fontWeight: "bold",
              fontSize: "1rem",
              background: "#888",
              color: "#fff",
              cursor: "pointer",
              marginRight: "10px",
            }}
          >
            Back
          </button>

          <button
            type="button"
            onClick={isLastSubStep ? handleSubmit : handleNext}
            style={{
              padding: "10px 20px",
              borderRadius: "4px",
              border: "none",
              fontWeight: "bold",
              fontSize: "1rem",
              background: "#FFD700",
              color: "#000",
              cursor: "pointer",
            }}
          >
            {isLastSubStep ? "Submit" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LearnerPersonaForm;