/**
 * Server-side API client (Server Components, Server Actions, Route Handlers).
 * Calls the backend directly and forwards the user's cookies.
 *
 * It reads `cookies()`, so with Cache Components every component that uses it
 * must be rendered inside a <Suspense> boundary.
 */
import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";

import { endpoints } from "./endpoints";
import { ApiError, toApiError } from "./errors";
import {
  Post,
  Idea,
  IdeaCollection,
  InstagramAccount,
  LogEntry,
  Program,
  User,
  Template,
  TemplateDetail, TemplateBase, TemplateBaseDetail, Id,
} from "./types";

const API_URL = process.env.API_URL ?? "https://localhost:8000";

async function rawFetch(path: string, init: RequestInit, accept: string): Promise<Response> {
  const cookieHeader = (await cookies()).toString();

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        Accept: accept,
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        ...init.headers,
      },
    });
  } catch (cause) {
    // Network error: backend not running or unreachable.
    throw new ApiError(503, "Can't reach the Autopost API", cause);
  }

  if (!res.ok) throw await toApiError(res);
  return res;
}

export async function serverFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await rawFetch(path, init, "application/json");
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Same as `serverFetch`, for endpoints that answer with plain text or HTML. */
export async function serverFetchText(path: string, init: RequestInit = {}): Promise<string> {
  const res = await rawFetch(path, init, "text/html, text/plain;q=0.9, */*;q=0.8");
  return res.text();
}

// `cache` dedupes identical calls within the same request.
export const serverApi = {
  me: cache(() => serverFetch<User>(endpoints.auth.me)),
  collections: cache(() => serverFetch<IdeaCollection[]>(endpoints.collections)),
  collection: cache((id: number) =>
    serverFetch<IdeaCollection>(`${endpoints.collections}/${id}`),
  ),
  ideas: cache(() => serverFetch<Idea[]>(endpoints.ideas)),
  idea: cache((id: number) => serverFetch<Idea>(`${endpoints.ideas}/${id}`)),
  collectionIdeas: cache((collectionId: number) =>
    serverFetch<Idea[]>(`${endpoints.ideas}?idea_collection_id=${collectionId}`),
  ),
  programs: cache(() => serverFetch<Program[]>(endpoints.programs)),
  program: cache((id: number) => serverFetch<Program>(`${endpoints.programs}/${id}`)),
  posts: cache(() => serverFetch<Post[]>(endpoints.posts)),
  post: cache((id: number) => serverFetch<Post>(`${endpoints.posts}/${id}`)),
  logs: cache(() => serverFetch<LogEntry[]>(endpoints.logs)),
  programLogs: cache((programId: number, limit = 20) =>
    serverFetch<LogEntry[]>(`${endpoints.logs}?program_id=${programId}&limit=${limit}`),
  ),
  templates: cache(() => serverFetch<Template[]>(endpoints.templates.list)),
  baseTemplates: cache(() => serverFetch<TemplateBase[]>(endpoints.templates.bases)),
  baseDetails: cache((key: string) => serverFetch<TemplateBaseDetail>(`${endpoints.templates.bases}/${key}`)),
  baseHtml: cache((key: string) => serverFetchText(endpoints.templates.baseHtml(key))),
  template: cache((id: number) =>
    serverFetch<TemplateDetail>(`${endpoints.templates.list}/${id}`),
  ),
  instagramAccounts: cache(() => serverFetch<InstagramAccount[]>(endpoints.instagram.accounts)),
};

/** Runs a request and returns `{ data }` or `{ error }` instead of throwing. */
export async function settle<T>(
  promise: Promise<T>,
): Promise<{ data: T; error?: undefined } | { data?: undefined; error: ApiError }> {
  try {
    return { data: await promise };
  } catch (e) {
    if (e instanceof ApiError) return { error: e };
    throw e;
  }
}
