import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { PersonUploadDropzone } from "../person-upload-dropzone"

describe("PersonUploadDropzone", () => {
  it("renders with accessible button role and helpful format guidance", () => {
    render(<PersonUploadDropzone onFileSelected={vi.fn()} />)

    expect(screen.getByRole("button", { name: /Select or drop a portrait photo/i })).toBeInTheDocument()
    expect(screen.getByText(/Add a photo/i)).toBeInTheDocument()
    expect(screen.getByText(/Choose a JPEG, PNG or WebP image/i)).toBeInTheDocument()
  })

  it("handles file selection via native file input", () => {
    const handleSelected = vi.fn()
    const { container } = render(<PersonUploadDropzone onFileSelected={handleSelected} />)

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    expect(fileInput).toBeInTheDocument()

    const file = new File(["test"], "my_photo.jpg", { type: "image/jpeg" })
    fireEvent.change(fileInput, { target: { files: [file] } })

    expect(handleSelected).toHaveBeenCalledWith(file)
  })

  it("rejects multiple files on drop and shows an alert message", () => {
    const handleSelected = vi.fn()
    render(<PersonUploadDropzone onFileSelected={handleSelected} />)

    const dropzone = screen.getByRole("button", { name: /Select or drop a portrait photo/i })

    const file1 = new File(["1"], "photo1.jpg", { type: "image/jpeg" })
    const file2 = new File(["2"], "photo2.jpg", { type: "image/jpeg" })

    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file1, file2],
      },
    })

    expect(handleSelected).not.toHaveBeenCalled()
    expect(screen.getByText(/Please choose one image at a time/i)).toBeInTheDocument()
  })

  it("triggers file picker on Enter key press", () => {
    const { container } = render(<PersonUploadDropzone onFileSelected={vi.fn()} />)

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    const clickSpy = vi.spyOn(fileInput, "click")

    const dropzone = screen.getByRole("button", { name: /Select or drop a portrait photo/i })
    fireEvent.keyDown(dropzone, { key: "Enter" })

    expect(clickSpy).toHaveBeenCalled()
  })
})
