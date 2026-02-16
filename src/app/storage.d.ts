export declare function loadSessionState<T>(key: string, fallback: T): T;
export declare function saveSessionState<T>(key: string, value: T): void;
export declare function removeSessionState(key: string): void;
export declare function clearSessionStateByPrefix(prefix: string): void;
