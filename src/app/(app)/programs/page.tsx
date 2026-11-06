import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRightIcon, CalendarClockIcon, PlusIcon } from "lucide-react";

import { ApiNotice } from "@/components/api-notice";
import {
  ListFilters,
  ListFiltersFallback,
  ListNoResults,
  ListPagination,
  type ListFilter,
} from "@/components/data-list";
import { EmptyState } from "@/components/empty-state";
import { PageHeader, SectionTitle } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ALL_ITEMS, serverApi, settle } from "@/lib/api/server";
import type { IdeaCollection, ProgramStatus } from "@/lib/api/types";
import { cronToSchedule } from "@/lib/cron";
import { formatDateTime, modeLabel } from "@/lib/format";
import { hasActiveFilters, isId, listQuery, paginate, parseListParams } from "@/lib/list-params";
import { isRunning } from "@/lib/program";
import { describeSchedule } from "@/lib/schedule";
import { NewProgramDialog } from "./new-program-dialog";

export const metadata: Metadata = { title: "Programs" };

const PATH = "/programs";

type SearchParams = Record<string, string | string[] | undefined>;

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
] as const satisfies readonly { value: ProgramStatus; label: string }[];

const MODE_OPTIONS = Object.entries(modeLabel).map(([value, label]) => ({ value, label }));

/** Filters that don't depend on data (the collection one is added once collections load). */
const BASE_FILTERS = [
  { type: "search", param: "q", label: "Search programs", placeholder: "Search programs…", maxLength: 100 },
  { type: "select", param: "status", label: "Status", allLabel: "Any status", options: STATUS_OPTIONS },
  { type: "select", param: "mode", label: "Mode", allLabel: "Any mode", options: MODE_OPTIONS },
] as const satisfies readonly ListFilter[];

function collectionFilter(collections: IdeaCollection[]): ListFilter {
  return {
    type: "select",
    param: "collection",
    label: "Collection",
    allLabel: "All collections",
    options: collections.map((c) => ({ value: String(c.id), label: c.name })),
  };
}

export default function ProgramsPage({ searchParams }: PageProps<"/programs">) {
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

      <div className="space-y-6">
        <Suspense fallback={<ListFiltersFallback filters={BASE_FILTERS} />}>
          <ProgramsFilters />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          {searchParams.then((sp) => (
            <ProgramsList searchParams={sp} />
          ))}
        </Suspense>
      </div>
    </div>
  );
}

async function NewProgramAction() {
  const [collections, templates, accounts] = await Promise.all([
    settle(serverApi.collections()),
    settle(serverApi.templates()),
    settle(serverApi.instagramAccounts()),
  ]);
  return (
    <NewProgramDialog
      collections={collections.data ?? []}
      templates={templates.data ?? []}
      instagramAccounts={accounts.data ?? []}
    />
  );
}

async function ProgramsFilters() {
  const collections = await settle(serverApi.collections(ALL_ITEMS));
  return <ListFilters filters={[...BASE_FILTERS, collectionFilter(collections.data ?? [])]} />;
}

async function ProgramsList({ searchParams }: { searchParams: SearchParams }) {
  const params = parseListParams(searchParams, {
    filters: ["q", "status", "mode", "collection"],
    validate: {
      status: STATUS_OPTIONS.map((o) => o.value),
      mode: MODE_OPTIONS.map((o) => o.value),
      collection: isId,
    },
  });
  const query = listQuery(params, {
    rename: { q: "search", collection: "idea_collection_id" },
  });

  const [programs, collections, accounts] = await Promise.all([
    settle(serverApi.programs(query)),
    settle(serverApi.collections(ALL_ITEMS)),
    settle(serverApi.instagramAccounts()),
  ]);

  if (programs.error) return <ApiNotice error={programs.error} />;

  const page = paginate(programs.data, params);

  if (page.items.length === 0) {
    if (hasActiveFilters(params)) {
      return (
        <ListNoResults
          resetHref={PATH}
          title="No matching programs"
          description="No program matches the current search and filters."
        />
      );
    }
    if (page.page > 1) {
      return (
        <ListNoResults
          resetHref={PATH}
          title="This page is empty"
          description="There are no programs this far. Go back to the first page."
          resetLabel="First page"
        />
      );
    }
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
        aside={
          <span className="font-mono text-xs text-muted-foreground">
            {page.hasPrev || page.hasNext ? `${page.from}–${page.to}` : page.items.length}
          </span>
        }
      >
        Programs
      </SectionTitle>
      <ul className="divide-y">
        {page.items.map((p) => {
          const active = isRunning(p);
          return (
            <li key={p.id}>
              <Link
                href={`/programs/${p.id}`}
                className="group grid gap-2 py-4 md:grid-cols-[1fr_auto] md:items-center md:gap-8"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[15px] font-medium">
                    {p.status === "archived" ? (
                      <Badge className="bg-chart-4 text-neutral-950">Archived</Badge>
                    ) : active ? (
                      <Badge className="bg-signal text-signal-foreground">Active</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-muted-foreground">
                        Inactive
                      </Badge>
                    )}
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
      <ListPagination pagination={page} />
    </section>
  );
}

function Frequency({ cron }: { cron: string }) {
  const schedule = cronToSchedule(cron);
  // Crons edited outside the app may not fit the picker: show them raw.
  if (!schedule) return <code className="font-mono text-xs">{cron}</code>;
  return <span title={cron}>{describeSchedule(schedule)}</span>;
}
