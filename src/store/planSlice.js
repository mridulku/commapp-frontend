import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

/**
 * fetchPlan
 * ----------
 * Async thunk to load a plan by planId from your endpoint (GET /api/adaptive-plan?planId=xxx).
 * Also accepts an optional 'initialActivityContext' (e.g. { subChapterId: "x", type: "READ" })
 */
export const fetchPlan = createAsyncThunk(
  "plan/fetchPlan",
  async ({ planId, backendURL, fetchUrl, initialActivityContext }, thunkAPI) => {
    try {
      console.log("[planSlice] fetchPlan => planId:", planId, "initialActivityContext:", initialActivityContext);

      // GET /api/adaptive-plan?planId=...
      const res = await axios.get(`${backendURL}${fetchUrl}`, {
        params: { planId },
      });

      if (!res.data || !res.data.planDoc) {
        console.warn("[planSlice] fetchPlan => no planDoc in response:", res.data);
        return thunkAPI.rejectWithValue("No planDoc found in response");
      }

      // Return planDoc + initialActivityContext so we can handle it in 'fulfilled'
      console.log("[planSlice] fetchPlan => planDoc found =>", res.data.planDoc);

      return {
        planDoc: res.data.planDoc,
        initialActivityContext: initialActivityContext || null,

        // We also return the planId we used,
        // in case the backend didn't embed it in planDoc
        requestedPlanId: planId,
      };
    } catch (err) {
      console.error("[planSlice] fetchPlan => error:", err);
      return thunkAPI.rejectWithValue(err.message || "Error fetching plan");
    }
  }
);

/**
 * Helper: addFlatIndexes
 *  1) Iterates over planDoc.sessions
 *  2) For each activity, adds { dayIndex, flatIndex }.
 *  3) Returns: { updatedPlanDoc, flattenedActivities }
 */
function addFlatIndexes(planDoc) {
  let globalIndex = 0;
  console.log("[planSlice] addFlatIndexes => start, planDoc.sessions length:", (planDoc.sessions || []).length);

  // 1) create a mutated copy of planDoc where each activity gets flatIndex
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

  const updatedPlanDoc = { ...planDoc, sessions: newSessions };

  // 2) build flattened array
  const flattenedActivities = [];
  newSessions.forEach((sess) => {
    (sess.activities || []).forEach((act) => {
      flattenedActivities.push(act);
    });
  });

  console.log("[planSlice] addFlatIndexes => final flattenedActivities length:", flattenedActivities.length);
  return { updatedPlanDoc, flattenedActivities };
}

// The Redux slice
const planSlice = createSlice({
  name: "plan",
  initialState: {
    planDoc: null,           // mutated planDoc (with flatIndex)
    flattenedActivities: [], // global flattened array
    currentIndex: -1,
    status: "idle",          // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    examId: "general",       // store examId in Redux
  },
  reducers: {
    setCurrentIndex(state, action) {
      state.currentIndex = action.payload;
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

        // We expect { planDoc, initialActivityContext, requestedPlanId }
        const { planDoc, initialActivityContext, requestedPlanId } = action.payload;
        console.log("[planSlice] planDoc =>", planDoc);
        console.log("[planSlice] initialActivityContext =>", initialActivityContext);
        console.log("[planSlice] requestedPlanId =>", requestedPlanId);

        // 1) Insert dayIndex + flatIndex into planDoc activities
        const { updatedPlanDoc, flattenedActivities } = addFlatIndexes(planDoc);

        // 2) If the server didn't return a .id or .planId, forcibly set them
        //    (Pick whichever field your front-end actually uses, e.g. "planId" or "id")
        if (requestedPlanId) {
          // If there's no planId in the doc, set it:
          if (!updatedPlanDoc.planId) {
            updatedPlanDoc.planId = requestedPlanId;
            console.log(`[planSlice] forcibly set updatedPlanDoc.planId = ${requestedPlanId}`);
          }
          // If there's no .id in the doc, set it as well:
          if (!updatedPlanDoc.id) {
            updatedPlanDoc.id = requestedPlanId;
            console.log(`[planSlice] forcibly set updatedPlanDoc.id = ${requestedPlanId}`);
          }
        }

        // 3) Store mutated doc + flattened array in Redux
        state.planDoc = updatedPlanDoc;
        state.flattenedActivities = flattenedActivities;

        // 4) Also store examId for global convenience
        state.examId = updatedPlanDoc.examId || "general";

        // 5) Default currentIndex => 0 if we have items
        let newIndex = flattenedActivities.length > 0 ? 0 : -1;

        // 6) If we have initialActivityContext => find matching item
        if (initialActivityContext && flattenedActivities.length > 0) {
          const { subChapterId, type } = initialActivityContext;
          console.log("[planSlice] searching for subChapterId:", subChapterId, "and type:", type);

          const found = flattenedActivities.find(
            (a) =>
              a.subChapterId === subChapterId &&
              (a.type || "").toUpperCase() === (type || "").toUpperCase()
          );

          if (found) {
            console.log("[planSlice] found match =>", found);
            newIndex = found.flatIndex;
          } else {
            console.log("[planSlice] no match found => defaulting to first activity");
          }
        }

        // 7) Set currentIndex
        state.currentIndex = newIndex;
        console.log("[planSlice] final currentIndex =>", newIndex);
      })
      .addCase(fetchPlan.rejected, (state, action) => {
        console.log("[planSlice] fetchPlan => rejected!");
        state.status = "failed";
        state.error = action.payload || action.error.message;
      });
  },
});

export const { setCurrentIndex } = planSlice.actions;
export default planSlice.reducer;