import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { UploadGrid } from "../upload-grid"
import type { PersonUpload } from "../../types"

describe("UploadGrid", () => {
  const mockUploads: PersonUpload[] = [
    {
      id: "upl_1",
      original_filename: "photo1.jpg",
      mime_type: "image/jpeg",
      size_bytes: 50000,
      width: 800,
      height: 1200,
      status: "active",
      image_url: "/media/photo1.jpg",
      created_at: "2026-09-04T10:00:00.000Z",
    },
    {
      id: "upl_2",
      original_filename: "photo2.jpg",
      mime_type: "image/jpeg",
      size_bytes: 60000,
      width: 768,
      height: 1024,
      status: "active",
      image_url: "/media/photo2.jpg",
      created_at: "2026-09-04T11:00:00.000Z",
    },
  ]

  it("renders loading skeletons when isLoading is true", () => {
    render(<UploadGrid uploads={[]} isLoading={true} />)
    expect(screen.getByTestId("upload-grid-skeleton")).toBeInTheDocument()
  })

  it("renders error state with retry button when isError is true", () => {
    const handleRetry = vi.fn()
    render(
      <UploadGrid
        uploads={[]}
        isError={true}
        error={new Error("Network connection lost")}
        onRetry={handleRetry}
      />
    )

    expect(screen.getByText(/We couldn't load your photos/i)).toBeInTheDocument()
    expect(screen.getByText(/Network connection lost/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /Try again/i }))
    expect(handleRetry).toHaveBeenCalledTimes(1)
  })

  it("renders empty state with Add photo action when uploads array is empty", () => {
    const handleUploadClick = vi.fn()
    render(<UploadGrid uploads={[]} onUploadClick={handleUploadClick} />)

    expect(screen.getByText(/No photos yet/i)).toBeInTheDocument()
    const addBtn = screen.getByRole("button", { name: /Add photo/i })
    expect(addBtn).toBeInTheDocument()

    fireEvent.click(addBtn)
    expect(handleUploadClick).toHaveBeenCalledTimes(1)
  })

  it("renders cards for each upload in grid", () => {
    render(<UploadGrid uploads={mockUploads} selectedId="upl_1" />)

    expect(screen.getByAltText("photo1.jpg")).toBeInTheDocument()
    expect(screen.getByAltText("photo2.jpg")).toBeInTheDocument()
    expect(screen.getByText(/Selected for Studio/i)).toBeInTheDocument()
  })
})
