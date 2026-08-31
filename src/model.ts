export type DosePeriod = "morning" | "noon" | "evening";

export type Doses = Record<DosePeriod, number>;

export type DailySchedule = {
  type: "daily";
  doses: Doses;
};

export type WeeklySchedule = {
  type: "weekly";
  days: number[];
  doses: Doses;
};

export type IntervalSchedule = {
  type: "interval";
  everyDays: number;
  startDate: string;
  doses: Doses;
};

export type AsNeededSchedule = {
  type: "as-needed";
};

export type Schedule =
  | DailySchedule
  | WeeklySchedule
  | IntervalSchedule
  | AsNeededSchedule;

export type DosePoint = {
  date: string;
  period: DosePeriod;
};

export type Person = {
  id: string;
  name: string;
};

export type Medication = {
  id: string;
  personId: string;
  name: string;
  strength: string;
  unit: string;
  packageSize: number | null;
  packageUnit: string;
  stock: number;
  stockBaseline: DosePoint | null;
  schedule: Schedule;
};

export type Plan = {
  coverThrough: string;
};

export type AppData = {
  version: 2;
  people: Person[];
  medications: Medication[];
  plan: Plan;
};

export function emptyData(): AppData {
  return {
    version: 2,
    people: [],
    medications: [],
    plan: {
      coverThrough: "",
    },
  };
}

export function emptyDoses(): Doses {
  return {
    morning: 0,
    noon: 0,
    evening: 0,
  };
}

export function makeId(): string {
  return crypto.randomUUID();
}
