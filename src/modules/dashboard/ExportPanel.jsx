import { useState } from "react";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { CURRENCY } from "../../utils/constants";
import { money } from "../../utils/helpers";

function buildCsv(expenses, monthlyBudget) {
  const headers = ["Date", "Category", "Subcategory", "Amount (BDT)", "Merchant", "Note", "Currency"];
  const rows = expenses.map((e) => [
    e.date || "",
    e.category || "",
    e.subcategory || "",
    Number(e.amount || 0).toFixed(2),
    e.merchant || "",
    String(e.note || "").replace(/,/g, ";"),
    e.currency || CURRENCY,
  ]);
  const totalSpent = expenses
    .filter((e) => Number(e.amount || 0) > 0)
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalDiscounts = expenses
    .filter((e) => Number(e.amount || 0) < 0)
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const summaryRows = [
    [],
    ["--- Summary ---"],
    ["Monthly Budget", "", "", Number(monthlyBudget || 0).toFixed(2)],
    ["Total Spent", "", "", totalSpent.toFixed(2)],
    ["Total Discounts", "", "", totalDiscounts.toFixed(2)],
    ["Total Transactions", "", "", expenses.length],
  ];

  return [headers, ...rows, ...summaryRows].map((row) => row.join(",")).join("\n");
}

function buildJson(expenses, monthlyBudget) {
  const totalSpent = expenses
    .filter((e) => Number(e.amount || 0) > 0)
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      summary: {
        monthly_budget: monthlyBudget,
        total_spent: totalSpent,
        total_transactions: expenses.length,
        remaining: Math.max(monthlyBudget - totalSpent, 0),
      },
      expenses,
    },
    null,
    2,
  );
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function openExportPreview(content, filename, type) {
  const win = window.open("", "_blank");
  if (!win) return false;

  win.document.write(`
    <html>
      <head>
        <title>${filename}</title>
        <style>
          body { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; padding: 20px; color: #0f172a; }
          .top { display: flex; justify-content: space-between; gap: 12px; align-items: center; margin-bottom: 14px; }
          h1 { font-family: Arial, sans-serif; font-size: 18px; margin: 0; }
          a { border-radius: 12px; background: #0f172a; color: white; padding: 9px 12px; text-decoration: none; font-family: Arial, sans-serif; font-size: 13px; font-weight: 700; }
          pre { white-space: pre-wrap; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; background: #f8fafc; }
        </style>
      </head>
      <body>
        <div class="top">
          <h1>${filename}</h1>
          <a id="download" download="${filename}">Download file</a>
        </div>
        <pre></pre>
      </body>
    </html>
  `);
  win.document.querySelector("pre").textContent = content;
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  win.document.querySelector("#download").href = url;
  return true;
}

function getDateStamp() {
  return new Date()
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .replaceAll(" ", "-");
}

function ExportButton({ label, icon, onClick, disabled }) {
  const [done, setDone] = useState(false);

  async function handleClick() {
    try {
      await onClick();
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      alert("Export failed. Please try again.");
    }
  }

  return (
    <Button
      variant={done ? "success" : "outline"}
      onClick={handleClick}
      disabled={disabled}
      className="min-w-[140px] flex-1"
    >
      {done ? "✅ Downloaded!" : `${icon} ${label}`}
    </Button>
  );
}

