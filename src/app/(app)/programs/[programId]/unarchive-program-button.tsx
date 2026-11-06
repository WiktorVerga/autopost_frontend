"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArchiveRestoreIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { Program } from "@/lib/api/types";

/** Takes the program out of the archive. It comes back inactive: activating it is a separate step. */
export function UnarchiveProgramButton({ program }: { program: Program }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function unarchive() {
    setPending(true);
    try {
      await api.updateProgram(program.id, { status: "inactive" });
      toast.success(`“${program.name}” unarchived`, {
        description: "It is inactive: turn it on when you want it to run on its schedule.",
      });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not unarchive the program");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="outline" disabled={pending} onClick={unarchive}>
      {pending ? <Loader2Icon className="animate-spin" /> : <ArchiveRestoreIcon />}
      Unarchive
    </Button>
  );
}
