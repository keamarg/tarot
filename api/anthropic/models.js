import { createProxyHeaders, handleCors, sendJson, sendUpstreamResponse } from "../_lib/proxy.js";

export default async function handler(req, res) {
  const { handled, origin } = handleCors(req, res);
  if (handled) {
    return;
  }

  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed." }, origin);
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    sendJson(res, 500, { error: "Missing ANTHROPIC_API_KEY" }, origin);
    return;
  }

  try {
    const headers = createProxyHeaders(req, {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    });
    const upstream = await fetch("https://api.anthropic.com/v1/models", {
      method: "GET",
      headers
    });
    await sendUpstreamResponse(res, upstream, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unhandled proxy error.";
    sendJson(res, 502, { error: message }, origin);
  }
}
