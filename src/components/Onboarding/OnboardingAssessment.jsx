import React, { useState } from "react";

/********************************************
 * OnboardingAssessment.jsx
 ********************************************/

function OnboardingAssessment() {
  /************************************************
   * Step Wizard (1 through 6)
   ************************************************/
  const [step, setStep] = useState(1);

  /************************************************
   * 1) Reading Speed & Comprehension
   ************************************************/
  const readingPassage = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
Aliquam in risus ante. Etiam fermentum porttitor odio nec pellentesque. 
Vestibulum vehicula nibh sed purus interdum mattis. Suspendisse volutpat magna 
sit amet consectetur rutrum. Nam tincidunt egestas neque, a faucibus nisl cursus eget.`;

  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  // For a small comprehension question
  const [comprehensionAnswers, setComprehensionAnswers] = useState({});
  const [comprehensionSubmitted, setComprehensionSubmitted] = useState(false);
  const [comprehensionScore, setComprehensionScore] = useState(null);

  // Example comprehension Q
  const readingQuestions = [
    {
      id: 1,
      question: "Which statement best describes the passage content?",
      options: [
        "It's about advanced physics.",
        "It's a placeholder text about Lorem Ipsum, nothing specific.",
        "It's describing a cooking recipe.",
      ],
      correctIndex: 1,
    },
  ];

  // Start reading
  const handleBeginReading = () => {
    setStartTime(Date.now());
    setEndTime(null);
    setComprehensionScore(null);
    setComprehensionSubmitted(false);
    setComprehensionAnswers({});
  };

  // Done reading
  const handleDoneReading = () => {
    setEndTime(Date.now());
  };

  const handleOptionSelect = (qId, optionIdx) => {
    setComprehensionAnswers((prev) => ({
      ...prev,
      [qId]: optionIdx,
    }));
  };

  const handleSubmitComprehension = () => {
    // Simple scoring
    let correctCount = 0;
    readingQuestions.forEach((q) => {
      if (comprehensionAnswers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });
    setComprehensionScore(correctCount);
    setComprehensionSubmitted(true);
  };

  const getReadingTimeSec = () => {
    if (!startTime || !endTime) return null;
    const diffMs = endTime - startTime;
    return (diffMs / 1000).toFixed(1); // in seconds
  };

  /************************************************
   * 2) Domain-Specific Questions
   ************************************************/
  // Example domain Q: "Basic knowledge about a certain field"
  const [domainAnswers, setDomainAnswers] = useState({});
  const domainQuestions = [
    {
      id: "dq1",
      question: "Have you studied this domain before?",
      options: ["Never", "Yes, basics", "Yes, advanced level"],
    },
    {
      id: "dq2",
      question: "Rate your familiarity with key terms in this domain",
      options: ["Low", "Medium", "High"],
    },
  ];

  const handleDomainSelect = (qId, optionIdx) => {
    setDomainAnswers((prev) => ({
      ...prev,
      [qId]: optionIdx,
    }));
  };

  /************************************************
   * 3) Learning Style & Engagement Survey
   ************************************************/
  const [styleAnswers, setStyleAnswers] = useState({
    preferBulletPoints: false,
    preferStepByStep: false,
    preferVideos: false,
    preferAnalogies: false,
  });
  const toggleStyleAnswer = (key) => {
    setStyleAnswers((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  /************************************************
   * 4) Attention Span / Session Length
   ************************************************/
  const [sessionLength, setSessionLength] = useState("15");
  const [visitFrequency, setVisitFrequency] = useState("Daily");

  /************************************************
   * 5) Stress Test (Advanced Difficulty)
   ************************************************/
  const advancedPassage = `This is a more advanced snippet with domain-specific jargon.
Phasellus a nisi ac elit aliquet lobortis. Etiam fermentum, dolor in 
hendrerit feugiat, urna purus dictum nulla, in venenatis dui dolor id purus. 
Aliquam lorem urna, fermentum eget pellentesque eget, feugiat nec nulla.`;
  const [advancedTestScore, setAdvancedTestScore] = useState(null);
  const [advancedAnswers, setAdvancedAnswers] = useState({});
  const advancedQuestions = [
    {
      id: "aq1",
      question: "Which of the following is true about advanced snippet?",
      options: [
        "It references general cooking instructions.",
        "It's an advanced snippet focusing on domain-specific jargon.",
        "It is describing a comedic narrative.",
      ],
      correctIndex: 1,
    },
  ];

  const handleAdvancedSelect = (qId, optionIdx) => {
    setAdvancedAnswers((prev) => ({
      ...prev,
      [qId]: optionIdx,
    }));
  };

  const handleSubmitAdvanced = () => {
    let correctCount = 0;
    advancedQuestions.forEach((q) => {
      if (advancedAnswers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });
    setAdvancedTestScore(correctCount);
  };

  /************************************************
   * Helper: Next Step
   ************************************************/
  const goNext = () => {
    setStep((prev) => prev + 1);
  };
  const goPrev = () => {
    setStep((prev) => prev - 1);
  };

  /************************************************
   * Final Step: Summaries
   ************************************************/
  const handleFinish = () => {
    alert("Onboarding Test Finished. Use these results to build a plan!");
    // Typically, you'd send this data to your backend or store in global state
  };

  /************************************************
   * RENDER
   ************************************************/
  return (
    <div style={containerStyle}>
      <div style={panelStyle}>
        <h2 style={sectionTitleStyle}>Onboarding Assessment</h2>
        <p style={{ fontStyle: "italic", marginTop: "0" }}>
          Step {step} of 6
        </p>

        {step === 1 && (
          <StepReadingTest
            readingPassage={readingPassage}
            startTime={startTime}
            endTime={endTime}
            getReadingTimeSec={getReadingTimeSec}
            readingQuestions={readingQuestions}
            comprehensionAnswers={comprehensionAnswers}
            handleOptionSelect={handleOptionSelect}
            handleBeginReading={handleBeginReading}
            handleDoneReading={handleDoneReading}
            comprehensionSubmitted={comprehensionSubmitted}
            comprehensionScore={comprehensionScore}
            handleSubmitComprehension={handleSubmitComprehension}
            goNext={goNext}
          />
        )}

        {step === 2 && (
          <StepDomainQuestions
            domainQuestions={domainQuestions}
            domainAnswers={domainAnswers}
            handleDomainSelect={handleDomainSelect}
            goNext={goNext}
            goPrev={goPrev}
          />
        )}

        {step === 3 && (
          <StepLearningStyle
            styleAnswers={styleAnswers}
            toggleStyleAnswer={toggleStyleAnswer}
            goNext={goNext}
            goPrev={goPrev}
          />
        )}

        {step === 4 && (
          <StepSessionPrefs
            sessionLength={sessionLength}
            setSessionLength={setSessionLength}
            visitFrequency={visitFrequency}
            setVisitFrequency={setVisitFrequency}
            goNext={goNext}
            goPrev={goPrev}
          />
        )}

        {step === 5 && (
          <StepStressTest
            advancedPassage={advancedPassage}
            advancedQuestions={advancedQuestions}
            advancedAnswers={advancedAnswers}
            handleAdvancedSelect={handleAdvancedSelect}
            advancedTestScore={advancedTestScore}
            handleSubmitAdvanced={handleSubmitAdvanced}
            goNext={goNext}
            goPrev={goPrev}
          />
        )}

        {step === 6 && (
          <StepSummary
            readingTimeSec={getReadingTimeSec()}
            comprehensionScore={comprehensionScore}
            domainAnswers={domainAnswers}
            styleAnswers={styleAnswers}
            sessionLength={sessionLength}
            visitFrequency={visitFrequency}
            advancedTestScore={advancedTestScore}
            handleFinish={handleFinish}
            goPrev={goPrev}
          />
        )}
      </div>
    </div>
  );
}

/********************************************
 * Step 1: Reading Speed & Comprehension
 ********************************************/
function StepReadingTest({
  readingPassage,
  startTime,
  endTime,
  getReadingTimeSec,
  readingQuestions,
  comprehensionAnswers,
  handleOptionSelect,
  handleBeginReading,
  handleDoneReading,
  comprehensionSubmitted,
  comprehensionScore,
  handleSubmitComprehension,
  goNext,
}) {
  return (
    <>
      <h3 style={{ marginTop: "0" }}>Reading Speed & Basic Comprehension</h3>

      {!startTime && !endTime && (
        <>
          <p>Please click "Begin Reading" and then read the passage below.</p>
          <button style={buttonStyle} onClick={handleBeginReading}>
            Begin Reading
          </button>
        </>
      )}

      {startTime && !endTime && (
        <>
          <p style={{ fontStyle: "italic" }}>
            Timer started! Once you finish reading the passage, click "Done
            Reading."
          </p>
          <div style={readingPassageStyle}>{readingPassage}</div>
          <button style={buttonStyle} onClick={handleDoneReading}>
            Done Reading
          </button>
        </>
      )}

      {endTime && (
        <>
          <p>
            Time taken: <strong>{getReadingTimeSec()} seconds</strong>
          </p>
          <div>
            <p>Quick Comprehension Check:</p>
            {readingQuestions.map((q) => {
              const userSel = comprehensionAnswers[q.id];
              return (
                <div key={q.id} style={quizQuestionStyle}>
                  <strong>{q.question}</strong>
                  {q.options.map((opt, idx) => {
                    const radioId = `q${q.id}_${idx}`;
                    return (
                      <label
                        key={idx}
                        htmlFor={radioId}
                        style={{ display: "block", cursor: "pointer" }}
                      >
                        <input
                          type="radio"
                          id={radioId}
                          name={`q${q.id}`}
                          checked={userSel === idx}
                          onChange={() => handleOptionSelect(q.id, idx)}
                        />
                        {opt}
                      </label>
                    );
                  })}
                </div>
              );
            })}

            {!comprehensionSubmitted ? (
              <button style={buttonStyle} onClick={handleSubmitComprehension}>
                Submit Answers
              </button>
            ) : (
              <div style={{ marginTop: "10px" }}>
                <strong>
                  You got {comprehensionScore} out of {readingQuestions.length} correct.
                </strong>
              </div>
            )}
          </div>
          {comprehensionSubmitted && (
            <button
              style={{ ...buttonStyle, marginTop: "10px" }}
              onClick={goNext}
            >
              Next
            </button>
          )}
        </>
      )}
    </>
  );
}

/********************************************
 * Step 2: Domain-Specific Questions
 ********************************************/
function StepDomainQuestions({
  domainQuestions,
  domainAnswers,
  handleDomainSelect,
  goNext,
  goPrev,
}) {
  return (
    <>
      <h3 style={{ marginTop: "0" }}>Domain-Specific Questions</h3>
      <p style={{ marginTop: 0, fontStyle: "italic" }}>
        Tell us about your familiarity with the topic.
      </p>

      {domainQuestions.map((q) => {
        const userSelection = domainAnswers[q.id];
        return (
          <div key={q.id} style={quizQuestionStyle}>
            <strong>{q.question}</strong>
            {q.options.map((opt, idx) => {
              const radioId = `domain_${q.id}_${idx}`;
              return (
                <label
                  key={idx}
                  htmlFor={radioId}
                  style={{ display: "block", cursor: "pointer" }}
                >
                  <input
                    type="radio"
                    id={radioId}
                    name={`domain_${q.id}`}
                    checked={userSelection === idx}
                    onChange={() => handleDomainSelect(q.id, idx)}
                  />
                  {opt}
                </label>
              );
            })}
          </div>
        );
      })}

      <div style={{ marginTop: "10px" }}>
        <button style={buttonStyle} onClick={goPrev}>
          Back
        </button>
        <button style={{ ...buttonStyle, marginLeft: "10px" }} onClick={goNext}>
          Next
        </button>
      </div>
    </>
  );
}

/********************************************
 * Step 3: Learning Style & Engagement
 ********************************************/
function StepLearningStyle({ styleAnswers, toggleStyleAnswer, goNext, goPrev }) {
  return (
    <>
      <h3 style={{ marginTop: "0" }}>Learning Style & Engagement</h3>
      <p style={{ marginTop: 0, fontStyle: "italic" }}>
        Select all that apply to your preferences:
      </p>

      <div style={checkGroupStyle}>
        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={styleAnswers.preferBulletPoints}
            onChange={() => toggleStyleAnswer("preferBulletPoints")}
          />
          I prefer bullet-point summaries.
        </label>

        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={styleAnswers.preferStepByStep}
            onChange={() => toggleStyleAnswer("preferStepByStep")}
          />
          I like step-by-step explanations.
        </label>

        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={styleAnswers.preferVideos}
            onChange={() => toggleStyleAnswer("preferVideos")}
          />
          I enjoy short videos alongside text.
        </label>

        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={styleAnswers.preferAnalogies}
            onChange={() => toggleStyleAnswer("preferAnalogies")}
          />
          I like analogy-based or real-life examples.
        </label>
      </div>

      <div style={{ marginTop: "10px" }}>
        <button style={buttonStyle} onClick={goPrev}>
          Back
        </button>
        <button style={{ ...buttonStyle, marginLeft: "10px" }} onClick={goNext}>
          Next
        </button>
      </div>
    </>
  );
}

/********************************************
 * Step 4: Attention Span & Session
 ********************************************/
function StepSessionPrefs({
  sessionLength,
  setSessionLength,
  visitFrequency,
  setVisitFrequency,
  goNext,
  goPrev,
}) {
  return (
    <>
      <h3 style={{ marginTop: "0" }}>Attention Span & Session Preferences</h3>
      <p style={{ marginTop: 0, fontStyle: "italic" }}>
        Estimate your usual reading or study session length:
      </p>

      <div style={quizQuestionStyle}>
        <label>
          Typical Session Length (minutes):
          <input
            type="number"
            style={{ marginLeft: "10px", width: "80px" }}
            value={sessionLength}
            onChange={(e) => setSessionLength(e.target.value)}
          />
        </label>
      </div>

      <div style={quizQuestionStyle}>
        <label>
          How often do you plan to visit?
          <select
            style={{ marginLeft: "10px" }}
            value={visitFrequency}
            onChange={(e) => setVisitFrequency(e.target.value)}
          >
            <option value="Daily">Daily</option>
            <option value="Every 2 Days">Every 2 Days</option>
            <option value="Weekly">Weekly</option>
            <option value="Ad Hoc">Ad Hoc / Rarely</option>
          </select>
        </label>
      </div>

      <div style={{ marginTop: "10px" }}>
        <button style={buttonStyle} onClick={goPrev}>
          Back
        </button>
        <button style={{ ...buttonStyle, marginLeft: "10px" }} onClick={goNext}>
          Next
        </button>
      </div>
    </>
  );
}

/********************************************
 * Step 5: Stress Test (Advanced Difficulty)
 ********************************************/
function StepStressTest({
  advancedPassage,
  advancedQuestions,
  advancedAnswers,
  handleAdvancedSelect,
  advancedTestScore,
  handleSubmitAdvanced,
  goNext,
  goPrev,
}) {
  return (
    <>
      <h3 style={{ marginTop: "0" }}>Stress Test / Advanced Difficulty</h3>
      <p style={{ marginTop: 0, fontStyle: "italic" }}>
        Quickly read the snippet below and answer the question:
      </p>
      <div style={readingPassageStyle}>{advancedPassage}</div>

      {advancedQuestions.map((q) => {
        const userSel = advancedAnswers[q.id];
        return (
          <div key={q.id} style={quizQuestionStyle}>
            <strong>{q.question}</strong>
            {q.options.map((opt, idx) => {
              const radioId = `adv_${q.id}_${idx}`;
              return (
                <label
                  key={idx}
                  htmlFor={radioId}
                  style={{ display: "block", cursor: "pointer" }}
                >
                  <input
                    type="radio"
                    id={radioId}
                    name={`adv_${q.id}`}
                    checked={userSel === idx}
                    onChange={() => handleAdvancedSelect(q.id, idx)}
                  />
                  {opt}
                </label>
              );
            })}
          </div>
        );
      })}

      {!advancedTestScore && advancedTestScore !== 0 ? (
        <button style={buttonStyle} onClick={handleSubmitAdvanced}>
          Submit Advanced Answers
        </button>
      ) : (
        <div style={{ marginTop: "10px" }}>
          <strong>
            You got {advancedTestScore} out of {advancedQuestions.length} correct.
          </strong>
        </div>
      )}

      {advancedTestScore !== null && (
        <div style={{ marginTop: "10px" }}>
          <button style={buttonStyle} onClick={goPrev}>
            Back
          </button>
          <button style={{ ...buttonStyle, marginLeft: "10px" }} onClick={goNext}>
            Next
          </button>
        </div>
      )}
    </>
  );
}

/********************************************
 * Step 6: Summary
 ********************************************/
function StepSummary({
  readingTimeSec,
  comprehensionScore,
  domainAnswers,
  styleAnswers,
  sessionLength,
  visitFrequency,
  advancedTestScore,
  handleFinish,
  goPrev,
}) {
  return (
    <>
      <h3 style={{ marginTop: 0 }}>Summary of Your Results</h3>
      <p>
        Reading Time:{" "}
        <strong>
          {readingTimeSec ? readingTimeSec + "s" : "Not measured or incomplete"}
        </strong>
      </p>
      <p>
        Basic Comprehension:{" "}
        {comprehensionScore !== null
          ? `You got ${comprehensionScore} correct.`
          : "Not answered or incomplete."}
      </p>

      <p>
        Domain Familiarity: 
        <br />
        {Object.entries(domainAnswers).map(([qId, optIdx]) => (
          <span key={qId}>
            {qId}: Selected Option #{optIdx}
            <br />
          </span>
        ))}
      </p>

      <p>
        Learning Style Preferences: 
        <br />
        {styleAnswers.preferBulletPoints && "• Bullet points\n"}
        {styleAnswers.preferStepByStep && "• Step-by-step\n"}
        {styleAnswers.preferVideos && "• Videos\n"}
        {styleAnswers.preferAnalogies && "• Analogies\n"}
      </p>

      <p>
        Session Length: ~{sessionLength} min, 
        Frequency: {visitFrequency}
      </p>

      <p>
        Advanced Difficulty Check:{" "}
        {advancedTestScore !== null
          ? `You got ${advancedTestScore} correct.`
          : "Did not attempt"}
      </p>

      <div style={{ marginTop: "10px" }}>
        <button style={buttonStyle} onClick={goPrev}>
          Back
        </button>
        <button
          style={{ ...buttonStyle, marginLeft: "10px" }}
          onClick={handleFinish}
        >
          Finish
        </button>
      </div>
    </>
  );
}

/********************************************
 * Reusable Style Objects
 ********************************************/
const containerStyle = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #0F2027, #203A43, #2C5364)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "'Open Sans', sans-serif",
};

const panelStyle = {
  backgroundColor: "rgba(255,255,255,0.1)",
  backdropFilter: "blur(6px)",
  padding: "20px",
  borderRadius: "10px",
  width: "600px",
  maxWidth: "90%",
};

const sectionTitleStyle = {
  marginTop: 0,
  borderBottom: "1px solid rgba(255,255,255,0.3)",
  paddingBottom: "5px",
  marginBottom: "10px",
};

const readingPassageStyle = {
  backgroundColor: "rgba(255,255,255,0.2)",
  padding: "10px",
  borderRadius: "6px",
  marginBottom: "10px",
  whiteSpace: "pre-line",
};

const buttonStyle = {
  padding: "10px 20px",
  borderRadius: "4px",
  border: "none",
  background: "#FFD700",
  color: "#000",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "opacity 0.3s",
  marginTop: "10px",
};

const quizQuestionStyle = {
  backgroundColor: "rgba(255,255,255,0.2)",
  padding: "10px",
  borderRadius: "6px",
  marginBottom: "10px",
};

const checkGroupStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  marginTop: "10px",
};

const checkboxLabelStyle = {
  display: "flex",
  alignItems: "center",
  cursor: "pointer",
  gap: "5px",
};

export default OnboardingAssessment;