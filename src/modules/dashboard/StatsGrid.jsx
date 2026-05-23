import Card from "../../components/Card";
import { calcDailyAvg, calcHealthScore, money } from "../../utils/helpers";
import { DAYS_IN_MONTH, DAYS_PASSED } from "../../utils/constants";

function StatCell({ icon, label, value, sub, color = "default" }) {
  const colorMap = {
    default: "bg-slate-100",
    green: "bg-emerald-50 ring-1 ring-emerald-200",
    red: "bg-red-50 ring-1 ring-red-200",
    amber: "bg-amber-50 ring-1 ring-amber-200",
    blue: "bg-sky-50 ring-1 ring-sky-200",
  };

  return (
    <Card className={colorMap[color]}>
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-white p-3 text-2xl shadow-sm">{icon}</div>
        <div className="min-w-0">
          <p className="truncate text-xs text-slate-500">{label}</p>
          <p className="truncate text-xl font-black">{value}</p>
        </div>
      </div>
      {sub && (
        <p className="mt-3 border-t border-slate-200 pt-2 text-xs text-slate-400">
          {sub}
        </p>
      )}
    </Card>
  );
}

function HealthBar({ score }) {
  const color =
    score > 70 ? "bg-emerald-500" : score > 40 ? "bg-amber-400" : "bg-red-500";
  const label = score > 70 ? "Healthy 💚" : score > 40 ? "Caution ⚡" : "Critical 🔴";
  const badgeColor =
    score > 70
      ? "bg-emerald-100 text-emerald-700"
      : score > 40
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";

  return (
    <Card className="p-5">
      <div className="mb-3 flex justify-between">
        <div>
          <p className="text-xs text-slate-500">Financial Health Score</p>
          <p className="text-3xl font-black">{score}</p>
        </div>
        <span className={`h-fit rounded-full px-3 py-1 text-xs font-bold ${badgeColor}`}>
          {label}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Score 0-100. Remaining budget er upor based.
      </p>
    </Card>
  );
}

function ProgressRing({ pct, label, sublabel }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(pct / 100, 1);
  const color = pct > 90 ? "#ef4444" : pct > 70 ? "#f59e0b" : "#10b981";

  return (
    <Card className="flex flex-col items-center p-5 text-center">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
        <circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 48 48)"
          style={{ transition: "stroke-dasharray 0.7s ease" }}
        />
        <text
          x="48"
          y="52"
          textAnchor="middle"
          fontSize="16"
          fontWeight="900"
          fill="#0f172a"
        >
          {Math.round(pct)}%
        </text>
      </svg>
      <p className="mt-1 text-sm font-black">{label}</p>
      <p className="mt-0.5 text-xs text-slate-400">{sublabel}</p>
    </Card>
  );
}

function StatsGrid({ monthlyBudget, totalSpent, remaining, expenses }) {
  const dailyAvg = calcDailyAvg(totalSpent, DAYS_PASSED);
  const healthScore = calcHealthScore(remaining, monthlyBudget);
  const spentPct = Math.round((totalSpent / Math.max(monthlyBudget, 1)) * 100);
  const daysLeft = dailyAvg
    ? Math.floor(remaining / dailyAvg)
    : DAYS_IN_MONTH - DAYS_PASSED;
  const biggestExpense = expenses.reduce(
    (max, item) => (Number(item.amount || 0) > Number(max.amount || 0) ? item : max),
    { amount: 0, category: "—", note: "—" },
  );
  const categoryTotals = expenses
    .filter((item) => Number(item.amount || 0) > 0)
    .reduce((map, item) => {
      map[item.category] = (map[item.category] || 0) + Number(item.amount || 0);
      return map;
    }, {});
  const topCat = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
  const projectedSpend = dailyAvg * DAYS_IN_MONTH;
  const overProjected = projectedSpend > monthlyBudget;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <HealthBar score={healthScore} />
        <ProgressRing
          pct={spentPct}
          label="Budget used"
          sublabel={`${money(totalSpent)} of ${money(monthlyBudget)}`}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCell
          icon="📅"
          label="Daily avg spend"
          value={money(Math.round(dailyAvg))}
          sub={`Based on last ${DAYS_PASSED} days`}
        />
        <StatCell
          icon="⏳"
          label="Budget lasts"
          value={`${daysLeft} days`}
          sub={`At current burn rate of ${money(Math.round(dailyAvg))}/day`}
          color={daysLeft < 5 ? "red" : daysLeft < 10 ? "amber" : "green"}
        />
        <StatCell
          icon="🏆"
          label="Biggest expense"
          value={money(biggestExpense.amount)}
          sub={`${biggestExpense.category} — ${String(biggestExpense.note || "").slice(0, 30)}`}
        />
        <StatCell
          icon="📊"
          label="Top category"
          value={topCat ? topCat[0] : "—"}
          sub={topCat ? `${money(topCat[1])} total spent` : "No data yet"}
          color="blue"
        />
      </div>

      <Card
        className={`flex flex-wrap items-center justify-between gap-3 p-5 ${
          overProjected
            ? "bg-red-50 ring-1 ring-red-200"
            : "bg-emerald-50 ring-1 ring-emerald-200"
        }`}
      >
        <div>
          <p className="text-xs text-slate-500">Month-end projection</p>
          <p className="text-2xl font-black">{money(Math.round(projectedSpend))}</p>
          <p className="mt-1 text-xs text-slate-400">
            {overProjected
              ? `⚠️ Budget ${money(Math.round(projectedSpend - monthlyBudget))} cross korbe!`
              : `✅ Budget er moddhe thakbe. ${money(Math.round(monthlyBudget - projectedSpend))} bachbe.`}
          </p>
        </div>
        <div className="text-4xl">{overProjected ? "🚨" : "✅"}</div>
      </Card>
    </div>
  );
}

export default StatsGrid;
