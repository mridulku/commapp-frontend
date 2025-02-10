import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function LandingPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    // If a user is already logged in, skip the landing page
    if (token) {
      navigate("/main");
    }
  }, [token, navigate]);

  const handleLoginClick = () => {
    navigate("/authlogin");
  };

  return (
    <div style={{ fontFamily: "'Open Sans', sans-serif", margin: 0, padding: 0 }}>
      {/* ===================== Hero Section ===================== */}
      <header
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "linear-gradient(135deg, #0F2027, #203A43, #2C5364)",
          color: "#ffffff",
          textAlign: "center",
          padding: "0 20px",
        }}
      >
        <h1 style={{ fontSize: "3rem", marginBottom: "20px" }}>
          Personalized Learning with AI – Smarter, Faster, Tailored to You
        </h1>
        <p style={{ fontSize: "1.2rem", maxWidth: "700px", lineHeight: 1.5 }}>
          Master any topic faster with AI-driven adaptive learning. Our system
          personalizes study plans, quizzes, and summaries based on your
          learning pace, ensuring the most efficient path to mastery. 🚀
        </p>

        <button
          onClick={handleLoginClick}
          style={{
            marginTop: "40px",
            padding: "15px 30px",
            fontSize: "1rem",
            fontWeight: "bold",
            border: "none",
            borderRadius: "4px",
            background: "#FFD700",
            color: "#000",
            cursor: "pointer",
            transition: "opacity 0.3s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Start Learning
        </button>
      </header>

      {/* ===================== Why Choose Our Adaptive Learning Platform ===================== */}
      <section
        style={{
          padding: "60px 20px",
          backgroundColor: "#f9f9f9",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "2rem", marginBottom: "40px" }}>
          Why Choose Our Adaptive Learning Platform?
        </h2>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            maxWidth: "1200px",
            margin: "0 auto",
            gap: "20px",
            justifyContent: "center",
          }}
        >
          {/* Feature 1: Adaptive Lessons 📖✨ */}
          <div style={featureCardStyle}>
            <h3 style={{ marginBottom: "15px" }}>
              Adaptive Lessons 📖✨
            </h3>
            <p style={{ lineHeight: 1.6 }}>
              Our AI continuously tracks progress and adjusts your study plan
              dynamically, ensuring learning remains personalized and efficient.
            </p>
          </div>

          {/* Feature 2: Personalized Feedback 📊✅ */}
          <div style={featureCardStyle}>
            <h3 style={{ marginBottom: "15px" }}>
              Personalized Feedback 📊✅
            </h3>
            <p style={{ lineHeight: 1.6 }}>
              AI-driven real-time insights help identify learning gaps and
              suggest optimized study strategies, so you improve exactly where
              needed.
            </p>
          </div>

          {/* Feature 3: Engaging Content 🎮📚 */}
          <div style={featureCardStyle}>
            <h3 style={{ marginBottom: "15px" }}>
              Engaging Content 🎮📚
            </h3>
            <p style={{ lineHeight: 1.6 }}>
              Enjoy interactive quizzes, AI-generated insights, and adaptive
              content recommendations that make learning both fun and effective.
            </p>
          </div>
        </div>
      </section>

     {/* ===================== Designed for Every Learner (4 Cards) ===================== */}
<section
  style={{
    padding: "60px 20px",
    backgroundColor: "#ffffff",
    textAlign: "center",
  }}
>
  <h2 style={{ fontSize: "2rem", marginBottom: "40px" }}>
    Designed for Every Learner – AI Tailored to Your Learning Style
  </h2>
  <p
    style={{
      maxWidth: "800px",
      margin: "0 auto",
      marginBottom: "50px",
      lineHeight: 1.6,
    }}
  >
    Whether you want to explore new interests casually or aim to excel in
    competitive exams, our AI adapts to your unique goals and learning
    preferences.
  </p>

  {/* Use a grid so all 4 cards line up nicely (1-4 columns depending on width) */}
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
      gap: "20px",
      maxWidth: "1200px",
      margin: "0 auto",
    }}
  >
    {/* Casual Learners 🎨 */}
    <div style={learnerCardStyle}>
      <h3>Casual Learners 🎨</h3>
      <p style={{ lineHeight: 1.6 }}>
        Explore topics at your own pace without pressure. Our AI guides you
        through bite-sized lessons that fit easily into a busy schedule,
        adapting difficulty as you learn.
      </p>
    </div>

    {/* Vocational Learners 🏗️ */}
    <div style={learnerCardStyle}>
      <h3>Vocational Learners 🏗️</h3>
      <p style={{ lineHeight: 1.6 }}>
        Learn industry-specific skills with practical, hands-on knowledge.
        Our AI tailors content to help you gain job-ready expertise
        efficiently.
      </p>
    </div>

    {/* Academic Learners 📚 */}
    <div style={learnerCardStyle}>
      <h3>Academic Learners 📚</h3>
      <p style={{ lineHeight: 1.6 }}>
        Ace your courses with AI-adaptive study plans. We break down
        complex concepts into digestible lessons and personalize them
        based on your pace and comprehension.
      </p>
    </div>

    {/* Competitive Exam Learners 🎯 */}
    <div style={learnerCardStyle}>
      <h3>Competitive Exam Learners 🎯</h3>
      <p style={{ lineHeight: 1.6 }}>
        Stay ahead with AI-driven exam prep. Our system identifies weak
        areas, fine-tunes study materials, and optimizes your routine for
        top scores.
      </p>
    </div>
  </div>
