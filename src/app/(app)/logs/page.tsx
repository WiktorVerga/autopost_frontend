import type {Metadata} from "next";
import {Suspense} from "react";
import {ActivityIcon} from "lucide-react";

import {ApiNotice} from "@/components/api-notice";
import {EmptyState} from "@/components/empty-state";
import {PageHeader} from "@/components/page-header";
import {Skeleton} from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {LogLevel, LogLevelValues, type Program} from "@/lib/api/types";
import {ALL_ITEMS, serverApi, settle} from "@/lib/api/server";
import {LocalDateTime} from "@/components/local-date-time";
import {type ListFilter, ListFilters, ListFiltersFallback, ListNoResults} from "@/components/data-list";
import {isId, listQuery, paginate, parseListParams} from "@/lib/list-params";


export const metadata: Metadata = {title: "Logs"};

const levelStyle: Record<LogLevel, string> = {
    info: "text-muted-foreground",
    warning: "text-chart-4",
    error: "text-destructive",
};

const FILTERS = [
    {
        type: "select" as const,
        param: "status",
        label: "Status",
        allLabel: "All Status",
        options: LogLevelValues.map(s => ({value: s, label: s})),
    }
] as const satisfies readonly ListFilter[];

function programFilter(programs: Program[]): ListFilter {
    return {
        type: "select",
        param: "program",
        label: "Program",
        allLabel: "All programs",
        options: programs.map((p) => ({ value: String(p.id), label: p.name })),
    };
}

async function LogsFilters() {
    const programs = await settle(serverApi.programs(ALL_ITEMS));
    return <ListFilters filters={[...FILTERS, programFilter(programs.data ?? [])]} />;
}

export default function LogsPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {

    return (
        <div className="space-y-10">
            <PageHeader
                eyebrow="Logs"
                title="History"
                description="Every run, generation and publication, in order. Useful when something didn't go out."
            />

            <Suspense fallback={<ListFiltersFallback filters={FILTERS}/>}>
                <LogsFilters/>
            </Suspense>

            <Suspense fallback={<Skeleton className="h-64 w-full"/>}>
                {Promise.all([searchParams]).then(([sp]) => (
                    <LogsTable params={parseListParams(sp, {filters: ["status", "program"], validate: {status: LogLevelValues.map((o) => o), program: isId}})}/>
                ))}

            </Suspense>

        </div>
    );
}

async function LogsTable({params}: { params: ReturnType<typeof parseListParams<"status" | "program">>; }) {
    const {data, error} = await settle(serverApi.logs(listQuery(params, { rename: { program: "program_id" } })));
    if (error) return <ApiNotice error={error}/>;

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
        // Below lg each row stacks: the details on one line, the message full width underneath.
        <Table className="block lg:table">
            <TableHeader className="hidden lg:table-header-group">
                <TableRow className="font-mono text-[10px] uppercase tracking-[0.14em]">
                    <TableHead className="w-48">Time</TableHead>
                    <TableHead className="w-24">Level</TableHead>
                    <TableHead className="w-24">Program</TableHead>
                    <TableHead>Message</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody className="block lg:table-row-group">
                {data.map((log) => (
                    <TableRow key={log.id} className="flex flex-wrap items-baseline py-2 lg:table-row lg:py-0">
                        <TableCell
                            className="py-0.5 pl-0 font-mono text-xs lg:p-2"><LocalDateTime iso={log.created_at} /></TableCell>
                        <TableCell
                            className={`py-0.5 font-mono text-xs uppercase lg:p-2 ${levelStyle[log.level]}`}>{log.level}</TableCell>
                        <TableCell className="py-0.5 font-mono text-xs text-muted-foreground lg:p-2">
                            {log.program_id !== null ? `#${log.program_id}` : "—"}
                        </TableCell>
                        <TableCell
                            className="w-full py-0.5 pl-0 whitespace-normal wrap-anywhere lg:w-auto lg:p-2">{log.message}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
