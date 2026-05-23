import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { money } from "../../utils/helpers";

function buildDailyData(expenses, monthlyBudget) {
  const dayMap = expenses.reduce((map, item) => {
    const date = item.date || "Unknown";
    const amount = Number(item.amount || 0);
    if (!map[date]) map[date] = { date, spent: 0, income: 0 };
    if (amount > 0) map[date].spent += amount;
    if (amount < 0) map[date].income += Math.abs(amount);
    return map;
  }, {});
  let cumulative = 0;

  return Object.values(dayMap)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .map((item) => {
      cumulative += item.spent;
      return {
        ...item,
        spent: Math.round(item.spent),
        income: Math.round(item.income),
        cumulative: Math.round(cumulative),
        dailyBudget: Math.round(monthlyBudget / 30),
      };
    });
}

function buildCategoryData(expenses) {
  const totals = expenses
    .filter((item) => Number(item.amount || 0) > 0)
    .reduce((map, item) => {
      map[item.category] = (map[item.category] || 0) + Number(item.amount || 0);
      return map;
    }, {});

  return Object.entries(totals)
    .map(([category, amount]) => ({ category, amount: Math.round(amount) }))
    .sort((a, b) => b.amount - a.amount);
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl bg-slate-950 p-3 text-xs text-white shadow-xl">
      <p className="mb-2 font-black">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-bold">{money(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function CategoryTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;

  return (
    <div className="rounded-2xl bg-slate-950 p-3 text-xs text-white shadow-xl">
      <p className="mb-1 font-black">{item.category}</p>
      <p>{money(item.amount)}</p>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-48 flex-col items-center justify-center text-center">
      <div className="text-4xl">📈</div>
      <p className="font-bold text-slate-700">Kono data nei</p>
      <p className="text-sm text-slate-400">Expense add korle chart dekhabe.</p>
    </div>
  );
}

function ChartToggle({ selected, onChange }) {
  const options = [
    { key: "bar", label: "📊 Daily" },
    { key: "line", label: "📈 Cumulative" },
    { key: "category", label: "🏷️ Category" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Button
          key={option.key}
          variant={selected === option.key ? "primary" : "outline"}
          onClick={() => onChange(option.key)}
          className="px-3 py-1.5 text-xs"
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

function DailyBarChart({ data, dailyBudget }) {
  if (!data.length) return <EmptyChart />;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `৳${v}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          y={dailyBudget}
          stroke="#f59e0b"
          strokeDasharray="4 4"
          label={{ value: "Daily limit", position: "insideTopRight", fontSize: 10, fill: "#f59e0b" }}
        />
        <Bar dataKey="spent" name="Spent" fill="#0f172a" radius={[6, 6, 0, 0]} maxBarSize={40} />
        <Bar dataKey="income" name="Income" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function CumulativeLineChart({ data, monthlyBudget }) {
  if (!data.length) return <EmptyChart />;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `৳${v}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine
          y={monthlyBudget}
          stroke="#ef4444"
          strokeDasharray="4 4"
          label={{ value: "Budget limit", position: "insideTopRight", fontSize: 10, fill: "#ef4444" }}
        />
        <Line
          type="monotone"
          dataKey="cumulative"
          name="Cumulative spent"
          stroke="#0f172a"
          strokeWidth={2.5}
          dot={{ r: 4, fill: "#0f172a" }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function CategoryBarChart({ data }) {
  const colors = ["#0f172a", "#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];
  if (!data.length) return <EmptyChart />;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `৳${v}`}
        />
        <YAxis
          type="category"
          dataKey="category"
          width={55}
          tick={{ fontSize: 11, fill: "#64748b" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CategoryTooltip />} />
        <Bar dataKey="amount" radius={[0, 6, 6, 0]} maxBarSize={32}>
          {data.map((entry, i) => (
            <Cell key={entry.category} fill={colors[i % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function SpendingChart({ expenses, monthlyBudget }) {
  const [chartType, setChartType] = useState("bar");
  const dailyData = useMemo(
    () => buildDailyData(expenses, monthlyBudget),
    [expenses, monthlyBudget],
  );
  const categoryData = useMemo(() => buildCategoryData(expenses), [expenses]);
  const dailyBudget = Math.round(monthlyBudget / 30);
  const chartTitles = {
    bar: "Daily Spending",
    line: "Cumulative Spending",
    category: "Spending by Category",
  };
  const chartSubs = {
    bar: `Daily limit: ${money(dailyBudget)}/day. Yellow line = limit.`,
    line: `Total budget: ${money(monthlyBudget)}. Red line = limit.`,
    category: "Highest spending category first.",
  };

  return (
    <Card padding={false} className="p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">{chartTitles[chartType]}</h2>
          <p className="text-xs text-slate-400">{chartSubs[chartType]}</p>
        </div>
        <ChartToggle selected={chartType} onChange={setChartType} />
      </div>

      {chartType === "bar" && <DailyBarChart data={dailyData} dailyBudget={dailyBudget} />}
      {chartType === "line" && (
        <CumulativeLineChart data={dailyData} monthlyBudget={monthlyBudget} />
      )}
      {chartType === "category" && <CategoryBarChart data={categoryData} />}

      {chartType === "bar" && dailyData.length > 0 && (
        <div className="mt-3 flex gap-4 text-xs">
          <span className="flex items-center gap-1">
            <i className="h-3 w-3 rounded-sm bg-slate-950" /> Spent
          </span>
          <span className="flex items-center gap-1">
            <i className="h-3 w-3 rounded-sm bg-emerald-500" /> Income
          </span>
          <span className="flex items-center gap-1">
            <i className="h-3 w-3 rounded-sm bg-amber-400" /> Daily limit
          </span>
        </div>
      )}
    </Card>
  );
}

export default SpendingChart;
