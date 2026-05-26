import { createSlice } from '@reduxjs/toolkit'

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    activeTab: 'assistant',
    assistant: {
      reply: "Ask something like 'bus bara 80 taka' or 'amar koto baki ache?'",
      insight: '',
    },
    isLoading: false,
  },
  reducers: {
    setActiveTab(state, action) {
      state.activeTab = action.payload
    },
    setAssistantReply(state, action) {
      state.assistant = {
        reply: action.payload?.reply || '',
        insight: action.payload?.insight || '',
      }
    },
    setLoading(state, action) {
      state.isLoading = Boolean(action.payload)
    },
    clearAssistant(state) {
      state.assistant = { reply: '', insight: '' }
    },
  },
})

export const { setActiveTab, setAssistantReply, setLoading, clearAssistant } =
  uiSlice.actions

export default uiSlice.reducer
