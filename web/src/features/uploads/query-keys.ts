export const uploadKeys = {
  all: ["uploads"] as const,
  lists: () => [...uploadKeys.all, "list"] as const,
  list: (params?: { page?: number; page_size?: number }) =>
    [...uploadKeys.lists(), params] as const,
  details: () => [...uploadKeys.all, "detail"] as const,
  detail: (id: string) => [...uploadKeys.details(), id] as const,
}
