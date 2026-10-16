import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeftIcon, LightbulbIcon, PlusIcon } from "lucide-react";

import { ApiNotice } from "@/components/api-notice";
import { EmptyState } from "@/components/empty-state";
import { PageHeader, SectionTitle } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { serverApi, settle } from "@/lib/api/server";
import { CollectionActions } from "./collection-actions";
import { IdeaActions } from "./idea-actions";
import { IdeaDialog } from "./idea-dialog";

export const metadata: Metadata = { title: "Idea collection" };

export default function IdeaCollectionPage({ params }: PageProps<"/idea-collections/[collectionId]">) {
  return (
    <div className="space-y-6">
      <Link
        href="/idea-collections"
        className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3.5" />
        All collections
      </Link>

      <Suspense fallback={<CollectionSkeleton />}>
        {params.then(({ collectionId }) => (
          <Collection collectionId={collectionId} />
        ))}
      </Suspense>
    </div>
  );
}

async function Collection({ collectionId }: { collectionId: string }) {
  const id = Number(collectionId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [collection, ideas] = await Promise.all([
    settle(serverApi.collection(id)),
    settle(serverApi.collectionIdeas(id)),
  ]);

  if (collection.error?.status === 404) notFound();
  if (collection.error) return <ApiNotice error={collection.error} />;

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Idea collection"
        title={collection.data.name}
        description="Every idea in this collection. Programs using it pick the oldest idea they haven't published yet."
        actions={
          <>
            <CollectionActions collection={collection.data} ideaCount={ideas.data?.length} />
            <IdeaDialog collectionId={id}>
              <Button>
                <PlusIcon />
                New idea
              </Button>
            </IdeaDialog>
          </>
        }
      />

      {ideas.error ? (
        <ApiNotice error={ideas.error} />
      ) : ideas.data.length === 0 ? (
        <EmptyState
          icon={LightbulbIcon}
          title="No ideas yet"
          description="Add the first idea to this collection: a short brief is enough, Autopost turns it into the post."
        />
      ) : (
        <section className="space-y-1">
          <SectionTitle aside={<span className="font-mono text-xs text-muted-foreground">{ideas.data.length}</span>}>
            Ideas
          </SectionTitle>
          <ul className="divide-y">
            {ideas.data.map((idea) => (
              <li key={idea.id} className="grid grid-cols-[1fr_auto] items-start gap-4 py-4 md:gap-8">
                <div>
                  <p className="text-[15px] font-medium">{idea.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{idea.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  {idea.category ? (
                    <span className="font-mono text-xs text-muted-foreground">{idea.category}</span>
                  ) : null}
                  <IdeaActions idea={idea} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function CollectionSkeleton() {
  return (
    <div className="space-y-10">
      <div className="space-y-4 border-b pb-8">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-14 w-72" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-3 w-40" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
