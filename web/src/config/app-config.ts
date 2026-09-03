export const APP_CONFIG = {
  name: "V Try-On",
  tagline: "AI Virtual Fitting Room",
  version: "1.0.0",
  apiPrefix: "/api/v1",
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 50,
  },
  polling: {
    tryOnIntervalMs: 3000,
  },
} as const
