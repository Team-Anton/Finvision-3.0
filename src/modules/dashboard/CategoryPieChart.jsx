import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from "recharts";
import Card from "../../components/Card";
import { money } from "../../utils/helpers";

const CATEGORY_COLORS = {
  Food: "#f97316",
  Transport: "#3b82f6",
  Groceries: "#10b981",
  Utilities: "#8b5cf6",
  Education: "#f59e0b",
  Health: "#ef4444",
  Entertainment: "#ec4899",
  Social: "#6366f1",
  Income: "#14b8a6",
  Miscellaneous: "#94a3b8",
};
const DEFAULT_COLOR = "#cbd5e1";

function buildPieData(expenses) {
  const totals = expenses
    .filter((item) => Number(item.amount || 0) > 0)
    .reduce((map, item) => {
      map[item.category] = (map[item.category] || 0) + Number(item.amount || 0);
      return map;
    }, {});

  return Object.entries(totals)
    .map(([name, value]) => ({
      name,
      value: Math.round(value),
      color: CATEGORY_COLORS[name] || DEFAULT_COLOR,
    }))
    .sort((a, b) => b.value - a.value);
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  return (
    <div className="rounded-2xl bg-slate-950 p-3 text-xs text-white">
      <p className="mb-1 font-black">{d.name}</p>
      <p>{money(d.value)}</p>
      <p className="text-slate-400">{Math.round((d.value / d.total) * 100)}% of total</p>
    </div>
  );
}

function ActiveShape(props) {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    value,
  } = props;

  return (
    <g>
      <text x={cx} y={cy - 12} textAnchor="middle" fill="#0f172a" fontSize="13" fontWeight="900">
        {payload.name}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#0f172a" fontSize="12" fontWeight="700">
        {money(value)}
      </text>
      <text x={cx} y={cy + 26} textAnchor="middle" fill="#94a3b8" fontSize="10">
        {(percent * 100).toFixed(1)}%
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 16}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
}

function LegendList({ data, activeIndex, onHover }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
      {data.map((d, i) => {
        const pct = Math.round((d.value / Math.max(total, 1)) * 100);
        const isActive = activeIndex === i;

        return (
          <div
            key={d.name}
            onMouseEnter={() => onHover(i)}
            onMouseLeave={() => onHover(null)}
            className={`flex cursor-pointer items-center justify-between rounded-2xl px-3 py-2 transition ${
              isActive ? "bg-slate-100 ring-1 ring-slate-300" : "hover:bg-slate-50"
            }`}
          >
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="truncate font-bold">{d.name}</span>
            </div>
            <div className="text-right">
              <p className="font-black">{money(d.value)}</p>
              <p className="text-xs text-slate-400">{pct}%</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyPie() {
  return (
    <div className="flex h-64 flex-col items-center justify-center text-center">
      <div className="text-5xl">🥧</div>
      <p className="font-bold text-slate-700">Kono data nei</p>
      <p className="text-sm text-slate-400">
        Expense add korle category breakdown dekhabe.
      </p>
    </div>
  );
}

function SummaryRow({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const top = data[0];

  return (
    <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-4">
      <div>
        <p className="text-xs text-slate-400">Total tracked</p>
        <p className="text-lg font-black">{money(total)}</p>
      </div>
      {top && (
        <div>
          <p className="text-xs text-slate-400">Biggest category</p>
          <p className="font-black">{top.name}</p>
          <p className="text-xs">{money(top.value)}</p>
        </div>
      )}
      <div>
        <p className="text-xs text-slate-400">Categories</p>
        <p className="text-lg font-black">{data.length}</p>
      </div>
    </div>
  );
}

function CategoryPieChart({ expenses }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const data = useMemo(() => buildPieData(expenses), [expenses]);
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const dataWithTotal = data.map((item) => ({ ...item, total }));

  return (
    <Card padding={false} className="p-6">
      <div className="mb-5">
        <h2 className="text-lg font-black">Category Breakdown</h2>
        <p className="text-xs text-slate-400">Hover kore category details dekho.</p>
      </div>

      {data.length === 0 ? (
        <EmptyPie />
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-[1fr_1fr]">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={dataWithTotal}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  dataKey="value"
                  activeIndex={activeIndex}
                  activeShape={ActiveShape}
                  onMouseEnter={(_, i) => setActiveIndex(i)}
                >
                  {dataWithTotal.map((d, i) => (
                    <Cell
                      key={d.name}
                      fill={d.color}
                      opacity={activeIndex === null || activeIndex === i ? 1 : 0.6}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            <div>
              <p className="mb-2 text-xs font-bold text-slate-500">All categories</p>
              <LegendList data={data} activeIndex={activeIndex} onHover={setActiveIndex} />
            </div>
          </div>
          <SummaryRow data={data} />
        </>
      )}
    </Card>
  );
}

export default CategoryPieChart;
