const rawBaseUrl = import.meta.env.BASE_URL?.trim() ?? "/";
const normalizedBaseUrl = rawBaseUrl.endsWith("/") ? rawBaseUrl : `${rawBaseUrl}/`;
export function publicAssetUrl(path) {
    if (!path) {
        return normalizedBaseUrl;
    }
    if (/^(?:[a-z][a-z\d+\-.]*:|\/\/)/i.test(path)) {
        return path;
    }
    return `${normalizedBaseUrl}${path.replace(/^\/+/, "")}`;
}
