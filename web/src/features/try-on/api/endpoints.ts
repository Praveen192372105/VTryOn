export const tryOnEndpoints = {
  create: "/try-ons",
  list: "/try-ons",
  detail: (jobId: string) => `/try-ons/${encodeURIComponent(jobId)}`,
  delete: (jobId: string) => `/try-ons/${encodeURIComponent(jobId)}`,
  content: (jobId: string) => `/try-ons/${encodeURIComponent(jobId)}/content`,
} as const
