"use client"

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
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

export function IdeaDialog({ collectionId, idea, children, open, onOpenChange }: IdeaDialogProps) {
  const router = useRouter();
  const [ownOpen, setOwnOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isOpen = open ?? ownOpen;
  const setOpen = onOpenChange ?? setOwnOpen;
  const editing = idea !== undefined;

  function onSubmit(formData: FormData) {
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const category = String(formData.get("category") ?? "").trim() || null;
    if (!title || !description) return;

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

        <form action={onSubmit} className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="title">Idea</Label>
            <Input
              id="title"
              name="title"
              maxLength={200}
              defaultValue={idea?.title}
              placeholder="e.g. Why espresso crema fades in 2 minutes"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={idea?.description}
              placeholder="Angle, sources, things to mention…"
              required
            />
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
