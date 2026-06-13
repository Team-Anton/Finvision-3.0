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
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (error) {
    console.warn('Could not load local finance data:', error.message)
    return null
  }
})

export const saveToStorage = async (state) => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        monthlyBudget: state.budget.monthlyBudget,
        expenses: state.budget.expenses,
      }),
    )
  } catch (error) {
    console.warn('Could not save local finance data:', error.message)
  }
}

const budgetSlice = createSlice({
  name: 'budget',
  initialState: {
    monthlyBudget: 10000,
    expenses: defaultExpenses,
    hydrated: false,
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
      if (action.payload) {
        const savedBudget = Number(action.payload.monthlyBudget)
        state.monthlyBudget = Number.isFinite(savedBudget)
          ? Math.max(savedBudget, 0)
          : state.monthlyBudget
        state.expenses = Array.isArray(action.payload.expenses)
          ? action.payload.expenses.filter(
              (expense) => expense && typeof expense === 'object',
            )
          : state.expenses
      }
      state.hydrated = true
    })
    builder.addCase(loadFromStorage.rejected, (state) => {
      state.hydrated = true
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
