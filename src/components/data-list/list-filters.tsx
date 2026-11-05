"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { LoaderCircleIcon, SearchIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEFAULT_PAGE_PARAM, withParams } from "@/lib/list-params";
import { cn } from "@/lib/utils";

export type ListFilter =
  | {
      type: "search";
      /** Search param that holds the value (e.g. "q"). */
      param: string;
      placeholder?: string;
      label?: string;
      maxLength?: number;
    }
  | {
      /** Dropdown: good for long or dynamic option lists (collections, programs…). */
      type: "select";
      param: string;
      label: string;
      options: readonly FilterOption[];
      /** Label of the "no filter" option. */
      allLabel?: string;
    }
  | {
      /** Segmented tabs: good for a few fixed values (statuses). Takes a full row. */
      type: "tabs";
      param: string;
      label: string;
      options: readonly FilterOption[];
      allLabel?: string;
    };

export type FilterOption = { value: string; label: string };

const ALL = "__all__";
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Filter bar for a list whose state lives in the URL.
 * Every change replaces the search params (resetting the page) and the server
 * re-renders the list; the old results stay on screen until the new ones arrive.
 *
 * Uses `useSearchParams`: render it inside a <Suspense> boundary
 * (see `ListFiltersFallback`).
 */
export function ListFilters({
  filters,
  pageParam = DEFAULT_PAGE_PARAM,
  className,
}: {
  filters: readonly ListFilter[];
  pageParam?: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = useCallback(
    (changes: Record<string, string | undefined>) => {
      startTransition(() => {
        router.replace(`${pathname}${withParams(searchParams, changes, pageParam)}`, { scroll: false });
      });
    },
    [router, pathname, searchParams, pageParam],
  );

  const active = filters.some((f) => searchParams.get(f.param));
  const clearAll = () => update(Object.fromEntries(filters.map((f) => [f.param, undefined])));

  return (
    <div
      role="search"
      aria-busy={pending}
      className={cn("flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center", className)}
    >
      {filters.map((filter) =>
        filter.type === "search" ? (
          <SearchField
            key={filter.param}
            filter={filter}
            urlValue={searchParams.get(filter.param) ?? ""}
            pending={pending}
            onCommit={(value) => update({ [filter.param]: value })}
          />
        ) : filter.type === "tabs" ? (
          <Tabs
            key={filter.param}
            value={searchParams.get(filter.param) ?? ALL}
            onValueChange={(value) => update({ [filter.param]: value === ALL ? undefined : value })}
            className="w-full"
          >
            <TabsList aria-label={filter.label}>
              <TabsTrigger value={ALL}>{filter.allLabel ?? "All"}</TabsTrigger>
              {filter.options.map((option) => (
                <TabsTrigger key={option.value} value={option.value}>
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        ) : (
          <Select
            key={filter.param}
            value={searchParams.get(filter.param) ?? ALL}
            onValueChange={(value) => update({ [filter.param]: value === ALL ? undefined : value })}
          >
            <SelectTrigger aria-label={filter.label} className="w-full sm:w-48">
              {/* Explicit label: Radix only finds it once the items mount, so SSR would show it empty. */}
              <SelectValue placeholder={filter.label}>
                {filter.options.find((o) => o.value === searchParams.get(filter.param))?.label ??
                  filter.allLabel ??
                  `All ${filter.label.toLowerCase()}`}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{filter.allLabel ?? `All ${filter.label.toLowerCase()}`}</SelectItem>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
      )}

      {active ? (
        <Button type="button" variant="ghost" size="sm" onClick={clearAll} className="self-start sm:self-auto">
          <XIcon />
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}

function SearchField({
  filter,
  urlValue,
  pending,
  onCommit,
}: {
  filter: Extract<ListFilter, { type: "search" }>;
  urlValue: string;
  pending: boolean;
  onCommit: (value: string) => void;
}) {
  const [value, setValue] = useState(urlValue);
  // Last value this field wrote to the URL, and last URL value seen: a URL change
  // we didn't make (back button, "Clear filters") overwrites what's typed.
  const [committed, setCommitted] = useState(urlValue);
  const [seen, setSeen] = useState(urlValue);
  if (urlValue !== seen) {
    setSeen(urlValue);
    if (urlValue !== committed) {
      setCommitted(urlValue);
      setValue(urlValue);
    }
  }

  const commit = useCallback(
    (next: string) => {
      setCommitted(next);
      onCommit(next);
    },
    [onCommit],
  );

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed === urlValue) return;
    const timer = setTimeout(() => commit(trimmed), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value, urlValue, commit]);

  return (
    <form
      className="relative w-full sm:max-w-xs"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim() !== urlValue) commit(value.trim());
      }}
    >
      {pending ? (
        <LoaderCircleIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : (
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      )}
      <Input
        type="search"
        aria-label={filter.label ?? "Search"}
        placeholder={filter.placeholder ?? "Search…"}
        maxLength={filter.maxLength ?? 200}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.preventDefault();
            setValue("");
          }
        }}
        className="pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setValue("")}
          className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded-sm text-muted-foreground hover:text-foreground"
        >
          <XIcon className="size-3.5" />
        </button>
      ) : null}
    </form>
  );
}

/**
 * Placeholder for the <Suspense> around `ListFilters`: same controls, disabled,
 * so the layout doesn't jump when the real ones mount.
 */
export function ListFiltersFallback({
  filters = [{ type: "search", param: "q" }],
  className,
}: {
  filters?: readonly ListFilter[];
  className?: string;
}) {
  return (
    <div aria-hidden className={cn("flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center", className)}>
      {filters.map((filter) =>
        filter.type === "search" ? (
          <div key={filter.param} className="relative w-full sm:max-w-xs">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input disabled tabIndex={-1} placeholder={filter.placeholder ?? "Search…"} className="pl-9" />
          </div>
        ) : filter.type === "tabs" ? (
          <Tabs key={filter.param} value={ALL} className="w-full">
            <TabsList>
              <TabsTrigger value={ALL} disabled>
                {filter.allLabel ?? "All"}
              </TabsTrigger>
              {filter.options.map((option) => (
                <TabsTrigger key={option.value} value={option.value} disabled>
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        ) : (
          <Select key={filter.param} disabled>
            <SelectTrigger tabIndex={-1} className="w-full sm:w-48">
              <SelectValue placeholder={filter.allLabel ?? `All ${filter.label.toLowerCase()}`} />
            </SelectTrigger>
          </Select>
        ),
      )}
    </div>
  );
}
