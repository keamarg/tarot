const DEFAULT_ALLOWED_ORIGINS = ["http://127.0.0.1:4173", "http://localhost:4173"];
const CORS_ALLOW_METHODS = "GET,POST,OPTIONS";
const CORS_ALLOW_HEADERS =
  "content-type,authorization,x-api-key,anthropic-version,anthropic-dangerous-direct-browser-access";

export function getHeaderValue(headers, key) {
  const value = headers[key.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return typeof value === "string" ? value : "";
}

function parseAllowedOrigins() {
  const raw = (process.env.ALLOWED_ORIGINS ?? "").trim();
  const values = raw
    ? raw
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    : DEFAULT_ALLOWED_ORIGINS;
  return new Set(values);
}

function resolveCorsOrigin(req) {
  const requestOrigin = getHeaderValue(req.headers, "origin");
  if (!requestOrigin) {
    return null;
  }

  const allowList = parseAllowedOrigins();
  if (allowList.has("*")) {
    return "*";
  }
  return allowList.has(requestOrigin) ? requestOrigin : null;
}

export function applyCorsHeaders(res, origin) {
  if (!origin) {
    return;
  }
  res.setHeader("access-control-allow-origin", origin);
  res.setHeader("access-control-allow-methods", CORS_ALLOW_METHODS);
  res.setHeader("access-control-allow-headers", CORS_ALLOW_HEADERS);
  res.setHeader("access-control-max-age", "86400");
  if (origin !== "*") {
    res.setHeader("vary", "Origin");
  }
}

export function handleCors(req, res) {
  const origin = resolveCorsOrigin(req);
  const requestOrigin = getHeaderValue(req.headers, "origin");

  if (requestOrigin && !origin) {
    res.status(403).json({ error: "Origin not allowed." });
    return { handled: true, origin: null };
  }

  if (req.method === "OPTIONS") {
    applyCorsHeaders(res, origin);
    res.status(204).end();
    return { handled: true, origin };
  }

  return { handled: false, origin };
}

export function sendJson(res, status, payload, origin) {
  applyCorsHeaders(res, origin);
  res.status(status).json(payload);
}

export function serializeRequestBody(req) {
  if (req.method === "GET" || req.method === "HEAD") {
    return undefined;
  }
  if (typeof req.body === "string") {
    return req.body;
  }
  if (Buffer.isBuffer(req.body)) {
    return req.body.toString("utf-8");
  }
  if (req.body == null) {
    return undefined;
  }
  return JSON.stringify(req.body);
}

export function createProxyHeaders(req, extraHeaders = {}) {
  const headers = new Headers();
  const contentType = getHeaderValue(req.headers, "content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }

  for (const [key, value] of Object.entries(extraHeaders)) {
    if (value == null || value === "") {
      continue;
    }
    headers.set(key, String(value));
  }

  return headers;
}

export async function sendUpstreamResponse(res, upstream, origin) {
  const contentType = upstream.headers.get("content-type");
  if (contentType) {
    res.setHeader("content-type", contentType);
  }
  applyCorsHeaders(res, origin);
  const bodyText = await upstream.text();
  res.status(upstream.status).send(bodyText);
}
