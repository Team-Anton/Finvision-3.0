import React, { useState } from 'react';
import { money } from '../../utils/helpers';
import { categories } from '../../utils/constants';
import Button from '../../components/Button';

const categoryIcons = {
  Food: '🍱',
  Transport: '🚌',
  Groceries: '🛒',
  Utilities: '📱',
  Education: '📚',
  Health: '💊',
  Entertainment: '🎬',
  Social: '🎁',
  Income: '💰',
  Miscellaneous: '📌',
};

function ItemRow({ item, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const isNegative = Number(item.amount) < 0;
  const name = item.note.split('×')[0].trim();
  const opt = categories.find((c) => c.category === item.category) || categories[0];
  const icon = categoryIcons[item.category] || '📌';

  return (
    <div className="overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-200">
      <div
        className="flex cursor-pointer items-center gap-3 p-3 transition hover:bg-slate-100"
        onClick={() => setExpanded((value) => !value)}
      >
        <div className="text-xl">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{name}</p>
          <p className="text-xs text-slate-400">
            {item.category} · {item.subcategory} · qty {item.qty}
          </p>
        </div>
        <div className={`text-sm font-black ${isNegative ? 'text-emerald-500' : ''}`}>
          {money(item.amount)}
        </div>
        <div className="text-xs text-slate-400">{expanded ? '▲' : '▼'}</div>
      </div>

      {expanded ? (
        <div className="space-y-3 border-t border-slate-200 bg-white p-4">
          <label className="text-xs text-slate-500">
            Item name
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
              value={name}
              onChange={(event) => onUpdate(item.id, 'name', event.target.value)}
            />
          </label>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <label className="text-xs text-slate-500">
              Qty
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                type="number"
                min="1"
                value={item.qty}
                onChange={(event) => onUpdate(item.id, 'qty', event.target.value)}
              />
            </label>
            <label className="text-xs text-slate-500">
              Category
              <select
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                value={item.category}
                onChange={(event) => onUpdate(item.id, 'category', event.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat.category}>{cat.category}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-500">
              Subcategory
              <select
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
                value={item.subcategory}
                onChange={(event) => onUpdate(item.id, 'subcategory', event.target.value)}
              >
                {opt.subcategories.map((sub) => (
                  <option key={sub}>{sub}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-500">
              Amount
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold outline-none focus:border-slate-950"
                type="number"
                value={item.amount}
                onChange={(event) => onUpdate(item.id, 'amount', event.target.value)}
              />
            </label>
          </div>

          <label className="text-xs text-slate-500">
            Merchant (optional)
            <input
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-950"
              placeholder="e.g. Shwapno, Meena Bazar"
              value={item.merchant || ''}
              onChange={(event) => onUpdate(item.id, 'merchant', event.target.value)}
            />
          </label>

          <div className="flex justify-end">
            <Button variant="danger" onClick={() => onDelete(item.id)}>
              🗑️ Remove item
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EmptyItems() {
  return (
    <div className="py-10 text-center">
      <div className="text-5xl">📋</div>
      <p className="mt-2 font-bold text-slate-700">Kono item extract hoyni</p>
      <p className="text-sm text-slate-400">OCR diye extract koro ba manually item add koro.</p>
    </div>
  );
}

function SummaryFooter({ items }) {
  const subtotal = items.filter((item) => Number(item.amount) > 0).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const discounts = items.filter((item) => Number(item.amount) < 0).reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const total = subtotal + discounts;

  return (
    <div className="space-y-2 rounded-2xl bg-slate-950 p-4 text-white">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">Subtotal</span>
        <span className="font-bold">{money(subtotal)}</span>
      </div>
      {discounts < 0 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-emerald-400">Discount</span>
          <span className="font-bold text-emerald-400">{money(discounts)}</span>
        </div>
      ) : null}
      <div className="flex items-center justify-between border-t border-white/10 pt-2 text-sm font-black">
        <span>Total</span>
        <span>{money(total)}</span>
      </div>
    </div>
  );
}

function Toolbar({ itemCount, onAddManual, onClearAll, onExpandAll }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-lg font-black">Extracted Items</p>
        <p className="text-xs text-slate-500">{itemCount} ta item · Edit kore add koro</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={onExpandAll}>
          Expand all
        </Button>
        <Button variant="outline" onClick={onAddManual}>
          + Add item
        </Button>
        <Button variant="danger" onClick={onClearAll}>
          Clear all
        </Button>
      </div>
    </div>
  );
}

function ReceiptItemEditor({ items, onUpdate, onDelete, onAddManual, onClearAll }) {
  const [allExpanded, setAllExpanded] = useState(false);

  if (items.length === 0) return <EmptyItems />;

  return (
    <div className="space-y-4">
      <Toolbar
        itemCount={items.length}
        onAddManual={onAddManual}
        onClearAll={onClearAll}
        onExpandAll={() => setAllExpanded((value) => !value)}
      />
      <div className="max-h-[500px] space-y-2 overflow-y-auto pr-1">
        {items.map((item) => (
          <ItemRow key={item.id} item={item} onUpdate={onUpdate} onDelete={onDelete} expandAll={allExpanded} />
        ))}
      </div>
      <SummaryFooter items={items} />
    </div>
  );
}

export default ReceiptItemEditor;
