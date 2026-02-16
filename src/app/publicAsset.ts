const rawBaseUrl = (import.meta.env.BASE_URL as string | undefined)?.trim() ?? "/";
const normalizedBaseUrl = rawBaseUrl.endsWith("/") ? rawBaseUrl : `${rawBaseUrl}/`;

export function publicAssetUrl(path: string): string {
  if (!path) {
    return normalizedBaseUrl;
  }

  if (/^(?:[a-z][a-z\d+\-.]*:|\/\/)/i.test(path)) {
    return path;
  }

  return `${normalizedBaseUrl}${path.replace(/^\/+/, "")}`;
}
