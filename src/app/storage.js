export function loadSessionState(key, fallback) {
    if (typeof window === "undefined") {
        return fallback;
    }
    try {
        const raw = window.sessionStorage.getItem(key);
        if (!raw) {
            return fallback;
        }
        return JSON.parse(raw);
    }
    catch {
        return fallback;
    }
}
export function saveSessionState(key, value) {
    if (typeof window === "undefined") {
        return;
    }
    window.sessionStorage.setItem(key, JSON.stringify(value));
}
export function removeSessionState(key) {
    if (typeof window === "undefined") {
        return;
    }
    window.sessionStorage.removeItem(key);
}
export function clearSessionStateByPrefix(prefix) {
    if (typeof window === "undefined") {
        return;
    }
    const keys = [];
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
