import type { Metadata } from "next";

import { PageHeader, SectionTitle } from "@/components/page-header";

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
    </div>
  );
}
