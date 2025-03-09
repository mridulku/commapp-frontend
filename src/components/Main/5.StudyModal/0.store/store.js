import { configureStore } from "@reduxjs/toolkit";
import planReducer from "./planSlice"; // We'll define planSlice in the next snippet
import authReducer from "./authSlice"; // <-- import your new auth slice



export const store = configureStore({
  reducer: {
    plan: planReducer,
    auth: authReducer, // <-- add the auth slice
    // ... add other slices as needed
  },
});

export default store;