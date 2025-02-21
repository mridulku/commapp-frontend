// src/hooks/useHomeData.js
import { useState, useEffect } from "react";
import { auth } from "../../firebase"; // Adjust path
import axios from "axios";

export function useHomeData() {
  const [userId, setUserId] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Book Info
  const [book, setBook] = useState(null);
  const [loadingBook, setLoadingBook] = useState(false);
  const [error, setError] = useState(null);

  // If you store your backend URL in an env variable:
  const backendURL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

  // 1) Listen for Firebase Auth
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2) Fetch the user’s book once we have userId
  useEffect(() => {
    if (authLoading) return;
    if (!userId) {
      // Not logged in
      setBook(null);
      return;
    }

    const fetchBook = async () => {
      try {
        setLoadingBook(true);
        setError(null);

        // e.g. GET /api/user-book?userId=xxx
        const url = `${backendURL}/api/user-book?userId=${userId}`;
        const response = await axios.get(url);
        if (response.data.success) {
          setBook(response.data.data); // might be null if no book
        } else {
          setError("Failed to fetch user book.");
        }
      } catch (err) {
        console.error("Error fetching user book:", err);
        setError(err.message);
      } finally {
        setLoadingBook(false);
      }
    };

    fetchBook();
  }, [userId, authLoading, backendURL]);

  return {
    userId,
    authLoading,
    book,
    loadingBook,
    error,
  };
}