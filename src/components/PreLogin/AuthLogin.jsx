import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase"; // or the correct relative path
import { signInWithCustomToken } from "firebase/auth";

function AuthLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Adjust to your actual backend URL environment variable
  const backendURL = import.meta.env.VITE_BACKEND_URL;

  const handleLogin = async () => {
    try {
      const response = await axios.post(`${backendURL}/login`, { username, password });

      if (response.data.success) {
        // 1) Get the firebaseCustomToken from your backend
        const firebaseCustomToken = response.data.firebaseCustomToken;
        if (!firebaseCustomToken) {
          alert("No firebase custom token returned from server.");
          return;
        }

        // 2) Sign in to Firebase Auth on the client
        await signInWithCustomToken(auth, firebaseCustomToken);

        // 3) Log the user object or UID to confirm sign-in success
        console.log("Auth current user after login:", auth.currentUser);
        console.log("User UID:", auth.currentUser?.uid);

        // 4) (Optional) Store your server JWT if you still need it
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userData", JSON.stringify(response.data.user));

        // 5) Check onboarding
        if (response.data.user.onboardingComplete) {
          navigate("/academichomepage");
        } else {
          navigate("/platformintro");
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