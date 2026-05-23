import { configureStore } from "@reduxjs/toolkit";
import budget from "./budgetSlice";
import ui from "./uiSlice";

const store = configureStore({
  reducer: {
    budget,
    ui,
  },
});

export default store;
