import Link from "next/link";
import { LayoutTemplateIcon } from "lucide-react";

import {TemplateBase} from "@/lib/api/types";
import {serverApi, settle} from "@/lib/api/server";
import {ApiNotice} from "@/components/api-notice";

/**
 * Flat grid of templates, same layout as the contents grid:
 * preview framed by hairlines only, name underneath.
 */
export async function BasesGrid({ bases }: { bases: TemplateBase[] }) {



  return (
    <ul className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {bases.map(async (b) => {
        const { data, error } = await settle(serverApi.baseDetails(b.key));

        if (error) return <ApiNotice key={b.key} error={error} />;

        if (data) {
          return (
              <li key={b.key} className="group">
                <Link href={`/editor?base=${b.key}`} className="block">
                  <div className="aspect-4/5 overflow-hidden bg-muted">
                    {data.preview_image ? (
                        // eslint-disable-next-line @next/next/no-img-element -- storage URLs are external and not known in advance
                        <img
                            src={data.preview_image}
                            alt=""
                            className="size-full object-cover transition-opacity group-hover:opacity-90"
                        />
                    ) : (
                        <div className="flex size-full items-center justify-center text-muted-foreground">
                          <LayoutTemplateIcon className="size-8" strokeWidth={1.25}/>
                        </div>
                    )}
                  </div>
                  <p className="mt-3 border-b pb-2 text-sm group-hover:underline">{b.key}</p>
                </Link>
              </li>
          )
        }
      })}
    </ul>
  );
}
