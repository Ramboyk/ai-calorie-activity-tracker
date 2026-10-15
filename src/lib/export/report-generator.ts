/**
 * Professional Nutrition & Dietitian Report Generator
 * Exports clinical-grade CSV data and printable A4 PDF summaries
 * without bulky external dependencies.
 */

import type { Meal } from "@/types/meal";
import type { DailyLog, ExerciseLog } from "@/types/activity";
import type { MacroGoals } from "@/context/TrackerContext";
import type { WeightLog } from "@/lib/storage/weight-tracker";
import { formatDisplayDate, getTodayDateString, addDays } from "@/lib/utils/date";

export type ReportRange = "7days" | "30days" | "all";

export interface ReportDataset {
  range: ReportRange;
  meals: Meal[];
  dailyLogs: Record<string, DailyLog>;
  activities: ExerciseLog[];
  weightLogs: WeightLog[];
  calorieGoal: number;
  macroGoals: MacroGoals;
  userWeight?: number;
}

export interface FilteredReportData {
  rangeLabel: string;
  startDate: string;
  endDate: string;
  filteredMeals: Meal[];
  totalCalories: number;
  avgCalories: number;
  totalWaterMl: number;
  avgWaterMl: number;
  totalSteps: number;
  avgSteps: number;
  totalBurned: number;
  avgBurned: number;
  weightChangeText: string;
}

/**
 * Filters dataset by selected date range and calculates summary metrics.
 */
