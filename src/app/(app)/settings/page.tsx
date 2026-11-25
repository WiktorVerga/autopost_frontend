import type { Metadata } from "next";
import Link from "next/link";

import { CookieSettingsButton } from "@/components/cookie-settings-button";
import { PageHeader, SectionTitle } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { LEGAL_PATHS } from "@/lib/legal";

import { ThemePicker } from "./theme-picker";

export const metadata: Metadata = { title: "Preferences" };

export default function SettingsPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Settings"
        title="Preferences"
        description="How Autopost looks and behaves for you. Saved in this browser."
      />

      <section className="max-w-2xl space-y-6">
        <SectionTitle>Appearance</SectionTitle>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Theme</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Light, dark, or follow your system setting.
            </p>
          </div>
          <ThemePicker />
        </div>
      </section>

      <section className="max-w-2xl space-y-6">
        <SectionTitle>Privacy</SectionTitle>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Cookies</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Allow or refuse Google Analytics. Necessary cookies stay on to keep you signed in.
            </p>
          </div>
          <Button asChild variant="outline">
            <CookieSettingsButton />
          </Button>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Your data</p>
            <p className="mt-1 text-sm text-muted-foreground">
              What we collect, who receives it and how to access or delete it.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="ghost">
              <Link href={LEGAL_PATHS.privacy}>Privacy Policy</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href={LEGAL_PATHS.cookies}>Cookie Policy</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
