const rawApiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ?? "";
const rawServerProxyEnabled = (import.meta.env.VITE_SERVER_PROXY_ENABLED as string | undefined)?.trim() ?? "";

const normalizedApiBase = rawApiBase.replace(/\/+$/, "");
const normalizedServerProxyEnabled = rawServerProxyEnabled.toLowerCase();

export function hasApiBaseOverride(): boolean {
  return normalizedApiBase.length > 0;
}

export function hasServerProxy(): boolean {
  return (
    hasApiBaseOverride() || normalizedServerProxyEnabled === "1" || normalizedServerProxyEnabled === "true"
  );
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
