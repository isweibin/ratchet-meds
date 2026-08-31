import type { DosePeriod, Medication } from "./model";

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function formatQuantity(value: number): string {
  const rounded = Math.round(value * 1_000_000) / 1_000_000;
  return rounded.toLocaleString("zh-CN", {
    maximumFractionDigits: 3,
    useGrouping: false,
  });
}

export function formatInputQuantity(value: number): string {
  return String(Math.round(value * 1_000_000) / 1_000_000);
}

export function periodLabel(period: DosePeriod): string {
  if (period === "morning") {
    return "早";
  }
  if (period === "noon") {
    return "中";
  }
  return "晚";
}

export function weekdayLabel(day: number): string {
  return ["", "一", "二", "三", "四", "五", "六", "日"][day] ?? String(day);
}

export function scheduleSummary(medication: Medication): string {
  const schedule = medication.schedule;
  if (schedule.type === "as-needed") {
    return "按需服用";
  }

  const doseText = (Object.entries(schedule.doses) as [DosePeriod, number][])
    .filter(([, amount]) => amount > 0)
    .map(
      ([period, amount]) =>
        `${periodLabel(period)} ${formatQuantity(amount)}${escapeHtml(medication.unit)}`,
    )
    .join(" · ");

  if (schedule.type === "weekly") {
    return `每周${schedule.days.map(weekdayLabel).join("、")} · ${doseText}`;
  }

  if (schedule.type === "interval") {
    return `每 ${schedule.everyDays} 天 · ${doseText}`;
  }

  return `每天 · ${doseText}`;
}

export function packageSuggestion(
  medication: Medication,
  amount: number,
): string {
  if (!medication.packageSize || medication.packageSize <= 0 || amount <= 0) {
    return "";
  }

  const packages = Math.ceil(amount / medication.packageSize);
  return `约 ${packages} ${escapeHtml(medication.packageUnit || "盒")}`;
}
