import type { JsonObject } from "@/lib/template/schema";

/**
 * Local cache of the unsaved edits made to a user's template in the editor.
 *
 * Only the user's own templates are cached, never the bases. A draft lives in
 * localStorage and is dropped when:
 *   - more than DRAFT_TTL_MS passed since the last edit;
 *   - the template was saved on the server after the draft was written
 *     (its `updated_at` changed), so the draft refers to an outdated version.
 */

const DRAFT_TTL_MS = 60 * 60 * 1000; // 1h
const KEY_PREFIX = "autopost:template-draft:";

type StoredDraft = {
  values: JsonObject;
  /** Epoch ms of the last edit. */
  savedAt: number;
  /** `updated_at` of the server template the draft was based on. */
  serverUpdatedAt: string;
};

export type TemplateDraft = {
  values: JsonObject;
  savedAt: Date;
};

function keyFor(templateId: number) {
  return `${KEY_PREFIX}${templateId}`;
}

function isPlainObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parse(raw: string | null): StoredDraft | null {
  if (!raw) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (
      isPlainObject(data) &&
      isPlainObject(data.values) &&
      typeof data.savedAt === "number" &&
      typeof data.serverUpdatedAt === "string"
    ) {
      return data as unknown as StoredDraft;
    }
  } catch {
    // Corrupted entry: treated as missing.
  }
  return null;
}

function isExpired(draft: StoredDraft, now = Date.now()) {
  return now - draft.savedAt > DRAFT_TTL_MS;
}

/**
 * Returns the draft of a template, or null if missing, expired or outdated.
 * Read-only (safe to call while rendering): stale entries are removed by
 * `pruneExpiredTemplateDrafts` and overwritten by the next save/clear.
 */
export function loadTemplateDraft(templateId: number, serverUpdatedAt: string): TemplateDraft | null {
  try {
    const draft = parse(localStorage.getItem(keyFor(templateId)));
    if (!draft || isExpired(draft) || draft.serverUpdatedAt !== serverUpdatedAt) return null;
    return { values: draft.values, savedAt: new Date(draft.savedAt) };
  } catch {
    // localStorage unavailable (private mode, blocked storage…).
    return null;
  }
}

export function saveTemplateDraft(templateId: number, values: JsonObject, serverUpdatedAt: string) {
  const draft: StoredDraft = { values, savedAt: Date.now(), serverUpdatedAt };
  try {
    localStorage.setItem(keyFor(templateId), JSON.stringify(draft));
  } catch {
    // Quota exceeded or storage unavailable: the draft is simply not kept.
  }
}

export function clearTemplateDraft(templateId: number) {
  try {
    localStorage.removeItem(keyFor(templateId));
  } catch {
    // Storage unavailable: nothing to clear.
  }
}

/** Removes the expired drafts of every template, so old entries don't pile up. */
export function pruneExpiredTemplateDrafts() {
  try {
    const now = Date.now();
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key?.startsWith(KEY_PREFIX)) continue;
      const draft = parse(localStorage.getItem(key));
      if (!draft || isExpired(draft, now)) localStorage.removeItem(key);
    }
  } catch {
    // Storage unavailable: nothing to prune.
  }
}
