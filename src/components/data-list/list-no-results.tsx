import Link from "next/link";
import { SearchXIcon } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

/**
 * Empty result of a filtered list, or a page past the end.
 * Different from the "nothing created yet" empty state: here data exists, the
 * current filters/page just don't match any of it.
 */
export function ListNoResults({
  resetHref,
  title = "No results",
  description = "Nothing matches the current filters.",
  resetLabel = "Clear filters",
}: {
  /** Where the reset button leads (usually the list path without params). */
  resetHref: string;
  title?: string;
  description?: string;
  resetLabel?: string;
}) {
  return (
    <EmptyState icon={SearchXIcon} title={title} description={description}>
      <Button variant="outline" size="sm" asChild>
        <Link href={resetHref} scroll={false}>
          {resetLabel}
        </Link>
      </Button>
    </EmptyState>
  );
}
