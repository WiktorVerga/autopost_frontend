import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { ActivityIcon, ArrowLeftIcon } from "lucide-react";

import { ApiNotice } from "@/components/api-notice";
import { EmptyState } from "@/components/empty-state";
import { PageHeader, SectionTitle } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { LogLevel } from "@/lib/api/types";
import { serverApi, settle } from "@/lib/api/server";
import { formatDateTime, modeLabel } from "@/lib/format";
import { DeleteProgramButton } from "./delete-program-button";
import { ProgramForm } from "./program-form";

export const metadata: Metadata = { title: "Program" };

const levelStyle: Record<LogLevel, string> = {
  info: "text-muted-foreground",
  warning: "text-chart-4",
  error: "text-destructive",
};

export default function ProgramPage({ params }: PageProps<"/programs/[programId]">) {
  return (
    <div className="space-y-6">
      <Link
        href="/programs"
        className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3.5" />
        All programs
      </Link>

      <Suspense fallback={<ProgramSkeleton />}>
        {params.then(({ programId }) => (
          <ProgramDetail programId={programId} />
        ))}
      </Suspense>
    </div>
  );
}

async function ProgramDetail({ programId }: { programId: string }) {
  const id = Number(programId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [program, collections, accounts] = await Promise.all([
    settle(serverApi.program(id)),
    settle(serverApi.collections()),
    settle(serverApi.instagramAccounts()),
  ]);

  if (program.error?.status === 404) notFound();
  if (program.error) return <ApiNotice error={program.error} />;

  const p = program.data;
  const active = p.is_active && p.idea_collection_id !== null;

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Program"
        title={p.name}
        description="Change how this program runs. Edits apply from its next run."
        actions={<DeleteProgramButton program={p} />}
      />

      <dl className="grid grid-cols-2 gap-6 border-b pb-8 md:grid-cols-4">
        <Fact label="Status">
          <span className="flex items-center gap-2">
            <span
              className={`size-1.5 rounded-full ${active ? "bg-signal" : "bg-muted-foreground/40"}`}
            />
            {active ? "Active" : "Inactive"}
          </span>
        </Fact>
        <Fact label="Mode">
          <Badge
            variant={p.mode === "publish" ? "default" : "outline"}
            className={p.mode === "publish" ? "bg-signal text-signal-foreground" : ""}
          >
            {modeLabel[p.mode]}
          </Badge>
        </Fact>
        <Fact label="Last run">
          <span className="font-mono text-xs">{formatDateTime(p.last_run)}</span>
        </Fact>
        <Fact label="Next run">
          <span className="font-mono text-xs">{active ? formatDateTime(p.next_run) : "—"}</span>
        </Fact>
      </dl>

      <section className="space-y-6">
        <SectionTitle>Settings</SectionTitle>
        {/* Cache Components keeps client state across navigations: remount the form
            whenever the saved program changes so its fields always show the real state. */}
        <ProgramForm
          key={JSON.stringify(p)}
          program={p}
          collections={collections.data ?? []}
          instagramAccounts={accounts.data ?? []}
        />
      </section>

      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <RecentLogs programId={id} />
      </Suspense>
    </div>
  );
}

async function RecentLogs({ programId }: { programId: number }) {
  const logs = await settle(serverApi.programLogs(programId));

  return (
    <section className="space-y-1">
      <SectionTitle
        aside={
          <Link
            href="/logs"
            className="font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            All logs
          </Link>
        }
      >
        Recent logs
      </SectionTitle>

      {logs.error ? (
        <div className="pt-3">
          <ApiNotice error={logs.error} />
        </div>
      ) : logs.data.length === 0 ? (
        <div className="pt-3">
          <EmptyState
            icon={ActivityIcon}
            title="No activity yet"
            description="Logs appear here as soon as this program runs for the first time."
          />
        </div>
      ) : (
        <ul className="divide-y">
          {logs.data.map((log) => (
            <li
              key={log.id}
              className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-1 py-3 text-sm sm:grid-cols-[auto_4.5rem_1fr] sm:gap-y-4"
            >
              <span className="font-mono text-xs text-muted-foreground">
                {formatDateTime(log.created_at)}
              </span>
              <span className={`font-mono text-xs uppercase ${levelStyle[log.level] ?? ""}`}>
                {log.level}
              </span>
              <span className="col-span-full min-w-0 wrap-anywhere sm:col-span-1">{log.message}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function ProgramSkeleton() {
  return (
    <div className="space-y-12">
      <div className="space-y-4 border-b pb-8">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-14 w-72" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-64 w-full max-w-2xl" />
      </div>
    </div>
  );
}
