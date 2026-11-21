"use client";

import {createContext, useCallback, useContext, useMemo, useState, type ReactNode} from "react";
import {ChevronLeftIcon, ChevronRightIcon, XIcon} from "lucide-react";
import {Dialog as DialogPrimitive} from "radix-ui";

import {cn} from "@/lib/utils";

export type LightboxImage = { src: string; alt?: string };

type LightboxContextValue = { open: (index: number) => void };

const LightboxContext = createContext<LightboxContextValue | null>(null);

/**
 * Shares one fullscreen overlay between every `LightboxTrigger` rendered inside it.
 * Children can stay server-rendered: only the triggers need to be client components.
 */
export function Lightbox({images, children}: { images: LightboxImage[]; children: ReactNode }) {
    const [index, setIndex] = useState<number | null>(null);
    const count = images.length;

    const open = useCallback((i: number) => {
        if (i >= 0 && i < count) setIndex(i);
    }, [count]);

    const step = useCallback((delta: number) => {
        setIndex((i) => (i === null ? i : (i + delta + count) % count));
    }, [count]);

    const ctx = useMemo(() => ({open}), [open]);
    const current = index === null ? null : images[index];
    const multiple = count > 1;

    return (
        <LightboxContext.Provider value={ctx}>
            {children}
            <DialogPrimitive.Root open={current !== null} onOpenChange={(o) => !o && setIndex(null)}>
                <DialogPrimitive.Portal>
                    <DialogPrimitive.Overlay
                        className="fixed inset-0 z-50 bg-black/90 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
                    />
                    <DialogPrimitive.Content
                        aria-describedby={undefined}
                        onKeyDown={(e) => {
                            if (!multiple) return;
                            if (e.key === "ArrowRight") step(1);
                            else if (e.key === "ArrowLeft") step(-1);
                        }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 sm:p-12"
                    >
                        <DialogPrimitive.Title className="sr-only">
                            {multiple && index !== null ? `Image ${index + 1} of ${count}` : "Image preview"}
                        </DialogPrimitive.Title>

                        {/* Clicking the empty area around the image closes the overlay. */}
                        <DialogPrimitive.Close className="absolute inset-0 cursor-zoom-out" tabIndex={-1} aria-hidden/>

                        {current ? (
                            // eslint-disable-next-line @next/next/no-img-element -- storage URLs are external and not known in advance
                            <img
                                key={current.src}
                                src={current.src}
                                alt={current.alt ?? ""}
                                className="relative max-h-full max-w-full object-contain shadow-2xl"
                            />
                        ) : null}

                        <DialogPrimitive.Close className={cn(overlayButton, "absolute top-4 right-4")}>
                            <XIcon className="size-5"/>
                            <span className="sr-only">Close</span>
                        </DialogPrimitive.Close>

                        {multiple && index !== null ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => step(-1)}
                                    className={cn(overlayButton, "absolute top-1/2 left-4 -translate-y-1/2")}
                                >
                                    <ChevronLeftIcon className="size-5"/>
                                    <span className="sr-only">Previous image</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => step(1)}
                                    className={cn(overlayButton, "absolute top-1/2 right-4 -translate-y-1/2")}
                                >
                                    <ChevronRightIcon className="size-5"/>
                                    <span className="sr-only">Next image</span>
                                </button>
                                <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-[11px] uppercase tracking-[0.16em] text-white/70">
                                    {index + 1} / {count}
                                </p>
                            </>
                        ) : null}
                    </DialogPrimitive.Content>
                </DialogPrimitive.Portal>
            </DialogPrimitive.Root>
        </LightboxContext.Provider>
    );
}

const overlayButton =
    "inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none";

/** Makes its children open the surrounding `Lightbox` at `index` when clicked. */
export function LightboxTrigger({index, className, children}: {
    index: number;
    className?: string;
    children: ReactNode;
}) {
    const ctx = useContext(LightboxContext);
    if (!ctx) throw new Error("LightboxTrigger must be rendered inside a Lightbox");

    return (
        <button
            type="button"
            onClick={() => ctx.open(index)}
            className={cn(
                "block size-full cursor-zoom-in focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
                className,
            )}
        >
            {children}
            <span className="sr-only">Open fullscreen</span>
        </button>
    );
}
