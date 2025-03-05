// planSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

/**
 * fetchPlan
 * Async thunk to load a plan by planId from your endpoint, e.g. GET /api/adaptive-plan?planId=xxx
 */
export const fetchPlan = createAsyncThunk(
  "plan/fetchPlan",
  async ({ planId, backendURL, fetchUrl }, thunkAPI) => {
    try {
      const res = await axios.get(`${backendURL}${fetchUrl}`, {
        params: { planId },
      });
      if (!res.data || !res.data.planDoc) {
        return thunkAPI.rejectWithValue("No planDoc found in response");
      }
      return res.data.planDoc;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || "Error fetching plan");
    }
  }
);

/**
 * Helper: addFlatIndexes
 * 1) Iterates over planDoc.sessions
 * 2) For each activity, adds { dayIndex, flatIndex }.
 * 3) Returns: { updatedPlanDoc, flattenedActivities }
 */
function addFlatIndexes(planDoc) {
  let globalIndex = 0;

  // 1) Create a mutated copy of planDoc where each activity gets flatIndex
  const newSessions = (planDoc.sessions || []).map((sess, dayIndex) => {
    const newActivities = (sess.activities || []).map((act) => {
      const updatedAct = {
        ...act,
        dayIndex,
        flatIndex: globalIndex,
      };
      globalIndex += 1;
      return updatedAct;
    });
    return { ...sess, activities: newActivities };
  });

  const updatedPlanDoc = {
    ...planDoc,
    sessions: newSessions,
  };

  // 2) Build flattened array from the mutated sessions
  const flattenedActivities = [];
  newSessions.forEach((sess) => {
    (sess.activities || []).forEach((act) => {
      flattenedActivities.push(act);
    });
  });

  return { updatedPlanDoc, flattenedActivities };
}

// The Redux slice
const planSlice = createSlice({
  name: "plan",
  initialState: {
    planDoc: null,             // will store the mutated planDoc (with flatIndex)
    flattenedActivities: [],   // the global array
    currentIndex: -1,
    status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
  },
  reducers: {
    setCurrentIndex(state, action) {
      state.currentIndex = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlan.pending, (state) => {
        state.status = "loading";
        state.error = null;
        state.planDoc = null;
        state.flattenedActivities = [];
        state.currentIndex = -1;
      })
      .addCase(fetchPlan.fulfilled, (state, action) => {
        state.status = "succeeded";

        // Insert dayIndex + flatIndex into planDoc activities
        const { updatedPlanDoc, flattenedActivities } = addFlatIndexes(
          action.payload
        );

        // Store mutated doc + flattened array in Redux
        state.planDoc = updatedPlanDoc;
        state.flattenedActivities = flattenedActivities;

        // Initialize currentIndex
        state.currentIndex =
          flattenedActivities.length > 0 ? 0 : -1;
      })
      .addCase(fetchPlan.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      });
  },
});

export const { setCurrentIndex } = planSlice.actions;
export default planSlice.reducer;