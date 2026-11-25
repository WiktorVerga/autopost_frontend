"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { GoogleTagManager } from "@next/third-parties/google";
import { CookieIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { closeCookieSettings, saveConsent, useConsent } from "@/lib/consent";
import { COOKIES, LEGAL_PATHS } from "@/lib/legal";

/** Google Tag Manager container; GA4 is configured inside it. */
const GTM_ID = "GTM-NZVWL8GG";

const NECESSARY = COOKIES.filter((c) => c.category === "necessary").map((c) => c.name);
const ANALYTICS = COOKIES.filter((c) => c.category === "analytics").map((c) => c.name);

/**
 * Cookie banner + Google Tag Manager, mounted once in the root layout.
 *
 * GTM loads on every visit (it also runs tags that don't concern the visitor),
 * but under Consent Mode: the "default: denied" command is queued when
 * `@/lib/consent` is evaluated, before GTM's script, and every choice sends an
 * "update". GA4 sends data only after an update with analytics_storage granted.
 */
export function CookieConsent() {
  const { ready, consent, settingsOpen } = useConsent();
  const showBanner = ready && (consent === null || settingsOpen);

  return (
    <>
      <GoogleTagManager gtmId={GTM_ID} />
      {showBanner && <CookieBanner reopened={consent !== null} />}
    </>
  );
}

function CookieBanner({ reopened }: { reopened: boolean }) {
  const ref = useRef<HTMLElement>(null);

  // When reopened from a "Cookie settings" link, move focus to the banner.
  useEffect(() => {
    if (reopened) ref.current?.focus();
  }, [reopened]);

  // Closing without choosing keeps only the necessary cookies (Garante, 2021 guidelines).
  const close = () => (reopened ? closeCookieSettings() : saveConsent(false));

  return (
    <section
      ref={ref}
      tabIndex={-1}
      role="region"
      aria-label="Cookie preferences"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 rounded-lg border bg-background p-5 shadow-xl outline-none sm:inset-x-auto sm:left-4 sm:max-w-md md:bottom-6 md:left-6"
    >
      <div className="flex items-start justify-between gap-4">
        <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          <CookieIcon className="size-4" aria-hidden />
          Cookies
        </p>
        <button
          type="button"
          onClick={close}
          aria-label={reopened ? "Close cookie settings" : "Close and keep only necessary cookies"}
          className="-m-1 rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <XIcon className="size-4" aria-hidden />
        </button>
      </div>

      <p className="mt-3 text-sm leading-relaxed">
        We use necessary cookies to keep you signed in and the site working. With your consent we
        also use Google Analytics to understand how the site is used.
      </p>

      <dl className="mt-3 space-y-1.5 text-xs text-muted-foreground">
        <div>
          <dt className="inline font-medium text-foreground">Necessary (always on): </dt>
          <dd className="inline font-mono">{NECESSARY.join(", ")}</dd>
        </div>
        <div>
          <dt className="inline font-medium text-foreground">Analytics (Google, optional): </dt>
          <dd className="inline font-mono">{ANALYTICS.join(", ")}</dd>
        </div>
      </dl>

      <p className="mt-3 text-xs text-muted-foreground">
        Details, durations and who receives the data in our{" "}
        <Link href={LEGAL_PATHS.cookies} className="underline underline-offset-4 hover:text-foreground">
          Cookie Policy
        </Link>
        . You can change your choice at any time from &ldquo;Cookie settings&rdquo;.
      </p>

      {/* Same size and style: rejecting must be as easy as accepting. */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => saveConsent(false)}>
          Reject
        </Button>
        <Button variant="outline" onClick={() => saveConsent(true)}>
          Accept
        </Button>
      </div>
    </section>
  );
}
