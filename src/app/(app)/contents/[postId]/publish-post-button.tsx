"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, SendIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { Post } from "@/lib/api/types";

const POLL_INTERVAL_MS = 3000;
/**
 * How long the "Publishing…" toast stays up. Sonner never auto-dismisses a
 * loading toast (it ignores `duration` for them), so it is closed by hand:
 * without this it stayed forever whenever the outcome never reached it, e.g.
 * after leaving the page, which stops the polling.
 */
const LOADING_TOAST_MS = 60_000;

/** One pending dismissal per toast, kept outside React so it survives leaving the page. */
const loadingToastTimers = new Map<string, ReturnType<typeof setTimeout>>();

function clearLoadingToastTimer(toastId: string) {
  clearTimeout(loadingToastTimers.get(toastId));
  loadingToastTimers.delete(toastId);
}

function scheduleLoadingToastDismiss(toastId: string) {
  clearLoadingToastTimer(toastId);
  loadingToastTimers.set(
    toastId,
    setTimeout(() => {
      loadingToastTimers.delete(toastId);
      toast.dismiss(toastId);
    }, LOADING_TOAST_MS),
  );
}

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * The backend answers the publish request right away (202, status "publishing")
 * and publishes in the background: the button then polls the post until it is
 * "published" or "failed". Reloading the page mid-publish resumes the polling.
 */
export function PublishPostButton({ post }: { post: Pick<Post, "id" | "status"> }) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [publishing, setPublishing] = useState(post.status === "publishing");
  const [elapsed, setElapsed] = useState(0);
  const toastId = `publish-post-${post.id}`;

  useEffect(() => {
    if (!publishing) return;
    let cancelled = false;

    // The success/error toast replaces it (same id); if no outcome arrives it closes by itself.
    toast.loading("Publishing to Instagram…", {
      id: toastId,
      description:
        "This can take a minute or two while Instagram processes the media. You can leave this page: publishing continues anyway.",
    });
    scheduleLoadingToastDismiss(toastId);
    // Elapsed-time counter, so a long publish doesn't look frozen.
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);

    async function poll() {
      while (!cancelled) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        if (cancelled) return;

        let current: Post;
        try {
          current = await api.getPost(post.id);
        } catch (e) {
          // Network hiccups and 5xx are retried; anything else won't fix itself.
          if (e instanceof ApiError && e.status < 500) {
            clearLoadingToastTimer(toastId);
            toast.error(e.message, { id: toastId, description: undefined, duration: undefined });
            setPublishing(false);
            return;
          }
          continue;
        }
        if (cancelled || current.status === "publishing") continue;

        // The outcome toast below has its own lifetime: don't cut it short.
        clearLoadingToastTimer(toastId);
        if (current.status === "published")
          toast.success("Post successfully published", { id: toastId, description: undefined, duration: undefined });
        else
          toast.error("Publishing failed", {
            id: toastId,
            description: "Check the program logs for details.",
            duration: undefined,
          });
        setPublishing(false);
        // Re-render the Server Component so the page shows the new status.
        router.refresh();
        return;
      }
    }
    void poll();

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [publishing, post.id, router, toastId]);

  async function publish() {
    setStarting(true);
    try {
      await api.publishPost(post.id);
      setElapsed(0);
      setPublishing(true);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to publish post", { id: toastId });
    } finally {
      setStarting(false);
    }
  }

  const pending = starting || publishing;

  return (
    <Button className={"cursor-pointer"} onClick={publish} disabled={pending}>
      {pending ? <Loader2Icon className="animate-spin" /> : <SendIcon />}
      {pending ? `Publishing… ${formatElapsed(elapsed)}` : "Publish now"}
    </Button>
  );
}
