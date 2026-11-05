"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon, LoaderCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DEFAULT_PAGE_PARAM, withParams, type Paginated } from "@/lib/list-params";
import { cn } from "@/lib/utils";

/**
 * Previous / next pager for a list paginated with `paginate()`.
 * Keeps the current filters in the links. Renders nothing when everything fits
 * in one page.
 *
 * Uses `useSearchParams`: render it inside the <Suspense> boundary of the list.
 */
export function ListPagination({
  pagination,
  pageParam = DEFAULT_PAGE_PARAM,
  className,
}: {
  pagination: Pick<Paginated<unknown>, "page" | "hasPrev" | "hasNext" | "from" | "to">;
  pageParam?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { page, hasPrev, hasNext, from, to } = pagination;

  if (!hasPrev && !hasNext) return null;

  const href = (target: number) =>
    `${pathname}${withParams(searchParams, { [pageParam]: target }, pageParam)}`;

  return (
    <nav aria-label="Pagination" className={cn("flex items-center justify-between gap-4 border-t pt-4", className)}>
      <p className="font-mono text-xs text-muted-foreground">
        {from > 0 ? `${from}–${to}` : "—"} · page {page}
      </p>
      <div className="flex items-center gap-2">
        <PageLink href={hasPrev ? href(page - 1) : undefined} direction="prev" />
        <PageLink href={hasNext ? href(page + 1) : undefined} direction="next" />
      </div>
    </nav>
  );
}

function PageLink({ href, direction }: { href?: string; direction: "prev" | "next" }) {
  const label = direction === "prev" ? "Previous" : "Next";

  if (!href) {
    return (
      <Button variant="outline" size="sm" disabled>
        {direction === "prev" ? <ChevronLeftIcon /> : null}
        {label}
        {direction === "next" ? <ChevronRightIcon /> : null}
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" asChild>
      <Link href={href} rel={direction}>
        <PageLinkContent direction={direction} label={label} />
      </Link>
    </Button>
  );
}

/** Child of the <Link>, so `useLinkStatus` can show the pending navigation. */
function PageLinkContent({ direction, label }: { direction: "prev" | "next"; label: string }) {
  const { pending } = useLinkStatus();
  const Icon = pending ? LoaderCircleIcon : direction === "prev" ? ChevronLeftIcon : ChevronRightIcon;
  const icon = <Icon className={pending ? "animate-spin" : undefined} />;

  return (
    <>
      {direction === "prev" ? icon : null}
      {label}
      {direction === "next" ? icon : null}
    </>
  );
}
