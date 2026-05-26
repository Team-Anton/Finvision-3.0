import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Button from "../../components/Button";

function ReceiptUploader({
  preview,
  fileName,
  rawText,
  wordCount,
  confidence,
  status,
  scanning,
  progress,
  hasFile,
  hasItems,
  totalVerified,
  onPickImage,
  onExtract,
  onAddManual,
  onAddToBudget,
  onRemoveImage,
}) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.statusCard}>
        <Text style={styles.statusText}>{status}</Text>
        {scanning ? (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        ) : null}
      </View>

      {!preview ? (
        <TouchableOpacity style={styles.uploadCard} onPress={onPickImage}>
          <Text style={styles.uploadTitle}>Receipt upload koro</Text>
          <Text style={styles.uploadSubtitle}>JPG, PNG, WEBP - max 10MB</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.previewCard}>
          <Image source={{ uri: preview }} style={styles.previewImage} />
          <View style={styles.previewMeta}>
            <Text style={styles.previewLabel}>{fileName}</Text>
            {confidence ? (
              <Text style={styles.previewLabel}>
                OCR {confidence}% confident
              </Text>
            ) : null}
          </View>
        </View>
      )}

      {rawText ? (
        <View style={styles.rawCard}>
          <Text style={styles.rawTitle}>Raw OCR text ({wordCount} words)</Text>
          <Text style={styles.rawText}>{rawText}</Text>
        </View>
      ) : null}

      <View style={styles.actionRow}>
        <Button onPress={onExtract} disabled={scanning || !hasFile}>
          {scanning ? `Scanning ${progress}%...` : "Extract with OCR"}
        </Button>
        <Button variant="outline" onPress={onAddManual}>
          Manual item
        </Button>
        {preview ? (
          <Button variant="outline" onPress={onRemoveImage}>
            Remove image
          </Button>
        ) : null}
        <Button variant="success" onPress={onAddToBudget} disabled={!hasItems || !totalVerified}>
          Add to budget
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  statusCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    padding: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },
  progressTrack: {
    marginTop: 10,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#e2e8f0",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#0f172a",
  },
  uploadCard: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    padding: 24,
    borderRadius: 14,
    alignItems: "center",
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1e293b",
  },
  uploadSubtitle: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748b",
  },
  previewCard: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 12,
  },
  previewImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    resizeMode: "contain",
  },
  previewMeta: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  previewLabel: {
    fontSize: 11,
    color: "#64748b",
  },
  rawCard: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 12,
  },
  rawTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },
  rawText: {
    marginTop: 6,
    fontSize: 11,
    color: "#64748b",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
});

export default ReceiptUploader;
