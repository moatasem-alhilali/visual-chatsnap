export type ApiErrorPayload = {
  message?: string;
  data?: unknown;
  code?: string | number | null;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: ApiErrorPayload,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function toApiError(response: Response): Promise<ApiError> {
  let payload: ApiErrorPayload | undefined;

  try {
    payload = (await response.json()) as ApiErrorPayload;
  } catch {
    payload = undefined;
  }

  return new ApiError(
    payload?.message ?? `Request failed with status ${response.status}`,
    response.status,
    payload,
  );
}
