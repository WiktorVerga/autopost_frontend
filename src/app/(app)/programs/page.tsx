import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRightIcon, CalendarClockIcon, PlusIcon } from "lucide-react";

import { ApiNotice } from "@/components/api-notice";
import { EmptyState } from "@/components/empty-state";
import { PageHeader, SectionTitle } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { serverApi, settle } from "@/lib/api/server";
import { cronToSchedule } from "@/lib/cron";
import { formatDateTime, modeLabel } from "@/lib/format";
import { describeSchedule } from "@/lib/schedule";
import { NewProgramDialog } from "./new-program-dialog";

export const metadata: Metadata = { title: "Programs" };

export default function ProgramsPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Programs"
        title="Schedules"
        description="Each program runs every few days, takes an idea from its collection and produces a carousel, reel or story."
        actions={
          <Suspense
            fallback={
              <Button disabled>
                <PlusIcon />
                New program
              </Button>
            }
          >
            <NewProgramAction />
          </Suspense>
        }
      />

      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <ProgramsList />
      </Suspense>
    </div>
  );
}

async function NewProgramAction() {
  const [collections, accounts] = await Promise.all([
    settle(serverApi.collections()),
    settle(serverApi.instagramAccounts()),
  ]);
  return (
    <NewProgramDialog collections={collections.data ?? []} instagramAccounts={accounts.data ?? []} />
  );
}

async function ProgramsList() {
  const [programs, collections, accounts] = await Promise.all([
    settle(serverApi.programs()),
    settle(serverApi.collections()),
    settle(serverApi.instagramAccounts()),
  ]);

  if (programs.error) return <ApiNotice error={programs.error} />;

  if (programs.data.length === 0) {
    return (
      <EmptyState
        icon={CalendarClockIcon}
        title="No programs yet"
        description="Create a program to start turning ideas into content. Start in preview mode to check the output before publishing."
      />
    );
  }

  const collectionName = (id: number | null) =>
    id === null ? null : collections.data?.find((c) => c.id === id)?.name ?? `#${id}`;

  const accountHandle = (id: number) => `@${accounts.data?.find((a) => a.id === id)?.handle ?? id}`;

  return (
    <section className="space-y-1">
      <SectionTitle
        aside={<span className="font-mono text-xs text-muted-foreground">{programs.data.length}</span>}
      >
        Programs
      </SectionTitle>
      <ul className="divide-y">
        {programs.data.map((p) => {
          const active = p.is_active && p.idea_collection_id !== null;
          return (
            <li key={p.id}>
              <Link
                href={`/programs/${p.id}`}
                className="group grid gap-2 py-4 md:grid-cols-[1fr_auto] md:items-center md:gap-8"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[15px] font-medium">
                    <span
                      className={`size-1.5 shrink-0 rounded-full ${active ? "bg-signal" : "bg-muted-foreground/40"}`}
                      aria-label={active ? "Active" : "Inactive"}
                    />
                    <span className="group-hover:underline group-hover:underline-offset-4">{p.name}</span>
                  </p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {collectionName(p.idea_collection_id) ?? <em>No collection</em>}
                    {" · "}
                    {accountHandle(p.instagram_account_id)}
                    {" · "}
                    <Frequency cron={p.cron_expression} />
                  </p>
                </div>
                <span className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
                  <Badge
                    variant={p.mode === "publish" ? "default" : "outline"}
                    className={p.mode === "publish" ? "bg-signal text-signal-foreground" : ""}
                  >
                    {modeLabel[p.mode]}
                  </Badge>
                  <span title="Next run">{active ? formatDateTime(p.next_run) : "—"}</span>
                  <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Frequency({ cron }: { cron: string }) {
  const schedule = cronToSchedule(cron);
  // Crons edited outside the app may not fit the picker: show them raw.
  if (!schedule) return <code className="font-mono text-xs">{cron}</code>;
  return <span title={cron}>{describeSchedule(schedule)}</span>;
}
