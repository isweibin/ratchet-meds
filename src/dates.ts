const DAY_MS = 86_400_000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function todayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatDateValue(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isValidDateString(value: unknown): value is string {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) {
    return false;
  }

  return formatDateValue(parseDate(value)) === value;
}

export function addDays(value: string, days: number): string {
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDateValue(date);
}

export function daysBetween(start: string, end: string): number {
  return Math.round(
    (parseDate(end).getTime() - parseDate(start).getTime()) / DAY_MS,
  );
}

export function dayOfWeek(value: string): number {
  const day = parseDate(value).getUTCDay();
  return day === 0 ? 7 : day;
}

export function compareDates(a: string, b: string): number {
  return a.localeCompare(b);
}

export function formatDate(value: string): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  }).format(parseDate(value));
}

export function formatFullDate(value: string): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parseDate(value));
}
