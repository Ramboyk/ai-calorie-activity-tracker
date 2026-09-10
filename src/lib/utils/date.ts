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
