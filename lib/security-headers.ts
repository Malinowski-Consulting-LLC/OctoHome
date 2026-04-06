type Environment = "development" | "production" | "test";

export function buildContentSecurityPolicy(environment: Environment) {
  const isProduction = environment === "production";

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    `connect-src 'self'${isProduction ? "" : " ws: wss: http://localhost:3000 http://127.0.0.1:3000"}`,
    "font-src 'self' data:",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob: https:",
    "manifest-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    `script-src 'self' 'unsafe-inline'${isProduction ? "" : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    "worker-src 'self' blob:",
  ];

  if (isProduction) {
    directives.push("upgrade-insecure-requests");
  }

  return directives.join("; ");
}

export function getSecurityHeaders(environment: Environment) {
  const headers: Record<string, string> = {
    "Content-Security-Policy": buildContentSecurityPolicy(environment),
    "Cross-Origin-Opener-Policy": "same-origin",
    "Permissions-Policy":
      "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Content-Type-Options": "nosniff",
    "X-DNS-Prefetch-Control": "off",
    "X-Frame-Options": "DENY",
  };

  if (environment === "production") {
    headers["Strict-Transport-Security"] =
      "max-age=63072000; includeSubDomains; preload";
  }

  return headers;
}
