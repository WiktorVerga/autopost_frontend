"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {ContentType, Id, IdeaCollection, InstagramAccount, ProgramMode} from "@/lib/api/types";
import { contentTypeLabel } from "@/lib/format";
import { scheduleToCron } from "@/lib/cron";
import { defaultScheduleDraft, toSchedule, validateSchedule } from "@/lib/schedule";
import { SchedulePicker } from "./schedule-picker";

const NO_COLLECTION = "none";

// Format choice is temporarily disabled: every program produces carousels.
// Set to true to bring the selector back.
const CONTENT_TYPE_SELECTABLE = false;
const DEFAULT_CONTENT_TYPE: ContentType = "carousel";

export function NewProgramDialog({
  collections,
  instagramAccounts,
}: {
  collections: IdeaCollection[];
  instagramAccounts: InstagramAccount[];
}) {
  const accounts = instagramAccounts;
  const defaultAccount = accounts.length === 1 ? String(accounts[0].id) : "";
  // IANA timezone of the browser (e.g. "Europe/Rome"): the cron times are expressed in it.
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [publish, setPublish] = useState(false);
  const [schedule, setSchedule] = useState(defaultScheduleDraft);
  const [accountId, setAccountId] = useState(defaultAccount);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim();
    const collection = String(formData.get("collection_id") ?? NO_COLLECTION);
    const contentType = CONTENT_TYPE_SELECTABLE
      ? (String(formData.get("content_type") ?? DEFAULT_CONTENT_TYPE) as ContentType)
      : DEFAULT_CONTENT_TYPE;
    if (!name) return;
    const scheduleError = validateSchedule(schedule);
    if (scheduleError) {
      toast.error(scheduleError);
      return;
    }
    if (publish && !accountId) {
      toast.error("Choose the Instagram account to publish to.");
      return;
    }

    startTransition(async () => {
      try {
        await api.createProgram({
          name,
          idea_collection_id: collection === NO_COLLECTION ? null : Number(collection),
          instagram_account_id: accountId ? Number(accountId) : null,
          cron_expression: scheduleToCron(toSchedule(schedule)),
          mode: publish ? "publish" : "preview",
          timezone,
          is_active: publish,
        });
        toast.success("Program created");
        setOpen(false);
        setSchedule(defaultScheduleDraft);
        setAccountId(defaultAccount);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof ApiError ? e.message : "Could not create the program");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon />
          New program
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl font-normal">New program</DialogTitle>
          <DialogDescription>
            A program runs on a schedule, takes the next idea from a collection and turns it into content.
          </DialogDescription>
        </DialogHeader>

        <form action={onSubmit} className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="e.g. Weekday carousels" required />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="collection_id">Collection</Label>
              <Select name="collection_id" defaultValue={NO_COLLECTION}>
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
              <Label htmlFor="content_type">Format</Label>
              <Select
                name="content_type"
                defaultValue={DEFAULT_CONTENT_TYPE}
                disabled={!CONTENT_TYPE_SELECTABLE}
              >
                <SelectTrigger id="content_type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(contentTypeLabel) as ContentType[]).map((type) => (
                    <SelectItem key={type} value={type}>
                      {contentTypeLabel[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <SchedulePicker value={schedule} onChange={setSchedule} timezone={timezone} />

          <div className="grid gap-4 border-t pt-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Label htmlFor="publish">Publish to Instagram</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  {publish
                    ? "Content is generated and posted automatically."
                    : "Preview mode: content is generated and saved, nothing is posted."}
                </p>
              </div>
              <Switch
                id="publish"
                checked={publish}
                onCheckedChange={setPublish}
                disabled={accounts.length === 0}
              />
            </div>

            {accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No Instagram account connected.{" "}
                <Link href="/account" className="text-foreground underline underline-offset-4">
                  Connect one
                </Link>{" "}
                to publish.
              </p>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="instagram_account_id">Account</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger
                    id="instagram_account_id"
                    className="w-full"
                    aria-invalid={publish && !accountId}
                  >
                    <SelectValue placeholder="Choose an account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        @{a.handle}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!publish && (
                  <p className="text-xs text-muted-foreground">
                    Saved with the program, used once you turn publishing on.
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || validateSchedule(schedule) !== null || (publish && !accountId)}>
              {pending ? "Creating…" : "Create program"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
