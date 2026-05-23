import { useState } from "react";

const categoryColors = {
  Food: "bg-orange-100 text-orange-700",
  Transport: "bg-blue-100 text-blue-700",
  Groceries: "bg-green-100 text-green-700",
  Utilities: "bg-purple-100 text-purple-700",
  Education: "bg-yellow-100 text-yellow-700",
  Health: "bg-red-100 text-red-700",
  Entertainment: "bg-pink-100 text-pink-700",
  Social: "bg-indigo-100 text-indigo-700",
  Income: "bg-emerald-100 text-emerald-700",
  Miscellaneous: "bg-slate-100 text-slate-700",
};

const categoryIcons = {
  Food: "🍱",
  Transport: "🚌",
  Groceries: "🛒",
  Utilities: "📱",
  Education: "📚",
  Health: "💊",
  Entertainment: "🎬",
  Social: "🎁",
  Income: "💰",
  Miscellaneous: "📌",
};

function ExpenseRow({ expense, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const colorClass =
    categoryColors[expense.category] || "bg-slate-100 text-slate-700";
  const icon = categoryIcons[expense.category] || "📌";
  const isNegative = Number(expense.amount) < 0;

  function handleDeleteClick() {
    if (confirmDelete) {
      onDelete?.(expense.id);
      return;
    }

    setConfirmDelete(true);
    setTimeout(() => setConfirmDelete(false), 3000);
  }

  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 transition hover:bg-slate-100">
      <div className="flex min-w-0 items-center gap-3">
        <div className={`shrink-0 rounded-2xl p-2 text-xl ${colorClass}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-bold">{expense.category}</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] ${colorClass}`}>
              {expense.subcategory}
            </span>
          </div>
          <p className="truncate text-xs text-slate-500">{expense.note}</p>
          {expense.merchant ? (
            <p className="text-xs text-slate-400">📍 {expense.merchant}</p>
          ) : null}
        </div>
      </div>

      <div className="ml-3 flex shrink-0 items-center gap-3">
        <div className="text-right">
          <p
            className={`text-sm font-black ${
              isNegative ? "text-emerald-600" : "text-slate-950"
            }`}
          >
            {isNegative ? "+" : "-"}
            {Math.abs(Number(expense.amount || 0)).toLocaleString()} BDT
          </p>
          <p className="text-xs text-slate-400">{expense.date}</p>
        </div>
        <button
          type="button"
          onClick={handleDeleteClick}
          className={`h-7 w-7 rounded-full text-sm font-black transition ${
            confirmDelete
              ? "bg-red-500 text-white"
              : "bg-slate-200 text-slate-500 hover:bg-red-100 hover:text-red-500"
          }`}
          aria-label={confirmDelete ? "Confirm delete" : "Delete expense"}
        >
          {confirmDelete ? "!" : "×"}
        </button>
      </div>
    </div>
  );
}

function EmptyExpenses() {
  return (
    <div className="py-10 text-center">
      <div className="text-5xl">🧾</div>
      <p className="mt-3 font-bold">Kono khoroch nei</p>
      <p className="mt-1 text-sm text-slate-400">
        Assistant e expense add korle ekhane dekhabe.
      </p>
    </div>
  );
}

function FilterBar({ selected, onChange }) {
  const filters = [
    "All",
    "Food",
    "Transport",
    "Groceries",
    "Utilities",
    "Health",
    "Income",
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {filters.map((filter) => (
        <button
          key={filter}
          type="button"
          onClick={() => onChange(filter)}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition ${
            selected === filter
              ? "bg-slate-950 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}

function ExpenseList({ expenses = [], onDelete }) {
  const [filter, setFilter] = useState("All");
  const [showAll, setShowAll] = useState(false);

  const filtered =
    filter === "All"
      ? expenses
      : expenses.filter((expense) => expense.category === filter);
  const visible = showAll ? filtered : filtered.slice(0, 5);
  const hasMore = filtered.length > 5;

  return (
    <div className="space-y-3">
      <FilterBar selected={filter} onChange={setFilter} />
      {filtered.length > 0 ? (
        <p className="text-xs font-bold text-slate-400">
          {filtered.length} ta entry{filter !== "All" ? ` (${filter})` : ""}
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyExpenses />
      ) : (
        <div className="space-y-3">
          {visible.map((expense) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {hasMore ? (
        <button
          type="button"
          onClick={() => setShowAll((current) => !current)}
          className="w-full rounded-2xl border border-slate-200 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-50"
        >
          {showAll ? "▲ Kom dekhao" : `▼ Aro ${filtered.length - 5} ta dekhao`}
        </button>
      ) : null}
    </div>
  );
}

export default ExpenseList;
