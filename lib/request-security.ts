export type RequestLike = {
  headers: {
    get(name: string): string | null;
  };
  nextUrl: {
    origin: string;
  };
};

export type GitHubAuthContextLike = {
  accessToken: string | null;
  login: string | null;
};

export type HomeRepoSummaryLike = {
  owner: string;
  name: string;
};

export type HomeRepoContext<TRepo extends HomeRepoSummaryLike = HomeRepoSummaryLike> = {
  accessToken: string;
  login: string;
  owner: string;
  repo: string;
  homeRepo: TRepo;
};

export type HomeRepoResolution<TRepo extends HomeRepoSummaryLike = HomeRepoSummaryLike> =
  | { kind: "ok"; context: HomeRepoContext<TRepo> }
  | { kind: "unauthorized" }
  | { kind: "missing-home-repo" };

function getRequestedHomeRepoOwner(request: RequestLike) {
  const owner = request.headers.get("x-octohome-repo-owner")?.trim();
  return owner ? owner : undefined;
}

function getAllowedRequestOrigins(request: RequestLike, appUrl?: string) {
  const allowedOrigins = new Set<string>();
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const forwardedOrigin = readForwardedOrigin(forwardedProto, forwardedHost);
  const configuredOrigin = readHeaderOrigin(appUrl ?? null);

  allowedOrigins.add(request.nextUrl.origin);

  if (configuredOrigin) {
    allowedOrigins.add(configuredOrigin);
  }

  if (
    forwardedOrigin &&
    (forwardedOrigin === request.nextUrl.origin || forwardedOrigin === configuredOrigin)
  ) {
    allowedOrigins.add(forwardedOrigin);
  }

  return allowedOrigins;
}

function readHeaderOrigin(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function readForwardedOrigin(proto: string | null, host: string | null) {
  const normalizedProto = proto?.split(",")[0]?.trim() ?? "";
  const normalizedHost = host?.split(",")[0]?.trim() ?? "";

  if (!normalizedProto || !normalizedHost) {
    return null;
  }

  return readHeaderOrigin(`${normalizedProto}://${normalizedHost}`);
}

export function hasTrustedOrigin(request: RequestLike, appUrl?: string) {
  const sourceOrigin =
    readHeaderOrigin(request.headers.get("origin")) ??
    readHeaderOrigin(request.headers.get("referer"));

  if (!sourceOrigin) {
    return false;
  }

  return getAllowedRequestOrigins(request, appUrl).has(sourceOrigin);
}

export async function resolveHomeRepoContext<
  TRepo extends HomeRepoSummaryLike,
  TRequest extends RequestLike,
>(
  request: TRequest,
  dependencies: {
    getAuthContext: (request: TRequest) => Promise<GitHubAuthContextLike>;
    findRepo: (token: string, login: string, preferredOwner?: string) => Promise<TRepo | null>;
  }
): Promise<HomeRepoResolution<TRepo>> {
  const { accessToken, login } = await dependencies.getAuthContext(request);

  if (!accessToken || !login) {
    return { kind: "unauthorized" };
  }

  const homeRepo = await dependencies.findRepo(
    accessToken,
    login,
    getRequestedHomeRepoOwner(request)
  );

  if (!homeRepo) {
    return { kind: "missing-home-repo" };
  }

  return {
    kind: "ok",
    context: {
      accessToken,
      login,
      owner: homeRepo.owner,
      repo: homeRepo.name,
      homeRepo,
    },
  };
}
