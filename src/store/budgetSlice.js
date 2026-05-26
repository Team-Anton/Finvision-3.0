import AsyncStorage from '@react-native-async-storage/async-storage'
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { createId } from '../utils/helpers'

const STORAGE_KEY = 'finvision-v3'

const defaultExpenses = [
  {
    id: createId('expense'),
    amount: 120,
    currency: 'BDT',
    category: 'Food',
    subcategory: 'Snacks',
    note: 'Singara and tea',
    merchant: 'Campus Canteen',
    date: new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    }),
  },
  {
    id: createId('expense'),
    amount: 80,
    currency: 'BDT',
    category: 'Transport',
    subcategory: 'Bus/Fare',
    note: 'Bus to UIU',
    merchant: null,
    date: new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    }),
  },
]

export const loadFromStorage = createAsyncThunk('budget/loadFromStorage', async () => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : null
})

export const saveToStorage = (state) => {
  AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      monthlyBudget: state.budget.monthlyBudget,
      expenses: state.budget.expenses,
    }),
  )
}

const budgetSlice = createSlice({
  name: 'budget',
  initialState: {
    monthlyBudget: 10000,
    expenses: defaultExpenses,
  },
  reducers: {
    setBudget(state, action) {
      state.monthlyBudget = Number(action.payload) || 0
    },
    increaseBudget(state, action) {
      state.monthlyBudget += Number(action.payload) || 0
    },
    addExpense(state, action) {
      state.expenses.unshift(action.payload)
    },
    addMultipleExpenses(state, action) {
      state.expenses = [...action.payload, ...state.expenses]
    },
    deleteExpense(state, action) {
      state.expenses = state.expenses.filter(
        (expense) => expense.id !== action.payload,
      )
    },
    clearExpenses(state) {
      state.expenses = []
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadFromStorage.fulfilled, (state, action) => {
      if (!action.payload) return
      state.monthlyBudget = action.payload.monthlyBudget ?? state.monthlyBudget
      state.expenses = Array.isArray(action.payload.expenses)
        ? action.payload.expenses
        : state.expenses
    })
  },
})

export const {
  setBudget,
  increaseBudget,
  addExpense,
  addMultipleExpenses,
  deleteExpense,
  clearExpenses,
} = budgetSlice.actions

export default budgetSlice.reducer
