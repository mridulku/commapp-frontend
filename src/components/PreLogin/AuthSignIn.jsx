// src/components/AuthSignIn.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCustomToken
} from "firebase/auth";
import axios from "axios";
import { auth } from "../../firebase";

// ----- Material UI Imports -----
import {
  createTheme,
  ThemeProvider,
  styled
} from "@mui/material/styles";
import {
  CssBaseline,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Divider,
  Alert
} from "@mui/material";

// OPTIONAL: small Google "G" logo icon
const GoogleLogo = () => (
  <img
    src="https://upload.wikimedia.org/u/0/gs/internal/gfpdoor/logo_googleg_192.png"
    alt="Google Logo"
    width="18"
    height="18"
    style={{ marginRight: 8, verticalAlign: "middle" }}
  />
);

// Dark theme with purple + gold accents
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#B39DDB" // Purple accent
    },
    secondary: {
      main: "#FFD700" // Gold accent
    },
    background: {
      default: "#0F0F0F",
      paper: "#1F1F1F"
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#AAAAAA"
    }
  },
  typography: {
    fontFamily: [
      "Inter",
      "Roboto",
      "Helvetica",
      "Arial",
      "sans-serif"
    ].join(","),
  },
});

// A styled Paper container to hold our sign-in box
const SignInContainer = styled(Paper)(({ theme }) => ({
  maxWidth: 400,
  margin: "60px auto",
  padding: theme.spacing(4),
  textAlign: "center",
  backgroundColor: theme.palette.background.paper,
}));

export default function AuthSignIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  // If you have your backend URL in env or just hardcode it:
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

  // If user is already logged in => redirect to /dashboard
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  /**
   * Helper: After sign-in, create learnerPersonas doc if it doesn't exist
   * with userId, wpm=200, dailyReadingTime=30
   */
  async function createLearnerPersonaIfNeeded() {
    try {
      // The current user must exist here
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      // Call an endpoint in your backend that does:
      // "If there's no doc in learnerPersonas with userId = X, create it with wpm=200, dailyReadingTime=30"
      await axios.post(`${backendURL}/create-learner-persona`, {
        userId: currentUser.uid,
        wpm: 200,
        dailyReadingTime: 30
      });
      // If the doc already exists, the server can ignore or do nothing
    } catch (err) {
      console.error("Error creating learner persona:", err);
      // Not a show-stopper, but log an error if needed
    }
  }

  // =============================================
  // 1) USERNAME + PASSWORD Sign-In
  // =============================================
  const handleEmailPasswordSignIn = async () => {
    setErrorMsg("");
    try {
      const response = await axios.post(`${backendURL}/login`, {
        username,
        password
      });

      if (response.data.success) {
        const { token, firebaseCustomToken, user } = response.data;
        if (!firebaseCustomToken) {
          alert("No Firebase custom token returned from server.");
          return;
        }

        // ----- IMPORTANT: sign in to Firebase using the custom token -----
        await signInWithCustomToken(auth, firebaseCustomToken);

        // Try to create a learner persona if none exists
        await createLearnerPersonaIfNeeded();

        // Store your JWT + user data
        localStorage.setItem("token", token);
        localStorage.setItem("userData", JSON.stringify(user));

        // Navigate to dashboard
        navigate("/dashboard");
      } else {
        setErrorMsg(response.data.error || "Login failed");
      }
    } catch (error) {
      console.error("Error logging in with username/password:", error);
      setErrorMsg("Login failed. Check console for details.");
    }
  };

  // =============================================
  // 2) GOOGLE Sign-In
  // =============================================
  const handleGoogleSignIn = async () => {
    setErrorMsg("");
    try {
      // Sign in with Google popup
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);

      // Get Firebase ID token from the newly signed-in user
      const idToken = await auth.currentUser.getIdToken();

      // Send it to your server's /login-google route
      const response = await axios.post(`${backendURL}/login-google`, { idToken });

      if (response.data.success) {
        const { token, firebaseCustomToken, user } = response.data;

        // ----- Sign in with the custom token from the server -----
        await signInWithCustomToken(auth, firebaseCustomToken);

        // Try to create a learner persona if none exists
        await createLearnerPersonaIfNeeded();

        // Store server JWT + user data
        localStorage.setItem("token", token);
        localStorage.setItem("userData", JSON.stringify(user));

        // Navigate to dashboard
        navigate("/dashboard");
      } else {
        setErrorMsg(response.data.error || "Google Sign-In failed");
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
      setErrorMsg("Google Sign-In failed. Check console for details.");
    }
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Container maxWidth="sm">
        <SignInContainer elevation={4}>
          <Typography variant="h5" sx={{ fontWeight: "bold", mb: 1 }}>
            Welcome Back
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
            Please sign in to continue
          </Typography>

          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMsg}
            </Alert>
          )}

          {/* USERNAME */}
          <TextField
            fullWidth
            variant="outlined"
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* PASSWORD */}
          <TextField
            fullWidth
            variant="outlined"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Button
            onClick={handleEmailPasswordSignIn}
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mb: 2, fontWeight: "bold" }}
          >
            Sign In with Username/Password
          </Button>

          <Divider sx={{ my: 2 }}>OR</Divider>

          <Button
            onClick={handleGoogleSignIn}
            variant="outlined"
            color="secondary"
            fullWidth
            sx={{
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <GoogleLogo />
            Sign In with Google
          </Button>
        </SignInContainer>
      </Container>
    </ThemeProvider>
  );
}