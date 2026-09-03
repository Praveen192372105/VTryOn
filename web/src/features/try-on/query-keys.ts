export const tryOnKeys = {
  all: ["try-ons"] as const,
  lists: () => [...tryOnKeys.all, "list"] as const,
  list: (params?: { page?: number; page_size?: number }) =>
    [...tryOnKeys.lists(), params] as const,
  details: () => [...tryOnKeys.all, "detail"] as const,
  detail: (jobId: string) => [...tryOnKeys.details(), jobId] as const,
}
