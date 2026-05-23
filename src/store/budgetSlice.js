import { createSlice } from "@reduxjs/toolkit";
import {
  DEFAULT_BUDGET,
  LOCAL_STORAGE_KEY,
  defaultExpenses,
} from "../utils/constants";

function loadInitialState() {
  if (typeof localStorage === "undefined") {
    return { monthlyBudget: DEFAULT_BUDGET, expenses: defaultExpenses };
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw)
      return { monthlyBudget: DEFAULT_BUDGET, expenses: defaultExpenses };
    const parsed = JSON.parse(raw);
    return {
      monthlyBudget: parsed?.monthlyBudget ?? DEFAULT_BUDGET,
      expenses: Array.isArray(parsed?.expenses)
        ? parsed.expenses
        : defaultExpenses,
    };
  } catch {
    return { monthlyBudget: DEFAULT_BUDGET, expenses: defaultExpenses };
  }
}

const budgetSlice = createSlice({
  name: "budget",
  initialState: loadInitialState(),
  reducers: {
    setBudget(state, action) {
      state.monthlyBudget = action.payload;
    },
    increaseBudget(state, action) {
      state.monthlyBudget += action.payload;
    },
    addExpense(state, action) {
      state.expenses.unshift(action.payload);
    },
    addMultipleExpenses(state, action) {
      state.expenses = [...action.payload, ...state.expenses];
    },
    deleteExpense(state, action) {
      state.expenses = state.expenses.filter(
        (expense) => expense.id !== action.payload,
      );
    },
    clearExpenses(state) {
      state.expenses = [];
    },
  },
});

export const {
  setBudget,
  increaseBudget,
  addExpense,
  addMultipleExpenses,
  deleteExpense,
  clearExpenses,
} = budgetSlice.actions;

export default budgetSlice.reducer;
