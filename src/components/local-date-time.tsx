"use client";

import { useSyncExternalStore } from "react";

import { formatDateTime } from "@/lib/format";

const subscribe = () => () => {};

/** Same width as a formatted date, so nothing shifts when the real one appears. */
const PLACEHOLDER = "Jan 00, 0000, 00:00 AM";

/**
 * A date and time in the visitor's own timezone.
 *
 * Server Components format dates in the server's timezone (UTC in production),
 * which is the wrong hour for most people. This renders an invisible placeholder
 * on the server and the real value once it runs in the browser.
 */
export function LocalDateTime({ iso }: { iso: string | null | undefined }) {
  const inBrowser = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  if (!iso) return <>—</>;

  return (
    <time dateTime={iso} className={inBrowser ? undefined : "invisible"}>
      {inBrowser ? formatDateTime(iso) : PLACEHOLDER}
    </time>
  );
}
