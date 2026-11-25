"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowRightIcon, CheckIcon, LoaderCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LEGAL_PATHS } from "@/lib/legal";

import { COMPANY_MAX, requestInvite, type InviteRequestState } from "./invite-request";

const INITIAL: InviteRequestState = { status: "idle" };

export function InviteRequestForm() {
  const [state, formAction, pending] = useActionState(requestInvite, INITIAL);

  if (state.status === "success") {
    return (
      <div role="status" className="rounded-lg border-2 border-foreground p-6 md:p-8">
        <span className="flex size-10 items-center justify-center rounded-full bg-signal text-signal-foreground">
          <CheckIcon className="size-5" aria-hidden />
        </span>
        <p className="mt-5 font-serif text-3xl leading-tight tracking-tight">
          You&apos;re on the waiting list.
        </p>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          We&apos;ve received your request, but{" "}
          <span className="font-medium text-foreground">@{state.handle}</span> can&apos;t be connected to
          Autopost yet. We add accounts to the beta by hand, and we&apos;ll send you a second email once
          it has been added: from then on you can connect it and start publishing.
        </p>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Until then you can already sign in and set up your ideas and templates.
        </p>
      </div>
    );
  }

  const errors = state.status === "error" ? state.fieldErrors : {};
  const values = state.status === "error" ? state.values : undefined;
  const formError = state.status === "error" ? state.message : undefined;

  return (
    <form action={formAction} noValidate className="rounded-lg border p-6 md:p-8">
      <div className="space-y-6">
        <Field id="invite-email" label="Email" error={errors.email}>
          <Input
            id="invite-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            required
            defaultValue={values?.email}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "invite-email-error" : undefined}
            className="h-11"
          />
        </Field>

        <Field
          id="invite-instagram"
          label="Instagram account"
          hint="The account you want Autopost to publish to."
          error={errors.instagram}
        >
          <div className="relative">
            <span
              className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground"
              aria-hidden
            >
              @
            </span>
            <Input
              id="invite-instagram"
              name="instagram"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="yourpage"
              required
              defaultValue={values?.instagram}
              aria-invalid={errors.instagram ? true : undefined}
              aria-describedby={
                errors.instagram ? "invite-instagram-error" : "invite-instagram-hint"
              }
              className="h-11 pl-7"
            />
          </div>
        </Field>

        <Field id="invite-company" label="Company or field" optional error={errors.company}>
          <Input
            id="invite-company"
            name="company"
            autoComplete="organization"
            placeholder="e.g. Specialty coffee roaster"
            maxLength={COMPANY_MAX}
            defaultValue={values?.company}
            aria-invalid={errors.company ? true : undefined}
            aria-describedby={errors.company ? "invite-company-error" : undefined}
            className="h-11"
          />
        </Field>

        <div>
          <div className="flex items-start gap-3">
            <input
              id="invite-privacy"
              name="privacy"
              type="checkbox"
              required
              defaultChecked={values?.privacy === "on"}
              aria-invalid={errors.privacy ? true : undefined}
              aria-describedby={errors.privacy ? "invite-privacy-error" : undefined}
              className="mt-0.5 size-4 shrink-0 accent-primary"
            />
            <label htmlFor="invite-privacy" className="text-sm leading-relaxed text-muted-foreground">
              I have read the{" "}
              <Link
                href={LEGAL_PATHS.privacy}
                target="_blank"
                className="font-medium text-foreground underline underline-offset-4"
              >
                Privacy Policy
              </Link>{" "}
              and understand that my email and Instagram account are used to handle my invite
              request.
            </label>
          </div>
          {errors.privacy && (
            <p id="invite-privacy-error" className="mt-2 text-sm text-destructive">
              {errors.privacy}
            </p>
          )}
        </div>
      </div>

      {formError && (
        <p role="alert" className="mt-6 text-sm font-medium text-destructive">
          {formError}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending} className="mt-8 w-full active:scale-[0.97] sm:w-auto">
        {pending ? (
          <>
            Sending <LoaderCircleIcon className="animate-spin" aria-hidden />
          </>
        ) : (
          <>
            Request an invite <ArrowRightIcon aria-hidden />
          </>
        )}
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  optional,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={id} className="justify-between">
        {label}
        {optional && (
          <span className="font-mono text-[10px] font-normal uppercase tracking-[0.14em] text-muted-foreground">
            Optional
          </span>
        )}
      </Label>
      <div className="mt-2">{children}</div>
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm text-destructive">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-2 text-sm text-muted-foreground">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
