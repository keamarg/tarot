export function loadSessionState<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveSessionState<T>(key: string, value: T): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.setItem(key, JSON.stringify(value));
}

export function removeSessionState(key: string): void {
  if (typeof window === "undefined") {
    return;
  }
  window.sessionStorage.removeItem(key);
}

export function clearSessionStateByPrefix(prefix: string): void {
  if (typeof window === "undefined") {
    return;
  }
  const keys: string[] = [];
  for (let index = 0; index < window.sessionStorage.length; index += 1) {
    const key = window.sessionStorage.key(index);
    if (key && key.startsWith(prefix)) {
      keys.push(key);
    }
  }
  for (const key of keys) {
    window.sessionStorage.removeItem(key);
  }
}
