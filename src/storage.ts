import { isValidDateString, todayString } from "./dates";
import {
  emptyData,
  type AppData,
  type DosePeriod,
  type DosePoint,
  type Medication,
  type Person,
  type Plan,
  type Schedule,
} from "./model";
import { scheduledDoseAmount } from "./schedule";

const STORAGE_KEY = "ratchet-meds";

type LoadResult = {
  data: AppData;
  issue: string | null;
  recoveryRaw: string | null;
};

export function loadData(): LoadResult {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch {
    return {
      data: emptyData(),
      issue:
        "Ratchet 无法访问当前浏览器的本地存储。请检查浏览器隐私或站点存储设置。",
      recoveryRaw: null,
    };
  }

  if (!raw) {
    return { data: emptyData(), issue: null, recoveryRaw: null };
  }

  try {
    return {
      data: normalizeData(JSON.parse(raw)),
      issue: null,
      recoveryRaw: null,
    };
  } catch {
    return {
      data: emptyData(),
      issue: "Ratchet 无法读取当前浏览器中的本地数据。原始数据尚未被覆盖。",
      recoveryRaw: raw,
    };
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportData(data: AppData): void {
  downloadJson(
    JSON.stringify(data, null, 2),
    `ratchet-backup-${todayString()}.json`,
  );
}

export function exportRawData(raw: string): void {
  downloadJson(raw, `ratchet-recovery-${todayString()}.json`);
}

export async function importData(file: File): Promise<AppData> {
  return normalizeData(JSON.parse(await file.text()));
}

function downloadJson(content: string, filename: string): void {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function normalizeData(value: unknown): AppData {
  if (!isRecord(value) || value.version !== 2) {
    throw new Error("Unsupported backup");
  }

  if (
    !Array.isArray(value.people) ||
    !Array.isArray(value.medications) ||
    !isPlan(value.plan)
  ) {
    throw new Error("Invalid backup");
  }

  if (!value.people.every(isPerson)) {
    throw new Error("Invalid people data");
  }

  const medications = normalizeMedications(value.medications);

  const personIds = value.people.map((person) => person.id);
  const medicationIds = medications.map((medication) => medication.id);

  if (
    new Set(personIds).size !== personIds.length ||
    new Set(medicationIds).size !== medicationIds.length
  ) {
    throw new Error("Duplicate IDs");
  }

  const knownPeople = new Set(personIds);
  if (medications.some((medication) => !knownPeople.has(medication.personId))) {
    throw new Error("Medication references an unknown person");
  }

  return {
    version: 2,
    people: value.people.map((person) => ({
      id: person.id,
      name: person.name,
    })),
    medications,
    plan: { coverThrough: value.plan.coverThrough },
  };
}

function normalizeMedications(values: unknown[]): Medication[] {
  if (!values.every(isMedication)) {
    throw new Error("Invalid medication data");
  }
  return values.map(copyMedication);
}

function copyMedication(medication: Medication): Medication {
  return {
    id: medication.id,
    personId: medication.personId,
    name: medication.name,
    strength: medication.strength,
    unit: medication.unit,
    packageSize: medication.packageSize,
    packageUnit: medication.packageUnit,
    stock: medication.stock,
    stockBaseline: medication.stockBaseline
      ? { ...medication.stockBaseline }
      : null,
    schedule: copySchedule(medication.schedule),
  };
}

function copySchedule(schedule: Schedule): Schedule {
  if (schedule.type === "as-needed") {
    return { type: "as-needed" };
  }

  const doses = { ...schedule.doses };
  if (schedule.type === "weekly") {
    return { type: "weekly", days: [...schedule.days], doses };
  }
  if (schedule.type === "interval") {
    return {
      type: "interval",
      everyDays: schedule.everyDays,
      startDate: schedule.startDate,
      doses,
    };
  }
  return { type: "daily", doses };
}

function isPerson(value: unknown): value is Person {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.name) &&
    value.name.trim().length <= 30
  );
}

function isMedication(value: unknown): value is Medication {
  if (!isMedicationBase(value) || !isSchedule(value.schedule)) {
    return false;
  }

  if (value.schedule.type === "as-needed") {
    return value.stockBaseline === null;
  }

  return (
    isDosePoint(value.stockBaseline) &&
    scheduledDoseAmount(
      value.schedule,
      value.stockBaseline.date,
      value.stockBaseline.period,
    ) > 0
  );
}

function isMedicationBase(value: unknown): value is Record<string, unknown> & {
  id: string;
  personId: string;
  name: string;
  strength: string;
  unit: string;
  packageSize: number | null;
  packageUnit: string;
  stock: number;
} {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.personId) &&
    isNonEmptyString(value.name) &&
    value.name.trim().length <= 80 &&
    isString(value.strength) &&
    value.strength.length <= 40 &&
    isNonEmptyString(value.unit) &&
    value.unit.trim().length <= 12 &&
    (value.packageSize === null || isPositiveNumber(value.packageSize)) &&
    isString(value.packageUnit) &&
    value.packageUnit.length <= 12 &&
    isNonNegativeNumber(value.stock)
  );
}

function isPlan(value: unknown): value is Plan {
  return (
    isRecord(value) &&
    (value.coverThrough === "" || isValidDateString(value.coverThrough))
  );
}

function isSchedule(value: unknown): value is Schedule {
  if (!isRecord(value) || !isString(value.type)) {
    return false;
  }

  if (value.type === "as-needed") {
    return true;
  }

  if (!isDoses(value.doses) || doseTotal(value.doses) <= 0) {
    return false;
  }

  if (value.type === "daily") {
    return true;
  }

  if (value.type === "weekly") {
    if (!Array.isArray(value.days) || value.days.length === 0) {
      return false;
    }
    const days = value.days;
    return (
      days.every((day) => Number.isInteger(day) && day >= 1 && day <= 7) &&
      new Set(days).size === days.length
    );
  }

  if (value.type === "interval") {
    return (
      Number.isInteger(value.everyDays) &&
      Number(value.everyDays) >= 1 &&
      isValidDateString(value.startDate)
    );
  }

  return false;
}

function isDosePoint(value: unknown): value is DosePoint {
  return (
    isRecord(value) &&
    isValidDateString(value.date) &&
    isDosePeriod(value.period)
  );
}

function isDosePeriod(value: unknown): value is DosePeriod {
  return value === "morning" || value === "noon" || value === "evening";
}

function isDoses(
  value: unknown,
): value is Record<"morning" | "noon" | "evening", number> {
  return (
    isRecord(value) &&
    isNonNegativeNumber(value.morning) &&
    isNonNegativeNumber(value.noon) &&
    isNonNegativeNumber(value.evening)
  );
}

function doseTotal(
  doses: Record<"morning" | "noon" | "evening", number>,
): number {
  return doses.morning + doses.noon + doses.evening;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}
