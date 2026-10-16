/**
 * Translation between the structured `ProgramSchedule` used by the UI and the
 * standard 5-field cron expression exchanged with the server:
 *
 *   minute  hour  day-of-month  month  day-of-week
 *
 * - hourly:  `{minute} *\/{every_hours} * * *`
 * - daily:   `{minute} {hour} *\/{every_days} * *`
 * - weekly:  `{minute} {hour} * * {days_of_week}`   (0 = Sunday … 6 = Saturday)
 * - monthly: `{minute} {hour} {days_of_month} * *`
 *
 * `scheduleToCron` always emits that canonical form. `cronToSchedule` also
 * accepts the common variants (ranges, names, `7` for Sunday, `0/n`, `?`,
 * a leading `0` seconds field, `@daily`-style macros) and returns `null` for
 * anything the picker cannot represent, e.g. a specific month.
 */
import { weekdays, type ProgramSchedule, type Weekday } from "./schedule";

const weekdayNumber: Record<Weekday, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

const weekdayByNumber = Object.fromEntries(
  Object.entries(weekdayNumber).map(([day, n]) => [n, day]),
) as Record<number, Weekday>;

const macros: Record<string, string> = {
  "@hourly": "0 * * * *",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@weekly": "0 0 * * 0",
  "@monthly": "0 0 1 * *",
};

// ---- Schedule → cron ----

const every = (n: number) => (n === 1 ? "*" : `*/${n}`);

/** Collapses sorted numbers into a cron list, using ranges for runs of 3+: [1,2,3,5] → "1-3,5". */
function toList(values: number[]) {
  const sorted = [...new Set(values)].sort((a, b) => a - b);
  const parts: string[] = [];
  for (let i = 0; i < sorted.length; ) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    if (j - i >= 2) parts.push(`${sorted[i]}-${sorted[j]}`);
    else for (let k = i; k <= j; k++) parts.push(String(sorted[k]));
    i = j + 1;
  }
  return parts.join(",");
}

export function scheduleToCron(schedule: ProgramSchedule): string {
  switch (schedule.frequency) {
    case "hourly":
      return `${schedule.minute} ${every(schedule.every_hours)} * * *`;
    case "daily":
      return `${schedule.time.minute} ${schedule.time.hour} ${every(schedule.every_days)} * *`;
    case "weekly":
      return `${schedule.time.minute} ${schedule.time.hour} * * ${toList(
        schedule.days_of_week.map((d) => weekdayNumber[d]),
      )}`;
    case "monthly":
      return `${schedule.time.minute} ${schedule.time.hour} ${toList(schedule.days_of_month)} * *`;
  }
}

// ---- Cron → schedule ----

const isWildcard = (field: string) => field === "*" || field === "?";

/** A plain integer in [min, max], or null. */
function parseNumber(field: string, min: number, max: number) {
  if (!/^\d+$/.test(field)) return null;
  const n = Number(field);
  return n >= min && n <= max ? n : null;
}

/** `*` → 1, `*\/n` or `0/n` (or `1/n` for days) → n, otherwise null. */
function parseStep(field: string, start: number, max: number) {
  if (isWildcard(field)) return 1;
  const match = /^(\*|\d+)\/(\d+)$/.exec(field);
  if (!match || (match[1] !== "*" && Number(match[1]) !== start)) return null;
  return parseNumber(match[2], 1, max);
}

/** Comma-separated values and ranges (`a-b`, `a-b/s`), with optional names. */
function parseList(field: string, min: number, max: number, names: Record<string, number> = {}) {
  const value = (token: string) =>
    token.toLowerCase() in names ? names[token.toLowerCase()] : parseNumber(token, min, max);

  const result = new Set<number>();
  for (const part of field.split(",")) {
    const match = /^([^-/]+)(?:-([^-/]+))?(?:\/(\d+))?$/.exec(part);
    if (!match) return null;
    const from = value(match[1]);
    const to = match[2] === undefined ? from : value(match[2]);
    const step = match[3] === undefined ? 1 : Number(match[3]);
    if (from === null || to === null || from > to || step < 1) return null;
    for (let n = from; n <= to; n += step) result.add(n);
  }
  return [...result].sort((a, b) => a - b);
}

/** Returns the schedule for `expression`, or null if the picker cannot represent it. */
export function cronToSchedule(expression: string): ProgramSchedule | null {
  const normalized = macros[expression.trim().toLowerCase()] ?? expression;
  let fields = normalized.trim().split(/\s+/);
  // 6-field crons (Quartz, Spring) start with seconds: accept them when it is 0.
  if (fields.length === 6 && fields[0] === "0") fields = fields.slice(1);
  if (fields.length !== 5) return null;

  const [minuteField, hourField, domField, monthField, dowField] = fields;
  if (!isWildcard(monthField)) return null;

  const minute = parseNumber(minuteField, 0, 59);
  if (minute === null) return null;

  // Hourly: fixed minute, hour step, every day.
  if (isWildcard(domField) && isWildcard(dowField)) {
    const everyHours = parseStep(hourField, 0, 23);
    if (everyHours !== null) return { frequency: "hourly", every_hours: everyHours, minute };
  }

  const hour = parseNumber(hourField, 0, 23);
  if (hour === null) return null;
  const time = { hour, minute };

  if (isWildcard(dowField)) {
    const everyDays = parseStep(domField, 1, 31);
    if (everyDays !== null) return { frequency: "daily", every_days: everyDays, time };

    const days = parseList(domField, 1, 31);
    return days ? { frequency: "monthly", days_of_month: days, time } : null;
  }

  if (isWildcard(domField)) {
    const names = Object.fromEntries(Object.entries(weekdayNumber));
    const days = parseList(dowField, 0, 7, names);
    if (!days) return null;
    // 7 is an alias for Sunday; keep the picker's Monday-first order.
    const set = new Set(days.map((n) => weekdayByNumber[n % 7]));
    return {
      frequency: "weekly",
      days_of_week: weekdays.map((d) => d.value).filter((d) => set.has(d)),
      time,
    };
  }

  // Both day-of-month and day-of-week restricted: cron ORs them, the picker can't.
  return null;
}
