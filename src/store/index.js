import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import budgetReducer from './budgetSlice'
import uiReducer from './uiSlice'

const store = configureStore({
  reducer: {
    auth: authReducer,
    budget: budgetReducer,
    ui: uiReducer,
  },
})

export default store
