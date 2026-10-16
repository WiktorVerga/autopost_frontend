import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRightIcon, LightbulbIcon } from "lucide-react";

import { ApiNotice } from "@/components/api-notice";
import { EmptyState } from "@/components/empty-state";
import { PageHeader, SectionTitle } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { serverApi, settle } from "@/lib/api/server";
import { NewCollectionDialog } from "./new-collection-dialog";

export const metadata: Metadata = { title: "Idea collections" };

export default function IdeaCollectionsPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Idea collections"
        title="The idea bank"
        description="Raw ideas grouped in collections. Programs pick the oldest idea they haven't published yet."
        actions={<NewCollectionDialog />}
      />

      <Suspense fallback={<CollectionsSkeleton />}>
        <CollectionsList />
      </Suspense>
    </div>
  );
}

async function CollectionsList() {
  const [collections, ideas] = await Promise.all([
    settle(serverApi.collections()),
    settle(serverApi.ideas()),
  ]);

  if (collections.error) return <ApiNotice error={collections.error} />;

  if (collections.data.length === 0) {
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
        aside={<span className="font-mono text-xs text-muted-foreground">{collections.data.length}</span>}
      >
        Collections
      </SectionTitle>
      <ul className="divide-y">
        {collections.data.map((collection) => {
          const count = ideaCount(collection.id);
          return (
            <li key={collection.id}>
              <Link
                href={`/idea-collections/${collection.id}`}
                className="group grid gap-1 py-4 md:grid-cols-[1fr_auto] md:items-center md:gap-8"
              >
                <p className="text-[15px] font-medium group-hover:underline group-hover:underline-offset-4">
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
