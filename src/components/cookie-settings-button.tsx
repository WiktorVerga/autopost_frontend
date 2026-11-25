"use client";

import type { ComponentProps } from "react";

import { openCookieSettings } from "@/lib/consent";

/** Plain button that reopens the cookie banner. Style it like a link where it's used. */
export function CookieSettingsButton({
  children = "Cookie settings",
  ...props
}: Omit<ComponentProps<"button">, "onClick" | "type">) {
  return (
    <button type="button" onClick={openCookieSettings} {...props}>
      {children}
    </button>
  );
}
