import type { Metadata } from "next";
import { Suspense } from "react";
import { LayoutTemplateIcon } from "lucide-react";

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
import { Skeleton } from "@/components/ui/skeleton";
import { serverApi, settle } from "@/lib/api/server";
import type { TemplateBase } from "@/lib/api/types";
import { hasActiveFilters, listQuery, paginate, parseListParams } from "@/lib/list-params";
import { TemplateGrid } from "./template-grid";
import {BasesGrid} from "@/app/(app)/templates/bases-grid";

export const metadata: Metadata = { title: "Templates" };

const PATH = "/templates";

type SearchParams = Record<string, string | string[] | undefined>;

const SEARCH_FILTER = {
  type: "search",
  param: "q",
  label: "Search templates",
  placeholder: "Search name or description…",
} as const satisfies ListFilter;

function templateFilters(bases: TemplateBase[]): ListFilter[] {
  if (bases.length === 0) return [SEARCH_FILTER];
  return [
    SEARCH_FILTER,
    {
      type: "select",
      param: "base",
      label: "Base",
      allLabel: "All bases",
      options: bases.map((b) => ({ value: b.key, label: b.key })),
    },
  ];
}

export default function TemplatesPage({ searchParams }: PageProps<"/templates">) {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Templates"
        title="How posts look"
        description="The layouts Autopost uses to draw your posts: the ones included with Autopost and the ones you uploaded."
      />

      <section className="space-y-6">
        <SectionTitle>Your templates</SectionTitle>
        <Suspense fallback={<ListFiltersFallback filters={[SEARCH_FILTER]} />}>
          <UserTemplatesFilters />
        </Suspense>
        <Suspense fallback={<GridSkeleton count={4} />}>
          {searchParams.then((sp) => (
            <UserTemplatesSection searchParams={sp} />
          ))}
        </Suspense>
      </section>

      <section className="space-y-6">
        <SectionTitle>Templates Bases</SectionTitle>
        <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Pick a base to start from: you can then change it and save it as a template of your own.
        </p>
        <Suspense fallback={<GridSkeleton count={4} />}>
          <BaseTemplatesSection />
        </Suspense>
      </section>
    </div>
  );
}

async function BaseTemplatesSection() {
  const { data, error } = await settle(serverApi.baseTemplates());
  if (error) return <ApiNotice error={error} />;

  if (data.length === 0) {
    return <p className="py-10 text-sm text-muted-foreground">No default templates available.</p>;
  }

  return <BasesGrid bases={data} />;
}

async function UserTemplatesFilters() {
  const bases = await settle(serverApi.baseTemplates());
  return <ListFilters filters={templateFilters(bases.data ?? [])} />;
}

async function UserTemplatesSection({ searchParams }: { searchParams: SearchParams }) {
  const bases = await settle(serverApi.baseTemplates());
  const params = parseListParams(searchParams, {
    filters: ["q", "base"],
    // Unknown base keys would make the backend answer 422.
    validate: bases.data ? { base: bases.data.map((b) => b.key) } : {},
  });

  const { data, error } = await settle(
    serverApi.templates(listQuery(params, { rename: { q: "search", base: "base_template" } })),
  );
  if (error) return <ApiNotice error={error} />;

  const page = paginate(data, params);

  if (page.items.length === 0) {
    if (hasActiveFilters(params)) {
      return (
        <ListNoResults
          resetHref={PATH}
          title="No matching templates"
          description="None of your templates matches the current search and base."
        />
      );
    }
    if (page.page > 1) {
      return (
        <ListNoResults
          resetHref={PATH}
          title="This page is empty"
          description="There are no templates this far. Go back to the first page."
          resetLabel="First page"
        />
      );
    }
    return (
      <EmptyState
        icon={LayoutTemplateIcon}
        title="No templates of your own yet"
        description="Upload an HTML template to give your posts your own look. Until then, programs use the ones included with Autopost."
      />
    );
  }

  return (
    <div className="space-y-10">
      <TemplateGrid templates={page.items} />
      <ListPagination pagination={page} />
    </div>
  );
}

function GridSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-4/5 w-full rounded-none" />
      ))}
    </div>
  );
}
