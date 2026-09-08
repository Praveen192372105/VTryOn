export interface StudioRouteParams {
  person?: string | null
  outfit?: string | null
}

export const ROUTES = {
  home: "/",
  howItWorks: "/how-it-works",
  privacy: "/privacy",
  terms: "/terms",

  auth: {
    login: "/login",
    register: "/register",
  },

  // Flat aliases for backwards compatibility
  login: "/login",
  register: "/register",

  app: {
    root: "/app",
    studio: "/app/studio",
    studioWithParams: (params?: StudioRouteParams) => {
      const sp = new URLSearchParams()
      if (params?.person) sp.set("person", params.person)
      if (params?.outfit) sp.set("outfit", params.outfit)
      const qs = sp.toString()
      return qs ? `/app/studio?${qs}` : "/app/studio"
    },
    outfits: "/app/outfits",
    favorites: "/app/favorites",
    uploads: "/app/uploads",
    history: "/app/history",
    settings: "/app/settings",
    tryOnDetail: (jobId: string) => `/app/try-ons/${jobId}`,
  },

  // Backwards-compatible aliases for flat references
  get studio() {
    return this.app.studio
  },
  studioWithParams(params?: StudioRouteParams) {
    return this.app.studioWithParams(params)
  },
  get outfits() {
    return this.app.outfits
  },
  get favorites() {
    return this.app.favorites
  },
  get uploads() {
    return this.app.uploads
  },
  get history() {
    return this.app.history
  },
  get settings() {
    return this.app.settings
  },

  tryOnDetails: (jobId: string) => `/app/try-ons/${jobId}`,
  tryOnDetail: (jobId: string) => `/app/try-ons/${jobId}`,
} as const
