export type RateLimitRequestLike = {
  headers: {
    get(name: string): string | null;
  };
};

export type RateLimitEnv = {
  upstashUrl?: string;
  upstashToken?: string;
  nodeEnv?: string;
};

export type RateLimitWindow = `${number} ${"s" | "m" | "h"}`;

type LimitFn = (key: string) => Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}>;

export type RateLimitOutcome = {
  applied: boolean;
  identifier: string;
  limit?: number;
  remaining?: number;
  reset?: number;
};

export class RateLimitConfigurationError extends Error {
  constructor(message = "Rate limiting is not configured for this deployment.") {
    super(message);
    this.name = "RateLimitConfigurationError";
  }
}

export class RateLimitExceededError extends Error {
  readonly limit: number;
  readonly remaining: number;
  readonly reset: number;

  constructor(limit: number, remaining: number, reset: number) {
    super("Too many requests. Please wait a moment and try again.");
    this.name = "RateLimitExceededError";
    this.limit = limit;
    this.remaining = remaining;
    this.reset = reset;
  }
}

const limiterCache = new Map<string, LimitFn>();

export function getRateLimitIdentifier(request: RateLimitRequestLike, login?: string | null) {
  if (login?.trim()) {
    return `user:${login.trim().toLowerCase()}`;
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  const forwardedIp = forwardedFor?.split(",")[0]?.trim();
  if (forwardedIp) {
    return `ip:${forwardedIp}`;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return `ip:${realIp}`;
  }

  return "anonymous";
}

export async function enforceRateLimit(
  request: RateLimitRequestLike,
  options: {
    bucket: string;
    login?: string | null;
    env: RateLimitEnv;
    limit?: LimitFn;
  }
): Promise<RateLimitOutcome> {
  const identifier = getRateLimitIdentifier(request, options.login);

  if (!options.env.upstashUrl || !options.env.upstashToken) {
    if (options.env.nodeEnv === "production") {
      throw new RateLimitConfigurationError();
    }

    return {
      applied: false,
      identifier,
    };
  }

  if (!options.limit) {
    throw new RateLimitConfigurationError("Rate limiting is enabled but no limiter is available.");
  }

  const result = await options.limit(`${options.bucket}:${identifier}`);

  if (!result.success) {
    throw new RateLimitExceededError(result.limit, result.remaining, result.reset);
  }

  return {
    applied: true,
    identifier,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

async function getUpstashLimitFunction(
  bucket: string,
  limit: number,
  window: RateLimitWindow,
  env: Required<Pick<RateLimitEnv, "upstashUrl" | "upstashToken">>
) {
  const cacheKey = `${bucket}:${limit}:${window}:${env.upstashUrl}`;
  const cached = limiterCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const [{ Ratelimit }, { Redis }] = await Promise.all([
    import("@upstash/ratelimit"),
    import("@upstash/redis"),
  ]);

  const redis = new Redis({
    url: env.upstashUrl,
    token: env.upstashToken,
  });
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, window),
    prefix: `octohome:${bucket}`,
    analytics: true,
  });

  const rateLimitFunction: LimitFn = async (key) => {
    const result = await ratelimit.limit(key);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  };

  limiterCache.set(cacheKey, rateLimitFunction);

  return rateLimitFunction;
}

export async function enforceServerRateLimit(
  request: RateLimitRequestLike,
  options: {
    bucket: string;
    login?: string | null;
    limit?: number;
    window?: RateLimitWindow;
    env?: RateLimitEnv;
  }
) {
  const env = options.env ?? {
    upstashUrl: process.env.UPSTASH_REDIS_REST_URL,
    upstashToken: process.env.UPSTASH_REDIS_REST_TOKEN,
    nodeEnv: process.env.NODE_ENV,
  };

  const limitFunction =
    env.upstashUrl && env.upstashToken
      ? await getUpstashLimitFunction(
          options.bucket,
          options.limit ?? 30,
          options.window ?? "1 m",
          {
            upstashUrl: env.upstashUrl,
            upstashToken: env.upstashToken,
          }
        )
      : undefined;

  return enforceRateLimit(request, {
    bucket: options.bucket,
    login: options.login,
    env,
    limit: limitFunction,
  });
}
