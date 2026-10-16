import { PlugZapIcon, TriangleAlertIcon } from "lucide-react";

import type { ApiError } from "@/lib/api/errors";

/** Inline message shown when a server-side request fails. */
export function ApiNotice({ error }: { error: ApiError }) {
  const offline = error.status === 503;
  const Icon = offline ? PlugZapIcon : TriangleAlertIcon;

  return (
    <div className="flex items-start gap-3 border-l-2 border-signal bg-muted/60 px-4 py-3 text-sm">
      <Icon className="mt-0.5 size-4 shrink-0 text-signal" />
      <div>
        <p className="font-medium">
          {offline ? "The Autopost API is not reachable" : error.message}
        </p>
        <p className="mt-0.5 text-muted-foreground">
          {offline
            ? "Start the FastAPI backend and check API_URL in .env.local."
            : `The backend answered with status ${error.status}.`}
        </p>
      </div>
    </div>
  );
}
