"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, RotateCcwIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import {
  clearTemplateDraft,
  loadTemplateDraft,
  pruneExpiredTemplateDrafts,
  saveTemplateDraft,
} from "@/lib/template/draft-cache";
import { setIn, type JsonObject, type JsonSchema, type Path } from "@/lib/template/schema";
import { SettingsPanel } from "./settings-panel";
import { TemplatePreview } from "./template-preview";
import SaveTemplateDialog from "@/app/(template_editor)/editor/save-template-dialog";

/** Delay before an edit is written to the local draft cache. */
const DRAFT_WRITE_DELAY_MS = 400;

const DRAFT_TOAST_ID = "template-draft-restored";

const subscribeNoop = () => () => {};

type TemplateEditorProps = {
  /** "base": new template from a base. "template": edit an existing template. */
  mode: "base" | "template";
  name: string;
  schema: JsonSchema;
  /** Raw HTML of the base template. */
  html: string;
  /** Customization with every default filled in. */
  initialValues: JsonObject;
  templateid: number;
  baseKey: string;
  description: string | null;
  /** `updated_at` of the template on the server; null when starting from a base. */
  updatedAt: string | null;
};

/**
 * The editor starts from scratch on every entry: Cache Components keep the
 * page alive across navigations (React <Activity>), so without a key the
 * unsaved values of a template would leak into the next template or base.
 *   - `bfcacheId` changes on each push/replace (a new entry), not on back/forward;
 *   - the identity changes when only the search params change (?template ↔ ?base).
 */
export function TemplateEditor(props: TemplateEditorProps) {
  const { bfcacheId } = useRouter();
  const identity = props.mode === "template" ? `template:${props.templateid}` : `base:${props.baseKey}`;
  return <EditorWorkspace key={`${bfcacheId}:${identity}`} {...props} />;
}

