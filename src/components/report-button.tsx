"use client";

import { useState, useTransition } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BugIcon,
  CheckIcon,
  CircleQuestionMarkIcon,
  LightbulbIcon,
  LoaderCircleIcon,
  type LucideIcon,
  MessageSquareWarningIcon,
  OctagonXIcon,
  PuzzleIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api/client";
import type { ReportCategory } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const CATEGORIES: { value: ReportCategory; label: string; icon: LucideIcon }[] = [
  { value: "missing_feature", label: "Missing feature", icon: PuzzleIcon },
  { value: "feature_error", label: "Error in an existing feature", icon: BugIcon },
  { value: "unclear_feature", label: "Feature is hard to understand", icon: CircleQuestionMarkIcon },
  { value: "broken_feature", label: "Feature is unusable (completely broken)", icon: OctagonXIcon },
  {
    value: "improvement_suggestion",
    label: "Suggestion for an existing feature (possible improvement)",
    icon: LightbulbIcon,
  },
];

const DESCRIPTION_MIN = 15;
const DESCRIPTION_MAX = 500;

type Step = "category" | "description" | "sent";

/**
 * Floating button, bottom right, that opens the beta report form: pick a category,
 * describe the problem, send. Rendered by every layout except the landing page.
 */
export function ReportButton() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("category");
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onOpenChange(next: boolean) {
    // A draft survives an accidental close; after a sent report the form starts over.
    if (next && step === "sent") {
      setStep("category");
      setCategory(null);
      setDescription("");
    }
    setError(null);
    setOpen(next);
  }

  function pickCategory(value: ReportCategory) {
    setCategory(value);
    setError(null);
    setStep("description");
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = description.trim();
    if (!category) return setStep("category");
    if (text.length < DESCRIPTION_MIN)
      return setError(`Write at least ${DESCRIPTION_MIN} characters, so we can understand what happened.`);

    setError(null);
    startTransition(async () => {
      try {
        await api.createReport({
          category,
          description: text,
          page_url: window.location.pathname + window.location.search,
        });
        setStep("sent");
      } catch {
        setError("We couldn't send your report right now. Try again in a few minutes.");
      }
    });
  }

  const length = description.trim().length;
  const tooShort = length < DESCRIPTION_MIN;
  const selected = CATEGORIES.find((c) => c.value === category);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          aria-label="Report a problem"
          title="Report a problem"
          className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 size-12 rounded-full shadow-lg transition-transform active:scale-[0.94] md:right-6 md:bottom-6 [&_svg:not([class*='size-'])]:size-5"
        >
          <MessageSquareWarningIcon aria-hidden />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        {step === "sent" ? (
          <div role="status">
            <span className="flex size-10 items-center justify-center rounded-full bg-signal text-signal-foreground">
              <CheckIcon className="size-5" aria-hidden />
            </span>
            <DialogTitle className="mt-5 font-serif text-3xl leading-tight font-normal tracking-tight">
              Thanks, report received.
            </DialogTitle>
            <DialogDescription className="mt-3 text-base leading-relaxed">
              We read every report sent during the beta: yours helps us decide what to fix and
              improve first.
            </DialogDescription>
            <DialogFooter className="mt-8">
              <Button onClick={() => onOpenChange(false)}>Close</Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <DialogHeader>
              <p className="font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                Step {step === "category" ? 1 : 2} of 2
              </p>
              <DialogTitle className="font-serif text-3xl font-normal">
                {step === "category" ? "What's it about?" : "Tell us more"}
              </DialogTitle>
              <DialogDescription>
                {step === "category"
                  ? "Autopost is in beta. Your reports help us improve it."
                  : selected?.label}
              </DialogDescription>
            </DialogHeader>

            {step === "category" ? (
              <div className="grid gap-4">
                <ul className="grid gap-2" aria-label="Report category">
                  {CATEGORIES.map((c) => {
                    const active = c.value === category;
                    return (
                      <li key={c.value}>
                        <button
                          type="button"
                          onClick={() => pickCategory(c.value)}
                          aria-current={active ? "true" : undefined}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-md border px-4 py-3 text-left text-sm transition-colors outline-none hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50",
                            active && "border-foreground bg-accent",
                          )}
                        >
                          <span className="flex items-center gap-3">
                            <c.icon
                              className={cn("size-4 shrink-0", active ? "text-signal" : "text-muted-foreground")}
                              aria-hidden
                            />
                            {c.label}
                          </span>
                          {active ? (
                            <CheckIcon className="size-4 shrink-0" aria-hidden />
                          ) : (
                            <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {category && (
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setStep("description")}>
                      Next <ArrowRightIcon aria-hidden />
                    </Button>
                  </DialogFooter>
                )}
              </div>
            ) : (
              <form onSubmit={onSubmit} noValidate className="grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="report-description">Description</Label>
                  <Textarea
                    id="report-description"
                    name="description"
                    autoFocus
                    required
                    minLength={DESCRIPTION_MIN}
                    maxLength={DESCRIPTION_MAX}
                    rows={5}
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="What were you doing, what did you expect, what happened instead?"
                    aria-invalid={error ? true : undefined}
                    aria-describedby="report-description-hint"
                    className="max-h-64 min-h-32"
                  />
                  <div className="flex items-start justify-between gap-4 text-sm">
                    {error ? (
                      <p id="report-description-hint" role="alert" className="text-destructive">
                        {error}
                      </p>
                    ) : (
                      <p id="report-description-hint" className="text-muted-foreground">
                        Between {DESCRIPTION_MIN} and {DESCRIPTION_MAX} characters.
                      </p>
                    )}
                    <span
                      className={cn(
                        "shrink-0 font-mono text-xs tabular-nums",
                        tooShort ? "text-muted-foreground" : "text-foreground",
                      )}
                      aria-hidden
                    >
                      {length}/{DESCRIPTION_MAX}
                    </span>
                  </div>
                </div>

                <DialogFooter className="sm:justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setError(null);
                      setStep("category");
                    }}
                    disabled={pending}
                  >
                    <ArrowLeftIcon aria-hidden /> Back
                  </Button>
                  <Button type="submit" disabled={pending}>
                    {pending ? (
                      <>
                        Sending <LoaderCircleIcon className="animate-spin" aria-hidden />
                      </>
                    ) : (
                      <>
                        Send report <ArrowRightIcon aria-hidden />
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
