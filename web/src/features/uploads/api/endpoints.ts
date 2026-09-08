export const uploadEndpoints = {
  createPerson: "/uploads/person",
  list: "/uploads",
  detail: (uploadId: string) => `/uploads/${encodeURIComponent(uploadId)}`,
  delete: (uploadId: string) => `/uploads/${encodeURIComponent(uploadId)}`,
} as const
