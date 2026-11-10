import Link from "next/link";

import type { Post, ContentStatus } from "@/lib/api/types";
import { formatDate } from "@/lib/format";

const statusStyle: Record<ContentStatus, string> = {
  generated: "text-muted-foreground",
  publishing: "text-muted-foreground",
  published: "text-signal",
  failed: "text-destructive",
};

/**
 * Flat grid of generated contents. Images sit directly on the page,
 * framed by hairlines only — no raised cards or shadows.
 * Gets one page, already filtered by the server.
 */
export function ContentsBrowser({ contents }: { contents: Post[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {contents.map((p) => (
        <li key={p.id} className="group">
          <Link href={`/contents/${p.id}`} className="block">
            <div className="aspect-4/5 overflow-hidden bg-muted">
              {p.slides[0].url ? (
                // eslint-disable-next-line @next/next/no-img-element -- storage URLs are external and not known in advance
                <img src={p.slides[0].url} alt="" className="size-full object-cover" />
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
  );
}
