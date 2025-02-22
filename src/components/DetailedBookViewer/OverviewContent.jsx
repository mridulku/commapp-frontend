import React, { useState } from 'react';
import axios from 'axios';

const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";


export default function MultiStageChatWithOptions() {
  const [messages, setMessages] = useState([
    { role: 'system', text: "Hello! Let's start your onboarding. What's your name?" }
  ]);

  // Our multi-step questions
  // type = "text" => user types
  // type = "options" => user picks from an array of options
  const steps = [
    { field: 'name', question: "What's your name?", type: 'text' },
    { 
      field: 'exam', 
      question: "Which exam are you preparing for?", 
      type: 'options',
      options: ["IIT JEE", "UPSC"],
    },
    { field: 'age', question: 'How old are you?', type: 'text' },
    { field: 'school', question: 'Which school do you go to?', type: 'text' },
  ];

  // We'll store the user's answers here
  const [formData, setFormData] = useState({ name: '', exam: '', age: '', school: '' });

  // Track which step (0-based) we are on
  const [currentStep, setCurrentStep] = useState(0);

  // Once the user finishes all steps, we mark onboarding complete
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  // The user's typed input
  const [userInput, setUserInput] = useState('');

  // Helper to append a message to the chat
  const addMessage = (role, text) => {
    setMessages((prev) => [...prev, { role, text }]);
  };

  /**
   * Handle normal typed input (for "text" steps)
   */
  const handleSend = async (e) => {
    e.preventDefault();
    const trimmed = userInput.trim();
    if (!trimmed) return;

    // Show the user's message in chat
    addMessage('user', trimmed);
    setUserInput('');

    // Capture the input for the current step
    const currentField = steps[currentStep].field;
    setFormData((prev) => ({ ...prev, [currentField]: trimmed }));

    await moveToNextStep(trimmed);
  };

  /**
   * Handle clicking an option (for "options" steps)
   */
  const handleOptionClick = async (optionValue) => {
    // Show the user selection in chat
    addMessage('user', optionValue);

    // Store the user's response
    const currentField = steps[currentStep].field;
    setFormData((prev) => ({ ...prev, [currentField]: optionValue }));

    await moveToNextStep(optionValue);
  };

  /**
   * Move to the next step or finalize onboarding
   */
  const moveToNextStep = async (answer) => {
    const nextStepIndex = currentStep + 1;
    // If there's another step, ask the next question
    if (nextStepIndex < steps.length) {
      setCurrentStep(nextStepIndex);
      addMessage('system', steps[nextStepIndex].question);
    } else {
      // All steps answered: submit
      addMessage('system', 'Great! Submitting your data...');

      try {
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/onboard`, {
          name: currentStep === 0 ? answer : formData.name,
          exam: currentStep === 1 ? answer : formData.exam,
          age: currentStep === 2 ? answer : formData.age,
          school: currentStep === 3 ? answer : formData.school,
        });

        if (response.data.success) {
          addMessage('system', 'Thanks for completing the onboarding!');
          setOnboardingComplete(true);
        } else {
          addMessage('system', 'Hmm, something went wrong. Please try again.');
        }
      } catch (error) {
        console.error('Error finalizing onboarding:', error);
        addMessage('system', 'Error occurred while onboarding. Check console for details.');
      }
    }
  };

  // Determine if the current step is an "options" step
  const isOptionsStep = !onboardingComplete && steps[currentStep]?.type === 'options';
  // If it's an options step, we disable the text input
  const disableTextInput = isOptionsStep || onboardingComplete;

  return (
    <div style={containerStyle}>
      <h2>Multi-Step Chat Onboarding (with Options)</h2>

      <div style={chatBoxStyle}>
        {messages.map((msg, idx) => {
          const isSystem = (msg.role === 'system');
          return (
            <div
              key={idx}
              style={{
                ...bubbleStyle,
                alignSelf: isSystem ? 'flex-start' : 'flex-end',
                backgroundColor: isSystem
                  ? 'rgba(255,255,255,0.2)'
                  : '#0084FF'
              }}
            >
              {msg.text}
            </div>
          );
        })}

        {/* If it's an options step, show clickable buttons for each option */}
        {isOptionsStep && (
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            {steps[currentStep].options.map((opt) => (
              <button
                key={opt}
                onClick={() => handleOptionClick(opt)}
                style={optionButtonStyle}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Normal text input form, disabled if it's an options step or if onboarding is complete */}
      <form onSubmit={handleSend} style={formStyle}>
        <input
          type="text"
          disabled={disableTextInput}
          style={inputStyle}
          placeholder={
            onboardingComplete
              ? 'Onboarding finished...'
              : isOptionsStep
              ? 'Please select an option above.'
              : 'Type your response...'
          }
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
        />
        <button
          style={buttonStyle}
          type="submit"
          disabled={disableTextInput}
        >
          Send
        </button>
      </form>
    </div>
  );
}

/** Minimal styling */
const containerStyle = {
  width: '400px',
  margin: '40px auto',
  backgroundColor: 'rgba(0,0,0,0.3)',
  padding: '20px',
  borderRadius: '8px',
  color: '#fff',
  fontFamily: 'sans-serif',
};

const chatBoxStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  maxHeight: '300px',
  overflowY: 'auto',
  marginBottom: '10px',
  position: 'relative',
};

const bubbleStyle = {
  maxWidth: '70%',
  padding: '8px 12px',
  borderRadius: '6px',
  color: '#fff',
  margin: '4px 0',
  wordWrap: 'break-word'
};

const formStyle = {
  display: 'flex',
  gap: '8px',
};

const inputStyle = {
  flex: 1,
  padding: '8px',
  borderRadius: '4px',
  border: 'none',
  outline: 'none',
};

const buttonStyle = {
  backgroundColor: '#0084FF',
  border: 'none',
  padding: '8px 16px',
  borderRadius: '4px',
  color: '#fff',
  cursor: 'pointer',
};

const optionButtonStyle = {
  backgroundColor: '#333',
  color: '#fff',
  border: 'none',
  padding: '8px 12px',
  borderRadius: '4px',
  cursor: 'pointer',
};