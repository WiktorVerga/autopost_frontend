import type { ReactNode } from "react";
import { CalendarClockIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { scheduleToCron } from "@/lib/cron";
import {
  dayIntervals,
  describeSchedule,
  frequencyLabel,
  hourIntervals,
  pad2,
  toSchedule,
  validateSchedule,
  weekdays,
  type ScheduleDraft,
  type ScheduleFrequency,
  type ScheduleTime,
  type Weekday,
} from "@/lib/schedule";

const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = Array.from({ length: 12 }, (_, i) => i * 5);
const monthDays = Array.from({ length: 31 }, (_, i) => i + 1);

const selectedItem =
  "data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground";

const weekdayPresets: { label: string; days: Weekday[] }[] = [
  { label: "Weekdays", days: ["mon", "tue", "wed", "thu", "fri"] },
  { label: "Weekends", days: ["sat", "sun"] },
  { label: "Every day", days: weekdays.map((d) => d.value) },
];

export function SchedulePicker({
  value,
  onChange,
  timezone,
}: {
  value: ScheduleDraft;
  onChange: (value: ScheduleDraft) => void;
  /** Timezone the cron times are expressed in, shown next to the expression. */
  timezone: string;
}) {
  const set = (patch: Partial<ScheduleDraft>) => onChange({ ...value, ...patch });
  const error = validateSchedule(value);
  const schedule = toSchedule(value);

  return (
    <div className="grid gap-3">
      <Label>Schedule</Label>

      <Tabs value={value.frequency} onValueChange={(f) => set({ frequency: f as ScheduleFrequency })}>
        <TabsList className="w-full">
          {(Object.keys(frequencyLabel) as ScheduleFrequency[]).map((f) => (
            <TabsTrigger key={f} value={f}>
              {frequencyLabel[f]}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="rounded-lg border p-4">
          <TabsContent value="hourly" className="grid gap-4 sm:grid-cols-2">
            <Field label="Run every" htmlFor="every_hours">
              <NumberSelect
                id="every_hours"
                value={value.every_hours}
                options={hourIntervals}
                format={(n) => (n === 1 ? "1 hour" : `${n} hours`)}
                onChange={(every_hours) => set({ every_hours })}
              />
            </Field>
            <Field label="At minute" htmlFor="hourly_minute">
              <NumberSelect
                id="hourly_minute"
                value={value.minute}
                options={minutes}
                format={(n) => `:${pad2(n)}`}
                onChange={(minute) => set({ minute })}
              />
            </Field>
          </TabsContent>

          <TabsContent value="daily" className="grid gap-4 sm:grid-cols-2">
            <Field label="Run every" htmlFor="every_days">
              <NumberSelect
                id="every_days"
                value={value.every_days}
                options={dayIntervals}
                format={(n) => (n === 1 ? "1 day" : `${n} days`)}
                onChange={(every_days) => set({ every_days })}
              />
            </Field>
            <TimeField value={value.time} onChange={(time) => set({ time })} />
          </TabsContent>

          <TabsContent value="weekly" className="grid gap-4">
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-muted-foreground">On these days</span>
                <div className="flex gap-1">
                  {weekdayPresets.map((preset) => (
                    <Button
                      key={preset.label}
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => set({ days_of_week: preset.days })}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
              </div>
              <ToggleGroup
                type="multiple"
                variant="outline"
                spacing={1}
                className="grid w-full grid-cols-7"
                value={value.days_of_week}
                onValueChange={(days) => set({ days_of_week: days as Weekday[] })}
              >
                {weekdays.map((d) => (
                  <ToggleGroupItem
                    key={d.value}
                    value={d.value}
                    aria-label={d.long}
                    className={`px-0 ${selectedItem}`}
                  >
                    {d.short}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
            <div className="sm:w-1/2">
              <TimeField value={value.time} onChange={(time) => set({ time })} />
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="grid gap-4">
            <div className="grid gap-2">
              <span className="text-sm text-muted-foreground">On these days of the month</span>
              <ToggleGroup
                type="multiple"
                variant="outline"
                size="sm"
                spacing={1}
                className="grid w-full grid-cols-7"
                value={value.days_of_month.map(String)}
                onValueChange={(days) => set({ days_of_month: days.map(Number) })}
              >
                {monthDays.map((day) => (
                  <ToggleGroupItem
                    key={day}
                    value={String(day)}
                    aria-label={`Day ${day}`}
                    className={`px-0 font-mono text-xs ${selectedItem}`}
                  >
                    {day}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              {value.days_of_month.some((d) => d > 28) && (
                <p className="text-xs text-muted-foreground">
                  Months without the selected day are skipped.
                </p>
              )}
            </div>
            <div className="sm:w-1/2">
              <TimeField value={value.time} onChange={(time) => set({ time })} />
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <p className="flex items-start gap-2 text-sm" aria-live="polite">
        <CalendarClockIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        {error ? (
          <span className="text-destructive">{error}</span>
        ) : (
          <span>
            {describeSchedule(schedule)}
            <span className="ml-2 text-muted-foreground">{timezone}</span>
            <code className="ml-2 rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
              {scheduleToCron(schedule)}
            </code>
          </span>
        )}
      </p>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor} className="font-normal text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function NumberSelect({
  id,
  value,
  options,
  format,
  onChange,
  className = "w-full",
}: {
  id?: string;
  value: number;
  options: number[];
  format: (n: number) => string;
  onChange: (n: number) => void;
  className?: string;
}) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
      <SelectTrigger id={id} className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-64">
        {(options.includes(value) ? options : [...options, value].sort((a, b) => a - b)).map((n) => (
          <SelectItem key={n} value={String(n)}>
            {format(n)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function TimeField({
  value,
  onChange,
}: {
  value: ScheduleTime;
  onChange: (time: ScheduleTime) => void;
}) {
  return (
    <Field label="At" htmlFor="schedule_hour">
      <div className="flex items-center gap-2">
        <NumberSelect
          id="schedule_hour"
          value={value.hour}
          options={hours}
          format={pad2}
          className="flex-1 font-mono"
          onChange={(hour) => onChange({ ...value, hour })}
        />
        <span className="text-muted-foreground">:</span>
        <NumberSelect
          value={value.minute}
          options={minutes}
          format={pad2}
          className="flex-1 font-mono"
          onChange={(minute) => onChange({ ...value, minute })}
        />
      </div>
    </Field>
  );
}
