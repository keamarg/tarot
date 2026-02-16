const rawApiBase = import.meta.env.VITE_API_BASE_URL?.trim() ?? "";
const normalizedApiBase = rawApiBase.replace(/\/+$/, "");
export function hasApiBaseOverride() {
    return normalizedApiBase.length > 0;
}
export function withApiBase(path) {
    if (/^https?:\/\//i.test(path)) {
        return path;
    }
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    if (!hasApiBaseOverride()) {
        return normalizedPath;
    }
    return `${normalizedApiBase}${normalizedPath}`;
}
