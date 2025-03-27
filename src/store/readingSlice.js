// store/readingSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// GET /api/getReadingTime => returns { totalSeconds }
export const fetchReadingTime = createAsyncThunk(
  "reading/fetchReadingTime",
  async ({ userId, planId, subChapterId }, { rejectWithValue }) => {
    try {
      const res = await axios.get("http://localhost:3001/api/getReadingTime", {
        params: { userId, planId, subChapterId },
      });
      return res.data.totalSeconds || 0;
    } catch (err) {
      return rejectWithValue(err.message || "Error fetching reading time");
    }
  }
);

// POST /api/incrementReadingTime => returns { newTotalSeconds }
export const incrementReadingTime = createAsyncThunk(
  "reading/incrementReadingTime",
  async ({ userId, planId, subChapterId, increment }, { rejectWithValue }) => {
    try {
      const res = await axios.post("http://localhost:3001/api/incrementReadingTime", {
        userId,
        planId,
        subChapterId,
        increment,
      });
      return res.data.newTotalSeconds; 
    } catch (err) {
      return rejectWithValue(err.message || "Error incrementing reading time");
    }
  }
);

const readingSlice = createSlice({
  name: "reading",
  initialState: {
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReadingTime.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchReadingTime.fulfilled, (state, action) => {
        state.status = "succeeded";
      })
      .addCase(fetchReadingTime.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(incrementReadingTime.fulfilled, (state, action) => {
        // The payload is newTotalSeconds
        // If you want to store it in Redux, you can do so here.
      })
      .addCase(incrementReadingTime.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default readingSlice.reducer;