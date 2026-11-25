"use client";

import { ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { browserUrl, endpoints } from "@/lib/api/endpoints";
import { rememberReturnPath, safeReturnPath } from "@/lib/return-to";

/** Full-page navigation: the backend redirects to Google and back. */
export function GoogleSignInLink() {
  function rememberDestination() {
    // `?next=` is set by the proxy when a protected page sent the user here.
    const next = new URLSearchParams(window.location.search).get("next");
    rememberReturnPath(safeReturnPath(next) ?? "/dashboard");
  }

  return (
    <Button asChild size="lg" className="mt-8 w-full justify-between">
      <a href={browserUrl(endpoints.auth.googleLogin)} onClick={rememberDestination}>
        Continue with Google
        <ArrowRightIcon />
      </a>
    </Button>
  );
}
