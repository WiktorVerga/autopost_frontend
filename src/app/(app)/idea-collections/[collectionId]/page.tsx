import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {Suspense} from "react";
import {ArrowLeftIcon, LightbulbIcon, PlusIcon} from "lucide-react";

import {ApiNotice} from "@/components/api-notice";
import {EmptyState} from "@/components/empty-state";
import {PageHeader, SectionTitle} from "@/components/page-header";
import {Button} from "@/components/ui/button";
import {Skeleton} from "@/components/ui/skeleton";
import {serverApi, settle} from "@/lib/api/server";
import type {Idea} from "@/lib/api/types";
import {IdeaCategoriesProvider} from "./category-combobox";
import {CollectionActions} from "./collection-actions";
import {IdeaDialog} from "./idea-dialog";
import {DataTable} from "@/app/(app)/idea-collections/[collectionId]/data-table";
import {columns} from "@/app/(app)/idea-collections/[collectionId]/comlumns";

export const metadata: Metadata = {title: "Idea collection"};

export default function IdeaCollectionPage({params}: PageProps<"/idea-collections/[collectionId]">) {
    return (
        <div className="space-y-6">
            <Link
                href="/idea-collections"
                className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
            >
                <ArrowLeftIcon className="size-3.5"/>
                All collections
            </Link>

            <Suspense fallback={<CollectionSkeleton/>}>
                {params.then(({collectionId}) => (
                    <Collection collectionId={collectionId}/>
                ))}
            </Suspense>
        </div>
    );
}

async function Collection({collectionId}: { collectionId: string }) {
    const id = Number(collectionId);
    if (!Number.isInteger(id) || id <= 0) notFound();

    const [collection, ideas] = await Promise.all([
        settle(serverApi.collection(id)),
        settle(serverApi.collectionIdeas(id)),
    ]);

    if (collection.error?.status === 404) notFound();
    if (collection.error) return <ApiNotice error={collection.error}/>;

    return (
        <IdeaCategoriesProvider categories={getCategories(ideas.data ?? [])}>
            <div className="space-y-10">
                <PageHeader
                    eyebrow="Idea collection"
                    title={collection.data.name.toUpperCase()}
                    description="Manage the collection and its ideas."
                    actions={
                        <>
                            <CollectionActions collection={collection.data} ideaCount={ideas.data?.length}/>
                            <IdeaDialog collectionId={id}>
                                <Button>
                                    <PlusIcon/>
                                    New idea
                                </Button>
                            </IdeaDialog>
                        </>
                    }
                />

                {ideas.error ? (
                    <ApiNotice error={ideas.error}/>
                ) : ideas.data.length === 0 ? (
                    <EmptyState
                        icon={LightbulbIcon}
                        title="No ideas yet"
                        description="Add the first idea to this collection: a short brief is enough, Autopost turns it into the post."
                    />
                ) : (
                    <section className="space-y-1">

                        <SectionTitle
                            aside={<span className="font-mono text-xs text-muted-foreground">{ideas.data.length}</span>}>
                            Ideas
                        </SectionTitle>

                        <DataTable columns={columns} data={ideas.data} />

                    </section>
                )}
            </div>
        </IdeaCategoriesProvider>
    );
}

/** Lists each category once, ignoring case, in alphabetical order. */
function getCategories(ideas: Idea[]) {
    const categories = new Map<string, string>();
    for (const idea of ideas) {
        const category = idea.category?.trim();
        if (!category) continue;
        const key = category.toLocaleLowerCase();
        if (!categories.has(key)) categories.set(key, category);
    }
    return [...categories.values()].sort((a, b) => a.localeCompare(b));
}

function CollectionSkeleton() {
    return (
        <div className="space-y-10">
            <div className="space-y-4 border-b pb-8">
                <Skeleton className="h-3 w-32"/>
                <Skeleton className="h-14 w-72"/>
            </div>
            <div className="space-y-4">
                <Skeleton className="h-3 w-40"/>
                {Array.from({length: 5}).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full"/>
                ))}
            </div>
        </div>
    );
}
