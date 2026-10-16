export class ApiError extends Error {
  readonly status: number;
  readonly detail: unknown;

  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }

  get isUnauthorized() {
    return this.status === 401;
  }
}

/** FastAPI puts error messages in `detail` (string or validation error list). */
export async function toApiError(res: Response): Promise<ApiError> {
  let detail: unknown = undefined;
  try {
    detail = await res.json();
  } catch {
    // body was not JSON
  }
  const fromDetail =
    detail && typeof detail === "object" && "detail" in detail
      ? (detail as { detail: unknown }).detail
      : undefined;
  const message =
    typeof fromDetail === "string" ? fromDetail : `Request failed (${res.status})`;
  return new ApiError(res.status, message, detail);
}
