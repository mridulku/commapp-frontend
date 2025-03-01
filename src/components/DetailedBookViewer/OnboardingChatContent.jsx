// src/components/DetailedBookViewer/OnboardingChatContent.jsx

import React, { useState } from "react";
import axios from "axios";
import {
  ref as firebaseRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { storage, auth } from "../../firebase";

const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

// Subject arrays
const UPSC_SUBJECTS = [
  "History",
  "Polity & Governance",
  "Geography",
  "Economics",
  "Environment & Ecology",
  "General Science",
  "Current Affairs",
];
const JEE_SUBJECTS = ["Physics", "Chemistry", "Mathematics"];

export default function OnboardingChatContent() {
  // Chat messages
  const [messages, setMessages] = useState([
    { role: "system", text: "Hi! Let's begin. What's your name?" },
  ]);

  // Data
  const [formData, setFormData] = useState({
    name: "",
    exam: "",
    subject: "",
    dailyHours: "",
    preparationGoal: "",
    additionalNote: "",
    pdfFile: null,
  });

  const steps = [
    { field: "name", question: "What's your name?", type: "text" },
    {
      field: "exam",
      question: "Which exam are you preparing for?",
      type: "options",
      options: ["UPSC", "IIT JEE"],
    },
    {
      field: "subject",
      question: "Which subject are you focusing on?",
      type: "conditionalOptions",
    },
    {
      field: "dailyHours",
      question: "How many hours can you study daily?",
      type: "text",
    },
    {
      field: "preparationGoal",
      question: "What's your preparation goal?",
      type: "options",
      options: ["revise", "start afresh", "deep mastery"],
    },
    {
      field: "additionalNote",
      question: "Any additional notes that might help us personalize your plan?",
      type: "text",
    },
    {
      field: "pdfUpload",
      question: "Please upload your PDF now (only 1).",
      type: "pdfUpload",
    },
    {
      field: "confirmFinish",
      question: "Everything set. Ready to finalize?",
      type: "options",
      options: ["Yes, finalize", "No, go back"],
    },
  ];

  const [stepIndex, setStepIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  /** Add message to chat array */
  const addMessage = (role, text) => {
    setMessages((prev) => [...prev, { role, text }]);
  };

  /** Handling answers step-by-step */
  async function handleUserAnswer(answer) {
    const step = steps[stepIndex];

    // If not pdfUpload or confirmFinish, store in formData
    if (step.field !== "pdfUpload" && step.field !== "confirmFinish") {
      setFormData((prev) => ({ ...prev, [step.field]: answer }));
    }

    const nextIndex = stepIndex + 1;

    if (step.field === "confirmFinish") {
      if (answer.startsWith("Yes")) {
        addMessage("system", "Great! We will now submit your data.");
        await finalizeSubmission();
        return;
      } else {
        // "No, go back"
        const backIndex = stepIndex - 1;
        setStepIndex(backIndex);
        addMessage("system", steps[backIndex].question);
        return;
      }
    }

    if (nextIndex < steps.length) {
      setStepIndex(nextIndex);
      const nextStep = steps[nextIndex];
      if (nextStep.type === "conditionalOptions" && nextStep.field === "subject") {
        if (formData.exam === "UPSC") {
          addMessage("system", "Which UPSC subject do you prefer?");
        } else if (formData.exam === "IIT JEE") {
          addMessage("system", "Which JEE subject do you prefer?");
        } else {
          addMessage("system", nextStep.question);
        }
      } else {
        addMessage("system", nextStep.question);
      }
    } else {
      // End
      addMessage("system", "We will now finalize your data...");
      await finalizeSubmission();
    }
  }

  function handleSend(e) {
    e.preventDefault();
    const trimmed = userInput.trim();
    if (!trimmed) return;

    addMessage("user", trimmed);
    setUserInput("");
    handleUserAnswer(trimmed);
  }

  function handleOptionClick(opt) {
    addMessage("user", opt);
    handleUserAnswer(opt);
  }

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    addMessage("user", `Selected file: ${file.name}`);
    setFormData((prev) => ({ ...prev, pdfFile: file }));
    await handleUserAnswer("PDF_FILE_CHOSEN");
  }

  /** Final submission => same logic as the chat approach */
  async function finalizeSubmission() {
    addMessage("system", "Uploading your PDF...");

    try {
      let pdfLink = "";
      if (formData.pdfFile) {
        const fileName = formData.pdfFile.name || "CourseDoc";
        pdfLink = await uploadPDFWithMetadata(formData.pdfFile, fileName);
      }

      const payload = {
        category: "academic",
        answers: {
          name: formData.name,
          exam: formData.exam,
          subject: formData.subject,
          dailyHours: formData.dailyHours,
          preparationGoal: formData.preparationGoal,
          additionalNote: formData.additionalNote,
          pdfLink: pdfLink,
        },
      };

      const token = localStorage.getItem("token") || "";
      const resp = await axios.post(`${backendURL}/api/learnerpersona`, payload, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });

      if (resp.data.success) {
        addMessage("system", "All set! Your onboarding is complete.");
        setOnboardingComplete(true);
      } else {
        addMessage("system", "Something went wrong storing your info.");
      }
    } catch (err) {
      console.error("Error finalizeSubmission =>", err);
      addMessage("system", "Error uploading or submitting. Check console logs.");
    }
  }

  /** PDF upload function */
  function uploadPDFWithMetadata(file, fileName) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve("");
        return;
      }
      const user = auth.currentUser;
      const path = `pdfUploads/${fileName}/${file.name}`;
      const storageRef = firebaseRef(storage, path);
      const metadata = {
        customMetadata: {
          category: "Academic",
          userId: user?.uid || "noUser",
        },
      };

      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      uploadTask.on(
        "state_changed",
        (snap) => {
          const progress = (snap.bytesTransferred / snap.totalBytes) * 100;
          console.log(`[UploadProgress] => ${progress}%`);
        },
        (err) => reject(err),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  }

  // figure out step
  const currentStep = steps[stepIndex];
  const isOptionsStep = currentStep?.type === "options";
  const isConditional = currentStep?.type === "conditionalOptions";
  const isPdfStep = currentStep?.type === "pdfUpload";
  const isConfirmFinish = currentStep?.field === "confirmFinish";

  const disableTextInput =
    onboardingComplete || isOptionsStep || isConditional || isPdfStep || isConfirmFinish;

  let dynamicSubjects = [];
  if (currentStep?.field === "subject") {
    if (formData.exam === "UPSC") dynamicSubjects = UPSC_SUBJECTS;
    if (formData.exam === "IIT JEE") dynamicSubjects = JEE_SUBJECTS;
  }

  return (
    <div>
      <h3 style={{ marginBottom: "8px" }}>Chat Onboarding</h3>

      <div style={chatBoxStyle}>
        {messages.map((msg, idx) => {
          const isSystem = msg.role === "system";
          return (
            <div
              key={idx}
              style={{
                ...bubbleStyle,
                alignSelf: isSystem ? "flex-start" : "flex-end",
                backgroundColor: isSystem ? "rgba(255,255,255,0.2)" : "#0084FF",
              }}
            >
              {msg.text}
            </div>
          );
        })}

        {/* If step is "options" => show option buttons */}
        {isOptionsStep && !onboardingComplete && (
          <div style={optionsRowStyle}>
            {currentStep.options?.map((opt) => (
              <button key={opt} onClick={() => handleOptionClick(opt)} style={optionButtonStyle}>
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* If step is "conditionalOptions" => subject choices */}
        {isConditional && currentStep.field === "subject" && dynamicSubjects.length > 0 && (
          <div style={optionsRowStyle}>
            {dynamicSubjects.map((subj) => (
              <button key={subj} onClick={() => handleOptionClick(subj)} style={optionButtonStyle}>
                {subj}
              </button>
            ))}
          </div>
        )}

        {/* If step is pdfUpload => show file input */}
        {isPdfStep && !onboardingComplete && (
          <div style={{ marginTop: 10 }}>
            <input type="file" accept="application/pdf" onChange={handleFileSelect} />
          </div>
        )}

        {/* If step is confirmFinish => "Yes, finalize" / "No, go back" */}
        {isConfirmFinish && !onboardingComplete && (
          <div style={optionsRowStyle}>
            {currentStep.options?.map((opt) => (
              <button key={opt} onClick={() => handleOptionClick(opt)} style={optionButtonStyle}>
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      <form style={formStyle} onSubmit={handleSend}>
        <input
          type="text"
          disabled={disableTextInput}
          style={inputStyle}
          placeholder={
            onboardingComplete
              ? "Onboarding finished..."
              : disableTextInput
              ? "Use buttons above..."
              : "Type your response..."
          }
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
        />
        <button type="submit" style={sendButtonStyle} disabled={disableTextInput}>
          Send
        </button>
      </form>
    </div>
  );
}

/** Basic chat styles (no overlay, since parent handles that) */
const chatBoxStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  maxHeight: "300px",
  overflowY: "auto",
  marginBottom: "10px",
  border: "1px solid rgba(255,255,255,0.2)",
  padding: "8px",
  borderRadius: "6px",
};

const bubbleStyle = {
  maxWidth: "70%",
  padding: "8px 12px",
  borderRadius: "6px",
  color: "#fff",
  margin: "4px 0",
  wordWrap: "break-word",
  fontSize: "0.9rem",
};

const optionsRowStyle = {
  display: "flex",
  gap: 10,
  marginTop: 10,
  flexWrap: "wrap",
};

const optionButtonStyle = {
  backgroundColor: "#333",
  color: "#fff",
  border: "none",
  padding: "8px 12px",
  borderRadius: "4px",
  cursor: "pointer",
};

const formStyle = {
  display: "flex",
  gap: "8px",
  marginTop: "10px",
};

const inputStyle = {
  flex: 1,
  padding: "8px",
  borderRadius: "4px",
  border: "none",
  outline: "none",
};

const sendButtonStyle = {
  backgroundColor: "#0084FF",
  border: "none",
  padding: "8px 16px",
  borderRadius: "4px",
  color: "#fff",
  cursor: "pointer",
};