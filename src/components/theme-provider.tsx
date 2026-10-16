"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * next-themes injects an inline <script> to set the theme before paint. It only
 * needs to run from the server HTML; on the client React 19 warns about script
 * tags, so there it's rendered as inert JSON (the tag already suppresses the
 * hydration mismatch).
 */
const scriptProps =
  typeof window === "undefined" ? undefined : ({ type: "application/json" } as const);

export function ThemeProvider(props: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider scriptProps={scriptProps} {...props} />;
}
