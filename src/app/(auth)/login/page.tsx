import type { Metadata } from "next";
import { ArrowRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { browserUrl, endpoints } from "@/lib/api/endpoints";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="grid min-h-svh md:grid-cols-[1.2fr_1fr]">
      <section className="relative flex flex-col justify-between overflow-hidden bg-primary p-8 text-primary-foreground md:p-12">
        <p className="flex items-baseline gap-1.5">
          <span className="font-serif text-2xl">Autopost</span>
          <span className="size-2 rounded-full bg-signal" aria-hidden />
        </p>

        <h1 className="my-16 font-serif text-6xl leading-[0.9] tracking-tight md:text-8xl">
          Ideas in.
          <br />
          <em className="text-signal">Posts out.</em>
        </h1>

        <ol className="grid gap-3 font-mono text-[11px] uppercase tracking-[0.14em] text-primary-foreground/60 sm:grid-cols-3">
          <li>
            <span className="text-signal">01</span> Store ideas
          </li>
          <li>
            <span className="text-signal">02</span> Schedule programs
          </li>
          <li>
            <span className="text-signal">03</span> Publish on Instagram
          </li>
        </ol>
      </section>

      <section className="flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-sm">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Sign in</p>
          <h2 className="mt-3 font-serif text-4xl tracking-tight">Welcome back</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Autopost uses your Google account. No password to remember.
          </p>

          {/* Full-page navigation: the backend redirects to Google and back. */}
          <Button asChild size="lg" className="mt-8 w-full justify-between">
            <a href={browserUrl(endpoints.auth.googleLogin)}>
              Continue with Google
              <ArrowRightIcon />
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}
