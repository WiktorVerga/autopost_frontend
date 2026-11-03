"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { applyCustomization, readTemplateVars, type CssVars } from "@/lib/template/compile";
import type { JsonObject } from "@/lib/template/schema";
import { cn } from "@/lib/utils";

const FALLBACK_SLIDE = { width: 1080, height: 1350 };

type Metrics = { width: number; height: number; slideHeight: number };

/** `<meta name="viewport" content="width=1080">` → 1080. */
function viewportWidth(html: string) {
  const match = /<meta[^>]+name=["']viewport["'][^>]*content=["'][^"']*width=(\d+)/i.exec(html);
  return match ? Number(match[1]) : FALLBACK_SLIDE.width;
}

function measure(doc: Document, width: number): Metrics {
  const slide = doc.querySelector<HTMLElement>(".t-slide, section");
  return {
    width,
    height: doc.documentElement.scrollHeight,
    slideHeight: slide?.offsetHeight || FALLBACK_SLIDE.height,
  };
}

/**
 * Renders the base HTML at its real size inside a sandboxed iframe, scaled so a
 * whole slide fits the available space. The customization is applied by
 * patching the iframe document, so edits show up without reloading it.
 */
export function TemplatePreview({
  html,
  values,
  className,
}: {
  html: string;
  values: JsonObject;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const baseVarsRef = useRef<CssVars | null>(null);

  const [frameWidth] = useState(() => viewportWidth(html));
  const [loads, setLoads] = useState(0);
  const [metrics, setMetrics] = useState<Metrics>({
    width: frameWidth,
    height: FALLBACK_SLIDE.height,
    slideHeight: FALLBACK_SLIDE.height,
  });
  const [box, setBox] = useState({ width: 0, height: 0 });

  // Size of the area available for the preview (content box, padding excluded).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBox({ width, height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Iframe document ready: read the template's own variables and its size.
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    let observer: ResizeObserver | undefined;

    const onLoad = () => {
      const doc = iframe.contentDocument;
      // The first document is the empty about:blank, not the template.
      if (!doc || doc.URL !== "about:srcdoc") return;
      baseVarsRef.current = readTemplateVars(doc);
      observer?.disconnect();
      observer = new ResizeObserver(() => setMetrics(measure(doc, frameWidth)));
      observer.observe(doc.documentElement);
      setLoads((n) => n + 1);
    };

    iframe.addEventListener("load", onLoad);
    // The iframe may have finished loading before hydration.
    if (iframe.contentDocument?.readyState === "complete") onLoad();
    return () => {
      iframe.removeEventListener("load", onLoad);
      observer?.disconnect();
    };
  }, [frameWidth]);

  // Apply the customization before paint, so the defaults never flash.
  useLayoutEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (loads === 0 || !doc || !baseVarsRef.current) return;
    applyCustomization(doc, values, baseVarsRef.current);
  }, [values, loads]);

  const scale =
    box.width > 0
      ? Math.max(0, Math.min(1, box.width / metrics.width, box.height / metrics.slideHeight))
      : 0;
  const ready = loads > 0 && scale > 0;

  return (
    <div ref={containerRef} className={cn("relative overflow-auto bg-muted/60 p-6 md:p-8", className)}>
      <div
        className="relative mx-auto"
        style={{ width: metrics.width * scale, height: metrics.height * scale }}
      >
        <iframe
          ref={iframeRef}
          title="Template preview"
          srcDoc={html}
          // No scripts: the template is only styled. Same origin lets the editor patch its DOM.
          sandbox="allow-same-origin"
          tabIndex={-1}
          className={cn(
            "pointer-events-none absolute top-0 left-0 origin-top-left border-0 shadow-sm transition-opacity",
            ready ? "opacity-100" : "opacity-0",
          )}
          style={{
            width: metrics.width,
            height: metrics.height,
            transform: `scale(${scale})`,
          }}
        />
      </div>
      {!ready ? (
        <p className="absolute inset-0 flex items-center justify-center font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Loading preview…
        </p>
      ) : null}
    </div>
  );
}
