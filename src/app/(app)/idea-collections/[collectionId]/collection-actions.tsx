"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { EllipsisIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { IdeaCollection } from "@/lib/api/types";

export function CollectionActions({
  collection,
  ideaCount,
}: {
  collection: IdeaCollection;
  ideaCount?: number;
}) {
  const router = useRouter();
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onRename(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim();
    if (!name) return;
    if (name === collection.name) {
      setRenameOpen(false);
      return;
    }

    startTransition(async () => {
      try {
        await api.updateCollection(collection.id, { name });
        toast.success("Collection renamed");
        setRenameOpen(false);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof ApiError ? e.message : "Could not rename the collection");
      }
    });
  }

  function onDelete() {
    startTransition(async () => {
      try {
        await api.deleteCollection(collection.id);
        toast.success("Collection deleted");
        setDeleteOpen(false);
        router.push("/idea-collections");
      } catch (e) {
        toast.error(e instanceof ApiError ? e.message : "Could not delete the collection");
      }
    });
  }

  const ideasLabel =
    ideaCount === undefined ? "all its ideas" : `its ${ideaCount} ${ideaCount === 1 ? "idea" : "ideas"}`;

  return (
    <>
      {/* Non-modal so the dialogs opened from the menu get focus and pointer events back. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Collection actions">
            <EllipsisIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setRenameOpen(true)}>
            <PencilIcon />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-3xl font-normal">Rename collection</DialogTitle>
            <DialogDescription>Programs using this collection keep working with the new name.</DialogDescription>
          </DialogHeader>

          <form action={onRename} className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="collection-name">Name</Label>
              <Input
                id="collection-name"
                name="name"
                maxLength={100}
                defaultValue={collection.name}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setRenameOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save name"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-3xl font-normal">Delete collection?</DialogTitle>
            <DialogDescription>
              “{collection.name}” and {ideasLabel} will be deleted. A collection used by an active
              program can&apos;t be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={pending} onClick={onDelete}>
              {pending ? "Deleting…" : "Delete collection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
