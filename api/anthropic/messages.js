import {
  createProxyHeaders,
  getHeaderValue,
  handleCors,
  sendJson,
  sendUpstreamResponse,
  serializeRequestBody
} from "../_lib/proxy.js";

export default async function handler(req, res) {
  const { handled, origin } = handleCors(req, res);
  if (handled) {
    return;
  }

  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed." }, origin);
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    sendJson(res, 500, { error: "Missing ANTHROPIC_API_KEY" }, origin);
    return;
  }

  try {
    const anthropicVersion = getHeaderValue(req.headers, "anthropic-version") || "2023-06-01";
    const headers = createProxyHeaders(req, {
      "x-api-key": apiKey,
      "anthropic-version": anthropicVersion
    });
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers,
      body: serializeRequestBody(req)
    });
    await sendUpstreamResponse(res, upstream, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unhandled proxy error.";
    sendJson(res, 502, { error: message }, origin);
  }
}
