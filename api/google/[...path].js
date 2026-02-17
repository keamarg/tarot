import {
  createProxyHeaders,
  handleCors,
  sendJson,
  sendUpstreamResponse,
  serializeRequestBody
} from "../_lib/proxy.js";

function normalizePathSegments(pathValue) {
  if (Array.isArray(pathValue)) {
    return pathValue.filter((segment) => typeof segment === "string" && segment.trim().length > 0);
  }
  if (typeof pathValue === "string" && pathValue.trim().length > 0) {
    return [pathValue];
  }
  return [];
}

function appendQueryParams(upstreamUrl, query) {
  for (const [key, value] of Object.entries(query)) {
    if (key === "path" || key.toLowerCase() === "key") {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item == null) {
          continue;
        }
        upstreamUrl.searchParams.append(key, String(item));
      }
      continue;
    }
    if (value != null) {
      upstreamUrl.searchParams.set(key, String(value));
    }
  }
}

export default async function handler(req, res) {
  const { handled, origin } = handleCors(req, res);
  if (handled) {
    return;
  }

  if (req.method !== "GET" && req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." }, origin);
    return;
  }

  const apiKey = process.env.GOOGLE_API_KEY?.trim();
  if (!apiKey) {
    sendJson(res, 500, { error: "Missing GOOGLE_API_KEY" }, origin);
    return;
  }

  const pathSegments = normalizePathSegments(req.query.path);
  if (!pathSegments.length) {
    sendJson(res, 404, { error: "Not found." }, origin);
    return;
  }

  try {
    const upstreamPath = `/v1beta/${pathSegments.join("/")}`;
    const upstreamUrl = new URL(`https://generativelanguage.googleapis.com${upstreamPath}`);
    appendQueryParams(upstreamUrl, req.query);
    upstreamUrl.searchParams.set("key", apiKey);

    const headers = createProxyHeaders(req);
    const upstream = await fetch(upstreamUrl.toString(), {
      method: req.method,
      headers,
      body: req.method === "GET" ? undefined : serializeRequestBody(req)
    });
    await sendUpstreamResponse(res, upstream, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unhandled proxy error.";
    sendJson(res, 502, { error: message }, origin);
  }
}
