const SESSION_KEY = "dv_card_session_id";

function randomUuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const n = (Math.random() * 16) | 0;
    const v = ch === "x" ? n : (n & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Anonymous first-party session id. sessionStorage so a new tab is a new visit.
 * Not a fingerprint and not unique-people.
 */
export function getOrCreateAnalyticsSessionId(): string {
  if (typeof window === "undefined") return randomUuid();
  try {
    const existing = sessionStorage.getItem(SESSION_KEY)?.trim();
    if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;
    const id = randomUuid();
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return randomUuid();
  }
}

const ONCE_PREFIX = "dv_card_once:";

export function markSessionEventOnce(key: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    const storageKey = `${ONCE_PREFIX}${key}`;
    if (sessionStorage.getItem(storageKey) === "1") return false;
    sessionStorage.setItem(storageKey, "1");
    return true;
  } catch {
    return true;
  }
}
