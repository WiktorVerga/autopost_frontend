import { sendGTMEvent } from "@next/third-parties/google";

import { api } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { analyticsAllowed } from "@/lib/consent";
import type { BetaRequestInput } from "@/lib/api/types";

type Field = "email" | "instagram" | "company" | "privacy";

export type InviteRequestState =
  | { status: "idle" }
  | { status: "success"; handle: string }
  | {
      status: "error";
      /** Message for the whole form (backend down, unexpected answer). */
      message?: string;
      fieldErrors: Partial<Record<Field, string>>;
      /** What was typed, so the fields can be filled in again after React resets the form. */
      values: Record<Field, string>;
    };

export const COMPANY_MAX = 120;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Instagram usernames: letters, numbers, dots and underscores, at most 30. */
const INSTAGRAM_HANDLE = /^[a-z0-9._]{1,30}$/;

/**
 * Accepts "name", "@name" or a profile link and returns the bare username,
 * lowercased (Instagram usernames are not case-sensitive).
 */
function normaliseHandle(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/[/?#].*$/, "")
    .replace(/^@/, "")
    .toLowerCase();
}

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Form action for the landing page. It runs in the browser and posts through
 * the `/api` rewrite like the rest of the app; the backend validates again.
 * Not a Server Action: re-rendering the landing after one trips a Next.js
 * invariant on the `cookies()` read in `AuthCta`.
 */
export async function requestInvite(
  _prev: InviteRequestState,
  formData: FormData,
): Promise<InviteRequestState> {
  const values = {
    email: text(formData, "email"),
    instagram: text(formData, "instagram"),
    company: text(formData, "company"),
    // checkbox: "on" when ticked, missing otherwise
    privacy: text(formData, "privacy"),
  };
  const handle = normaliseHandle(values.instagram);

  const fieldErrors: Partial<Record<Field, string>> = {};
  if (!values.email) fieldErrors.email = "Enter your email.";
  else if (!EMAIL.test(values.email)) fieldErrors.email = "This doesn't look like an email address.";

  if (!handle) fieldErrors.instagram = "Enter the Instagram account you want to post to.";
  else if (!INSTAGRAM_HANDLE.test(handle) || handle.startsWith(".") || handle.endsWith("."))
    fieldErrors.instagram = "Use the username only: letters, numbers, dots and underscores.";

  if (values.company.length > COMPANY_MAX)
    fieldErrors.company = `Keep it under ${COMPANY_MAX} characters.`;

  if (values.privacy !== "on") fieldErrors.privacy = "Please confirm you have read the Privacy Policy.";

  if (Object.keys(fieldErrors).length > 0) return { status: "error", fieldErrors, values };

  const input: BetaRequestInput = {
    email: values.email.toLowerCase(),
    instagram_handle: handle,
    company: values.company || null,
  };

  let alreadyRequested = false;
  try {
    await api.requestInvite(input);
  } catch (e) {
    // Asking twice is not a mistake worth reporting: the request is already in.
    if (e instanceof ApiError && e.status === 409) alreadyRequested = true;
    else
      return {
        status: "error",
        message: "We couldn't send your request right now. Try again in a few minutes.",
        fieldErrors: {},
        values,
      };
  }

  // Only with analytics consent: otherwise the event would wait in the dataLayer and reach GA4
  // if the visitor accepted later on the same page. No email or handle: GA must not get personal data.
  if (analyticsAllowed())
    sendGTMEvent({
      event: "invite_request",
      already_requested: alreadyRequested,
      has_company: input.company !== null,
    });

  return { status: "success", handle };
}
