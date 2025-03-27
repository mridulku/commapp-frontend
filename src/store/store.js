import { configureStore } from "@reduxjs/toolkit";
import planReducer from "./planSlice"; // We'll define planSlice in the next snippet
import authReducer from "./authSlice"; // <-- import your new auth slice
import examReducer from "./examSlice"; // <--- import the new slice
import timeTrackingReducer from "./timeTrackingSlice"; // <--- new




export const store = configureStore({
  reducer: {
    plan: planReducer,
    auth: authReducer, 
    exam: examReducer, // <--- add the exam slice
    timeTracking: timeTrackingReducer, // <--- add it

    // <-- add the auth slice
    // ... add other slices as needed
  },
});

export default store;