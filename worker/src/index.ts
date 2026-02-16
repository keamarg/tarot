interface Env {
  ANTHROPIC_API_KEY?: string;
  OPENAI_API_KEY?: string;
  GOOGLE_API_KEY?: string;
  ALLOWED_ORIGINS?: string;
}

const DEFAULT_ALLOWED_ORIGINS = ["http://127.0.0.1:4173", "http://localhost:4173"];
const CORS_ALLOW_METHODS = "GET,POST,OPTIONS";
const CORS_ALLOW_HEADERS =
  "content-type,authorization,x-api-key,anthropic-version,anthropic-dangerous-direct-browser-access";

function parseAllowedOrigins(env: Env): Set<string> {
  const raw = env.ALLOWED_ORIGINS?.trim() ?? "";
  const values = raw
    ? raw.split(",").map((value) => value.trim()).filter(Boolean)
    : DEFAULT_ALLOWED_ORIGINS;
  return new Set(values);
}

function resolveCorsOrigin(request: Request, env: Env): string | null {
  const requestOrigin = request.headers.get("origin");
  if (!requestOrigin) {
    return null;
  }

  const allowList = parseAllowedOrigins(env);
  if (allowList.has("*")) {
    return "*";
  }
  if (allowList.has(requestOrigin)) {
    return requestOrigin;
  }
  return null;
}

function applyCorsHeaders(headers: Headers, origin: string | null): void {
  if (!origin) {
    return;
  }
  headers.set("access-control-allow-origin", origin);
  headers.set("access-control-allow-methods", CORS_ALLOW_METHODS);
  headers.set("access-control-allow-headers", CORS_ALLOW_HEADERS);
  headers.set("access-control-max-age", "86400");
  if (origin !== "*") {
    headers.append("vary", "Origin");
  }
}

function jsonResponse(payload: unknown, status: number, origin: string | null): Response {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8"
  });
  applyCorsHeaders(headers, origin);
  return new Response(JSON.stringify(payload), { status, headers });
}

function createProxyHeaders(request: Request): Headers {
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }
  return headers;
}

async function proxyAnthropic(
  request: Request,
  env: Env,
  origin: string | null,
  endpoint: "/v1/messages" | "/v1/models"
): Promise<Response> {
  const apiKey = env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return jsonResponse({ error: "Missing ANTHROPIC_API_KEY" }, 500, origin);
  }

  const headers = createProxyHeaders(request);
  headers.set("x-api-key", apiKey);
  headers.set("anthropic-version", request.headers.get("anthropic-version") ?? "2023-06-01");

  const upstream = await fetch(`https://api.anthropic.com${endpoint}`, {
    method: request.method,
    headers,
    body: request.method === "GET" ? undefined : request.body
  });

  const responseHeaders = new Headers(upstream.headers);
  applyCorsHeaders(responseHeaders, origin);
  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders
  });
}

async function proxyOpenAI(
  request: Request,
  env: Env,
  origin: string | null,
  endpoint: "/v1/chat/completions" | "/v1/models"
): Promise<Response> {
  const apiKey = env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return jsonResponse({ error: "Missing OPENAI_API_KEY" }, 500, origin);
  }

  const headers = createProxyHeaders(request);
  headers.set("authorization", `Bearer ${apiKey}`);

  const upstream = await fetch(`https://api.openai.com${endpoint}`, {
    method: request.method,
    headers,
    body: request.method === "GET" ? undefined : request.body
  });

  const responseHeaders = new Headers(upstream.headers);
  applyCorsHeaders(responseHeaders, origin);
  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders
  });
}

async function proxyGoogle(request: Request, env: Env, origin: string | null, url: URL): Promise<Response> {
  const apiKey = env.GOOGLE_API_KEY?.trim();
  if (!apiKey) {
    return jsonResponse({ error: "Missing GOOGLE_API_KEY" }, 500, origin);
  }

  const upstreamPath = url.pathname.replace(/^\/api\/google/, "/v1beta");
  const upstreamUrl = new URL(`https://generativelanguage.googleapis.com${upstreamPath}`);

  for (const [key, value] of url.searchParams.entries()) {
    if (key.toLowerCase() === "key") {
      continue;
    }
    upstreamUrl.searchParams.set(key, value);
  }
  upstreamUrl.searchParams.set("key", apiKey);

  const headers = createProxyHeaders(request);
  const upstream = await fetch(upstreamUrl.toString(), {
    method: request.method,
    headers,
    body: request.method === "GET" ? undefined : request.body
  });

  const responseHeaders = new Headers(upstream.headers);
  applyCorsHeaders(responseHeaders, origin);
  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = resolveCorsOrigin(request, env);
    const requestOrigin = request.headers.get("origin");

    if (requestOrigin && !origin) {
      return jsonResponse({ error: "Origin not allowed." }, 403, null);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: (() => {
          const headers = new Headers();
          applyCorsHeaders(headers, origin);
          return headers;
        })()
      });
    }

    try {
      if (request.method === "GET" && url.pathname === "/health") {
        return jsonResponse({ ok: true }, 200, origin);
      }

      if (request.method === "POST" && url.pathname === "/api/anthropic/messages") {
        return await proxyAnthropic(request, env, origin, "/v1/messages");
      }

      if (request.method === "GET" && url.pathname === "/api/anthropic/models") {
        return await proxyAnthropic(request, env, origin, "/v1/models");
      }

      if (request.method === "POST" && url.pathname === "/api/openai/chat/completions") {
        return await proxyOpenAI(request, env, origin, "/v1/chat/completions");
      }

      if (request.method === "GET" && url.pathname === "/api/openai/models") {
        return await proxyOpenAI(request, env, origin, "/v1/models");
      }

      if ((request.method === "GET" || request.method === "POST") && url.pathname.startsWith("/api/google/")) {
        return await proxyGoogle(request, env, origin, url);
      }

      return jsonResponse({ error: "Not found." }, 404, origin);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unhandled proxy error.";
      return jsonResponse({ error: message }, 502, origin);
    }
  }
};
