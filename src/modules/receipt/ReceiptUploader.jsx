import React, { useRef, useState } from 'react';
import { validateReceiptFile } from './receiptScanner';
import Button from '../../components/Button';

function OcrOverlay({ boxes }) {
  if (!boxes?.length) return null;

  return boxes.map((box) => {
    let colorClass = 'border-red-400 bg-red-400/10';
    if (box.confidence > 80) colorClass = 'border-emerald-500 bg-emerald-400/10';
    else if (box.confidence > 60) colorClass = 'border-yellow-500 bg-yellow-400/10';

    return (
      <span
        key={box.id}
        title={`${box.text} (${box.confidence}%)`}
        className={`absolute rounded-sm border transition ${colorClass}`}
        style={{
          left: `${box.left}%`,
          top: `${box.top}%`,
          width: `${box.width}%`,
          height: `${box.height}%`,
        }}
      />
    );
  });
}

function ConfidenceBadge({ confidence }) {
  if (!confidence) return null;

  let colorClass = 'bg-red-100 text-red-700';
  if (confidence > 80) colorClass = 'bg-emerald-100 text-emerald-700';
  else if (confidence > 60) colorClass = 'bg-yellow-100 text-yellow-700';

  return <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${colorClass}`}>OCR {confidence}% confident</span>;
}

function ProgressBar({ progress }) {
  if (!progress && progress !== 0) return null;

  return (
    <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
      <div className="h-2 rounded-full bg-slate-950 transition-all duration-300" style={{ width: `${progress}%` }} />
    </div>
  );
}

function DropZone({ onFile }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer rounded-3xl border-2 border-dashed p-8 text-center transition ${
        dragging
          ? 'border-slate-950 bg-slate-100'
          : 'border-slate-200 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'
      }`}
    >
      <div className="text-5xl">📷</div>
      <p className="mt-2 font-black text-slate-700">{dragging ? 'Chhere dao!' : 'Receipt upload koro'}</p>
      <p className="text-sm text-slate-400">Drag & drop ba click kore select koro</p>
      <p className="text-xs text-slate-400">JPG, PNG, WEBP — max 10MB</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => onFile(event.target.files?.[0] || null)}
      />
    </div>
  );
}

function ImagePreview({ preview, fileName, boxes, confidence }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm">
      <div className="relative overflow-hidden rounded-xl bg-slate-100">
        <img src={preview} alt="Receipt preview" className="mx-auto max-h-96 w-full object-contain" />
        <OcrOverlay boxes={boxes} />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="truncate text-xs text-slate-500">{fileName}</p>
        <ConfidenceBadge confidence={confidence} />
      </div>
    </div>
  );
}

function RawTextViewer({ rawText, wordCount }) {
  if (!rawText) return null;

  return (
    <details className="rounded-2xl bg-slate-50 p-3 text-xs">
      <summary className="cursor-pointer font-bold">Raw OCR text ({wordCount} words detected)</summary>
      <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-slate-600">{rawText}</pre>
    </details>
  );
}

function StatusBanner({ status, scanning, progress }) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
      <p>{status}</p>
      {scanning ? <ProgressBar progress={progress} /> : null}
    </div>
  );
}

function ReceiptUploader({
  preview,
  fileName,
  boxes,
  rawText,
  wordCount,
  confidence,
  status,
  scanning,
  progress,
  hasFile,
  hasItems,
  onFile,
  onExtract,
  onAddManual,
  onAddToBudget,
}) {
  function handleFile(file) {
    const result = validateReceiptFile(file);
    if (!result.valid) {
      alert(result.error);
      return;
    }
    onFile(file);
  }

  return (
    <div className="space-y-4">
      <StatusBanner status={status} scanning={scanning} progress={progress} />
      {!preview ? (
        <DropZone onFile={handleFile} />
      ) : (
        <ImagePreview preview={preview} fileName={fileName} boxes={boxes} confidence={confidence} />
      )}
      <RawTextViewer rawText={rawText} wordCount={wordCount} />
      <div className="flex flex-wrap gap-2">
        <Button onClick={onExtract} disabled={scanning || !hasFile}>
          {scanning ? `Scanning ${progress}%...` : '🔍 Extract with OCR'}
        </Button>
        <Button variant="outline" onClick={onAddManual}>
          + Manual item
        </Button>
        {preview ? (
          <Button variant="outline" onClick={() => onFile(null)}>
            🗑️ Remove image
          </Button>
        ) : null}
        <Button variant="success" onClick={onAddToBudget} disabled={!hasItems}>
          ✅ Add to budget
        </Button>
      </div>
    </div>
  );
}

export default ReceiptUploader;
