"use client";

import { useState } from "react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Content, ContentStatus, ContentType } from "@/lib/api/types";
import { contentTypeLabel, contentTypePlural, formatDate } from "@/lib/format";

type Filter = "all" | ContentType;

const statusStyle: Record<ContentStatus, string> = {
  generated: "text-muted-foreground",
  published: "text-signal",
  failed: "text-destructive",
};

/**
 * Flat grid of generated contents. Images sit directly on the page,
 * framed by hairlines only — no raised cards or shadows.
 */
export function ContentsBrowser({ contents }: { contents: Content[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const visible = filter === "all" ? contents : contents.filter((c) => c.content_type === filter);

  return (
    <div className="space-y-6">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {(Object.keys(contentTypeLabel) as ContentType[]).map((type) => (
            <TabsTrigger key={type} value={type}>
              {contentTypePlural[type]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {visible.length === 0 ? (
        <p className="py-10 text-sm text-muted-foreground">Nothing in this format yet.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((c) => (
            <li key={c.id} className="group">
              <div className="aspect-[4/5] overflow-hidden bg-muted">
                {c.media_urls[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element -- storage URLs are external and not known in advance
                  <img src={c.media_urls[0]} alt="" className="size-full object-cover" />
                ) : null}
              </div>
              <div className="mt-3 flex items-baseline justify-between gap-2 border-b pb-2 font-mono text-[10px] uppercase tracking-[0.14em]">
                <span>{contentTypeLabel[c.content_type]}</span>
                <span className={statusStyle[c.status]}>{c.status}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm">{c.caption}</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {formatDate(c.published_at ?? c.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
