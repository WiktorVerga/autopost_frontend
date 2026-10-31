import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {Suspense, type ReactNode} from "react";
import {ArrowLeftIcon} from "lucide-react";

import {ApiNotice} from "@/components/api-notice";
import {PageHeader, SectionTitle} from "@/components/page-header";
import {Skeleton} from "@/components/ui/skeleton";
import {serverApi, settle} from "@/lib/api/server";
import type {ContentStatus} from "@/lib/api/types";
import {contentStatusLabel, formatDateTime} from "@/lib/format";
import {PublishPostButton} from "./publish-post-button";

export const metadata: Metadata = {title: "Post"};

const statusStyle: Record<ContentStatus, string> = {
    generated: "text-muted-foreground",
    publishing: "text-muted-foreground",
    published: "text-signal",
    failed: "text-destructive",
};

export default function PostPage({params}: PageProps<"/contents/[postId]">) {
    return (
        <div className="space-y-6">
            <Link
                href="/contents"
                className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
            >
                <ArrowLeftIcon className="size-3.5"/>
                All contents
            </Link>

            <Suspense fallback={<PostSkeleton/>}>
                {params.then(({postId}) => (
                    <PostDetails postId={postId}/>
                ))}
            </Suspense>
        </div>
    );
}

async function PostDetails({postId}: { postId: string }) {
    const id = Number(postId);
    if (!Number.isInteger(id) || id <= 0) notFound();

    // There is no single-post endpoint yet: the caption comes from the list,
    // the title from the idea the post was generated from.
    const postraw = await settle(serverApi.post(id));
    if (postraw.error) return <ApiNotice error={postraw.error}/>;
    if (!postraw.data) notFound();

    const post = postraw.data;

    const idearaw = await settle(serverApi.idea(post.idea_id));
    if (idearaw.error) return <ApiNotice error={idearaw.error}/>;
    if (!idearaw.data) notFound();

    const idea = idearaw.data;

    const title = idea.title;
    const slides = post.slides;

    return (
        <div className="space-y-12">
            <PageHeader
                eyebrow="Post"
                title={title}
                actions={post.status === "generated" || post.status === "publishing" ? <PublishPostButton post={post}/> : null}
            />

            <dl className="grid grid-cols-2 gap-6 border-b pb-8 md:grid-cols-4">
                <Fact label="Status">
          <span className={`font-mono text-xs uppercase ${statusStyle[post.status] ?? ""}`}>
            {contentStatusLabel[post.status]}
          </span>
                </Fact>
                <Fact label="Slides">
                    <span className="font-mono text-xs">{slides.length}</span>
                </Fact>
                <Fact label="Created">
                    <span className="font-mono text-xs">{formatDateTime(post.created_at)}</span>
                </Fact>
                <Fact label="Published">
                    <span className="font-mono text-xs">{formatDateTime(post.published_at)}</span>
                </Fact>
            </dl>

            <section className="space-y-6">
                <SectionTitle>Caption</SectionTitle>
                <p className="max-w-2xl whitespace-pre-line text-[15px] leading-relaxed">
                    {post.caption || <span className="text-muted-foreground">No caption.</span>}
                </p>
            </section>

            <section className="space-y-6">
                <SectionTitle>Slides</SectionTitle>
                <ul className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
                    {slides.map((s, i) => (
                        <li key={s.id}>
                            <div className="aspect-[4/5] overflow-hidden bg-muted">
                                {s.url ? (
                                    // eslint-disable-next-line @next/next/no-img-element -- storage URLs are external and not known in advance
                                    <img src={s.url} alt="" className="size-full object-cover"/>
                                ) : null}
                            </div>
                            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                                {i + 1} / {slides.length}
                            </p>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}

function Fact({label, children}: { label: string; children: ReactNode }) {
    return (
        <div className="space-y-2">
            <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {label}
            </dt>
            <dd className="text-sm">{children}</dd>
        </div>
    );
}

function PostSkeleton() {
    return (
        <div className="space-y-12">
            <div className="space-y-4 border-b pb-8">
                <Skeleton className="h-3 w-32"/>
                <Skeleton className="h-14 w-72"/>
            </div>
            <div className="space-y-4">
                <Skeleton className="h-3 w-40"/>
                <Skeleton className="h-24 w-full max-w-2xl"/>
            </div>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({length: 4}).map((_, i) => (
                    <Skeleton key={i} className="aspect-[4/5] w-full rounded-none"/>
                ))}
            </div>
        </div>
    );
}
