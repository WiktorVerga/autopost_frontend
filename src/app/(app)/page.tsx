import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRightIcon } from "lucide-react";

import { ApiNotice } from "@/components/api-notice";
import { PageHeader, SectionTitle } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { serverApi, settle } from "@/lib/api/server";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Overview" };

export default function OverviewPage() {
  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Overview"
        title="What's going out"
        description="A snapshot of your idea queue, the programs that turn it into posts, and what happened recently."
      />

      <Suspense fallback={<StatsSkeleton />}>
        <Stats />
      </Suspense>

      <section className="space-y-4">
        <SectionTitle
          aside={
            <Link
              href="/logs"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              All logs <ArrowRightIcon className="size-3" />
            </Link>
          }
        >
          Recent activity
        </SectionTitle>
        <Suspense fallback={<ListSkeleton />}>
          <RecentActivity />
        </Suspense>
      </section>
    </div>
  );
}

async function Stats() {
  const [ideas, programs, posts] = await Promise.all([
    settle(serverApi.ideas()),
    settle(serverApi.programs()),
    settle(serverApi.posts()),
  ]);

  const usedIdeasIds = new Set(posts.data?.map((p) => p.idea_id));
  const ideasLeftToGenerate = ideas.data?.filter((i) => !usedIdeasIds.has(i.id));
  const activePrograms = programs.data?.filter((p) => p.is_active && p.idea_collection_id !== null);
  const nextRun = activePrograms
    ?.map((p) => p.next_run)
    .filter((d): d is string => Boolean(d))
    .sort()[0];
  const publishedThisWeek = posts.data?.filter((c) => isWithinDays(c.published_at, 7));

  const stats = [
    { label: "Ideas left to generate", value: ideasLeftToGenerate?.length },
    { label: "Active programs", value: activePrograms?.length },
    { label: "Next run", value: nextRun ? formatDateTime(nextRun) : undefined, small: true },
    { label: "Published this Week", value: publishedThisWeek ? publishedThisWeek.length : undefined, small: true },
  ];

  const error = ideas.error ?? programs.error;

  return (
    <div className="space-y-4">
      {error ? <ApiNotice error={error} /> : null}
      {/* gap-px over a border-coloured background draws the hairline grid */}
      <dl className="grid grid-cols-2 gap-px border-y bg-border md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-background px-4 py-6 md:px-6">
            <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {s.label}
            </dt>
            <dd className={`mt-3 font-serif tracking-tight ${s.small ? "text-2xl" : "text-5xl"}`}>
              {s.value ?? "—"}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function isWithinDays(iso: string | null, days: number) {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < days * 24 * 60 * 60 * 1000;
}

async function RecentActivity() {
  const { data, error } = await settle(serverApi.logs());
  if (error) return <ApiNotice error={error} />;

  const recent = data.slice(0, 6);
  if (recent.length === 0) {
    return <p className="py-6 text-sm text-muted-foreground">Nothing has run yet.</p>;
  }

  return (
    <ol className="divide-y">
      {recent.map((log) => (
        <li key={log.id} className="flex items-baseline gap-4 py-3 text-sm">
          <span className="w-44 shrink-0 whitespace-nowrap font-mono text-xs text-muted-foreground">
            {formatDateTime(log.created_at)}
          </span>
          <span className={log.level === "error" ? "text-destructive" : ""}>{log.message}</span>
        </li>
      ))}
    </ol>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-6 border-y py-6 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-16" />
        </div>
      ))}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3 py-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full max-w-lg" />
      ))}
    </div>
  );
}
