// File: planSlice.js
// ────────────────────────────────────────────────────────────────
//  v2 – adds `setPlanDoc` so other components can inject a plan
//       into Redux without refetching.  Nothing else removed.
// ────────────────────────────────────────────────────────────────

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

/* ================================================================
   1 ▪ Async thunk – fetchPlan (unchanged)
================================================================ */
export const fetchPlan = createAsyncThunk(
  "plan/fetchPlan",
  async ({ planId, backendURL, fetchUrl, initialActivityContext }, thunkAPI) => {
    try {
      console.log(
        "[planSlice] fetchPlan => planId:",
        planId,
        "initialActivityContext:",
        initialActivityContext
      );

      const res = await axios.get(`${backendURL}${fetchUrl}`, {
        params: { planId },
      });

      if (!res.data || !res.data.planDoc) {
        console.warn(
          "[planSlice] fetchPlan => no planDoc in response:",
          res.data
        );
        return thunkAPI.rejectWithValue("No planDoc found in response");
      }

      console.log(
        "[planSlice] fetchPlan => planDoc found =>",
        res.data.planDoc
      );

      return {
        planDoc: res.data.planDoc,
        initialActivityContext: initialActivityContext || null,
        requestedPlanId: planId,
      };
    } catch (err) {
      console.error("[planSlice] fetchPlan => error:", err);
      return thunkAPI.rejectWithValue(err.message || "Error fetching plan");
    }
  }
);

/* ================================================================
   2 ▪ Helper – addFlatIndexes (unchanged)
================================================================ */
function addFlatIndexes(planDoc) {
  let globalIndex = 0;
  console.log(
    "[planSlice] addFlatIndexes => start, planDoc.sessions length:",
    (planDoc.sessions || []).length
  );

  const newSessions = (planDoc.sessions || []).map((sess, dayIndex) => {
    const newActivities = (sess.activities || []).map((act) => {
      const aggregatorTask = act.aggregatorTask ?? null;
      const aggregatorStatus = act.aggregatorStatus ?? null;

      let derivedType = (act.type || "").toLowerCase();
      if (!derivedType) derivedType = "read";

      let derivedQuizStage = "";
      if (derivedType === "quiz") {
        const rawStage = (act.quizStage || "").toLowerCase();
        const recognizedStages = [
          "remember",
          "understand",
          "apply",
          "analyze",
          "cumulativequiz",
          "cumulativerevision",
        ];
        derivedQuizStage = recognizedStages.includes(rawStage)
          ? rawStage
          : "remember";
      }

      const updatedAct = {
        ...act,
        aggregatorTask,
        aggregatorStatus,
        dayIndex,
        flatIndex: globalIndex,
        type: derivedType,
        quizStage: derivedQuizStage,
      };
      globalIndex += 1;
      return updatedAct;
    });
    return { ...sess, activities: newActivities };
  });

  const updatedPlanDoc = { ...planDoc, sessions: newSessions };

  const flattenedActivities = [];
  newSessions.forEach((sess) => {
    (sess.activities || []).forEach((act) => {
      flattenedActivities.push(act);
    });
  });

  console.log(
    "[planSlice] addFlatIndexes => final flattenedActivities length:",
    flattenedActivities.length
  );
  return { updatedPlanDoc, flattenedActivities };
}

/* ================================================================
   3 ▪ Slice definition
================================================================ */
const planSlice = createSlice({
  name: "plan",
  initialState: {
    planDoc: null,
    flattenedActivities: [],
    currentIndex: -1,
    status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    examId: "general",
  },
  reducers: {
    /* Keep existing reducer */
    setCurrentIndex(state, action) {
      state.currentIndex = action.payload;
    },

    /* NEW ▸ allow components to inject / overwrite the planDoc
       without going through fetchPlan again */
    setPlanDoc(state, action) {
      const incoming = action.payload;
      if (!incoming) return;

      console.log("[planSlice] setPlanDoc => received planDoc:", incoming);

      /* 1) Apply flat indexes & aggregator placeholders */
      const { updatedPlanDoc, flattenedActivities } = addFlatIndexes(incoming);

      /* 2) Store */
      state.planDoc = updatedPlanDoc;
      state.flattenedActivities = flattenedActivities;

      /* 3) Reset pointer to first activity (or -1 if none) */
      state.currentIndex =
        flattenedActivities.length > 0 ? 0 : -1;

      /* 4) Keep examId handy */
      state.examId = updatedPlanDoc.examId || "general";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlan.pending, (state) => {
        console.log("[planSlice] fetchPlan => pending...");
        state.status = "loading";
        state.error = null;
        state.planDoc = null;
        state.flattenedActivities = [];
        state.currentIndex = -1;
      })
      .addCase(fetchPlan.fulfilled, (state, action) => {
        console.log("[planSlice] fetchPlan => fulfilled!");
        state.status = "succeeded";

        const { planDoc, initialActivityContext, requestedPlanId } =
          action.payload;

        const { updatedPlanDoc, flattenedActivities } =
          addFlatIndexes(planDoc);

        if (requestedPlanId) {
          if (!updatedPlanDoc.planId) updatedPlanDoc.planId = requestedPlanId;
          if (!updatedPlanDoc.id) updatedPlanDoc.id = requestedPlanId;
        }

        state.planDoc = updatedPlanDoc;
        state.flattenedActivities = flattenedActivities;
        state.examId = updatedPlanDoc.examId || "general";

        let newIndex = flattenedActivities.length > 0 ? 0 : -1;

        if (initialActivityContext && flattenedActivities.length > 0) {
          const { subChapterId, type } = initialActivityContext;
          const found = flattenedActivities.find(
            (a) =>
              a.subChapterId === subChapterId &&
              (a.type || "").toUpperCase() === (type || "").toUpperCase()
          );
          if (found) newIndex = found.flatIndex;
        }

        state.currentIndex = newIndex;
      })
      .addCase(fetchPlan.rejected, (state, action) => {
        console.log("[planSlice] fetchPlan => rejected!");
        state.status = "failed";
        state.error = action.payload || action.error.message;
      });
  },
});

/* ================================================================
   4 ▪ Exports
================================================================ */
export const { setCurrentIndex, setPlanDoc } = planSlice.actions;
export default planSlice.reducer;