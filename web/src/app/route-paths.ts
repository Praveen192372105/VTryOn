export const ROUTES = {
  home: "/",
  login: "/login",
  register: "/register",

  app: "/app",
  studio: "/app/studio",
  outfits: "/app/outfits",
  favorites: "/app/favorites",
  uploads: "/app/uploads",
  history: "/app/history",
  settings: "/app/settings",

  tryOnDetail: (id: string) => `/app/try-ons/${id}`,
} as const
