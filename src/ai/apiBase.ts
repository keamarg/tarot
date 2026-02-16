const rawApiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ?? "";

const normalizedApiBase = rawApiBase.replace(/\/+$/, "");

export function hasApiBaseOverride(): boolean {
  return normalizedApiBase.length > 0;
}

export function withApiBase(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!hasApiBaseOverride()) {
    return normalizedPath;
  }
  return `${normalizedApiBase}${normalizedPath}`;
}
