import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setActiveTab } from './store/uiSlice'
import { LOCAL_STORAGE_KEY, navTabs } from './utils/constants'
import {
  calcHealthScore,
  calcRemaining,
  calcTotalSpent,
  money,
} from './utils/helpers'
import Button from './components/Button'
import Card from './components/Card'
import AssistantTab from './modules/assistant/AssistantTab'
import DashboardTab from './modules/dashboard/DashboardTab'
import ReceiptTab from './modules/receipt/ReceiptTab'
import GroupSplitTab from './modules/groupSplit/GroupSplitTab'

function App() {
  const dispatch = useDispatch()
  const activeTab = useSelector((state) => state.ui.activeTab)
  const monthlyBudget = useSelector((state) => state.budget.monthlyBudget)
  const expenses = useSelector((state) => state.budget.expenses)

  const totalSpent = calcTotalSpent(expenses)
  const remaining = calcRemaining(monthlyBudget, totalSpent)
  const healthScore = calcHealthScore(remaining, monthlyBudget)

  useEffect(() => {
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({ monthlyBudget, expenses }),
    )
  }, [monthlyBudget, expenses])

  function renderTab() {
    switch (activeTab) {
      case 'assistant':
        return <AssistantTab />
      case 'dashboard':
        return <DashboardTab />
      case 'receipt':
        return <ReceiptTab />
      case 'group':
        return <GroupSplitTab />
      case 'store':
        return (
          <Card>
            <h2 className="text-lg font-extrabold text-slate-900">
              Store Ready
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              FinVision AI is running as a complete Vite web app.
            </p>
          </Card>
        )
      default:
        return <AssistantTab />
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Bangla/Banglish personal finance assistant
              </p>
              <h1 className="mt-1 text-3xl font-black text-slate-950">
                FinVision AI
              </h1>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Card className="min-w-40" padding>
                <p className="text-xs font-bold text-slate-500">Budget</p>
                <p className="mt-1 text-lg font-black">{money(monthlyBudget)}</p>
              </Card>
              <Card className="min-w-40" padding>
                <p className="text-xs font-bold text-slate-500">Remaining</p>
                <p className="mt-1 text-lg font-black text-emerald-700">
                  {money(remaining)}
                </p>
              </Card>
              <Card className="min-w-40" padding>
                <p className="text-xs font-bold text-slate-500">Health</p>
                <p className="mt-1 text-lg font-black">{healthScore}/100</p>
              </Card>
            </div>
          </div>

          <nav className="flex flex-wrap gap-2">
            {navTabs.map((tab) => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? 'primary' : 'outline'}
                onClick={() => dispatch(setActiveTab(tab.key))}
              >
                {tab.label}
              </Button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {renderTab()}
      </main>
    </div>
  )
}

export default App
