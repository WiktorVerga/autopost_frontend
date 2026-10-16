import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

/** Editorial page header: mono eyebrow + serif title + hairline rule. */
export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-6 border-b pb-8 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="mt-3 font-serif text-5xl leading-[0.95] tracking-tight md:text-6xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

/** Section title used inside pages. */
export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b pb-3">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        {children}
      </h2>
      {aside}
    </div>
  );
}
