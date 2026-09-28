import type { Form } from "./cat-frames";
import { canStore } from "@/lib/consent";

// Which shape mochi has right now lives on <html data-mochi="…"> so every sprite on the page follows along,
// and in local storage so she stays that way on the next visit. Typing "catgirl" anywhere toggles it (see decor/Cheats.tsx).

export const FORM_ATTR = "data-mochi";
const STORAGE = "mochi:form";

export function subscribeForm(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: [FORM_ATTR] });
  return () => obs.disconnect();
}

export const readForm = (): Form => (document.documentElement.getAttribute(FORM_ATTR) === "catgirl" ? "catgirl" : "cat");

export function setForm(form: Form) {
  if (form === "cat") document.documentElement.removeAttribute(FORM_ATTR);
  else document.documentElement.setAttribute(FORM_ATTR, form);
  // remembered across visits only with the visitor's okay (cookie notice)
  try {
    if (form === "cat") localStorage.removeItem(STORAGE);
    else if (canStore()) localStorage.setItem(STORAGE, form);
  } catch {}
}

/** the form saved from an earlier visit, applied once on load */
export function restoreForm() {
  try {
    if (localStorage.getItem(STORAGE) === "catgirl") document.documentElement.setAttribute(FORM_ATTR, "catgirl");
  } catch {}
}
