import type { Program } from "@/lib/api/types";

/** True when the program actually runs on its schedule. */
export function isRunning(program: Pick<Program, "status" | "idea_collection_id">): boolean {
  return program.status === "active" && program.idea_collection_id !== null;
}

/**
 * Why a program cannot be switched to active, or null when it can.
 * A program needs a collection to take ideas from and a template to render them with:
 * the backend rejects an active program missing either one.
 */
export function activationError(hasCollection: boolean, hasTemplate: boolean): string | null {
  if (!hasCollection && !hasTemplate) {
    return "To activate the program, choose a collection to take ideas from and a template to render them with.";
  }
  if (!hasCollection) return "To activate the program, choose a collection to take ideas from.";
  if (!hasTemplate) return "To activate the program, choose a template to render its content with.";
  return null;
}
