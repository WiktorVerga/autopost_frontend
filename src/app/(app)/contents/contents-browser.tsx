"use client";

import { useState } from "react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Post, ContentStatus } from "@/lib/api/types";
import { contentStatusLabel, formatDate } from "@/lib/format";
import Link from "next/link";

type Filter = "all" | ContentStatus;

const statusStyle: Record<ContentStatus, string> = {
  generated: "text-muted-foreground",
  publishing: "text-muted-foreground",
  published: "text-signal",
  failed: "text-destructive",
};

/**
 * Flat grid of generated contents. Images sit directly on the page,
 * framed by hairlines only — no raised cards or shadows.
 */
export function ContentsBrowser({ contents }: { contents: Post[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const visible = filter === "all" ? contents : contents.filter((c) => c.status === filter);

  return (
    <div className="space-y-6">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {(Object.keys(contentStatusLabel) as ContentStatus[]).map((status) => (
            <TabsTrigger key={status} value={status}>
              {contentStatusLabel[status]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {visible.length === 0 ? (
        <p className="py-10 text-sm text-muted-foreground">No posts with this status yet.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((p) => (
            <li key={p.id} className="group">
              <Link href={`/contents/${p.id}`} className="block">
                <div className="aspect-[4/5] overflow-hidden bg-muted">
                  {p.slides[0].public_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- storage URLs are external and not known in advance
                    <img src={p.slides[0].public_url} alt="" className="size-full object-cover" />
                  ) : null}
                </div>
                <div className="mt-3 flex items-baseline justify-between gap-2 border-b pb-2 font-mono text-[10px] uppercase tracking-[0.14em]">
                  <span className={statusStyle[p.status]}>{p.status}</span>
                </div>
              </Link>
              <p className="mt-2 line-clamp-2 text-sm">{p.caption}</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {formatDate(p.published_at ?? p.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
