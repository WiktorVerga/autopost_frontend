"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { Id } from "@/lib/api/types";

export function DisconnectInstagramButton({ id, username }: { id: Id; username: string | null }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const label = username ? `@${username}` : "this account";

  async function disconnect() {
    setPending(true);
    try {
      await api.disconnectInstagramAccount(id);
      toast.success(`${label} disconnected`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not disconnect the account");
    } finally {
      setPending(false);
    }
  }

  // Nothing is sent to the backend until the user confirms in the toast.
  function askConfirmation() {
    toast(`Disconnect ${label}?`, {
      id: `disconnect-instagram-${id}`,
      description: "Autopost will no longer be able to publish to it.",
      duration: 10_000,
      action: { label: "Disconnect", onClick: disconnect },
      cancel: { label: "Cancel", onClick: () => {} },
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Disconnect ${label}`}
      disabled={pending}
      onClick={askConfirmation}
    >
      {pending ? <Loader2Icon className="animate-spin" /> : <Trash2Icon />}
    </Button>
  );
}
