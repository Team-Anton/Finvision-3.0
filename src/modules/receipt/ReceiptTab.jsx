import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useDispatch, useSelector } from "react-redux";
import { addMultipleExpenses } from "../../store/budgetSlice";
import { setAssistantReply } from "../../store/uiSlice";
import { categories } from "../../utils/constants";
import {
  calcRemaining,
  calcTotalSpent,
  createId,
  money,
  todayLabel,
} from "../../utils/helpers";
import Button from "../../components/Button";
import Card from "../../components/Card";
import BudgetImpactPanel from "./BudgetImpactPanel";
import ReceiptItemEditor from "./ReceiptItemEditor";
import ReceiptUploader from "./ReceiptUploader";
import {
  parseReceiptText,
  runOcr,
  validateReceiptFile,
} from "./receiptScanner";

const initialReceiptState = {
  preview: null,
  file: null,
  fileName: "",
  rawText: "",
  wordCount: 0,
  confidence: 0,
  items: [],
  status: "Receipt image upload koro tahole OCR diye extract hobe.",
  scanning: false,
  progress: 0,
};

function createManualItem() {
  return {
    id: createId("receipt"),
    amount: "",
    currency: "BDT",
    category: "Groceries",
    subcategory: "Household",
    merchant: "",
    date: todayLabel,
    note: "",
    qty: "",
  };
}

function ReceiptTab() {
  const [receipt, setReceipt] = useState(initialReceiptState);
  const dispatch = useDispatch();
  const { monthlyBudget, expenses } = useSelector((state) => state.budget);
  const totalSpent = calcTotalSpent(expenses);
  const remaining = calcRemaining(monthlyBudget, totalSpent);
  const receiptTotal = receipt.items.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0,
  );

  function update(patch) {
    setReceipt((current) => ({ ...current, ...patch }));
  }

  async function handlePickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Photo access na dile receipt upload kora jabe na.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9,
      base64: true,
    });
    if (result.canceled) return;

    const asset = result.assets?.[0];
    const validation = validateReceiptFile(asset);
    if (!validation.valid) {
      update({ status: validation.error });
      return;
    }

    update({
      preview: asset.uri,
      file: asset,
      fileName: asset.fileName || "receipt-image",
      base64: asset.base64 || "",
      rawText: "",
      wordCount: 0,
      confidence: 0,
      items: [],
      status: "Image ready. Extract with OCR button click koro.",
      scanning: false,
      progress: 0,
    });
  }

  async function handleExtract() {
    if (!receipt.file) {
      update({ status: "Aghe receipt image upload koro." });
      return;
    }

    if (!receipt.file.base64) {
      update({
        status: "Image base64 data nai. Please re-pick the image.",
      });
      return;
    }

    try {
      update({ scanning: true, progress: 0, status: "OCR cholche..." });
      const result = await runOcr(receipt.file, (progress) =>
        update({ progress }),
      );
      const items = parseReceiptText(result.rawText, todayLabel);

      update({
        rawText: result.rawText,
        wordCount: result.wordCount,
        confidence: result.confidence,
        items,
        scanning: false,
        progress: 100,
        status: items.length
          ? `${items.length} ta item extract hoyeche. Review kore add koro.`
          : "OCR text pawa geche kintu item parse hoyni. Manual entry use koro.",
      });
    } catch (error) {
      update({
        scanning: false,
        progress: 0,
        status: `OCR failed: ${error.message || "Please try again."}`,
      });
    }
  }

  function handleUpdateItem(id, field, value) {
    update({
      items: receipt.items.map((item) => {
        if (item.id !== id) return item;
        if (field === "category") {
          const option =
            categories.find((cat) => cat.category === value) || categories[0];
          return {
            ...item,
            category: value,
            subcategory: option.subcategories[0],
          };
        }
        if (field === "amount") return { ...item, amount: Number(value) || 0 };
        if (field === "qty") {
          const name = String(item.note || "")
            .split(" x ")[0]
            .trim();
          const numericQty = value === "" ? "" : Number(value) || 1;
          return {
            ...item,
            qty: numericQty,
            note: name ? `${name} x ${numericQty || 1}` : "",
          };
        }
        if (field === "name")
          return {
            ...item,
            note: value ? `${value} x ${item.qty || 1}` : "",
          };
        if (field === "merchant") return { ...item, merchant: value };
        return { ...item, [field]: value };
      }),
    });
  }

  function handleAddToBudget() {
    if (!receipt.items.length) return;
    dispatch(addMultipleExpenses(receipt.items));
    dispatch(
      setAssistantReply({
        reply: `Receipt added! ${money(receiptTotal)} khoroch hoyeche.`,
        insight: `Remaining: ${money(Math.max(remaining - receiptTotal, 0))}.`,
      }),
    );
    update({
      items: [],
      status: `${receipt.items.length} ta item budget e add hoyeche.`,
    });
  }

  return (
    <View style={styles.wrapper}>
      <Card>
        <View style={styles.header}>
          <Text style={styles.title}>Receipt Scanner</Text>
          <Text style={styles.subtitle}>
            OCR diye receipt read kore items auto extract hobe.
          </Text>
        </View>
        <ReceiptUploader
          preview={receipt.preview}
          fileName={receipt.fileName}
          rawText={receipt.rawText}
          wordCount={receipt.wordCount}
          confidence={receipt.confidence}
          status={receipt.status}
          scanning={receipt.scanning}
          progress={receipt.progress}
          hasFile={!!receipt.file}
          hasItems={receipt.items.length > 0}
          onPickImage={handlePickImage}
          onExtract={handleExtract}
          onAddManual={() =>
            update({ items: [...receipt.items, createManualItem()] })
          }
          onAddToBudget={handleAddToBudget}
          onRemoveImage={() => update(initialReceiptState)}
        />
      </Card>

      <Card>
        <BudgetImpactPanel receiptItems={receipt.items} />
      </Card>

      <Card>
        <ReceiptItemEditor
          items={receipt.items}
          onUpdate={handleUpdateItem}
          onDelete={(id) =>
            update({ items: receipt.items.filter((item) => item.id !== id) })
          }
          onAddManual={() =>
            update({ items: [...receipt.items, createManualItem()] })
          }
          onClearAll={() => update({ items: [], status: "Items cleared." })}
        />

        {receipt.items.length ? (
          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>
                Total: {money(receiptTotal)}
              </Text>
              <Text style={styles.totalHint}>
                {receipt.items.length} ta item ready to add
              </Text>
            </View>
            <Button variant="success" onPress={handleAddToBudget}>
              Add {receipt.items.length} items to budget
            </Button>
          </View>
        ) : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 16,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748b",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    marginTop: 16,
    paddingTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  totalLabel: {
    fontWeight: "800",
    color: "#0f172a",
  },
  totalHint: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748b",
  },
});

export default ReceiptTab;
