import { configureStore } from '@reduxjs/toolkit'
import budgetReducer from './budgetSlice'
import uiReducer from './uiSlice'

const store = configureStore({
  reducer: {
    budget: budgetReducer,
    ui: uiReducer,
  },
})

export default store
