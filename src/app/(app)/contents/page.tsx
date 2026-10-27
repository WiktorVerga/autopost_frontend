import type { Metadata } from "next";
import { Suspense } from "react";
import { ImagesIcon } from "lucide-react";

import { ApiNotice } from "@/components/api-notice";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { serverApi, settle } from "@/lib/api/server";
import { ContentsBrowser } from "./contents-browser";

export const metadata: Metadata = { title: "Contents" };

export default function ContentsPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Contents"
        title="Made by Autopost"
        description="Everything the programs generated: previews waiting to be checked and posts already on Instagram."
      />

      <Suspense fallback={<GridSkeleton />}>
        <ContentsSection />
      </Suspense>
    </div>
  );
}

async function ContentsSection() {
  const { data, error } = await settle(serverApi.posts());
  if (error) return <ApiNotice error={error} />;

  if (data.length === 0) {
    return (
      <EmptyState
        icon={ImagesIcon}
        title="Nothing generated yet"
        description="When a program runs, its carousels, reels and stories will appear here with their caption and hashtags."
      />
    );
  }

  return <ContentsBrowser contents={data} />;
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
