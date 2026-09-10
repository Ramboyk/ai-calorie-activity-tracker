/**
 * Date utility helpers for NutriTrack AI
 */

const TURKISH_MONTHS = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

const TURKISH_DAYS = [
  "Pazar",
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
];

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isToday(dateStr: string): boolean {
  return dateStr === getTodayDateString();
}

export function addDays(dateStr: string, days: number): string {
  const parts = dateStr.split("-").map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  date.setDate(date.getDate() + days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "Bugün";

  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3) return dateStr;

  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  const dayNumber = date.getDate();
  const monthName = TURKISH_MONTHS[date.getMonth()] || "";
  const dayName = TURKISH_DAYS[date.getDay()] || "";

  if (isToday(dateStr)) {
    return `Bugün, ${dayNumber} ${monthName} ${dayName}`;
  }

  // Check for yesterday / tomorrow
  const yesterday = addDays(getTodayDateString(), -1);
  if (dateStr === yesterday) {
    return `Dün, ${dayNumber} ${monthName} ${dayName}`;
  }

  const tomorrow = addDays(getTodayDateString(), 1);
  if (dateStr === tomorrow) {
    return `Yarın, ${dayNumber} ${monthName} ${dayName}`;
  }

  return `${dayNumber} ${monthName}, ${dayName}`;
}

export function getDayShortLabel(dateStr: string): string {
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3) return "";
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  const shortDays = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  return shortDays[date.getDay()] || "";
}

export function getWeekRangeLabel(startDateStr: string, endDateStr: string): string {
  const startParts = startDateStr.split("-").map(Number);
  const endParts = endDateStr.split("-").map(Number);
  const shortMonths = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

  const startDay = startParts[2];
  const startMonth = shortMonths[startParts[1] - 1];
  const endDay = endParts[2];
  const endMonth = shortMonths[endParts[1] - 1];

  if (startMonth === endMonth) {
    return `${startDay} – ${endDay} ${endMonth}`;
  }
  return `${startDay} ${startMonth} – ${endDay} ${endMonth}`;
}

export function getWeekNumber(dateStr: string): number {
  const parts = dateStr.split("-").map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

