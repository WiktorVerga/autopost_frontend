import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRightIcon, LightbulbIcon } from "lucide-react";

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
import { hasActiveFilters, listQuery, paginate, parseListParams } from "@/lib/list-params";
import { NewCollectionDialog } from "./new-collection-dialog";

export const metadata: Metadata = { title: "Idea collections" };

const PATH = "/idea-collections";

const FILTERS = [
  { type: "search", param: "q", label: "Search collections", placeholder: "Search collections…", maxLength: 100 },
] as const satisfies readonly ListFilter[];

export default function IdeaCollectionsPage({ searchParams }: PageProps<"/idea-collections">) {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Idea collections"
        title="The idea bank"
        description="Raw ideas grouped in collections. Programs pick the oldest idea they haven't published yet."
        actions={<NewCollectionDialog />}
      />

      <div className="space-y-6">
        <Suspense fallback={<ListFiltersFallback filters={FILTERS} />}>
          <ListFilters filters={FILTERS} />
        </Suspense>

        <Suspense fallback={<CollectionsSkeleton />}>
          {searchParams.then((sp) => (
            <CollectionsList searchParams={sp} />
          ))}
        </Suspense>
      </div>
    </div>
  );
}

async function CollectionsList({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const params = parseListParams(searchParams, { filters: FILTERS.map((f) => f.param) });

  const [collections, ideas] = await Promise.all([
    settle(serverApi.collections(listQuery(params, { rename: { q: "search" } }))),
    settle(serverApi.ideas()),
  ]);

  if (collections.error) return <ApiNotice error={collections.error} />;

  const page = paginate(collections.data, params);

  if (page.items.length === 0) {
    if (hasActiveFilters(params)) {
      return (
        <ListNoResults
          resetHref={PATH}
          title="No matching collections"
          description={`No collection name contains “${params.filters.q}”.`}
        />
      );
    }
    if (page.page > 1) {
      return (
        <ListNoResults
          resetHref={PATH}
          title="This page is empty"
          description="There are no collections this far. Go back to the first page."
          resetLabel="First page"
        />
      );
    }
    return (
      <EmptyState
        icon={LightbulbIcon}
        title="No collections yet"
        description="Collections group related ideas (e.g. “Espresso basics”). Create one, then open it to add ideas."
      />
    );
  }

  const ideaCount = (collectionId: number) =>
    ideas.data?.filter((i) => i.idea_collection_id === collectionId).length;

  return (
    <section className="space-y-1">
      <SectionTitle
        aside={
          <span className="font-mono text-xs text-muted-foreground">
            {page.hasPrev || page.hasNext ? `${page.from}–${page.to}` : page.items.length}
          </span>
        }
      >
        {params.filters.q ? `Collections matching “${params.filters.q}”` : "Collections"}
      </SectionTitle>
      <ul className="divide-y">
        {page.items.map((collection) => {
          const count = ideaCount(collection.id);
          return (
            <li key={collection.id}>
              <Link
                href={`/idea-collections/${collection.id}`}
                className="group grid gap-1 py-4 md:grid-cols-[1fr_auto] md:items-center md:gap-8"
              >
                <p className="text-[15px] font-medium group-hover:underline group-hover:underline-offset-4 capitalize">
                  {collection.name}
                </p>
                <span className="flex items-center gap-3 font-mono text-xs text-muted-foreground">
                  {count === undefined ? "—" : `${count} ${count === 1 ? "idea" : "ideas"}`}
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

function CollectionsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-3 w-40" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
