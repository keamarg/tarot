import { handleCors, sendJson } from "./_lib/proxy.js";

export default async function handler(req, res) {
  const { handled, origin } = handleCors(req, res);
  if (handled) {
    return;
  }

  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method not allowed." }, origin);
    return;
  }

  sendJson(res, 200, { ok: true }, origin);
}
