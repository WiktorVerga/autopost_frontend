/**
 * URL-driven pagination and filters for server-paginated lists.
 *
 * The state of a list (page + filters) lives in the URL search params, so it
 * survives reloads, can be shared and works with the back button. The page reads
 * it with `parseListParams`, asks the backend for one page with `listQuery`, and
 * trims the result with `paginate`.
 *
 * The backend answers with plain arrays (no total count): we ask for
 * `pageSize + 1` items and use the extra one only to know if a next page exists.
 *
 * Pure module: safe to import from Server and Client Components.
 */

export const DEFAULT_PAGE_SIZE = 20;
export const DEFAULT_PAGE_PARAM = "page";

type RawSearchParams = Record<string, string | string[] | undefined>;

export type ListParams<F extends string = string> = {
  page: number;
  pageSize: number;
  /** Items to skip on the backend. */
  skip: number;
  /** Items to request from the backend (`pageSize + 1`). */
  limit: number;
  /** Active filters, trimmed; empty values are `undefined`. */
  filters: Record<F, string | undefined>;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  hasPrev: boolean;
  hasNext: boolean;
  /** 1-based index of the first item shown (0 when the page is empty). */
  from: number;
  /** 1-based index of the last item shown. */
  to: number;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

/** Accepted values of a filter: a fixed list, or a check. */
type FilterValidator = readonly string[] | ((value: string) => boolean);

/** Validator for filters that hold an id (positive integer). */
export const isId = (value: string) => /^[1-9]\d*$/.test(value);

/**
 * Reads page and filters from the search params.
 * Unknown params are ignored; an invalid page falls back to 1; a filter value
 * rejected by its validator is ignored (so a hand-edited URL can't make the
 * backend answer 422).
 */
export function parseListParams<const F extends string = never>(
  searchParams: RawSearchParams,
  options: {
    filters?: readonly F[];
    validate?: Partial<Record<F, FilterValidator>>;
    pageSize?: number;
    pageParam?: string;
  } = {},
): ListParams<F> {
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  const rawPage = Number(first(searchParams[options.pageParam ?? DEFAULT_PAGE_PARAM]));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  const filters = {} as Record<F, string | undefined>;
  for (const name of options.filters ?? []) {
    const value = first(searchParams[name])?.trim() || undefined;
    const validator = options.validate?.[name];
    const valid =
      value === undefined ||
      validator === undefined ||
      (typeof validator === "function" ? validator(value) : validator.includes(value));
    filters[name] = valid ? value : undefined;
  }

  return { page, pageSize, skip: (page - 1) * pageSize, limit: pageSize + 1, filters };
}

/** True when at least one filter is set. */
export function hasActiveFilters(params: ListParams) {
  return Object.values(params.filters).some(Boolean);
}

/**
 * Query string for the backend list endpoints (`?search=…&skip=…&limit=…`).
 * `rename` maps a URL filter name to the backend param (e.g. `{ q: "search" }`).
 */
export function listQuery<F extends string>(
  params: ListParams<F>,
  options: {
    rename?: Partial<Record<NoInfer<F>, string>>;
    /** Filters not sent as they are (e.g. "active" → `is_active=true`): handle them in `extra`. */
    omit?: readonly NoInfer<F>[];
    extra?: Record<string, string | number | boolean | undefined>;
  } = {},
) {
  const query = new URLSearchParams();
  for (const [name, value] of Object.entries(params.filters) as [F, string | undefined][]) {
    if (value && !options.omit?.includes(name)) query.set(options.rename?.[name] ?? name, value);
  }
  for (const [name, value] of Object.entries(options.extra ?? {})) {
    if (value !== undefined && value !== "") query.set(name, String(value));
  }
  query.set("skip", String(params.skip));
  query.set("limit", String(params.limit));
  return `?${query.toString()}`;
}

/** Drops the look-ahead item and computes the page info. */
export function paginate<T>(items: T[], params: ListParams): Paginated<T> {
  const pageItems = items.slice(0, params.pageSize);
  return {
    items: pageItems,
    page: params.page,
    pageSize: params.pageSize,
    hasPrev: params.page > 1,
    hasNext: items.length > params.pageSize,
    from: pageItems.length ? params.skip + 1 : 0,
    to: params.skip + pageItems.length,
  };
}

/**
 * Copy of `current` with `changes` applied (`undefined`/empty removes a param).
 * Changing anything but the page resets the page to 1.
 */
export function withParams(
  current: URLSearchParams | string,
  changes: Record<string, string | number | undefined>,
  pageParam = DEFAULT_PAGE_PARAM,
) {
  const next = new URLSearchParams(current);
  for (const [name, value] of Object.entries(changes)) {
    if (value === undefined || value === "") next.delete(name);
    else next.set(name, String(value));
  }
  if (!(pageParam in changes)) next.delete(pageParam);
  if (next.get(pageParam) === "1") next.delete(pageParam);
  const qs = next.toString();
  return qs ? `?${qs}` : "";
}
