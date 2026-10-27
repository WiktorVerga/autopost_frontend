import type { ContentStatus, ContentType, ProgramMode } from "./api/types";

const dateTime = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateOnly = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function formatDateTime(iso: string | null | undefined) {
  return iso ? dateTime.format(new Date(iso)) : "—";
}

export function formatDate(iso: string | null | undefined) {
  return iso ? dateOnly.format(new Date(iso)) : "—";
}

export const contentTypeLabel: Record<ContentType, string> = {
  carousel: "Carousel",
  reel: "Reel",
  story: "Story",
};

export const contentStatusLabel: Record<ContentStatus, string> = {
  generated: "Generated",
  publishing: "Publishing",
  published: "Published",
  failed: "Failed",
};

export const modeLabel: Record<ProgramMode, string> = {
  preview: "Preview",
  publish: "Publish",
};
