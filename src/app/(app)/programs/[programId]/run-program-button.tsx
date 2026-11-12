"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, PlayIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { Program } from "@/lib/api/types";

/** Seconds the button stays disabled after a run, so it can't be spammed. */
const COOLDOWN_SECONDS = 30;

/** Runs the program's pipeline right away, outside its schedule. */
export function RunProgramButton({ program }: { program: Program }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function run() {
    setPending(true);
    try {
      const post = await api.runProgram(program.id);
      const viewPost = { label: "View post", onClick: () => router.push(`/contents/${post.id}`) };
      if (post.status === "failed") {
        toast.error(`“${program.name}” ran, but the post failed`, {
          description: "Check the program logs for details.",
          action: viewPost,
        });
      } else {
        toast.success(`“${program.name}” ran`, {
          description:
            post.status === "publishing"
              ? "The post is being published: it can take a few minutes."
              : "A new post was generated.",
          action: viewPost,
        });
      }
      router.refresh();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not run the program");
    } finally {
      setPending(false);
      setCooldown(COOLDOWN_SECONDS);
    }
  }

  const disabled = pending || cooldown > 0;

  return (
    <Button variant="outline" disabled={disabled} onClick={run}>
      {pending ? <Loader2Icon className="animate-spin" /> : <PlayIcon />}
      {pending ? "Running…" : cooldown > 0 ? `Run now (${cooldown}s)` : "Run now"}
    </Button>
  );
}
