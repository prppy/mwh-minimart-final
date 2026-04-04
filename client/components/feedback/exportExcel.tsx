import { useState } from "react";
import { TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { Download } from "lucide-react-native";
import * as XLSX from "xlsx";

import { HStack } from "@/components/ui/hstack";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

import { exportAllFeedback } from "@/utils/api/feedback";

export const ExportExcel: React.FC = () => {
  const [exporting, setExporting] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  async function handleExport() {
    setExporting(true);
    setError(null);

    try {
      const data = await exportAllFeedback();

      // ── Build rows ──────────────────────────────────────────────────────
      const rows = data.map((item: any, index: number) => ({
        "#":             index + 1,
        "Feedback ID":   item.feedbackId,
        "Resident Name": item.residentName,
        "User ID":       item.userId,
        "Rating":        item.rating,
        "Category":      item.feedbackCategory,
        "Feedback":      item.feedback,
        "Submitted At":  item.submittedAt,
      }));

      // ── Build workbook ──────────────────────────────────────────────────
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [
        { wch: 5  },
        { wch: 12 },
        { wch: 25 },
        { wch: 10 },
        { wch: 8  },
        { wch: 14 },
        { wch: 60 },
        { wch: 22 },
      ];
      const wb   = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Feedback");

      const date     = new Date().toISOString().slice(0, 10);
      const filename = `feedback_export_${date}.xlsx`;

      if (Platform.OS === "web") {
        // ── Web: trigger browser download ───────────────────────────────
        const buf  = XLSX.write(wb, { type: "array", bookType: "xlsx" });
        const blob = new Blob([buf], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const a   = document.createElement("a");
        a.href     = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

      } else {
        // ── Mobile: write to cache then share ───────────────────────────
        const { File, Paths } = await import("expo-file-system/next");
        const Sharing         = await import("expo-sharing");

        const base64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
        const file   = new File(Paths.cache, filename);
        await file.write(base64, { encoding: "base64" });

        await Sharing.shareAsync(file.uri, {
          mimeType:    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Export Feedback",
          UTI:         "com.microsoft.excel.xlsx",
        });
      }

    } catch (err) {
      console.error(err);
      setError("Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <HStack className="items-center gap-2">
      {error && (
        <Text className="text-xs" style={{ color: "#A32D2D" }}>{error}</Text>
      )}
      <TouchableOpacity
        onPress={handleExport}
        disabled={exporting}
        className="flex-row items-center gap-1 px-3 py-2 rounded-xl"
        style={{ backgroundColor: "#3C3489", opacity: exporting ? 0.6 : 1 }}
      >
        {exporting ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Icon as={Download} size="xs" style={{ color: "#fff" }} />
        )}
        <Text style={{ color: "#fff", fontSize: 12, fontWeight: 600, marginLeft: 4 }}>
          {exporting ? "Exporting..." : "Export Excel"}
        </Text>
      </TouchableOpacity>
    </HStack>
  );
};