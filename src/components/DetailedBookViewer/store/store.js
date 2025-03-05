import { configureStore } from "@reduxjs/toolkit";
import planReducer from "./planSlice"; // We'll define planSlice in the next snippet

export const store = configureStore({
  reducer: {
    plan: planReducer,
    // ... add other slices as needed
  },
});

export default store;