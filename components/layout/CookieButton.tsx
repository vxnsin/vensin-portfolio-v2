"use client";

import { openConsentNotice } from "@/lib/consent";

/** footer button that brings the cookie notice back so the choice can be changed */
export function CookieButton() {
  return (
    <button type="button" onClick={openConsentNotice} className="btn text-xs">
      cookies
    </button>
  );
}
