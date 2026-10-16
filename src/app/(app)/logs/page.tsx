import type { Metadata } from "next";
import { Suspense } from "react";
import { ActivityIcon } from "lucide-react";

import { ApiNotice } from "@/components/api-notice";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LogLevel } from "@/lib/api/types";
import { serverApi, settle } from "@/lib/api/server";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Logs" };

const levelStyle: Record<LogLevel, string> = {
  info: "text-muted-foreground",
  warning: "text-chart-4",
  error: "text-destructive",
};

export default function LogsPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Logs"
        title="History"
        description="Every run, generation and publication, in order. Useful when something didn't go out."
      />

      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <LogsTable />
      </Suspense>
    </div>
  );
}

async function LogsTable() {
  const { data, error } = await settle(serverApi.logs());
  if (error) return <ApiNotice error={error} />;

  if (data.length === 0) {
    return (
      <EmptyState
        icon={ActivityIcon}
        title="No activity yet"
        description="Logs appear here as soon as a program runs for the first time."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="font-mono text-[10px] uppercase tracking-[0.14em]">
          <TableHead className="w-48">Time</TableHead>
          <TableHead className="w-24">Level</TableHead>
          <TableHead className="w-24">Program</TableHead>
          <TableHead>Message</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((log) => (
          <TableRow key={log.id}>
            <TableCell className="font-mono text-xs">{formatDateTime(log.created_at)}</TableCell>
            <TableCell className={`font-mono text-xs uppercase ${levelStyle[log.level]}`}>{log.level}</TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {log.program_id !== null ? `#${log.program_id}` : "—"}
            </TableCell>
            <TableCell className="whitespace-normal">{log.message}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