</section>

      {/* ===================== How Our AI Platform Streamlines Learning ===================== */}
      <section
        style={{
          padding: "60px 20px",
          backgroundColor: "#f9f9f9",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "2rem", marginBottom: "40px" }}>
          How Our AI Platform Streamlines Learning
        </h2>
        <div
          style={{
            maxWidth: "1000px",
            margin: "0 auto",
            textAlign: "left",
            lineHeight: 1.6,
          }}
        >
          <ol style={{ paddingLeft: "1.2rem" }}>
            <li style={{ marginBottom: "20px" }}>
              <strong>1️⃣ Upload Your Content:</strong> Easily import your study
              material, lecture notes, or any text-based content.
            </li>
            <li style={{ marginBottom: "20px" }}>
              <strong>2️⃣ Intelligent Breakdown:</strong> Our AI parses your
              content into digestible segments, optimizing them for quick
              comprehension and long-term retention.
            </li>
            <li style={{ marginBottom: "20px" }}>
              <strong>3️⃣ Personalized Preferences:</strong> We gather info on
              your goals, study time, reading speed, and style to shape your
              learning path.
            </li>
            <li style={{ marginBottom: "20px" }}>
              <strong>4️⃣ Adaptive Learning Flow 🔄🤖:</strong> Our AI
              continuously tracks progress and dynamically adjusts difficulty,
              explanations, and quizzes to keep learning engaging and
              personalized.
            </li>
            <li style={{ marginBottom: "20px" }}>
              <strong>5️⃣ Continuous AI Optimization 🔁📖:</strong> As we learn
              more about you, we fine-tune material, pacing, and quiz difficulty
              to ensure every session is optimized for mastery and retention.
            </li>
          </ol>
        </div>
      </section>

      {/* ===================== Scientific Validation & Social Proof ===================== */}
      <section
        style={{
          padding: "60px 20px",
          backgroundColor: "#ffffff",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "2rem", marginBottom: "30px" }}>
          The Science Behind Adaptive Learning
        </h2>
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            lineHeight: 1.6,
            textAlign: "left",
          }}
        >
          <p style={{ marginBottom: "20px" }}>
            <strong>📈 Scientific Validation:</strong> Studies in cognitive
            science show that adaptive learning improves retention and
            comprehension by up to <strong>30%</strong> compared to traditional
            methods. By leveraging AI and real-time adjustments, our platform
            ensures every learner progresses efficiently and retains knowledge
            longer.
          </p>
          <p style={{ marginBottom: "30px" }}>
            <em>
              “I noticed immediate improvements in my test scores! The system
              quickly figured out my weak areas and provided exactly the right
              explanations and practice.” — Jessica, Pilot User
            </em>
            <br />
            <em>
              “The adaptive quizzes are a game-changer. I’m learning
              significantly faster than I did with standard textbooks.” — Raj, 
              Early Adopter
            </em>
          </p>
        </div>
      </section>

      {/* ===================== Call to Action (Improved) ===================== */}
      <section
        style={{
          background: "#203A43",
          color: "#ffffff",
          padding: "60px 20px",
          textAlign: "center",
        }}
      >
        <h2 style={{ fontSize: "2rem", marginBottom: "20px" }}>
          Join thousands of learners leveraging AI-powered education for
          smarter, faster learning. 🚀
        </h2>
        <p
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            marginBottom: "30px",
            lineHeight: 1.6,
          }}
        >
          Take control of your learning journey today and discover a truly
          adaptive experience tailored just for you.
        </p>
        <button
          onClick={handleLoginClick}
          style={{
            padding: "15px 30px",
            fontSize: "1rem",
            fontWeight: "bold",
            border: "none",
            borderRadius: "4px",
            background: "#FFD700",
            color: "#000",
            cursor: "pointer",
            transition: "opacity 0.3s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Start Learning
        </button>
      </section>
    </div>
  );
}

/****************************************
 * Reusable Style Objects
 ****************************************/
const featureCardStyle = {
  flex: "1 1 250px",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  padding: "30px",
  minWidth: "250px",
};

const learnerCardStyle = {
  flex: "1 1 250px",
  backgroundColor: "#f9f9f9",
  borderRadius: "8px",
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  padding: "30px",
  margin: "10px",
  textAlign: "left",
  minWidth: "250px",
  // ensures same size in a row, can adjust "height" or "minHeight"
  minHeight: "270px", // you can tweak to keep them consistent
};

export default LandingPage;