// src/store/aggregatorSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

/* ------------------------------------------------------------------ */
/* 1 ▪ Master fetch – runs once right after the plan is in Redux      */
/* ------------------------------------------------------------------ */
export const fetchAggregatorData = createAsyncThunk(
  "aggregator/fetchAggregatorData",
  /* no args */ async (_, thunkAPI) => {
    const state      = thunkAPI.getState();
    const userId     = state.auth?.userId;
    const planDoc    = state.plan?.planDoc;
    const planId     = planDoc?.id;
    const backendURL = import.meta.env.VITE_BACKEND_URL;   // env var

    if (!userId || !planId || !planDoc) {
      return thunkAPI.rejectWithValue("Missing userId, planId or planDoc");
    }

    /* ----- derive id lists from the plan -------------------------- */
    const activityIds    = [];
    const subchapterIds  = new Set();
    const activityTypeById = {};          // so we know "read" vs "quiz"

    (planDoc.sessions || []).forEach((sess) =>
      (sess.activities || []).forEach((act) => {
        if (act.activityId) {
          activityIds.push(act.activityId);
          activityTypeById[act.activityId] =
            (act.type || "").toLowerCase().includes("read") ? "read" : "quiz";
        }
        if (act.subChapterId) subchapterIds.add(act.subChapterId);
      })
    );

    /* ----- (A) getActivityTime for every activity ----------------- */
    const timeMap = {};                             // { activityId: seconds }
    await Promise.all(
      activityIds.map(async (id) => {
        try {
          const { data } = await axios.get(
            `${backendURL}/api/getActivityTime`,
            { params: { activityId: id, type: activityTypeById[id] } }
          );
          timeMap[id] = data?.totalTime ?? 0;
        } catch {
          timeMap[id] = 0;                          // graceful fallback
        }
      })
    );

    /* ----- (B) subchapter-status for each subChapter -------------- */
    const subchapterMap = {};                       // { subId: {...} }
    await Promise.all(
      [...subchapterIds].map(async (sid) => {
        try {
          const { data } = await axios.get(
            `${backendURL}/subchapter-status`,
            { params: { userId, planId, subchapterId: sid } }
          );
          subchapterMap[sid] = data ?? {};
        } catch {
          subchapterMap[sid] = {};
        }
      })
    );

    return { timeMap, subchapterMap };
  }
);

/* ------------------------------------------------------------------ */
/* 2 ▪ Incremental thunks (optional, handy later)                     */
/* ------------------------------------------------------------------ */
export const incrementReadingTime = createAsyncThunk(
  "aggregator/incrementReadingTime",
  async ({ activityId, seconds }, thunkAPI) => {
    const backendURL = import.meta.env.VITE_BACKEND_URL;
    try {
      await axios.post(`${backendURL}/api/incrementReadingTime`, {
        activityId,
        increment: seconds,
      });
      return { activityId, seconds };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || "incrementReadingTime err");
    }
  }
);

export const incrementQuizTime = createAsyncThunk(
  "aggregator/incrementQuizTime",
  async ({ activityId, seconds }, thunkAPI) => {
    const backendURL = import.meta.env.VITE_BACKEND_URL;
    try {
      await axios.post(`${backendURL}/api/incrementQuizTime`, {
        activityId,
        increment: seconds,
      });
      return { activityId, seconds };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.message || "incrementQuizTime err");
    }
  }
);

/* ------------------------------------------------------------------ */
/* 3 ▪ Slice                                                          */
/* ------------------------------------------------------------------ */
const aggregatorSlice = createSlice({
  name: "aggregator",
  initialState: {
    status: "idle",            // idle | loading | succeeded | failed
    error:  null,
    timeMap: {},               // { [activityId]: seconds }
    subchapterMap: {},         // { [subChapterId]: obj }
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      /* ---- master fetch ---- */
      .addCase(fetchAggregatorData.pending, (st) => {
        st.status = "loading";
        st.error  = null;
      })
      .addCase(fetchAggregatorData.fulfilled, (st, action) => {
        st.status = "succeeded";
        Object.assign(st.timeMap,       action.payload.timeMap);
        Object.assign(st.subchapterMap, action.payload.subchapterMap);
      })
      .addCase(fetchAggregatorData.rejected, (st, action) => {
        st.status = "failed";
        st.error  = action.payload ?? action.error.message;
      })

      /* ---- reading time bump ---- */
      .addCase(incrementReadingTime.fulfilled, (st, { payload }) => {
        const { activityId, seconds } = payload;
        st.timeMap[activityId] = (st.timeMap[activityId] || 0) + seconds;
      })

      /* ---- quiz time bump ---- */
      .addCase(incrementQuizTime.fulfilled, (st, { payload }) => {
        const { activityId, seconds } = payload;
        st.timeMap[activityId] = (st.timeMap[activityId] || 0) + seconds;
      });
  },
});

export default aggregatorSlice.reducer;