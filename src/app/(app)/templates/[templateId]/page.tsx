import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { ArrowLeftIcon, ArrowRightIcon, LayoutTemplateIcon, PencilIcon } from "lucide-react";

import { ApiNotice } from "@/components/api-notice";
import { PageHeader, SectionTitle } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { serverApi, settle } from "@/lib/api/server";
import type { TemplateFormat } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";
import { DeleteTemplateButton } from "./delete-template-button";

export const metadata: Metadata = { title: "Template" };

const formatLabel: Record<TemplateFormat, string> = {
  carousel: "Carousel",
  reel: "Reel",
};

export default function TemplatePage({ params }: PageProps<"/templates/[templateId]">) {
  return (
    <div className="space-y-6">
      <Link
        href="/templates"
        className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-3.5" />
        All templates
      </Link>

      <Suspense fallback={<TemplateSkeleton />}>
        {params.then(({ templateId }) => (
          <TemplateDetails templateId={templateId} />
        ))}
      </Suspense>
    </div>
  );
}

async function TemplateDetails({ templateId }: { templateId: string }) {
  const id = Number(templateId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const { data: template, error } = await settle(serverApi.template(id));
  if (error) {
    if (error.status === 404) notFound();
    return <ApiNotice error={error} />;
  }

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Template"
        title={template.name}
        description={template.description ?? undefined}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild>
              <Link href={`/editor?template=${template.id}`}>
                <PencilIcon />
                Open in editor
              </Link>
            </Button>
            <DeleteTemplateButton template={{ id: template.id, name: template.name }} />
          </div>
        }
      />

      <dl className="grid grid-cols-2 gap-6 border-b pb-8 md:grid-cols-4">
        <Fact label="Format">
          <span className="font-mono text-xs uppercase">{formatLabel[template.format]}</span>
        </Fact>
        <Fact label="Size">
          <span className="font-mono text-xs">
            {template.width} × {template.height}
          </span>
        </Fact>
        <Fact label="Base">
          <span className="font-mono text-xs">
            {template.base_template} · v{template.base_version}
          </span>
        </Fact>
        <Fact label="Updated">
          <span className="font-mono text-xs">{formatDateTime(template.updated_at)}</span>
        </Fact>
      </dl>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <section className="space-y-6">
          <SectionTitle>Preview</SectionTitle>
          <div
            className="w-full max-w-sm overflow-hidden bg-muted"
            style={{ aspectRatio: `${template.width} / ${template.height}` }}
          >
            {template.preview_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- storage URLs are external and not known in advance
              <img src={template.preview_url} alt="" className="size-full object-cover" />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-3 text-muted-foreground">
                <LayoutTemplateIcon className="size-8" strokeWidth={1.25} />
                <span className="font-mono text-[10px] uppercase tracking-[0.14em]">
                  No preview yet
                </span>
              </div>
            )}
          </div>
        </section>

        <Suspense fallback={<ProgramsSkeleton />}>
          <TemplatePrograms templateId={template.id} />
        </Suspense>
      </div>
    </div>
  );
}

async function TemplatePrograms({ templateId }: { templateId: number }) {
  const { data: programs, error } = await settle(serverApi.programs());

  const usedBy = programs?.filter((p) => p.template_id === templateId) ?? [];

  return (
    <section className="space-y-1">
      <SectionTitle
        aside={
          error ? undefined : (
            <span className="font-mono text-xs text-muted-foreground">{usedBy.length}</span>
          )
        }
      >
        Used in programs
      </SectionTitle>
      {error ? (
        <ApiNotice error={error} />
      ) : usedBy.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">No program uses this template yet.</p>
      ) : (
        <ul className="divide-y">
          {usedBy.map((p) => {
            const active = p.is_active && p.idea_collection_id !== null;
            return (
              <li key={p.id}>
                <Link
                  href={`/programs/${p.id}`}
                  className="group flex items-center justify-between gap-6 py-4"
                >
                  <span className="flex min-w-0 items-center gap-2 text-[15px] font-medium">
                    <span
                      className={`size-1.5 shrink-0 rounded-full ${active ? "bg-signal" : "bg-muted-foreground/40"}`}
                      aria-label={active ? "Active" : "Inactive"}
                    />
                    <span className="truncate group-hover:underline group-hover:underline-offset-4">
                      {p.name}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground group-hover:text-foreground">
                    Change template
                    <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function ProgramsSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-40" />
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

function TemplateSkeleton() {
  return (
    <div className="space-y-12">
      <div className="space-y-4 border-b pb-8">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-14 w-72" />
      </div>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Skeleton className="aspect-4/5 w-full max-w-sm rounded-none" />
        <ProgramsSkeleton />
      </div>
    </div>
  );
}
