// Cookie choice of the visitor, client side only.
// "all": the site may remember the look (theme, season cookies) and mochi's state (local storage).
// "necessary": nothing but this choice itself is stored; switches still work for the current visit.
// Unset: the notice at the bottom of the page is showing and nothing is written until it is answered.

export type Consent = "all" | "necessary";

const COOKIE = "consent";
const EVENT = "consent-change";
const OPEN_EVENT = "consent-open";

export function getConsent(): Consent | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)consent=(all|necessary)(?:;|$)/);
  return m ? (m[1] as Consent) : null;
}

/** true when the look and the cat may be remembered across visits */
export const canStore = () => getConsent() === "all";

export function setConsent(value: Consent) {
  document.cookie = `${COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
  if (value === "necessary") forgetStored();
  window.dispatchEvent(new Event(EVENT));
}

/** drops everything the site remembered about the look and the cat */
export function forgetStored() {
  document.cookie = "theme=; path=/; max-age=0; samesite=lax";
  document.cookie = "season=; path=/; max-age=0; samesite=lax";
  try {
    localStorage.removeItem("mochi:form");
    localStorage.removeItem("mochi:clicker");
  } catch {}
}

export function subscribeConsent(cb: () => void) {
  window.addEventListener(EVENT, cb);
  return () => window.removeEventListener(EVENT, cb);
}

/** re-opens the notice, e.g. from the "cookies" button in the footer */
export const openConsentNotice = () => window.dispatchEvent(new Event(OPEN_EVENT));
export function subscribeOpen(cb: () => void) {
  window.addEventListener(OPEN_EVENT, cb);
  return () => window.removeEventListener(OPEN_EVENT, cb);
}