export function filterReportData(data: ReportDataset): FilteredReportData {
  const todayStr = getTodayDateString();
  let startDate = addDays(todayStr, -7);
  let rangeLabel = "Son 7 Günlük İnceleme";

  if (data.range === "30days") {
    startDate = addDays(todayStr, -30);
    rangeLabel = "Son 30 Günlük İnceleme";
  } else if (data.range === "all") {
    startDate = "2020-01-01";
    rangeLabel = "Tüm Zamanlar İncelemesi";
  }

  const filteredMeals = data.meals.filter((m) => m.date >= startDate && m.date <= todayStr);
  const filteredActs = data.activities.filter((a) => a.date >= startDate && a.date <= todayStr);

  const datesInRange: string[] = [];
  const startObj = new Date(startDate);
  const endObj = new Date(todayStr);
  for (let d = new Date(startObj); d <= endObj; d.setDate(d.getDate() + 1)) {
    datesInRange.push(d.toISOString().split("T")[0]);
  }

  const daysCount = Math.max(1, datesInRange.length);

  const totalCalories = filteredMeals.reduce((acc, m) => acc + (m.totalCalories || 0), 0);
  const avgCalories = Math.round(totalCalories / daysCount);

  let totalWaterMl = 0;
  let totalSteps = 0;
  datesInRange.forEach((dt) => {
    const log = data.dailyLogs[dt];
    if (log) {
      totalWaterMl += log.waterMl || 0;
      totalSteps += log.steps || 0;
    }
  });

  const avgWaterMl = Math.round(totalWaterMl / daysCount);
  const avgSteps = Math.round(totalSteps / daysCount);

  const totalBurned = filteredActs.reduce((acc, a) => acc + (a.caloriesBurned || 0), 0);
  const avgBurned = Math.round(totalBurned / daysCount);

  // Weight progression
  const sortedWeights = [...data.weightLogs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  let weightChangeText = "Kilo kaydı yok";
  if (sortedWeights.length >= 2) {
    const first = sortedWeights[0].weightKg;
    const last = sortedWeights[sortedWeights.length - 1].weightKg;
    const diff = Math.round((last - first) * 10) / 10;
    weightChangeText = `${diff > 0 ? `+${diff}` : diff} kg (${first}kg → ${last}kg)`;
  } else if (sortedWeights.length === 1) {
    weightChangeText = `Mevcut: ${sortedWeights[0].weightKg} kg`;
  }

  return {
    rangeLabel,
    startDate,
    endDate: todayStr,
    filteredMeals,
    totalCalories,
    avgCalories,
    totalWaterMl,
    avgWaterMl,
    totalSteps,
    avgSteps,
    totalBurned,
    avgBurned,
    weightChangeText,
  };
}

// ─── CSV EXPORT ────────────────────────────────────────────────────────────

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

export function buildCsvContent(data: ReportDataset): string {
  const filtered = filterReportData(data);

  const headers = [
    "Tarih",
    "Öğün Türü",
    "Yemek / Menü Adı",
    "Kalori (kcal)",
    "Protein (g)",
    "Karbonhidrat (g)",
    "Yağ (g)",
    "Su (ml)",
    "Adım Sayısı",
    "Tartım (kg)",
  ];

  const mealTypeLabels: Record<string, string> = {
    breakfast: "Kahvaltı",
    lunch: "Öğle Yemeği",
    dinner: "Akşam Yemeği",
    snack: "Ara Öğün",
  };

  const rows: string[][] = [];

  // Group meals by date or print each meal entry
  filtered.filteredMeals.forEach((meal) => {
    const dayLog = data.dailyLogs[meal.date];
    const weightLog = data.weightLogs.find((w) => w.date === meal.date);

    rows.push([
      meal.date,
      mealTypeLabels[meal.type] || meal.type,
      meal.name,
      String(meal.totalCalories || 0),
      String(meal.totalProtein || 0),
      String(meal.totalCarbs || 0),
      String(meal.totalFat || 0),
      String(dayLog?.waterMl || 0),
      String(dayLog?.steps || 0),
      weightLog ? String(weightLog.weightKg) : "",
    ]);
  });

  // If no meals in range, include at least daily log rows
  if (rows.length === 0) {
    Object.entries(data.dailyLogs).forEach(([dateStr, log]) => {
      const weightLog = data.weightLogs.find((w) => w.date === dateStr);
      rows.push([
        dateStr,
        "Günlük Özet",
        "Kayıtlı Öğün Yok",
        "0",
        "0",
        "0",
        "0",
        String(log.waterMl || 0),
        String(log.steps || 0),
        weightLog ? String(weightLog.weightKg) : "",
      ]);
    });
  }

  // Build CSV content with UTF-8 BOM for Microsoft Excel Turkish compatibility
  const csvLines = [
    headers.map(escapeCsvCell).join(";"),
    ...rows.map((row) => row.map(escapeCsvCell).join(";")),
  ];
  return "\uFEFF" + csvLines.join("\r\n");
}

export function exportToCsv(data: ReportDataset): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const filtered = filterReportData(data);
  const csvContent = buildCsvContent(data);

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `NutriTrack_Beslenme_Raporu_${filtered.startDate}_${filtered.endDate}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── CLINICAL PDF / PRINT REPORT ───────────────────────────────────────────

export function generatePdfReport(data: ReportDataset): void {
  const filtered = filterReportData(data);

  const mealTypeLabels: Record<string, string> = {
    breakfast: "Kahvaltı",
    lunch: "Öğle",
    dinner: "Akşam",
    snack: "Ara Öğün",
  };

  const mealRowsHtml = filtered.filteredMeals
    .map(
      (m) => `
      <tr>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${m.date}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 600;">${
          mealTypeLabels[m.type] || m.type
        }</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${m.name}</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: right; font-weight: bold;">${m.totalCalories} kcal</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: right;">${m.totalProtein}g</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: right;">${m.totalCarbs}g</td>
        <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: right;">${m.totalFat}g</td>
      </tr>
    `
    )
    .join("");

  const printHtml = `
