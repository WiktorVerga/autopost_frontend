"use client";

import { useSyncExternalStore } from "react";
import { TriangleAlertIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BETA_NOTICE } from "@/lib/beta";

const STORAGE_KEY = "autopost:beta-banner-dismissed";
const listeners = new Set<() => void>();
/** Covers browsers where localStorage can't be written. */
let dismissedThisSession = false;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function isDismissed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // localStorage unavailable (private mode, blocked storage…): show the banner.
    return false;
  }
}

function dismiss() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Can't remember the choice: it stays closed until the next reload.
  }
  dismissedThisSession = true;
  listeners.forEach((l) => l());
}

/** Invite-only beta notice at the top of the app. Once closed it stays closed in this browser. */
export function BetaBanner() {
  const dismissed = useSyncExternalStore(
    subscribe,
    () => dismissedThisSession || isDismissed(),
    // Hidden on the server, so it never flashes for users who already closed it.
    () => true,
  );

  if (dismissed) return null;

  return (
    <div
      role="status"
      className="flex items-start gap-3 border-b bg-yellow-200 px-4 py-2.5 text-sm text-yellow-950 md:items-center md:px-6"
    >
      <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 md:mt-0" aria-hidden />
      <p className="flex-1">
        <strong className="font-bold">{BETA_NOTICE.title}</strong> {BETA_NOTICE.message}
      </p>
      <Button
        variant="ghost"
        size="icon"
        className="-my-1 size-7 shrink-0 text-yellow-950 hover:bg-yellow-300 hover:text-yellow-950"
        onClick={dismiss}
        aria-label="Close beta notice"
      >
        <XIcon />
      </Button>
    </div>
  );
}
