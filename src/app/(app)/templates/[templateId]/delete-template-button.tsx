"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { Template } from "@/lib/api/types";

export function DeleteTemplateButton({ template }: { template: Pick<Template, "id" | "name"> }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function remove() {
    setPending(true);
    try {
      await api.deleteTemplate(template.id);
      toast.success(`“${template.name}” deleted`);
      router.push("/templates");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not delete the template");
      setPending(false);
    }
  }

  // Nothing is sent to the backend until the user confirms in the toast.
  function askConfirmation() {
    toast(`Delete “${template.name}”?`, {
      id: `delete-template-${template.id}`,
      description: "This can't be undone. Templates used by a program can't be deleted.",
      duration: 10_000,
      action: { label: "Delete", onClick: remove },
      cancel: { label: "Cancel", onClick: () => {} },
    });
  }

  return (
    <Button variant="destructive" disabled={pending} onClick={askConfirmation}>
      {pending ? <Loader2Icon className="animate-spin" /> : <Trash2Icon />}
      Delete
    </Button>
  );
}
