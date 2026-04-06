export type RateLimitApiError = {
  status: number;
  message: string;
};

export function getRateLimitApiError(error: unknown): RateLimitApiError | null {
  if (!(error instanceof Error)) {
    return null;
  }

  if (error.name === "RateLimitConfigurationError") {
    return {
      status: 503,
      message:
        "Rate limiting is not configured for this deployment yet. Add the Upstash Redis environment variables and try again.",
    };
  }

  if (error.name === "RateLimitExceededError") {
    return {
      status: 429,
      message: "Too many requests. Please wait a moment and try again.",
    };
  }

  return null;
}
