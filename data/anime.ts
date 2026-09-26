// Favorites: edit this list freely. Covers are pulled from the Jikan (MyAnimeList) API by malId.
// PLACEHOLDER picks until Luis fills in his real favorites.
export type FavoriteAnime = { title: string; note?: string; malId: number };

export const favoriteAnime: FavoriteAnime[] = [
  { title: "Steins;Gate", note: "el psy kongroo", malId: 9253 },
  { title: "Fullmetal Alchemist: Brotherhood", note: "peak", malId: 5114 },
  { title: "Vinland Saga", note: "i have no enemies", malId: 37521 },
  { title: "Frieren: Beyond Journey's End", note: "comfy", malId: 52991 },
  { title: "Cyberpunk: Edgerunners", note: "tears", malId: 42310 },
  { title: "Mob Psycho 100", note: "???%", malId: 32182 },
];

// aniworld.to profile used for the "recently watched" widget
export const aniworldProfile = "vensin";
