import Link from "next/link";
import { LayoutTemplateIcon } from "lucide-react";

import type { Template } from "@/lib/api/types";

/**
 * Flat grid of templates, same layout as the contents grid:
 * preview framed by hairlines only, name underneath.
 */
export function TemplateGrid({ templates }: { templates: Template[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {templates.map((t) => (
        <li key={t.id} className="group">
          <Link href={`/templates/${t.id}`} className="block">
            <div className="aspect-4/5 overflow-hidden bg-muted">
              {t.preview_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- storage URLs are external and not known in advance
                <img
                  src={t.preview_url}
                  alt=""
                  className="size-full object-cover transition-opacity group-hover:opacity-90"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-muted-foreground">
                  <LayoutTemplateIcon className="size-8" strokeWidth={1.25} />
                </div>
              )}
            </div>
            <p className="mt-3 border-b pb-2 text-sm group-hover:underline">{t.name}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
