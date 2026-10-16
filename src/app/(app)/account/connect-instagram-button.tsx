"use client";

import { useEffect, useState, type ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { ExternalLinkIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";

type Props = Omit<ComponentProps<typeof Button>, "onClick" | "asChild">;

export function ConnectInstagramButton({ children, disabled, ...props }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [awaitingReturn, setAwaitingReturn] = useState(false);

  // Once the login tab is open, re-fetch the connection status every time
  // the user comes back to this tab.
  useEffect(() => {
    if (!awaitingReturn) return;
    function refreshIfVisible() {
      if (document.visibilityState === "visible") router.refresh();
    }
    document.addEventListener("visibilitychange", refreshIfVisible);
    window.addEventListener("focus", refreshIfVisible);
    return () => {
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.removeEventListener("focus", refreshIfVisible);
    };
  }, [awaitingReturn, router]);

  async function handleClick() {
    // Open the tab synchronously, inside the click: browsers block
    // `window.open` once we're past an `await`.
    const tab = window.open("");
    setPending(true);
    try {
      const { authorization_url } = await api.instagramLogin();
      if (tab) {
        tab.opener = null;
        tab.location.href = authorization_url;
        setAwaitingReturn(true);
      } else {
        window.location.href = authorization_url;
      }
    } catch (e) {
      tab?.close();
      toast.error(e instanceof ApiError ? e.message : "Could not start the Instagram login");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button {...props} disabled={disabled || pending} onClick={handleClick}>
      {children}
      {pending ? <Loader2Icon className="animate-spin" /> : <ExternalLinkIcon />}
    </Button>
  );
}
