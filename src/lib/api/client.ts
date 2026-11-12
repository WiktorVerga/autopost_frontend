/**
 * Browser-side API client (Client Components, event handlers, forms).
 * Calls go to `/api/*` on the same origin, so the session cookie is sent
 * automatically and there is no CORS to configure.
 */
import { BROWSER_API_PREFIX, endpoints } from "./endpoints";
import { toApiError } from "./errors";
import {
  CreateCollectionInput,
  CreateIdeaInput,
  CreateProgramInput, CreateTemplateInput,
  Id,
  Idea,
  IdeaCollection,
  InstagramOAuthLogin,
  Post,
  Program, Template,
  UpdateCollectionInput,
  UpdateIdeaInput,
  UpdateProgramInput, UpdateTemplateInput,
} from "./types";

type Options = Omit<RequestInit, "body"> & { body?: unknown };

export async function apiFetch<T>(path: string, options: Options = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  const res = await fetch(`${BROWSER_API_PREFIX}${path}`, {
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    ...rest,
  });

  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  logout: () => apiFetch<void>(endpoints.auth.logout, {method: "POST"}),
  createCollection: (input: CreateCollectionInput) =>
      apiFetch<IdeaCollection>(endpoints.collections, {method: "POST", body: input}),
  updateCollection: (id: Id, input: UpdateCollectionInput) =>
      apiFetch<IdeaCollection>(`${endpoints.collections}/${id}`, {method: "PATCH", body: input}),
  deleteCollection: (id: Id) =>
      apiFetch<void>(`${endpoints.collections}/${id}`, {method: "DELETE"}),
  createIdea: (input: CreateIdeaInput) =>
      apiFetch<Idea>(endpoints.ideas, {method: "POST", body: input}),
  updateIdea: (id: Id, input: UpdateIdeaInput) =>
      apiFetch<Idea>(`${endpoints.ideas}/${id}`, {method: "PATCH", body: input}),
  deleteIdea: (id: Id) =>
      apiFetch<void>(`${endpoints.ideas}/${id}`, {method: "DELETE"}),
  createProgram: (input: CreateProgramInput) =>
      apiFetch<Program>(endpoints.programs, {method: "POST", body: input}),
  updateProgram: (id: Id, input: UpdateProgramInput) =>
      apiFetch<Program>(`${endpoints.programs}/${id}`, {method: "PATCH", body: input}),
  deleteProgram: (id: Id) =>
      apiFetch<void>(`${endpoints.programs}/${id}`, {method: "DELETE"}),
  /** Runs the pipeline now, outside the schedule, and returns the resulting post. */
  runProgram: (id: Id) =>
      apiFetch<Post>(`${endpoints.programs}/${id}/run`, {method: "POST"}),
  getPost: (id: Id) => apiFetch<Post>(`${endpoints.posts}/${id}`),
  publishPost: (id: Id) =>
      apiFetch<Post>(`${endpoints.posts}/${id}/publish`, {method: "POST"}),
  instagramLogin: () =>
      apiFetch<InstagramOAuthLogin>(endpoints.instagram.connect),
  disconnectInstagramAccount: (id: Id) =>
      apiFetch<void>(`${endpoints.instagram.disconnect}/${id}`, {method: "DELETE"}),
  createTemplate: ( input: CreateTemplateInput) =>
      apiFetch<Template>(endpoints.templates.list, {method: "POST", body: input}),
  updateTemplate: (id: Id, input: UpdateTemplateInput) =>
      apiFetch<Template>(`${endpoints.templates.list}/${id}`, {method: "PATCH", body: input}),
  deleteTemplate: (id: Id) =>
      apiFetch<void>(`${endpoints.templates.list}/${id}`, {method: "DELETE"}),
};
