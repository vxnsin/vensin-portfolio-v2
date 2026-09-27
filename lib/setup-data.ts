// pure bits of the setup page, safe to import from client components
export type SetupItem = { id: string; category: string; name: string; note: string; url: string | null; image: string | null; position: number };
export const SETUP_CATEGORIES = ["desk", "computer", "peripherals", "audio", "mobile", "software", "motorcycle", "everyday carry", "misc"] as const;
