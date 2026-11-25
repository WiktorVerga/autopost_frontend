import Link from "next/link";

import { CookieSettingsButton } from "@/components/cookie-settings-button";
import { LEGAL_PATHS } from "@/lib/legal";

/** Public, lightweight shell for the Privacy Policy and the Cookie Policy. */
export default function LegalLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-5 md:px-8">
          <Link href="/" className="flex items-baseline gap-1.5" aria-label="Autopost home">
            <span className="font-serif text-2xl">Autopost</span>
            <span className="size-2 rounded-full bg-signal" aria-hidden />
          </Link>
          <nav className="flex gap-5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            <Link href={LEGAL_PATHS.privacy} className="hover:text-foreground">
              Privacy
            </Link>
            <Link href={LEGAL_PATHS.cookies} className="hover:text-foreground">
              Cookies
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 md:px-8 md:py-16">{children}</main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-5 py-6 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground md:px-8">
          <Link href="/" className="hover:text-foreground">
            Back to Autopost
          </Link>
          <CookieSettingsButton className="uppercase tracking-[0.14em] hover:text-foreground" />
        </div>
      </footer>
    </div>
  );
}
