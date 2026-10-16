export type ScheduleFrequency = "hourly" | "daily" | "weekly" | "monthly";

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

/** 24h wall-clock time, in the server's timezone. */
export type ScheduleTime = { hour: number; minute: number };

/**
 * Structured run schedule, edited by the picker. It never reaches the
 * server: `scheduleToCron` / `cronToSchedule` (lib/cron.ts) translate it.
 */
export type ProgramSchedule =
  | { frequency: "hourly"; every_hours: number; minute: number }
  | { frequency: "daily"; every_days: number; time: ScheduleTime }
  | { frequency: "weekly"; days_of_week: Weekday[]; time: ScheduleTime }
  | { frequency: "monthly"; days_of_month: number[]; time: ScheduleTime };

/**
 * Editing state of the schedule picker. It keeps the fields of every
 * frequency, so switching tab and back does not lose what the user picked.
 */
export type ScheduleDraft = {
  frequency: ScheduleFrequency;
  every_hours: number;
  minute: number;
  every_days: number;
  days_of_week: Weekday[];
  days_of_month: number[];
  time: ScheduleTime;
};

export const defaultScheduleDraft: ScheduleDraft = {
  frequency: "daily",
  every_hours: 6,
  minute: 0,
  every_days: 2,
  days_of_week: ["mon", "wed", "fri"],
  days_of_month: [1],
  time: { hour: 9, minute: 0 },
};

export const frequencyLabel: Record<ScheduleFrequency, string> = {
  hourly: "Hourly",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

export const weekdays: { value: Weekday; short: string; long: string }[] = [
  { value: "mon", short: "Mon", long: "Monday" },
  { value: "tue", short: "Tue", long: "Tuesday" },
  { value: "wed", short: "Wed", long: "Wednesday" },
  { value: "thu", short: "Thu", long: "Thursday" },
  { value: "fri", short: "Fri", long: "Friday" },
  { value: "sat", short: "Sat", long: "Saturday" },
  { value: "sun", short: "Sun", long: "Sunday" },
];

/** Divisors of 24, so runs are evenly spaced across the day. */
export const hourIntervals = [1, 2, 3, 4, 6, 8, 12];
export const dayIntervals = [1, 2, 3, 4, 5, 6, 7, 10, 14];

/** Returns an error message when the draft cannot be submitted yet. */
export function validateSchedule(draft: ScheduleDraft): string | null {
  if (draft.frequency === "weekly" && draft.days_of_week.length === 0) {
    return "Pick at least one day of the week.";
  }
  if (draft.frequency === "monthly" && draft.days_of_month.length === 0) {
    return "Pick at least one day of the month.";
  }
  return null;
}

/** Keeps only the fields of the selected frequency, in a stable order. */
export function toSchedule(draft: ScheduleDraft): ProgramSchedule {
  switch (draft.frequency) {
    case "hourly":
      return { frequency: "hourly", every_hours: draft.every_hours, minute: draft.minute };
    case "daily":
      return { frequency: "daily", every_days: draft.every_days, time: draft.time };
    case "weekly":
      return {
        frequency: "weekly",
        days_of_week: weekdays.map((d) => d.value).filter((d) => draft.days_of_week.includes(d)),
        time: draft.time,
      };
    case "monthly":
      return {
        frequency: "monthly",
        days_of_month: [...draft.days_of_month].sort((a, b) => a - b),
        time: draft.time,
      };
  }
}

/** Opens the picker on an existing schedule (e.g. one parsed from a cron). */
export function toDraft(schedule: ProgramSchedule): ScheduleDraft {
  return { ...defaultScheduleDraft, ...schedule };
}

export const pad2 = (n: number) => String(n).padStart(2, "0");

export const formatTime = ({ hour, minute }: ScheduleTime) => `${pad2(hour)}:${pad2(minute)}`;

function ordinal(n: number) {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th");
  return `${n}${suffix}`;
}

function list(items: string[]) {
  return items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

/** Human-readable sentence, e.g. "Every Monday and Friday at 09:00". */
export function describeSchedule(schedule: ProgramSchedule) {
  switch (schedule.frequency) {
    case "hourly":
      return schedule.every_hours === 1
        ? `Every hour at minute ${pad2(schedule.minute)}`
        : `Every ${schedule.every_hours} hours at minute ${pad2(schedule.minute)}`;
    case "daily":
      return `${schedule.every_days === 1 ? "Every day" : `Every ${schedule.every_days} days`} at ${formatTime(schedule.time)}`;
    case "weekly": {
      const names = weekdays.filter((d) => schedule.days_of_week.includes(d.value)).map((d) => d.long);
      return `Every ${list(names)} at ${formatTime(schedule.time)}`;
    }
    case "monthly":
      return `On the ${list(schedule.days_of_month.map(ordinal))} of every month at ${formatTime(schedule.time)}`;
  }
}