function ExportPreview({ expenses, monthlyBudget }) {
  const totalSpent = expenses
    .filter((e) => Number(e.amount || 0) > 0)
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalDiscounts = expenses
    .filter((e) => Number(e.amount || 0) < 0)
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const categories = new Set(expenses.map((e) => e.category).filter(Boolean));
  const rows = [
    { label: "Total transactions", value: expenses.length },
    { label: "Monthly budget", value: money(monthlyBudget) },
    { label: "Total spent", value: money(totalSpent) },
    { label: "Total discounts", value: money(Math.abs(totalDiscounts)) },
    { label: "Remaining", value: money(Math.max(monthlyBudget - totalSpent, 0)) },
    { label: "Categories tracked", value: categories.size },
  ];

  return (
    <div className="space-y-2 rounded-2xl bg-slate-50 p-4">
      <p className="mb-3 text-xs font-bold text-slate-500">Export preview</p>
      {rows.map((row) => (
        <div key={row.label} className="flex justify-between text-sm">
          <span className="text-slate-500">{row.label}</span>
          <span className="font-bold">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  return copied;
}

function CopyButton({ expenses }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = expenses
      .map((e) => `${e.date || ""} | ${e.category || ""} | ${money(e.amount)} | ${e.note || ""}`)
      .join("\n");

    try {
      let didCopy = fallbackCopy(text);
      if (!didCopy && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        didCopy = true;
      }
      if (!didCopy) throw new Error("Clipboard copy failed");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Clipboard access denied.");
    }
  }

  return (
    <Button
      variant={copied ? "success" : "outline"}
      onClick={handleCopy}
      disabled={!expenses.length}
      className="min-w-[140px] flex-1"
    >
      {copied ? "✅ Copied!" : "📋 Copy to clipboard"}
    </Button>
  );
}

function buildPrintHtml(expenses, monthlyBudget) {
  const totalSpent = expenses
    .filter((e) => Number(e.amount || 0) > 0)
    .reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const rows = expenses
    .map(
      (e) => `
        <tr>
          <td>${e.date || ""}</td>
          <td>${e.category || ""}</td>
          <td>${e.subcategory || ""}</td>
          <td>${money(e.amount)}</td>
          <td>${e.note || ""}</td>
        </tr>
      `,
    )
    .join("");
  return `
    <html>
      <head>
        <title>FinVision AI Expense Report</title>
        <style>
          body { font-family: Arial, sans-serif; color: #0f172a; padding: 24px; }
          h1 { margin: 0 0 16px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { background: #0f172a; color: white; text-align: left; padding: 10px; }
          td { border-bottom: 1px solid #e2e8f0; padding: 9px 10px; font-size: 13px; }
          .summary { margin-top: 20px; padding: 14px; background: #f8fafc; border-radius: 12px; }
          .summary p { margin: 6px 0; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>FinVision AI Expense Report</h1>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Subcategory</th>
              <th>Amount</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="summary">
          <p><strong>Monthly Budget:</strong> ${money(monthlyBudget)}</p>
          <p><strong>Total Spent:</strong> ${money(totalSpent)}</p>
          <p><strong>Remaining:</strong> ${money(Math.max(monthlyBudget - totalSpent, 0))}</p>
          <p><strong>Transactions:</strong> ${expenses.length}</p>
        </div>
      </body>
    </html>
  `;
}

function handlePrint(expenses, monthlyBudget) {
  const html = buildPrintHtml(expenses, monthlyBudget);
  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
    return;
  }

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);
  iframe.contentDocument.open();
  iframe.contentDocument.write(html);
  iframe.contentDocument.close();
  iframe.contentWindow.focus();
  iframe.contentWindow.print();
  setTimeout(() => document.body.removeChild(iframe), 1000);
}

function PrintButton({ expenses, monthlyBudget, disabled }) {
  const [printed, setPrinted] = useState(false);

  function handleClick() {
    try {
      handlePrint(expenses, monthlyBudget);
      setPrinted(true);
      setTimeout(() => setPrinted(false), 2000);
    } catch {
      alert("Print failed. Please try again.");
    }
  }

  return (
    <Button
      variant={printed ? "success" : "outline"}
      onClick={handleClick}
      disabled={disabled}
      className="min-w-[140px] flex-1"
    >
      {printed ? "✅ Print opened!" : "🖨️ Print report"}
    </Button>
  );
}

function ExportFallback({ exportFile }) {
  const [copied, setCopied] = useState(false);

  if (!exportFile) return null;

  async function handleCopy() {
    try {
      let didCopy = fallbackCopy(exportFile.content);
      if (!didCopy && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(exportFile.content);
        didCopy = true;
      }
      if (!didCopy) throw new Error("Copy failed");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Copy failed. Select the text manually from the box.");
    }
  }

  return (
    <div className="mt-5 rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-900">{exportFile.filename}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={copied ? "success" : "outline"}
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs"
          >
            {copied ? "Copied" : "Copy file text"}
          </Button>
          <Button
            variant="outline"
            onClick={() => openExportPreview(exportFile.content, exportFile.filename, exportFile.type)}
            className="px-3 py-1.5 text-xs"
          >
            Open preview
          </Button>
        </div>
      </div>
      <textarea
        readOnly
        value={exportFile.content}
        className="mt-3 h-36 w-full rounded-xl border border-sky-200 bg-white p-3 font-mono text-xs text-slate-700"
      />
    </div>
  );
}

function ExportPanel({ expenses, monthlyBudget }) {
  const dateStamp = getDateStamp();
  const isEmpty = !expenses.length;
  const [exportFile, setExportFile] = useState(null);

  function handleCsvExport() {
    const filename = `finvision-expenses-${dateStamp}.csv`;
    const content = buildCsv(expenses, monthlyBudget);
    const type = "text/csv";
    setExportFile({ content, filename, type });
    downloadFile(content, filename, type);
  }

  function handleJsonExport() {
    const filename = `finvision-expenses-${dateStamp}.json`;
    const content = buildJson(expenses, monthlyBudget);
    const type = "application/json";
    setExportFile({ content, filename, type });
    downloadFile(content, filename, type);
  }

  return (
    <Card padding={false} className="p-6">
      <div className="mb-5">
        <h2 className="text-lg font-black">Export Data</h2>
        <p className="text-xs text-slate-400">Expense data CSV, JSON, ba print e export koro.</p>
      </div>

      <ExportPreview expenses={expenses} monthlyBudget={monthlyBudget} />

      {isEmpty && (
        <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
          ⚠️ Kono expense nei. Aghe expense add koro.
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <ExportButton label="Export CSV" icon="📄" onClick={handleCsvExport} disabled={isEmpty} />
        <ExportButton label="Export JSON" icon="📦" onClick={handleJsonExport} disabled={isEmpty} />
        <CopyButton expenses={expenses} />
        <PrintButton expenses={expenses} monthlyBudget={monthlyBudget} disabled={isEmpty} />
      </div>

      <ExportFallback exportFile={exportFile} />

      <p className="mt-4 text-xs text-slate-400">
        📌 Data shudhu tomar browser e save thake. Export kore backup rakho.
      </p>
    </Card>
  );
}

export default ExportPanel;
