"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { Program } from "@/lib/api/types";

export function DeleteProgramButton({ program }: { program: Program }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function remove() {
    setPending(true);
    try {
      await api.deleteProgram(program.id);
      toast.success(`“${program.name}” deleted`);
      router.push("/programs");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not delete the program");
      setPending(false);
    }
  }

  // Nothing is sent to the backend until the user confirms in the toast.
  function askConfirmation() {
    toast(`Delete “${program.name}”?`, {
      id: `delete-program-${program.id}`,
      description: "Its logs are deleted too. Programs that already produced posts can't be deleted.",
      duration: 10_000,
      action: { label: "Delete", onClick: remove },
      cancel: { label: "Cancel", onClick: () => {} },
    });
  }

  return (
    <Button variant="outline" disabled={pending} onClick={askConfirmation}>
      {pending ? <Loader2Icon className="animate-spin" /> : <Trash2Icon />}
      Delete
    </Button>
  );
}
