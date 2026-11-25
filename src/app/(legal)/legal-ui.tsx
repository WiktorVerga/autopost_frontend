import type { ReactNode } from "react";

import { LEGAL_UPDATED } from "@/lib/legal";

/** Shared building blocks for the policy pages, so both read the same way. */

export function LegalHeader({ title, intro }: { title: string; intro: ReactNode }) {
  return (
    <header className="border-b pb-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        Last updated {LEGAL_UPDATED}
      </p>
      <h1 className="mt-3 font-serif text-5xl leading-[0.95] tracking-tight md:text-6xl">{title}</h1>
      <div className="mt-5 text-[15px] leading-relaxed text-muted-foreground">{intro}</div>
    </header>
  );
}

export function LegalSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-8 border-b py-10 last:border-b-0">
      <h2 className="font-serif text-3xl tracking-tight">{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed [&_a]:underline [&_a]:underline-offset-4 [&_li]:mt-1.5 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}

/** Simple responsive table: scrolls horizontally on narrow screens. */
export function LegalTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead className="bg-muted/50 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-3 py-2.5 font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t align-top">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2.5">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
