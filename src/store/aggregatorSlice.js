/*  ──────────────────────────────────────────────────────────────
    aggregatorSlice.js
    • Two fetch modes
        1.  fetchAggregatorData      ⟶ legacy “load everything once”
        2.  fetchAggregatorForDay    ⟶ NEW lazy day-by-day loader
    • The slice now tracks which session-days it has hydrated so
      subsequent requests are no-ops.
    • Existing incremental thunks (incrementReadingTime / QuizTime)
      untouched.
    ────────────────────────────────────────────────────────────── */
    import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
    import axios from "axios";
    
    /* ================================================================
       1 ▪ Legacy whole-plan fetch  (kept for backward compatibility)
    ================================================================ */
    export const fetchAggregatorData = createAsyncThunk(
      "aggregator/fetchAggregatorData",
      async (_, thunkAPI) => {
        const state      = thunkAPI.getState();
        const userId     = state.auth?.userId;
        const planDoc    = state.plan?.planDoc;
        const planId     = planDoc?.id;
        const backendURL = import.meta.env.VITE_BACKEND_URL;
    
        if (!userId || !planId || !planDoc) {
          return thunkAPI.rejectWithValue("Missing userId / planId / planDoc");
        }
    
        /* ----- derive id lists from entire plan ------------------- */
        const activityIds    = [];
        const subchapterIds  = new Set();
        const typeById       = {};
    
        (planDoc.sessions || []).forEach((sess) =>
          (sess.activities || []).forEach((act) => {
            if (act.activityId) {
              activityIds.push(act.activityId);
              typeById[act.activityId] =
                (act.type || "").toLowerCase().includes("read") ? "read" : "quiz";
            }
            if (act.subChapterId) subchapterIds.add(act.subChapterId);
          })
        );
    
        const timeMap = {};
        await Promise.all(
          activityIds.map(async (id) => {
            try {
              const { data } = await axios.get(
                `${backendURL}/api/getActivityTime`,
                { params: { activityId: id, type: typeById[id] } }
              );
              timeMap[id] = data?.totalTime ?? 0;
            } catch {
              timeMap[id] = 0;
            }
          })
        );
    
        const subchapterMap = {};
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
    
    /* ================================================================
       2 ▪ NEW  fetchAggregatorForDay({ dayIndex })
          • idempotent  – exits if day already loaded
          • merges results into global maps
    ================================================================ */
    export const fetchAggregatorForDay = createAsyncThunk(
      "aggregator/fetchAggregatorForDay",
      async ({ dayIndex }, thunkAPI) => {
        const state      = thunkAPI.getState();
        const userId     = state.auth?.userId;
        const planDoc    = state.plan?.planDoc;
        const planId     = planDoc?.id;
        const backendURL = import.meta.env.VITE_BACKEND_URL;
    
        if (!userId || !planDoc) {
          return thunkAPI.rejectWithValue("Missing userId or planDoc");
        }
    
        /* exit early if already hydrated */
        if (state.aggregator.loadedDays[dayIndex]) {
          return { dayIndex, cached: true, timeMap: {}, subchapterMap: {} };
        }
    
        const session = planDoc.sessions?.[dayIndex];
        if (!session) {
          return thunkAPI.rejectWithValue(`No session at index ${dayIndex}`);
        }
    
        const acts = session.activities || [];
        const activityIds   = [];
        const subchapterIds = new Set();
        const typeById      = {};
    
        acts.forEach((act) => {
          if (act.activityId) {
            activityIds.push(act.activityId);
            typeById[act.activityId] =
              (act.type || "").toLowerCase().includes("read") ? "read" : "quiz";
          }
          if (act.subChapterId) subchapterIds.add(act.subChapterId);
        });
    
        /* ---- time map for this day ---- */
        const timeMap = {};
        await Promise.all(
          activityIds.map(async (id) => {
            try {
              const { data } = await axios.get(
                `${backendURL}/api/getActivityTime`,
                { params: { activityId: id, type: typeById[id] } }
              );
              timeMap[id] = data?.totalTime ?? 0;
            } catch {
              timeMap[id] = 0;
            }
          })
        );
    
        /* ---- sub-chapter map for this day ---- */
        const subchapterMap = {};
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
    
        return { dayIndex, cached: false, timeMap, subchapterMap };
      }
    );

    /* --------------------------------------------------------------
   fetchAggregatorForSubchapter({ subChapterId })
   • idempotent – exits if that sub-chapter is already cached
-------------------------------------------------------------- */
export const fetchAggregatorForSubchapter = createAsyncThunk(
    "aggregator/fetchAggregatorForSubchapter",
    async ({ subChapterId }, thunkAPI) => {
      const state      = thunkAPI.getState();
      const userId     = state.auth?.userId;
      const planDoc    = state.plan?.planDoc;
      const planId     = planDoc?.id;
      const backendURL = import.meta.env.VITE_BACKEND_URL;
  
      if (!userId || !planId) {
        return thunkAPI.rejectWithValue("Missing userId / planId");
      }
      /* already cached? */
      if (state.aggregator.subchapterMap[subChapterId]) {
        return { subChapterId, cached: true, payload: {} };
      }
  
      try {
        const { data } = await axios.get(
          `${backendURL}/subchapter-status`,
          { params: { userId, planId, subchapterId: subChapterId } }
        );
        return { subChapterId, cached: false, payload: data || {} };
      } catch (err) {
        return thunkAPI.rejectWithValue(err.message || "subchapter-status err");
      }
    }
  );
  
 
    
    
    /* ================================================================
       3 ▪ Incremental “bump” thunks  (unchanged)
    ================================================================ */
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
    
    /* ================================================================
       4 ▪ Slice definition
    ================================================================ */
    const aggregatorSlice = createSlice({
      name: "aggregator",
      initialState: {
        status: "idle",              // global status for legacy fetch
        error:  null,
        timeMap: {},                 // { [activityId]: seconds }
        subchapterMap: {},           // { [subChapterId]: blob }
        loadedDays:  {},             // { [dayIdx]: true }
        loadingDays: {},             // { [dayIdx]: true }
        subchapterErrors: {},   // NEW  { [subChapterId]: "msg" }
      },
      reducers: {},
      extraReducers: (builder) => {
        /* ---------- legacy whole-plan loader ---------- */
        builder
          .addCase(fetchAggregatorData.pending,   (st) => {
            st.status = "loading";
            st.error  = null;
          })
          .addCase(fetchAggregatorData.fulfilled, (st, { payload }) => {
            st.status = "succeeded";
            Object.assign(st.timeMap,       payload.timeMap);
            Object.assign(st.subchapterMap, payload.subchapterMap);
            /* mark ALL days as loaded because we hydrated the whole plan */
            const planSessions = Object.keys(payload.subchapterMap).length;
            for (let i = 0; i < planSessions; i++) st.loadedDays[i] = true;
          })
          .addCase(fetchAggregatorData.rejected,  (st, action) => {
            st.status = "failed";
            st.error  = action.payload ?? action.error.message;
          });
    
        /* ---------- new day-scoped loader ---------- */
        builder
          .addCase(fetchAggregatorForDay.pending, (st, { meta }) => {
            st.loadingDays[meta.arg.dayIndex] = true;
          })
          .addCase(fetchAggregatorForDay.fulfilled, (st, { payload }) => {
            const { dayIndex, timeMap, subchapterMap } = payload;
            delete st.loadingDays[dayIndex];
            st.loadedDays[dayIndex] = true;
            Object.assign(st.timeMap,       timeMap);
            Object.assign(st.subchapterMap, subchapterMap);
          })
          .addCase(fetchAggregatorForDay.rejected, (st, { meta, error }) => {
            delete st.loadingDays[meta.arg.dayIndex];
            st.error = error.message;
          });
    
        /* ---------- incremental bumps ---------- */
        builder
          .addCase(incrementReadingTime.fulfilled, (st, { payload }) => {
            const { activityId, seconds } = payload;
            st.timeMap[activityId] = (st.timeMap[activityId] || 0) + seconds;
          })
          .addCase(incrementQuizTime.fulfilled, (st, { payload }) => {
            const { activityId, seconds } = payload;
            st.timeMap[activityId] = (st.timeMap[activityId] || 0) + seconds;
          });

          builder
            .addCase(fetchAggregatorForSubchapter.pending, (st, { meta }) => {
              const id = meta.arg.subChapterId;
              delete st.subchapterErrors[id];
            })
            .addCase(fetchAggregatorForSubchapter.fulfilled, (st, { payload }) => {
              const id = payload.subChapterId;
              delete st.subchapterErrors[id];
              if (!payload.cached) {
                st.subchapterMap[id] = payload.payload;
              }
            })
            .addCase(fetchAggregatorForSubchapter.rejected, (st, { payload, meta, error }) => {
              const id = meta.arg.subChapterId;
              st.subchapterErrors[id] = payload || error.message || "unknown error";
            });


          
      },
    });
    
    export default aggregatorSlice.reducer;