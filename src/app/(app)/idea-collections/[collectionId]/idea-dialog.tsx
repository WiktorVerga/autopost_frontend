"use client"

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { Idea } from "@/lib/api/types";
import { CategoryCombobox } from "./category-combobox";

type IdeaDialogProps = {
  collectionId: number;
  /** When set the dialog edits this idea, otherwise it creates a new one. */
  idea?: Idea;
  /** Trigger element; omit it and control the dialog with `open`/`onOpenChange`. */
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const TITLE_MAX_LENGTH = 70;
const DESCRIPTION_MAX_LENGTH = 450;

type FieldErrors = { title?: string; description?: string };

function validate(form: HTMLFormElement): FieldErrors {
  const formData = new FormData(form);
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const errors: FieldErrors = {};
  if (title.length > TITLE_MAX_LENGTH) {
    errors.title = `The title can be at most ${TITLE_MAX_LENGTH} characters (currently ${title.length}).`;
  }
  if (description.length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `The description can be at most ${DESCRIPTION_MAX_LENGTH} characters (currently ${description.length}).`;
  }
  return errors;
}

type FieldLengths = { title: number; description: number };

/** Lengths are counted on the trimmed value, the same way the limits are checked. */
function initialLengths(idea?: Idea): FieldLengths {
  return {
    title: idea?.title.trim().length ?? 0,
    description: idea?.description.trim().length ?? 0,
  };
}

function CharCounter({ id, length, max }: { id: string; length: number; max: number }) {
  return (
    <span
      id={id}
      className={`text-xs tabular-nums ${length > max ? "text-destructive" : "text-muted-foreground"}`}
    >
      {length}/{max}
    </span>
  );
}

export function IdeaDialog({ collectionId, idea, children, open, onOpenChange }: IdeaDialogProps) {
  const router = useRouter();
  const [ownOpen, setOwnOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [lengths, setLengths] = useState<FieldLengths>(() => initialLengths(idea));
  const isOpen = open ?? ownOpen;
  const setOpen = onOpenChange ?? setOwnOpen;
  const editing = idea !== undefined;

  // Each time the dialog opens the fields start again from their default values,
  // so the counters and errors start again too (also when `open` is controlled).
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setErrors({});
      setLengths(initialLengths(idea));
    }
  }

  function onFieldChange(field: keyof FieldLengths, value: string) {
    setLengths((prev) => ({ ...prev, [field]: value.trim().length }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  // Runs before the form action: preventing the default skips the action,
  // so the typed text is not reset when a limit is exceeded.
  function onBeforeSubmit(event: FormEvent<HTMLFormElement>) {
    const nextErrors = validate(event.currentTarget);
    setErrors(nextErrors);
    if (nextErrors.title || nextErrors.description) event.preventDefault();
  }

  function onSubmit(formData: FormData) {
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const category = String(formData.get("category") ?? "").trim() || null;
    if (!title || !description) return;
    if (title.length > TITLE_MAX_LENGTH || description.length > DESCRIPTION_MAX_LENGTH) return;

    startTransition(async () => {
      try {
        if (editing) {
          await api.updateIdea(idea.id, { title, description, category });
          toast.success("Idea updated");
        } else {
          await api.createIdea({ idea_collection_id: collectionId, title, description, category });
          toast.success("Idea added to the queue");
        }
        setOpen(false);
        router.refresh();
      } catch (e) {
        // React resets the form fields to their default values once the action ends.
        setLengths(initialLengths(idea));
        toast.error(e instanceof ApiError ? e.message : "Could not save the idea");
      }
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl font-normal">
            {editing ? "Edit idea" : "New idea"}
          </DialogTitle>
          <DialogDescription>
            A short brief is enough: Autopost will turn it into the post, caption and hashtags.
          </DialogDescription>
        </DialogHeader>

        <form action={onSubmit} onSubmit={onBeforeSubmit} className="grid gap-5">
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="title">Idea</Label>
              <CharCounter id="title-count" length={lengths.title} max={TITLE_MAX_LENGTH} />
            </div>
            <Input
              id="title"
              name="title"
              defaultValue={idea?.title}
              placeholder="e.g. Why espresso crema fades in 2 minutes"
              aria-invalid={errors.title ? true : undefined}
              aria-describedby={errors.title ? "title-count title-error" : "title-count"}
              onChange={(e) => onFieldChange("title", e.target.value)}
              required
            />
            {errors.title ? (
              <p id="title-error" className="text-sm text-destructive">
                {errors.title}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="description">Description</Label>
              <CharCounter
                id="description-count"
                length={lengths.description}
                max={DESCRIPTION_MAX_LENGTH}
              />
            </div>
            <Textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={idea?.description}
              placeholder="Angle, sources, things to mention…"
              aria-invalid={errors.description ? true : undefined}
              aria-describedby={
                errors.description ? "description-count description-error" : "description-count"
              }
              onChange={(e) => onFieldChange("description", e.target.value)}
              required
            />
            {errors.description ? (
              <p id="description-error" className="text-sm text-destructive">
                {errors.description}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">
              Category <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <CategoryCombobox
              id="category"
              name="category"
              maxLength={100}
              defaultValue={idea?.category ?? undefined}
              placeholder="e.g. Brewing"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : editing ? "Save changes" : "Add idea"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
