import type { PersonUploadListItem, PersonUploadListResponse } from "../../features/uploads/types"

export const mockPersonUpload1: PersonUploadListItem = {
  id: "upl_fixture_person_1",
  original_filename: "portrait_studio.jpg",
  image_url: "/api/v1/uploads/upl_fixture_person_1/content",
  mime_type: "image/jpeg",
  size_bytes: 2_450_000,
  width: 768,
  height: 1024,
  status: "active",
  created_at: "2026-09-04T15:00:00.000Z",
}

export const mockPersonUploadListResponse: PersonUploadListResponse = {
  items: [mockPersonUpload1],
  pagination: {
    page: 1,
    page_size: 20,
    total: 1,
    total_pages: 1,
  },
}
