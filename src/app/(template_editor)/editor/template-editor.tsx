"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, SaveIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { setIn, type JsonObject, type JsonSchema, type Path } from "@/lib/template/schema";
import { SettingsPanel } from "./settings-panel";
import { TemplatePreview } from "./template-preview";

type TemplateEditorProps = {
  /** "base": new template from a base. "template": edit an existing template. */
  mode: "base" | "template";
  name: string;
  schema: JsonSchema;
  /** Raw HTML of the base template. */
  html: string;
  /** Customization with every default filled in. */
  initialValues: JsonObject;
};

export function TemplateEditor({ mode, name, schema, html, initialValues }: TemplateEditorProps) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);

  const dirty = useMemo(
    () => JSON.stringify(values) !== JSON.stringify(initialValues),
    [values, initialValues],
  );

  const handleChange = useCallback((path: Path, value: unknown) => {
    setValues((current) => setIn(current, path, value));
  }, []);

  function handleExit() {
    // Opened from a direct link there is no page to go back to.
    if (window.history.length > 1) router.back();
    else router.push("/templates");
  }

  function handleSave() {
    // TODO: send `values` to the backend (create from a base / update a template).
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

        <Button size="sm" onClick={handleSave}>
          <SaveIcon />
          Save
        </Button>
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