function EditorWorkspace({
  mode,
  name,
  schema,
  html,
  initialValues,
  templateid,
  baseKey,
  description,
  updatedAt,
}: TemplateEditorProps) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);

  // Drafts are kept only for the user's own templates, never for the bases.
  const draftUpdatedAt = mode === "template" && templateid > 0 ? updatedAt : null;

  const initialJson = useMemo(() => JSON.stringify(initialValues), [initialValues]);
  const dirty = useMemo(() => JSON.stringify(values) !== initialJson, [values, initialJson]);

  // localStorage only exists in the browser: the draft is looked up after
  // hydration, so the server render and the first client render match.
  const hydrated = useSyncExternalStore(subscribeNoop, () => true, () => false);
  // Server version the draft was looked up for. Until it matches, nothing is
  // written: the first render still shows the server values and would wipe the draft.
  const [draftCheckedFor, setDraftCheckedFor] = useState<string | null>(null);
  // Draft restored on start: kept as is (same expiry) until it is edited again.
  const [restoredDraft, setRestoredDraft] = useState<{ json: string; savedAt: Date } | null>(null);
  const draftChecked = draftUpdatedAt === null || draftCheckedFor === draftUpdatedAt;

  // On start: restore the local draft if there is a valid one, otherwise keep
  // the values downloaded from the server. Done while rendering (not in an
  // effect) so the editor never paints the server values first.
  if (hydrated && draftUpdatedAt !== null && draftCheckedFor !== draftUpdatedAt) {
    setDraftCheckedFor(draftUpdatedAt);
    const draft = loadTemplateDraft(templateid, draftUpdatedAt);
    const draftJson = draft ? JSON.stringify(draft.values) : null;
    if (draft && draftJson && draftJson !== initialJson) {
      setValues(draft.values);
      setRestoredDraft({ json: draftJson, savedAt: draft.savedAt });
    }
  }

  useEffect(() => {
    pruneExpiredTemplateDrafts();
  }, []);

  // Read by the "Discard" action, which may run after a refresh.
  const latestInitialValues = useRef(initialValues);
  useEffect(() => {
    latestInitialValues.current = initialValues;
  }, [initialValues]);

  // Effects re-run every time <Activity> shows the page again: the toast is
  // shown once per restored draft, not on every return to the editor.
  const draftToastShownFor = useRef<Date | null>(null);
  const restoredAt = restoredDraft?.savedAt;
  useEffect(() => {
    if (!restoredAt) {
      // A toast left by the previous editor (another template) no longer applies.
      toast.dismiss(DRAFT_TOAST_ID);
      return;
    }
    if (draftToastShownFor.current === restoredAt) return;
    draftToastShownFor.current = restoredAt;

    toast("Unsaved changes restored", {
      id: DRAFT_TOAST_ID,
      description: `Last edited ${formatDateTime(restoredAt.toISOString())}. They are kept for 1 hour.`,
      duration: 8_000,
      action: {
        label: "Discard",
        onClick: () => {
          clearTemplateDraft(templateid);
          setValues(latestInitialValues.current);
        },
      },
    });
  }, [restoredAt, templateid]);

  // Write the pending draft right away (used when leaving the editor).
  const flushDraft = useRef<(() => void) | null>(null);

  // Keep the draft in sync with the edits; back to the server values = no draft.
  useEffect(() => {
    if (draftUpdatedAt === null || !draftChecked) return;

    // Still the restored draft: rewriting it would only push its expiry forward.
    if (dirty && JSON.stringify(values) === restoredDraft?.json) return;

    const write = () => {
      flushDraft.current = null;
      if (dirty) saveTemplateDraft(templateid, values, draftUpdatedAt);
      else clearTemplateDraft(templateid);
    };
    flushDraft.current = write;
    const timer = setTimeout(write, DRAFT_WRITE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [values, dirty, templateid, draftUpdatedAt, draftChecked, restoredDraft]);

  // Don't lose the last edits when the tab is closed or the editor unmounts.
  useEffect(() => {
    const flush = () => flushDraft.current?.();
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);

  // Nothing is reset until the user confirms in the toast.
  function askResetConfirmation() {
    toast("Discard all unsaved changes?", {
      id: "template-editor-reset",
      description:
        mode === "base"
          ? "The settings go back to the defaults of the base."
          : "The template goes back to the version saved on the server.",
      duration: 10_000,
      action: {
        label: "Reset",
        onClick: () => {
          if (draftUpdatedAt !== null) clearTemplateDraft(templateid);
          setValues(latestInitialValues.current);
          toast.dismiss(DRAFT_TOAST_ID);
        },
      },
      cancel: { label: "Cancel", onClick: () => {} },
    });
  }

  const handleChange = useCallback((path: Path, value: unknown) => {
    setValues((current) => setIn(current, path, value));
  }, []);

  function handleExit() {
    // Opened from a direct link there is no page to go back to.
    if (window.history.length > 1) router.back();
    else router.push("/templates");
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b px-3">
        <Button variant="ghost" size="sm" onClick={handleExit}>
          <ArrowLeftIcon />
          Exit
        </Button>

        <div className="flex min-w-0 flex-1 items-baseline justify-center gap-3">
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground sm:inline">
            {mode === "base" ? "New from base" : "Template"}
          </span>
          <span className="truncate font-serif text-xl leading-none">{name}</span>
          {dirty ? (
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-signal">
              Unsaved
            </span>
          ) : null}
        </div>

        <Button variant="ghost" size="sm" disabled={!dirty} onClick={askResetConfirmation}>
          <RotateCcwIcon />
          Reset
        </Button>

        <SaveTemplateDialog dirty={dirty} templateid={templateid} baseKey={baseKey} definition={values} nameTemp={name} descriptionTemp={description}/>

      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <TemplatePreview html={html} values={values} className="min-h-0 flex-1" />
        <SettingsPanel
          schema={schema}
          values={values}
          onChange={handleChange}
          className="h-[45dvh] shrink-0 border-t lg:h-auto lg:w-96 lg:border-t-0 lg:border-l"
        />
      </div>
    </div>
  );
}
