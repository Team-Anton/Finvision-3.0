import {
  parseReceiptText,
  runOcr,
  validateReceiptFile,
} from "./receiptScannerNative";

export { parseReceiptText, runOcr, validateReceiptFile };

export function parseReceiptTextWithTotal(rawText, todayLabel) {
  return {
    items: parseReceiptText(rawText, todayLabel),
    extractedTotal: 0,
  };
}
