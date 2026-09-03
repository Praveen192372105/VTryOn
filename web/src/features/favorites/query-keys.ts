export const favoriteKeys = {
  all: ["favorites"] as const,
  lists: () => [...favoriteKeys.all, "list"] as const,
  list: (params?: { page?: number; page_size?: number }) =>
    [...favoriteKeys.lists(), params] as const,
}
