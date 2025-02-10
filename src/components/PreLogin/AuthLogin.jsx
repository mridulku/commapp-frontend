
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function AuthLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // const backendURL = "https://commapp-backend.onrender.com"
//  const backendURL = "http://localhost:3001";

  const backendURL = import.meta.env.VITE_BACKEND_URL;

  
  const handleLogin = async () => {
    try {
      const response = await axios.post(`${backendURL}/login`, {
        username,
        password,
      });

      if (response.data.success) {
        // 1) Store token
        localStorage.setItem("token", response.data.token);

        // 2) Store user data
        localStorage.setItem("userData", JSON.stringify(response.data.user));

        // 3) Onboarding check
        if (response.data.user.onboardingComplete) {
          navigate("/main"); // take them to your main private route
        } else {
          navigate("/onboarding");
        }
      } else {
        alert(response.data.error || "Login failed");
      }
    } catch (error) {
      console.error("Error logging in:", error);
      alert("Login failed. Check console for details.");
    }
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
          width: "100%",
          maxWidth: "400px",
          boxSizing: "border-box",
          textAlign: "center",
        }}
      >
        <h1 style={{ marginBottom: "20px" }}>Welcome Back</h1>
        <p style={{ marginBottom: "30px", fontSize: "1.1rem" }}>
          Please log in to continue
        </p>

        <div style={{ marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "4px",
              border: "none",
              outline: "none",
              fontSize: "1rem",
              marginBottom: "10px",
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "4px",
              border: "none",
              outline: "none",
              fontSize: "1rem",
            }}
          />
        </div>

        <button
          onClick={handleLogin}
          style={{
            display: "inline-block",
            width: "100%",
            padding: "12px 0",
            borderRadius: "4px",
            border: "none",
            background: "#FFD700",
            color: "#000",
            fontWeight: "bold",
            fontSize: "1rem",
            cursor: "pointer",
            transition: "opacity 0.3s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Log In
        </button>
      </div>
    </div>
  );
}

export default AuthLogin;