<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>NutriTrack AI Klinik & Diyetisyen Raporu</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    body {
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 0;
      font-size: 12px;
      line-height: 1.4;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      border-bottom: 2px solid #006948;
      margin-bottom: 16px;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      color: #006948;
      margin: 0;
    }
    .brand-sub {
      font-size: 11px;
      color: #64748b;
      margin: 2px 0 0 0;
    }
    .report-meta {
      text-align: right;
      font-size: 11px;
      color: #475569;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px;
      text-align: center;
    }
    .card-label {
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      font-weight: 600;
    }
    .card-value {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 2px;
    }
    .goals-section {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      font-size: 11px;
      padding: 8px;
      text-align: left;
      border-bottom: 2px solid #cbd5e1;
    }
    .signature-box {
      margin-top: 30px;
      display: flex;
      justify-content: space-between;
      padding-top: 20px;
      border-top: 1px dashed #cbd5e1;
      font-size: 11px;
      color: #64748b;
    }
    .print-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #006948;
      color: white;
      padding: 10px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 9999;
    }
    .btn-print {
      background: #ffffff;
      color: #006948;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
    }
    @media print {
      .print-bar {
        display: none !important;
      }
      body {
        padding: 0;
      }
    }
    @media screen {
      body {
        padding-top: 60px;
        max-width: 800px;
        margin: 0 auto;
        padding-left: 20px;
        padding-right: 20px;
        padding-bottom: 40px;
      }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <span>NutriTrack AI • Klinik Rapor Önizlemesi</span>
    <button class="btn-print" onclick="window.print()">🖨️ PDF Olarak Kaydet / Yazdır</button>
  </div>

  <div class="header">
    <div>
      <h1 class="brand-title">NutriTrack AI</h1>
      <p class="brand-sub">Akıllı Beslenme & Metabolik Aktivite Klinik İnceleme Raporu</p>
    </div>
    <div class="report-meta">
      <strong>${filtered.rangeLabel}</strong><br>
      Tarih: ${filtered.startDate} — ${filtered.endDate}<br>
      Oluşturulma: ${new Date().toLocaleDateString("tr-TR")}
    </div>
  </div>

  <!-- 4-Stat Metric Summary -->
  <div class="grid-4">
    <div class="card">
      <div class="card-label">Günlük Ort. Kalori</div>
      <div class="card-value">${filtered.avgCalories.toLocaleString("tr-TR")} <span style="font-size:11px;font-weight:normal;">kcal</span></div>
    </div>
    <div class="card">
      <div class="card-label">Günlük Ort. Su</div>
      <div class="card-value">${filtered.avgWaterMl.toLocaleString("tr-TR")} <span style="font-size:11px;font-weight:normal;">ml</span></div>
    </div>
    <div class="card">
      <div class="card-label">Günlük Ort. Adım</div>
      <div class="card-value">${filtered.avgSteps.toLocaleString("tr-TR")}</div>
    </div>
    <div class="card">
      <div class="card-label">Kilo Gelişimi</div>
      <div class="card-value" style="font-size:14px; margin-top: 5px;">${filtered.weightChangeText}</div>
    </div>
  </div>

  <!-- Target Goals Section -->
  <div class="goals-section">
    <div>
      <strong style="color: #006948;">Mevcut Hedef Parametreleri:</strong>
      <span style="margin-left: 8px;">Hedef: <strong>${data.calorieGoal} kcal/gün</strong></span>
    </div>
    <div>
      <span>🥩 <strong>${data.macroGoals.protein}g</strong> Protein</span>
      <span style="margin-left: 10px;">🌾 <strong>${data.macroGoals.carbs}g</strong> Karb</span>
      <span style="margin-left: 10px;">🥑 <strong>${data.macroGoals.fat}g</strong> Yağ</span>
    </div>
  </div>

  <!-- Detailed Meal Table -->
  <h3 style="font-size: 13px; margin: 16px 0 4px 0; color: #1e293b;">Öğün & Besin Tüketim Detayları (${filtered.filteredMeals.length} Öğün)</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 85px;">Tarih</th>
        <th style="width: 80px;">Öğün</th>
        <th>Yemek / Besin Adı</th>
        <th style="width: 90px; text-align: right;">Kalori</th>
        <th style="width: 65px; text-align: right;">Protein</th>
        <th style="width: 65px; text-align: right;">Karb</th>
        <th style="width: 65px; text-align: right;">Yağ</th>
      </tr>
    </thead>
    <tbody>
      ${
        mealRowsHtml ||
        '<tr><td colspan="7" style="text-align:center; padding: 20px; color:#94a3b8;">Bu tarih aralığında kayıtlı öğün bulunmamaktadır.</td></tr>'
      }
    </tbody>
  </table>

  <!-- Signoff / Dietitian Approval -->
  <div class="signature-box">
    <div>
      <strong>NutriTrack AI Doğrulama Kodu:</strong> NT-${Date.now().toString(36).toUpperCase()}<br>
      <span style="font-size: 9px;">Bu rapor NutriTrack AI dijital sağlık günlüğü tarafından otomatik derlenmiştir.</span>
    </div>
    <div style="text-align: right;">
      <strong>Diyetisyen / Klinik Uzman Onayı:</strong><br><br>
      ____________________________
    </div>
  </div>

  <script>
    // Automatically trigger print dialog on desktop
    window.addEventListener("load", function() {
      setTimeout(function() {
        window.print();
      }, 400);
    });
  </script>
</body>
</html>
  `.trim();

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(printHtml);
    printWindow.document.close();
  }
}
