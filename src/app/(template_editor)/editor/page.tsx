import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { ArrowLeftIcon } from "lucide-react";

import { ApiNotice } from "@/components/api-notice";
import { Skeleton } from "@/components/ui/skeleton";
import { serverApi, settle } from "@/lib/api/server";
import type { TemplateDefinition } from "@/lib/api/types";
import { buildDefaults, deepMerge, parseSchema, type JsonObject, type JsonSchema } from "@/lib/template/schema";
import { TemplateEditor } from "./template-editor";

export const metadata: Metadata = { title: "Template editor" };

/**
 * Template editor.
 *   /editor?base=<key>     → new template starting from a base (schema defaults)
 *   /editor?template=<id>  → edit a template of the user (its saved definition)
 */
export default function EditorPage({ searchParams }: PageProps<"/editor">) {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      {searchParams.then((sp) => (
        <EditorLoader base={first(sp.base)} templateId={first(sp.template)} />
      ))}
    </Suspense>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function EditorLoader({ base, templateId }: { base?: string; templateId?: string }) {
  let baseKey: string;
  let name: string;
  let description: string | null = null;
  let updatedAt: string | null = null;
  let definition: TemplateDefinition | null = null;

  if (templateId) {
    const id = Number(templateId);
    if (!Number.isInteger(id) || id <= 0) notFound();

    const { data: template, error } = await settle(serverApi.template(id));
    if (error) {
      if (error.status === 404) notFound();
      return <EditorNotice><ApiNotice error={error} /></EditorNotice>;
    }
    baseKey = template.base_template;
    name = template.name;
    description = template.description;
    updatedAt = template.updated_at;
    definition = template.definition_json;
  } else if (base) {
    baseKey = base;
    name = base;
  } else {
    notFound();
  }

  const [detail, html] = await Promise.all([
    settle(serverApi.baseDetails(baseKey)),
    settle(serverApi.baseHtml(baseKey)),
  ]);
  if (detail.error?.status === 404) notFound();
  const error = detail.error ?? html.error;
  if (error) return <EditorNotice><ApiNotice error={error} /></EditorNotice>;

  let schema: JsonSchema;
  try {
    schema = parseSchema(detail.data!.json_schema);
  } catch {
    return (
      <EditorNotice>
        <Message
          title="The template settings could not be read"
          body={`The schema of the base "${baseKey}" is not a valid JSON object.`}
        />
      </EditorNotice>
    );
  }

  // Defaults of the base, overridden by the template's own definition.
  const initialValues = deepMerge(buildDefaults(schema, schema), definition ?? {}) as JsonObject;

  return (
    <TemplateEditor
      mode={templateId ? "template" : "base"}
      name={name}
      description={description}
      updatedAt={updatedAt}
      schema={schema}
      html={html.data!}
      initialValues={initialValues}
      templateid={Number(templateId)}
      baseKey={baseKey}
    />
  );
}

function EditorNotice({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-5">
      <div className="w-full max-w-md">{children}</div>
      <Link
        href="/templates"
        className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3.5" />
        All templates
      </Link>
    </div>
  );
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-l-2 border-signal bg-muted/60 px-4 py-3 text-sm">
      <p className="font-medium">{title}</p>
      <p className="mt-0.5 text-muted-foreground">{body}</p>
    </div>
  );
}

function EditorSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center justify-between border-b px-3">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="flex flex-1 items-center justify-center bg-muted/50">
          <Skeleton className="aspect-4/5 h-3/4 rounded-none" />
        </div>
        <div className="hidden w-96 space-y-4 border-l p-5 lg:block">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
