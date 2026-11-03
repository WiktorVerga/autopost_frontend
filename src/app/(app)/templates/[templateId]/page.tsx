import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { ArrowLeftIcon, LayoutTemplateIcon } from "lucide-react";

import { ApiNotice } from "@/components/api-notice";
import { PageHeader, SectionTitle } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { serverApi, settle } from "@/lib/api/server";
import type { TemplateFormat } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format";

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
        <Fact label="Version">
          <span className="font-mono text-xs">v{template.version}</span>
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

        <section className="space-y-6">
          <SectionTitle
            aside={
              <span className="font-mono text-xs text-muted-foreground">
                {template.variables.length}
              </span>
            }
          >
            Variables
          </SectionTitle>
          {template.variables.length === 0 ? (
            <p className="text-sm text-muted-foreground">This template has no variables.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="py-2 pr-4 font-normal">Name</th>
                  <th className="py-2 pr-4 font-normal">Type</th>
                  <th className="py-2 font-normal">Example</th>
                </tr>
              </thead>
              <tbody>
                {template.variables.map((v) => (
                  <tr key={v.name} className="border-b align-top">
                    <td className="py-3 pr-4 font-mono text-xs">{v.name}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">{v.type}</td>
                    <td className="py-3">
                      <span className="line-clamp-3 break-words">{formatExample(v.example)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <section className="space-y-6">
        <SectionTitle>HTML source</SectionTitle>
        <pre className="max-h-[32rem] overflow-auto border bg-muted/40 p-4 font-mono text-xs leading-relaxed">
          <code>{template.html_content}</code>
        </pre>
      </section>
    </div>
  );
}

function formatExample(value: unknown) {
  if (value === null || value === undefined) return "—";
  return typeof value === "string" ? value : JSON.stringify(value);
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

function TemplateSkeleton() {
  return (
    <div className="space-y-12">
      <div className="space-y-4 border-b pb-8">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-14 w-72" />
      </div>
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Skeleton className="aspect-4/5 w-full max-w-sm rounded-none" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
