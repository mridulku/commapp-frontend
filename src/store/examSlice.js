// examSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  examType: "TOEFL", 
  // you can store more exam-related data in the future, e.g. examConfig: {}, etc.
};

const examSlice = createSlice({
  name: "exam",
  initialState,
  reducers: {
    setExamType(state, action) {
      state.examType = action.payload;
    },
  },
  // If you have any async logic in the future (e.g. fetchExamConfig from an API),
  // you can use extraReducers or createAsyncThunk here.
});

export const { setExamType } = examSlice.actions;
export default examSlice.reducer;