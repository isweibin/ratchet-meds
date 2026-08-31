import type { DosePeriod, DosePoint, Medication, Schedule } from "./model";
import { addDays, compareDates, dayOfWeek, daysBetween } from "./dates";

const EPSILON = 1e-9;
const SEARCH_LIMIT_DAYS = 365 * 30;
const PERIODS: readonly DosePeriod[] = ["morning", "noon", "evening"];

export function scheduledDoseAmount(
  schedule: Schedule,
  date: string,
  period: DosePeriod,
): number {
  if (schedule.type === "as-needed" || !isScheduledDate(schedule, date)) {
    return 0;
  }

  return schedule.doses[period];
}

export function scheduledDosePoints(
  schedule: Schedule,
  startDate: string,
  limit = 4,
): DosePoint[] {
  if (schedule.type === "as-needed" || limit <= 0) {
    return [];
  }

  const points: DosePoint[] = [];
  let date = startDate;

  for (
    let dayIndex = 0;
    dayIndex < SEARCH_LIMIT_DAYS && points.length < limit;
    dayIndex += 1
  ) {
    if (isScheduledDate(schedule, date)) {
      for (const period of PERIODS) {
        if (scheduledDoseAmount(schedule, date, period) > 0) {
          points.push({ date, period });
          if (points.length >= limit) {
            break;
          }
        }
      }
    }
    date = addDays(date, 1);
  }

  return points;
}

export function firstScheduledDoseOnOrAfter(
  schedule: Schedule,
  start: DosePoint,
): DosePoint | null {
  if (schedule.type === "as-needed") {
    return null;
  }

  let date = start.date;
  for (let dayIndex = 0; dayIndex < SEARCH_LIMIT_DAYS; dayIndex += 1) {
    if (isScheduledDate(schedule, date)) {
      const firstPeriodIndex =
        date === start.date ? PERIODS.indexOf(start.period) : 0;
      for (
        let index = Math.max(0, firstPeriodIndex);
        index < PERIODS.length;
        index += 1
      ) {
        const period = PERIODS[index];
        if (scheduledDoseAmount(schedule, date, period) > 0) {
          return { date, period };
        }
      }
    }
    date = addDays(date, 1);
  }

  return null;
}

export function projectedStock(medication: Medication, date: string): number {
  const baseline = medication.stockBaseline;
  if (
    medication.schedule.type === "as-needed" ||
    baseline === null ||
    compareDates(date, baseline.date) <= 0
  ) {
    return medication.stock;
  }

  const used = consumptionFromDoseThroughDate(
    medication.schedule,
    baseline,
    addDays(date, -1),
  );
  return cleanNumber(Math.max(0, medication.stock - used));
}

export function projectionBaselineForDate(
  medication: Medication,
  date: string,
): DosePoint | null {
  if (medication.schedule.type === "as-needed") {
    return null;
  }

  const baseline = medication.stockBaseline;
  if (
    baseline &&
    compareDosePoints(baseline, { date, period: "morning" }) >= 0
  ) {
    return baseline;
  }

  return firstScheduledDoseOnOrAfter(medication.schedule, {
    date,
    period: "morning",
  });
}

export function firstShortageDate(medication: Medication): string | null {
  const baseline = medication.stockBaseline;
  if (medication.schedule.type === "as-needed" || baseline === null) {
    return null;
  }

  let remaining = medication.stock;
  let date = baseline.date;

  for (let dayIndex = 0; dayIndex < SEARCH_LIMIT_DAYS; dayIndex += 1) {
    if (isScheduledDate(medication.schedule, date)) {
      for (const period of PERIODS) {
        const point = { date, period } satisfies DosePoint;
        if (compareDosePoints(point, baseline) < 0) {
          continue;
        }

        const amount = scheduledDoseAmount(medication.schedule, date, period);
        if (amount <= 0) {
          continue;
        }

        if (amount > remaining + EPSILON) {
          return date;
        }
        remaining = cleanNumber(remaining - amount);
      }
    }
    date = addDays(date, 1);
  }

  return null;
}

export function availableThroughDate(medication: Medication): string | null {
  const shortageDate = firstShortageDate(medication);
  return shortageDate ? addDays(shortageDate, -1) : null;
}

export function refillAmount(
  medication: Medication,
  fromDate: string,
  coverThrough: string,
): number | null {
  const baseline = medication.stockBaseline;
  if (
    medication.schedule.type === "as-needed" ||
    baseline === null ||
    !fromDate ||
    !coverThrough ||
    compareDates(coverThrough, fromDate) < 0
  ) {
    return null;
  }

  const fromPoint = firstScheduledDoseOnOrAfter(medication.schedule, {
    date: fromDate,
    period: "morning",
  });
  if (!fromPoint) {
    return 0;
  }

  const startPoint =
    compareDosePoints(baseline, fromPoint) > 0 ? baseline : fromPoint;
  if (compareDates(startPoint.date, coverThrough) > 0) {
    return 0;
  }

  const stockAtStart = projectedStock(medication, fromDate);
  const needed = consumptionFromDoseThroughDate(
    medication.schedule,
    startPoint,
    coverThrough,
  );
  return cleanNumber(Math.max(0, needed - stockAtStart));
}

export function compareDosePoints(a: DosePoint, b: DosePoint): number {
  const dateComparison = compareDates(a.date, b.date);
  if (dateComparison !== 0) {
    return dateComparison;
  }
  return PERIODS.indexOf(a.period) - PERIODS.indexOf(b.period);
}

export function cleanNumber(value: number): number {
  const rounded = Math.round(value * 1_000_000) / 1_000_000;
  return Math.abs(rounded) < EPSILON ? 0 : rounded;
}

function consumptionFromDoseThroughDate(
  schedule: Schedule,
  start: DosePoint,
  endInclusive: string,
): number {
  if (
    schedule.type === "as-needed" ||
    compareDates(endInclusive, start.date) < 0
  ) {
    return 0;
  }

  let total = 0;
  let date = start.date;

  while (compareDates(date, endInclusive) <= 0) {
    if (isScheduledDate(schedule, date)) {
      for (const period of PERIODS) {
        const point = { date, period } satisfies DosePoint;
        if (compareDosePoints(point, start) >= 0) {
          total += scheduledDoseAmount(schedule, date, period);
        }
      }
    }
    date = addDays(date, 1);
  }

  return cleanNumber(total);
}

function isScheduledDate(schedule: Schedule, date: string): boolean {
  if (schedule.type === "as-needed") {
    return false;
  }

  if (schedule.type === "weekly") {
    return schedule.days.includes(dayOfWeek(date));
  }

  if (schedule.type === "interval") {
    const offset = daysBetween(schedule.startDate, date);
    return offset >= 0 && offset % schedule.everyDays === 0;
  }

  return true;
}
