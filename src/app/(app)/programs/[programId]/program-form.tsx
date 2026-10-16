"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type {
  IdeaCollection,
  InstagramAccount,
  Program,
  ProgramMode,
  UpdateProgramInput,
} from "@/lib/api/types";
import { cronToSchedule, scheduleToCron } from "@/lib/cron";
import { defaultScheduleDraft, toDraft, toSchedule, validateSchedule } from "@/lib/schedule";
import { SchedulePicker } from "../schedule-picker";

const NO_COLLECTION = "none";

type FormState = {
  name: string;
  collection: string;
  account: string;
  mode: ProgramMode;
};

function initialState(program: Program): FormState {
  return {
    name: program.name,
    collection: program.idea_collection_id === null ? NO_COLLECTION : String(program.idea_collection_id),
    account: String(program.instagram_account_id),
    mode: program.mode,
  };
}

export function ProgramForm({
  program,
  collections,
  instagramAccounts,
}: {
  program: Program;
  collections: IdeaCollection[];
  instagramAccounts: InstagramAccount[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(() => initialState(program));
  // Crons edited outside the app may not fit the picker: then the picker starts
  // from the default and the cron is only replaced once the user touches it.
  const parsed = cronToSchedule(program.cron_expression);
  const savedCron = parsed ? scheduleToCron(parsed) : null;
  const [schedule, setSchedule] = useState(() => (parsed ? toDraft(parsed) : defaultScheduleDraft));
  const [scheduleEdited, setScheduleEdited] = useState(false);

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));
  const saved = initialState(program);
  const cron = scheduleToCron(toSchedule(schedule));
  const scheduleError = validateSchedule(schedule);

  const changes: UpdateProgramInput = {};
  const name = form.name.trim();
  if (name !== saved.name) changes.name = name;
  if (form.collection !== saved.collection) {
    changes.idea_collection_id = form.collection === NO_COLLECTION ? null : Number(form.collection);
  }
  if (form.account !== saved.account) changes.instagram_account_id = Number(form.account);
  if (form.mode !== saved.mode) changes.mode = form.mode;
  if (savedCron === null ? scheduleEdited : cron !== savedCron) changes.cron_expression = cron;
  const dirty = Object.keys(changes).length > 0;

  function reset() {
    setForm(saved);
    setSchedule(parsed ? toDraft(parsed) : defaultScheduleDraft);
    setScheduleEdited(false);
  }

  function onSubmit() {
    if (!name || !dirty) return;
    if (scheduleError) {
      toast.error(scheduleError);
      return;
    }

    startTransition(async () => {
      try {
        await api.updateProgram(program.id, changes);
        toast.success("Program updated");
        setScheduleEdited(false);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof ApiError ? e.message : "Could not update the program");
      }
    });
  }

  // Keep the saved account selectable even if it is no longer in the list.
  const accounts = instagramAccounts.some((a) => a.id === program.instagram_account_id)
    ? instagramAccounts
    : [{ id: program.instagram_account_id, handle: null, updated_at: null }, ...instagramAccounts];

  return (
    <form action={onSubmit} className="grid max-w-2xl gap-6">
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          maxLength={100}
          value={form.name}
          onChange={(e) => set({ name: e.target.value })}
          required
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="collection_id">Collection</Label>
          <Select value={form.collection} onValueChange={(collection) => set({ collection })}>
            <SelectTrigger id="collection_id" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_COLLECTION}>None (inactive)</SelectItem>
              {collections.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="instagram_account_id">Account</Label>
          <Select value={form.account} onValueChange={(account) => set({ account })}>
            <SelectTrigger id="instagram_account_id" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={String(a.id)}>
                  {a.handle ? `@${a.handle}` : `#${a.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <SchedulePicker
          value={schedule}
          onChange={(value) => {
            setSchedule(value);
            setScheduleEdited(true);
          }}
          timezone={program.timezone}
        />
        {savedCron === null && !scheduleEdited ? (
          <p className="text-xs text-muted-foreground">
            The current schedule{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{program.cron_expression}</code>{" "}
            can&apos;t be shown in the picker: it is kept until you change it here.
          </p>
        ) : null}
      </div>

      <div className="flex items-start justify-between gap-4 border-t pt-5">
        <div>
          <Label htmlFor="publish">Publish to Instagram</Label>
          <p className="mt-1 text-sm text-muted-foreground">
            {form.mode === "publish"
              ? "Content is generated and posted automatically."
              : "Preview mode: content is generated and saved, nothing is posted."}
          </p>
        </div>
        <Switch
          id="publish"
          checked={form.mode === "publish"}
          onCheckedChange={(on) => set({ mode: on ? "publish" : "preview" })}
        />
      </div>

      <div className="flex justify-end gap-2 border-t pt-5">
        <Button type="button" variant="ghost" disabled={!dirty || pending} onClick={reset}>
          Discard
        </Button>
        <Button type="submit" disabled={!dirty || !name || pending || scheduleError !== null}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
