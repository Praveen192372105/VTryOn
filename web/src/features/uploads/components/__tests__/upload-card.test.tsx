import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { UploadCard } from "../upload-card"
import type { PersonUpload } from "../../types"

describe("UploadCard", () => {
  const mockUpload: PersonUpload = {
    id: "upl_999",
    original_filename: "my_portrait.jpg",
    mime_type: "image/jpeg",
    size_bytes: 500000,
    width: 768,
    height: 1024,
    status: "active",
    image_url: "/media/people/usr_1/upl_999.jpg",
    created_at: "2026-09-04T12:00:00.000Z",
  }

  it("renders upload thumbnail, creation date, and dimensions", () => {
    render(<UploadCard upload={mockUpload} />)

    expect(screen.getByAltText("my_portrait.jpg")).toBeInTheDocument()
    expect(screen.getByText("Sep 4, 2026")).toBeInTheDocument()
    expect(screen.getByText("768×1024 px")).toBeInTheDocument()
  })

  it("shows selected badge when isSelected is true", () => {
    render(<UploadCard upload={mockUpload} isSelected={true} />)
    expect(screen.getByText(/Selected for Studio/i)).toBeInTheDocument()
  })

  it("fires onDelete when delete button is clicked", () => {
    const handleDelete = vi.fn()
    render(<UploadCard upload={mockUpload} onDelete={handleDelete} />)

    const deleteBtn = screen.getByRole("button", { name: /Delete photo/i })
    fireEvent.click(deleteBtn)

    expect(handleDelete).toHaveBeenCalledWith("upl_999")
  })

  it("fires onUseInStudio when Use button is clicked", () => {
    const handleUse = vi.fn()
    render(<UploadCard upload={mockUpload} onUseInStudio={handleUse} />)

    const useBtn = screen.getByRole("button", { name: /Use/i })
    fireEvent.click(useBtn)

    expect(handleUse).toHaveBeenCalledWith("upl_999")
  })
})
