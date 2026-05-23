import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addMultipleExpenses } from '../../store/budgetSlice';
import { setAssistantReply } from '../../store/uiSlice';
import { money, calcTotalSpent, calcRemaining } from '../../utils/helpers';
import { categories } from '../../utils/constants';
import { runOcr, parseReceiptText } from './receiptScanner';
import ReceiptUploader from './ReceiptUploader';
import ReceiptItemEditor from './ReceiptItemEditor';
import BudgetImpactPanel from './BudgetImpactPanel';
import Card from '../../components/Card';
import Button from '../../components/Button';

const todayLabel = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

const initialReceiptState = {
  preview: null,
  file: null,
  fileName: '',
  rawText: '',
  boxes: [],
  wordCount: 0,
  confidence: 0,
  items: [],
  status: 'Receipt image upload koro tahole OCR diye extract hobe.',
  scanning: false,
  progress: 0,
};

function ReceiptTab() {
  const [receipt, setReceipt] = useState(initialReceiptState);
  const dispatch = useDispatch();
  const { monthlyBudget, expenses } = useSelector((state) => state.budget);

  const totalSpent = calcTotalSpent(expenses);
  const remaining = calcRemaining(monthlyBudget, totalSpent);
  const receiptTotal = receipt.items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  function update(patch) {
    setReceipt((prev) => ({ ...prev, ...patch }));
  }

  function handleFile(file) {
    if (!file) {
      setReceipt(initialReceiptState);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      update({
        preview: reader.result,
        file,
        fileName: file.name,
        rawText: '',
        boxes: [],
        wordCount: 0,
        confidence: 0,
        items: [],
        status: 'Image ready. "Extract with OCR" button click koro.',
        progress: 0,
      });
    };
    reader.readAsDataURL(file);
  }

  async function handleExtract() {
    if (!receipt.file) {
      update({ status: 'Aghe receipt image upload koro.' });
      return;
    }

    update({ scanning: true, status: 'OCR starting...', progress: 0 });
    try {
      const { rawText, boxes, wordCount, confidence } = await runOcr(receipt.file, (pct) => {
        update({ progress: pct, status: `OCR scanning ${pct}%...` });
      });

      const items = parseReceiptText(rawText, todayLabel);
      if (!items.length) {
        update({
          rawText,
          boxes,
          wordCount,
          confidence,
          scanning: false,
          status: 'OCR item khauje payni. Manual add koro.',
        });
        return;
      }

      const total = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      update({
        rawText,
        boxes,
        wordCount,
        confidence,
        items,
        scanning: false,
        status: `✅ ${items.length} ta item found. Total ${money(total)}.`,
      });
    } catch (err) {
      update({
        scanning: false,
        status: `OCR error: ${err.message}. Clearer image try koro.`,
      });
    }
  }

  function handleUpdateItem(id, field, value) {
    update({
      items: receipt.items.map((item) => {
        if (item.id !== id) return item;

        if (field === 'category') {
          const option = categories.find((cat) => cat.category === value) || categories[0];
          return { ...item, category: value, subcategory: option.subcategories[0] };
        }

        if (field === 'amount') {
          return { ...item, amount: Number(value) || 0 };
        }

        if (field === 'qty') {
          const qty = Number(value) || 1;
          const name = item.note.split('×')[0].trim();
          return { ...item, qty, note: `${name} × ${qty}` };
        }

        if (field === 'name') {
          return { ...item, note: `${value} × ${item.qty || 1}` };
        }

        return { ...item, [field]: value };
      }),
    });
  }

  function handleDeleteItem(id) {
    update({ items: receipt.items.filter((item) => item.id !== id) });
  }

  function handleAddManual() {
    update({
      items: [
        ...receipt.items,
        {
          id: crypto.randomUUID(),
          amount: 0,
          currency: 'BDT',
          category: 'Groceries',
          subcategory: 'Household',
          merchant: 'Manual Entry',
          date: todayLabel,
          note: 'New item × 1',
          qty: 1,
        },
      ],
    });
  }

  function handleClearItems() {
    update({
      items: [],
      status: 'Items cleared. OCR again ba manual add koro.',
    });
  }

  function handleAddToBudget() {
    if (!receipt.items.length) return;

    dispatch(addMultipleExpenses(receipt.items));
    dispatch(
      setAssistantReply({
        reply: `✅ Receipt added! ${money(receiptTotal)} khoroch hoyeche.`,
        insight: `Remaining: ${money(Math.max(remaining - receiptTotal, 0))}.`,
      })
    );

    update({
      items: [],
      status: `✅ ${receipt.items.length} ta item budget e add hoyeche.`,
    });
  }

  return (
    <main className="space-y-5">
      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-black">Receipt Scanner</h2>
            <p className="text-sm text-slate-500">OCR diye receipt read kore items auto extract hobe.</p>
          </div>
          <ReceiptUploader
            preview={receipt.preview}
            fileName={receipt.fileName}
            boxes={receipt.boxes}
            rawText={receipt.rawText}
            wordCount={receipt.wordCount}
            confidence={receipt.confidence}
            status={receipt.status}
            scanning={receipt.scanning}
            progress={receipt.progress}
            hasFile={!!receipt.file}
            hasItems={receipt.items.length > 0}
            onFile={handleFile}
            onExtract={handleExtract}
            onAddManual={handleAddManual}
            onAddToBudget={handleAddToBudget}
          />
        </Card>

        <Card className="p-6">
          <BudgetImpactPanel receiptItems={receipt.items} />
        </Card>
      </section>

      {receipt.items.length > 0 || receipt.rawText ? (
        <Card className="p-6">
          <ReceiptItemEditor
            items={receipt.items}
            onUpdate={handleUpdateItem}
            onDelete={handleDeleteItem}
            onAddManual={handleAddManual}
            onClearAll={handleClearItems}
          />

          {receipt.items.length > 0 ? (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
              <div>
                <p className="text-lg font-black">Total: {money(receiptTotal)}</p>
                <p className="text-xs text-slate-500">{receipt.items.length} ta item ready to add</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleClearItems}>
                  Discard
                </Button>
                <Button variant="success" onClick={handleAddToBudget}>
                  ✅ Add {receipt.items.length} items to budget
                </Button>
              </div>
            </div>
          ) : null}
        </Card>
      ) : null}
    </main>
  );
}

export default ReceiptTab;
