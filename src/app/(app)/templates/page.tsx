import type { Metadata } from "next";
import { Suspense } from "react";
import { LayoutTemplateIcon } from "lucide-react";

import { ApiNotice } from "@/components/api-notice";
import { EmptyState } from "@/components/empty-state";
import { PageHeader, SectionTitle } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { serverApi, settle } from "@/lib/api/server";
import { TemplateGrid } from "./template-grid";
import {BasesGrid} from "@/app/(app)/templates/bases-grid";

export const metadata: Metadata = { title: "Templates" };

export default function TemplatesPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Templates"
        title="How posts look"
        description="The layouts Autopost uses to draw your posts: the ones included with Autopost and the ones you uploaded."
      />

      <section className="space-y-6">
        <SectionTitle>Your templates</SectionTitle>
        <Suspense fallback={<GridSkeleton count={4} />}>
          <UserTemplatesSection />
        </Suspense>
      </section>

      <section className="space-y-6">
        <SectionTitle>Templates Bases</SectionTitle>
        <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          Pick a base to start from: you can then change it and save it as a template of your own.
        </p>
        <Suspense fallback={<GridSkeleton count={4} />}>
          <BaseTemplatesSection />
        </Suspense>
      </section>
    </div>
  );
}

async function BaseTemplatesSection() {
  const { data, error } = await settle(serverApi.baseTemplates());
  if (error) return <ApiNotice error={error} />;

  if (data.length === 0) {
    return <p className="py-10 text-sm text-muted-foreground">No default templates available.</p>;
  }

  return <BasesGrid bases={data} />;
}

async function UserTemplatesSection() {
  const { data, error } = await settle(serverApi.templates());
  if (error) return <ApiNotice error={error} />;

  if (data.length === 0) {
    return (
      <EmptyState
        icon={LayoutTemplateIcon}
        title="No templates of your own yet"
        description="Upload an HTML template to give your posts your own look. Until then, programs use the ones included with Autopost."
      />
    );
  }

  return <TemplateGrid templates={data} />;
}

function GridSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-4/5 w-full rounded-none" />
      ))}
    </div>
  );
}
