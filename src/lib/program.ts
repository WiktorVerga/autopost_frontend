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
