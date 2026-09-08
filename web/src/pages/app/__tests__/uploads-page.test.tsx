import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, within, waitFor } from "@testing-library/react"
import UploadsPage from "../uploads-page"
import * as listApi from "../../../features/uploads/api/list-uploads"
import * as deleteApi from "../../../features/uploads/api/delete-upload"
import { renderWithProviders } from "../../../test/render"

vi.mock("../../../features/uploads/api/list-uploads")
vi.mock("../../../features/uploads/api/delete-upload")

describe("UploadsPage", () => {
  const mockUploads = [
    {
      id: "upl_1",
      original_filename: "portrait_1.jpg",
      mime_type: "image/jpeg",
      size_bytes: 150000,
      width: 768,
      height: 1024,
      status: "active",
      image_url: "/media/portrait_1.jpg",
      created_at: "2026-09-04T12:00:00.000Z",
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.spyOn(listApi, "listUploads").mockResolvedValue({
      items: mockUploads,
      pagination: { page: 1, page_size: 10, total: 1, total_pages: 1 },
    })
  })

  it("renders page header and photo library items", async () => {
    renderWithProviders(<UploadsPage />, { initialEntries: ["/app/uploads"] })

    expect(await screen.findByText("Your photos")).toBeInTheDocument()
    expect(
      screen.getByText("Photos available for virtual try-ons.")
    ).toBeInTheDocument()
    expect(await screen.findByAltText("portrait_1.jpg")).toBeInTheDocument()
  })

  it("toggles add photo inline dropzone when Add photo button is clicked", async () => {
    renderWithProviders(<UploadsPage />, { initialEntries: ["/app/uploads"] })

    const addBtn = await screen.findByRole("button", { name: /Add photo/i })
    fireEvent.click(addBtn)

    expect(screen.getByText("Select a portrait photo")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument()

    // Click Cancel to close
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }))
    expect(screen.queryByText("Select a portrait photo")).not.toBeInTheDocument()
  })

  it("opens safe deletion dialog and confirms deletion", async () => {
    vi.spyOn(deleteApi, "deleteUpload").mockResolvedValue(undefined)

    renderWithProviders(<UploadsPage />, { initialEntries: ["/app/uploads"] })

    // Find card delete button
    const deleteCardBtn = await screen.findByTitle("Delete photo")
    fireEvent.click(deleteCardBtn)

    // Verify dialog opened
    expect(await screen.findByText("Delete this photo?")).toBeInTheDocument()

    // Confirm deletion inside the dialog
    const dialog = screen.getByRole("alertdialog")
    const confirmBtn = within(dialog).getByRole("button", { name: /Delete photo/i })
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(deleteApi.deleteUpload).toHaveBeenCalledWith("upl_1")
    })
  })
})
