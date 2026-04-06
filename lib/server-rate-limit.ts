import type { NextRequest } from "next/server";

import { ApiError } from "@/lib/api-errors";
import {
  enforceServerRateLimit,
  type RateLimitOutcome,
  type RateLimitWindow,
} from "./rate-limit";
import { getRateLimitApiError } from "./rate-limit-error";

export async function enforceMutationRateLimit(
  request: NextRequest,
  options: {
    bucket: string;
    login?: string | null;
    limit?: number;
    window?: RateLimitWindow;
  },
  dependencies: {
    enforce?: typeof enforceServerRateLimit;
  } = {}
): Promise<RateLimitOutcome> {
  try {
    const enforce = dependencies.enforce ?? enforceServerRateLimit;
    return await enforce(request, options);
  } catch (error) {
    const mappedError = getRateLimitApiError(error);
    if (mappedError) {
      throw new ApiError(mappedError.message, mappedError.status);
    }

    throw error;
  }
}
