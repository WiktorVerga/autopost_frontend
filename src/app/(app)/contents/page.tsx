import type { Metadata } from "next";
import { Suspense } from "react";
import { ImagesIcon } from "lucide-react";

import { ApiNotice } from "@/components/api-notice";
import {
  ListFilters,
  ListFiltersFallback,
  ListNoResults,
  ListPagination,
  type ListFilter,
} from "@/components/data-list";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ALL_ITEMS, serverApi, settle } from "@/lib/api/server";
import type { Program } from "@/lib/api/types";
import { contentStatusLabel } from "@/lib/format";
import { hasActiveFilters, isId, listQuery, paginate, parseListParams } from "@/lib/list-params";
import { ContentsBrowser } from "./contents-browser";

export const metadata: Metadata = { title: "Contents" };

const PATH = "/contents";

type SearchParams = Record<string, string | string[] | undefined>;

const STATUS_OPTIONS = Object.entries(contentStatusLabel).map(([value, label]) => ({ value, label }));

/** Filters that don't depend on data (the program one is added once programs load). */
const BASE_FILTERS = [
  { type: "tabs", param: "status", label: "Status", options: STATUS_OPTIONS },
  { type: "search", param: "q", label: "Search contents", placeholder: "Search caption or idea…" },
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

export default function ContentsPage({ searchParams }: PageProps<"/contents">) {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Contents"
        title="Made by Autopost"
        description="Everything the programs generated: previews waiting to be checked and posts already on Instagram."
      />

      <div className="space-y-6">
        <Suspense fallback={<ListFiltersFallback filters={BASE_FILTERS} />}>
          <ContentsFilters />
        </Suspense>

        <Suspense fallback={<GridSkeleton />}>
          {searchParams.then((sp) => (
            <ContentsSection searchParams={sp} />
          ))}
        </Suspense>
      </div>
    </div>
  );
}

async function ContentsFilters() {
  const programs = await settle(serverApi.programs(ALL_ITEMS));
  return <ListFilters filters={[...BASE_FILTERS, programFilter(programs.data ?? [])]} />;
}

async function ContentsSection({ searchParams }: { searchParams: SearchParams }) {
  const params = parseListParams(searchParams, {
    filters: ["status", "q", "program"],
    validate: { status: STATUS_OPTIONS.map((o) => o.value), program: isId },
  });
  const { data, error } = await settle(
    serverApi.posts(listQuery(params, { rename: { q: "search", program: "program_id" } })),
  );
  if (error) return <ApiNotice error={error} />;

  const page = paginate(data, params);

  if (page.items.length === 0) {
    if (hasActiveFilters(params)) {
      return (
        <ListNoResults
          resetHref={PATH}
          title="No matching contents"
          description="Nothing generated matches the current status, program and search."
        />
      );
    }
    if (page.page > 1) {
      return (
        <ListNoResults
          resetHref={PATH}
          title="This page is empty"
          description="There are no contents this far. Go back to the first page."
          resetLabel="First page"
        />
      );
    }
    return (
      <EmptyState
        icon={ImagesIcon}
        title="Nothing generated yet"
        description="When a program runs, its carousels, reels and stories will appear here with their caption and hashtags."
      />
    );
  }

  return (
    <div className="space-y-10">
      <ContentsBrowser contents={page.items} />
      <ListPagination pagination={page} />
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="aspect-[4/5] w-full rounded-none" />
      ))}
    </div>
  );
}
