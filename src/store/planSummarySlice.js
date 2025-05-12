/* ------------------------------------------------------------------
   planSummarySlice.js     (JS, no TS)
   ------------------------------------------------------------------
   Keeps a *local cache* of adaptivePlanSummaries/{planId}/subs/{subId}
-------------------------------------------------------------------*/
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getFirestore, doc, getDoc }     from "firebase/firestore";

/* ──────────────────────────────────────────────────────────────
   THUNK – fetch one sub-chapter summary
   arg = { planId , subId }
──────────────────────────────────────────────────────────────── */
export const fetchSubSummary = createAsyncThunk(
  "planSummary/fetchSubSummary",
  async ({ planId, subId }, thunkAPI) => {
    if (!planId || !subId) {
      throw new Error("fetchSubSummary: planId and subId are required");
    }

    const db   = getFirestore();
    const ref  = doc(db, "adaptivePlanSummaries", planId, "subs", subId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      throw new Error(`No summary found for sub ${subId}`);
    }

    return { subId, payload: snap.data() };
  }
);

/* ──────────────────────────────────────────────────────────────
   SLICE
──────────────────────────────────────────────────────────────── */
const planSummarySlice = createSlice({
  name: "planSummary",
  initialState: {
    entities : {},   // { [subId] : summaryDoc }
    loading  : {},   // { [subId] : true|false }
    error    : {},   // { [subId] : "msg" }
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      /* ----- fetchSubSummary ----- */
      .addCase(fetchSubSummary.pending, (st, { meta }) => {
        const { subId } = meta.arg;
        st.loading[subId] = true;
        delete st.error[subId];
      })
      .addCase(fetchSubSummary.fulfilled, (st, { payload }) => {
        const { subId, payload: docData } = payload;
        st.loading[subId]  = false;
        st.entities[subId] = docData;
      })
      .addCase(fetchSubSummary.rejected, (st, { meta, error }) => {
        const { subId } = meta.arg;
        st.loading[subId] = false;
        st.error[subId]   = error.message;
      });
  },
});

export default planSummarySlice.reducer;

/* ──────────────────────────────────────────────────────────────
   SELECTORS
──────────────────────────────────────────────────────────────── */

/** 1) Per-stage concept-stats object  */
export const selectConceptStats = (state, subId, stage) =>
  state.planSummary.entities?.[subId]?.conceptStats?.[stage] || {};

/** 2) All concept names (union of keys across stages) */
export const selectConceptNames = (state, subId) => {
  const cs = state.planSummary.entities?.[subId]?.conceptStats;
  if (!cs) return [];
  const names = new Set();
  Object.values(cs).forEach(stageMap =>
    Object.keys(stageMap || {}).forEach(n => names.add(n))
  );
  return Array.from(names).sort((a, b) => (a || "").localeCompare(b || ""));
};

/** 3) Top-level per-stage percentages (reading, remember, …) */
export const selectSubSummaryMeta = (state, subId) => {
  const e = state.planSummary.entities?.[subId];
  return e
    ? {
        readingPct   : e.readingPct    ?? 0,
        rememberPct  : e.rememberPct   ?? null,
        understandPct: e.understandPct ?? null,
        applyPct     : e.applyPct      ?? null,
        analyzePct   : e.analyzePct    ?? null,
      }
    : {
        readingPct: 0,
        rememberPct: null,
        understandPct: null,
        applyPct: null,
        analyzePct: null,
      };
};