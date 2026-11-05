import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {Suspense} from "react";
import {ArrowLeftIcon, LightbulbIcon, PlusIcon} from "lucide-react";

import {ApiNotice} from "@/components/api-notice";
import {
    ListFilters,
    ListFiltersFallback,
    ListNoResults,
    ListPagination,
    type ListFilter,
} from "@/components/data-list";
import {EmptyState} from "@/components/empty-state";
import {PageHeader, SectionTitle} from "@/components/page-header";
import {Button} from "@/components/ui/button";
import {Skeleton} from "@/components/ui/skeleton";
import {ALL_ITEMS, serverApi, settle} from "@/lib/api/server";
import {listQuery, paginate, parseListParams} from "@/lib/list-params";
import type {Idea} from "@/lib/api/types";
import {IdeaCategoriesProvider} from "./category-combobox";
import {CollectionActions} from "./collection-actions";
import {IdeaDialog} from "./idea-dialog";
import {DataTable} from "@/app/(app)/idea-collections/[collectionId]/data-table";
import {columns} from "@/app/(app)/idea-collections/[collectionId]/comlumns";

export const metadata: Metadata = {title: "Idea collection"};

type SearchParams = Record<string, string | string[] | undefined>;

export default function IdeaCollectionPage({params, searchParams}: PageProps<"/idea-collections/[collectionId]">) {
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
                {Promise.all([params, searchParams]).then(([{collectionId}, sp]) => (
                    <Collection collectionId={collectionId} searchParams={sp}/>
                ))}
            </Suspense>
        </div>
    );
}

async function Collection({collectionId, searchParams}: { collectionId: string; searchParams: SearchParams }) {
    const id = Number(collectionId);
    if (!Number.isInteger(id) || id <= 0) notFound();

    const params = parseListParams(searchParams, {filters: ["q", "category", "order"]});

    const [collection, allIdeas, ideas] = await Promise.all([
        settle(serverApi.collection(id)),
        // Whole collection: categories for the filter and the dialogs, and the idea count.
        settle(serverApi.ideas(`${ALL_ITEMS}&idea_collection_id=${id}`)),
        // The page shown in the table.
        settle(serverApi.ideas(listQuery(params, {rename: {q: "search"}, extra: {idea_collection_id: id}}))),
    ]);

    if (collection.error?.status === 404) notFound();
    if (collection.error) return <ApiNotice error={collection.error}/>;

    const categories = getCategories(allIdeas.data ?? []);
    const filters: ListFilter[] = [
        {type: "search", param: "q", label: "Search ideas", placeholder: "Search title or description…"},
        {
            type: "select" as const,
            param: "order",
            label: "Order",
            allLabel: "Default Order",
            options: [{value: "oldest", label: "Oldest"}, {value: "newest", label: "Newest"}],
        },
        ...(categories.length > 0
            ? [{
                type: "select" as const,
                param: "category",
                label: "Category",
                allLabel: "All categories",
                options: categories.map((c) => ({value: c, label: c})),
            }]
            : []),
    ];

    return (
        <IdeaCategoriesProvider categories={categories}>
            <div className="space-y-10">
                <PageHeader
                    eyebrow="Idea collection"
                    title={collection.data.name.toUpperCase()}
                    description="Manage the collection and its ideas."
                    actions={
                        <>
                            <CollectionActions collection={collection.data} ideaCount={allIdeas.data?.length}/>
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
                ) : allIdeas.data?.length === 0 ? (
                    <EmptyState
                        icon={LightbulbIcon}
                        title="No ideas yet"
                        description="Add the first idea to this collection: a short brief is enough, Autopost turns it into the post."
                    />
                ) : (
                    <section className="space-y-4">
                        <SectionTitle
                            aside={
                                <span className="font-mono text-xs text-muted-foreground">
                                    {allIdeas.data?.length ?? ""}
                                </span>
                            }>
                            Ideas
                        </SectionTitle>

                        <Suspense fallback={<ListFiltersFallback filters={filters}/>}>
                            <ListFilters filters={filters}/>
                        </Suspense>

                        <IdeasPage ideas={ideas.data} params={params} collectionId={id}/>
                    </section>
                )}
            </div>
        </IdeaCategoriesProvider>
    );
}

function IdeasPage({ideas, params, collectionId}: {
    ideas: Idea[];
    params: ReturnType<typeof parseListParams<"q" | "category">>;
    collectionId: number;
}) {
    const page = paginate(ideas, params);
    const resetHref = `/idea-collections/${collectionId}`;

    if (page.items.length === 0) {
        return page.page > 1 && !params.filters.q && !params.filters.category ? (
            <ListNoResults
                resetHref={resetHref}
                title="This page is empty"
                description="There are no ideas this far. Go back to the first page."
                resetLabel="First page"
            />
        ) : (
            <ListNoResults
                resetHref={resetHref}
                title="No matching ideas"
                description="No idea in this collection matches the current search and category."
            />
        );
    }

    return (
        <div className="space-y-4">
            <DataTable columns={columns} data={page.items}/>
            <ListPagination pagination={page}/>
        </div>
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
